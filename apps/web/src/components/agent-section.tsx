"use client";

import type { ModelInfo } from "@loomic/shared";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "./ui/button";
import { Label } from "./ui/label";

interface AgentSectionProps {
  defaultModel: string;
  onSave: (defaultModel: string) => Promise<void>;
  fetchModels: () => Promise<{ models: ModelInfo[] }>;
}

export function AgentSection({
  defaultModel: initialModel,
  onSave,
  fetchModels,
}: AgentSectionProps) {
  const t = useTranslations("settings.agent");
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const hasChanges = selectedModel !== initialModel;

  useEffect(() => {
    fetchModels()
      .then((data) => {
        setModels(data.models);
        const ids = data.models.map((m: ModelInfo) => m.id);
        if (ids.length > 0 && !ids.includes(selectedModel)) {
          setSelectedModel(ids[0]);
        }
      })
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false));
  }, [fetchModels]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedModel) return;

    setSaving(true);
    setFeedback(null);

    try {
      await onSave(selectedModel);
      setFeedback({ type: "success", message: t("updated") });
    } catch {
      setFeedback({
        type: "error",
        message: t("updateFailed"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">{t("heading")}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {t("subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="defaultModel">{t("defaultModel")}</Label>
          {modelsLoading ? (
            <p className="text-sm text-muted-foreground">{t("loadingModels")}</p>
          ) : (
            <select
              id="defaultModel"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-muted-foreground">
            {t("modelNote")}
          </p>
        </div>

        {feedback && (
          <p
            className={`text-sm ${feedback.type === "success" ? "text-success" : "text-destructive"}`}
          >
            {feedback.message}
          </p>
        )}

        <Button type="submit" disabled={saving || !hasChanges} size="sm">
          {saving ? t("saving") : t("save")}
        </Button>
      </form>
    </div>
  );
}
