import { describe, expect, test, vi } from "vitest";

import { createCanvasService } from "./canvas-service.js";

describe("CanvasService", () => {
  test("stores canvas files under the canvas workspace path", async () => {
    const canvasSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { project_id: "project-id" },
          error: null,
        }),
      }),
    });
    const projectSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { workspace_id: "workspace-id" },
          error: null,
        }),
      }),
    });
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const upload = vi.fn().mockResolvedValue({ error: null });
    const client = {
      from: vi.fn((table: string) => table === "canvases"
        ? { select: canvasSelect, update }
        : { select: projectSelect }),
      storage: { from: vi.fn().mockReturnValue({ upload }) },
    };
    const service = createCanvasService({
      createUserClient: () => client as any,
    });

    await service.saveCanvasContent(
      { id: "user-id", accessToken: "token", email: "user@example.com", userMetadata: {} },
      "canvas-id",
      {
        elements: [],
        appState: {},
        files: {
          "file-id": { dataURL: "data:image/png;base64,aGVsbG8=" },
        },
      } as any,
    );

    expect(canvasSelect).toHaveBeenCalledWith("project_id");
    expect(projectSelect).toHaveBeenCalledWith("workspace_id");
    expect(upload).toHaveBeenCalledWith(
      "workspace-id/canvas-files/canvas-id/file-id.png",
      expect.any(Buffer),
      { contentType: "image/png", upsert: true },
    );
  });
});
