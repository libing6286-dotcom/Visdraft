"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  StreamEvent,
  WsCommandAck,
  WsRpcRequest,
  RunCreateRequest,
} from "@scenva/shared";
import { getServerBaseUrl } from "../lib/env";

type EventCallback = (event: StreamEvent) => void;
type RPCHandler = (
  params: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

export type WebSocketHandle = {
  connected: boolean;
  startRun: (
    payload: RunCreateRequest,
    onAck?: (ack: WsCommandAck) => void,
  ) => void;
  cancelRun: (runId: string) => void;
  onEvent: (cb: EventCallback) => () => void;
  registerRPC: (method: string, handler: RPCHandler) => () => void;
  resumeCanvas: (canvasId: string, onAck?: (ack: WsCommandAck) => void) => void;
};

export function useWebSocket(
  getToken: () => string | null,
): WebSocketHandle {
  // 当前webSocket实例
  const wsRef = useRef<WebSocket | null>(null);
  // 避免浏览器刷新后彻底丢失上下文
  // 后端可以用它识别同一个客户端会话
  const connectionIdRef = useRef(
    (() => {
      if (typeof sessionStorage !== "undefined") {
        const stored = sessionStorage.getItem("ws_connection_id");
        if (stored) return stored;
        const id = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem("ws_connection_id", id);
        return id;
      }
      return typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    })(),
  );
  // 当前是否已连接
  const [connected, setConnected] = useState(false);
  // 当前重连次数
  const reconnectAttempt = useRef(0);
  // 重连定时器句柄
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 组件卸载标识，用于停止重连
  const disposed = useRef(false);
  // Set<EventCallback> 监听服务器事件的回调函数集合
  const eventListeners = useRef<Set<EventCallback>>(new Set());
  // Map<action, callback> 发送命令后等待服务器ack的回调函数集合
  const ackListeners = useRef<
    Map<string, (ack: WsCommandAck) => void>
  >(new Map());
  // Map<method, handler> RPC方法及其处理函数集合
  const rpcHandlers = useRef<Map<string, RPCHandler>>(new Map());

  const connect = useCallback(() => {
    const token = getToken();
    if (disposed.current) return;
    // Skip if already connected -- prevents React Strict Mode double-mount
    // from replacing an active connection mid-stream
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }
    // Close any existing connection before creating a new one
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect from old socket
      wsRef.current.close();
      wsRef.current = null;
    }
    if (!token) {
      // Token not yet available (auth loading) -- retry shortly
      reconnectTimer.current = setTimeout(connect, 500);
      return;
    }

    const serverBase = getServerBaseUrl();
    const wsUrl =
      serverBase.replace(/^http/, "ws") +
      `/api/ws?token=${encodeURIComponent(token)}&connectionId=${encodeURIComponent(connectionIdRef.current)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    // 连接建立成功
    ws.onopen = () => {
      console.log("[ws] connected, connectionId:", connectionIdRef.current);
      setConnected(true);
      reconnectAttempt.current = 0;
    };
    // 解析JSON消息
    // 支持三种类型
    // type === 'event'：分发给eventListeners
    // type === 'command.ack'：分发给对应ackListeners
    // type === 'rpc.request'：分发给对应rpcHandlers，并回复结果
    ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string) as Record<string, unknown>;
      } catch (err) {
        console.warn("[ws] failed to parse incoming message:", err);
        return;
      }

      if (msg.type === "event") {
        const streamEvent = msg.event as StreamEvent;
        // Defensive: skip malformed events without proper structure
        if (!streamEvent || typeof streamEvent !== "object") {
          console.warn("[ws] received malformed stream event:", msg);
          return;
        }
        for (const cb of eventListeners.current) {
          try {
            cb(streamEvent);
          } catch (listenerErr) {
            // Prevent one listener's error from breaking others
            console.error("[ws] event listener threw:", listenerErr);
          }
        }
      } else if (msg.type === "command.ack") {
        const cb = ackListeners.current.get(msg.action as string);
        if (cb) {
          ackListeners.current.delete(msg.action as string);
          try {
            cb(msg as unknown as WsCommandAck);
          } catch (ackErr) {
            console.error("[ws] ack listener threw:", ackErr);
          }
        }
      } else if (msg.type === "rpc.request") {
        void handleRpcRequest(ws, msg as unknown as WsRpcRequest);
      }
      // Unknown message types are silently ignored -- server may add new types
    };

    ws.onclose = (event) => {
      // Only handle close for the CURRENT connection.
      // React Strict Mode creates two connections; when the server replaces
      // the old one, its close event fires after remount resets disposed=false.
      // Without this guard, we'd enter a reconnect loop.
      if (wsRef.current !== ws) return;

      setConnected(false);
      wsRef.current = null;

      if (event.code === 4001) {
        console.warn("[ws] Auth rejected, will retry with fresh token");
      }

      if (!disposed.current) {
        const delay = Math.min(
          30_000,
          1000 * Math.pow(2, reconnectAttempt.current),
        );
        const attempt = reconnectAttempt.current + 1;
        console.log(
          `[ws] scheduling reconnect attempt ${attempt} in ${delay}ms (code: ${event.code})`,
        );
        reconnectAttempt.current = attempt;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [getToken]);

  // 处理来自服务器的RPC请求，并返回结果给服务器
  async function handleRpcRequest(ws: WebSocket, req: WsRpcRequest) {
    const handler = rpcHandlers.current.get(req.method);
    if (!handler) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "rpc.response",
            id: req.id,
            error: `No handler for method: ${req.method}`,
          }),
        );
      }
      return;
    }

    try {
      const result = await handler(req.params);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "rpc.response", id: req.id, result }),
        );
      }
    } catch (error) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "rpc.response",
            id: req.id,
            error:
              error instanceof Error ? error.message : "RPC handler failed",
          }),
        );
      }
    }
  }

  useEffect(() => {
    disposed.current = false;
    connect();
    return () => {
      disposed.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);
  // 发送命令封装
  const sendCommand = useCallback(
    (action: string, payload: Record<string, unknown>): boolean => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn("[ws] command dropped -- not connected, readyState:", ws?.readyState);
        return false;
      }
      try {
        ws.send(JSON.stringify({ type: "command", action, payload }));
        return true;
      } catch (err) {
        // Guard against serialization errors (e.g. circular refs in payload)
        console.error("[ws] failed to send command:", action, err);
        return false;
      }
    },
    [],
  );
  // 注册ack listener
  // 发送命令:agent.run
  const startRun = useCallback(
    (
      payload: RunCreateRequest,
      onAck?: (ack: WsCommandAck) => void,
    ) => {
      if (onAck) {
        ackListeners.current.set("agent.run", onAck);
      }
      const sent = sendCommand(
        "agent.run",
        payload as unknown as Record<string, unknown>,
      );
      if (!sent) {
        // Remove the dangling ack listener so callers don't hang forever
        ackListeners.current.delete("agent.run");
      }
    },
    [sendCommand],
  );
  // 发送命令agent.cancel
  const cancelRun = useCallback(
    (runId: string) => {
      sendCommand("agent.cancel", { runId });
    },
    [sendCommand],
  );
  // 注册ack listener
  // 发送命令:canvas.resume
  const resumeCanvas = useCallback(
    (canvasId: string, onAck?: (ack: WsCommandAck) => void) => {
      if (onAck) {
        ackListeners.current.set("canvas.resume", onAck);
      }
      const sent = sendCommand("canvas.resume", { canvasId, lastSeq: 0 });
      if (!sent) {
        ackListeners.current.delete("canvas.resume");
      }
    },
    [sendCommand],
  );

  const onEvent = useCallback((cb: EventCallback) => {
    eventListeners.current.add(cb);
    return () => {
      eventListeners.current.delete(cb);
    };
  }, []);

  const registerRPC = useCallback(
    (method: string, handler: RPCHandler) => {
      rpcHandlers.current.set(method, handler);
      return () => {
        rpcHandlers.current.delete(method);
      };
    },
    [],
  );

  return { connected, startRun, cancelRun, onEvent, registerRPC, resumeCanvas };
}
