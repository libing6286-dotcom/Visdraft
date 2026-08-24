"use client";

import type {
  ImageGenerationPreference,
  VideoGenerationPreference,
} from "@visdraft/shared";
import type { ReadyAttachment } from "@/hooks/use-image-attachments";
import { motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { HomeExampleBrowser } from "@/components/home-example-browser";
import { HomePrompt, type HomePromptHandle } from "@/components/home-prompt";
import { useCreateProject } from "@/hooks/use-create-project";
import { useImageAttachments } from "@/hooks/use-image-attachments";
import { useAuth } from "@/lib/auth-context";
import { loadHomeExampleCategories } from "@/lib/home-example-library";
import {
  homeExampleSeedCategories,
  type HomeExampleSelection,
} from "@/lib/home-example-seeds";

// ---------------------------------------------------------------------------
// Animation variant — staggered fade-up for the prompt block
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

// ---------------------------------------------------------------------------
// LandingPrompt
// Interactive prompt block for the public landing page. Lets visitors describe
// a creative idea and jump straight into the canvas. Anonymous visitors are
// routed to /login on submit (createNewProject no-ops without a session token).
// ---------------------------------------------------------------------------
export function LandingPrompt({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("landing.prompt");
  const { session } = useAuth();
  const router = useRouter();
  const { create: createNewProject } = useCreateProject();

  const [homeExampleCategories, setHomeExampleCategories] = useState(
    homeExampleSeedCategories,
  );
  const [selectedExample, setSelectedExample] =
    useState<HomeExampleSelection | null>(null);

  const promptRef = useRef<HomePromptHandle>(null);

  // Image attachments for the landing prompt. No projectId yet — uploads go to
  // the general bucket; the project is created on submit. Falls back to an empty
  // token for anonymous visitors (uploads simply no-op without a session).
  const {
    attachments: imageAttachments,
    addFiles,
    removeAttachment,
    clearAll: clearAttachments,
    isUploading,
    readyAttachments,
  } = useImageAttachments(session?.access_token ?? "");

  // -----------------------------------------------------------------------
  // Load example categories (public seed content). Falls back to the bundled
  // seeds when the request fails or returns nothing.
  // -----------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    void loadHomeExampleCategories()
      .then((categories) => {
        if (!cancelled) setHomeExampleCategories(categories);
      })
      .catch((error) => {
        console.warn("[landing] failed to load home example content", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------------------------------------------------------
  // Prompt submit → create project → navigate to canvas.
  // Anonymous visitors are routed to /login first; createNewProject no-ops
  // without a session token.
  // -----------------------------------------------------------------------
  const handlePromptSubmit = useCallback(
    (
      prompt: string,
      attachments?: ReadyAttachment[],
      imageGenerationPreference?: ImageGenerationPreference,
      videoGenerationPreference?: VideoGenerationPreference,
      model?: string,
    ) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setSelectedExample(null);
      clearAttachments();
      createNewProject({
        prompt,
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
        ...(imageGenerationPreference ? { imageGenerationPreference } : {}),
        ...(videoGenerationPreference ? { videoGenerationPreference } : {}),
        ...(model ? { model } : {}),
      });
    },
    [session, router, createNewProject, clearAttachments],
  );

  const handleExampleSelect = useCallback((selection: HomeExampleSelection) => {
    setSelectedExample(selection);
    promptRef.current?.fill(selection.prompt);
  }, []);

  const handleExampleClear = useCallback(() => {
    setSelectedExample(null);
  }, []);

  const content = (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="flex w-full flex-col items-center text-center"
      >
        {!compact && <motion.h1
          variants={fadeUp}
          custom={0}
          className="mb-2 text-2xl font-bold text-foreground sm:text-3xl"
        >
          {t("seoHeadline")}
        </motion.h1>}
        {!compact && <motion.p
          variants={fadeUp}
          custom={1}
          className="mb-6 text-sm text-muted-foreground sm:text-base md:mb-8"
        >
          {t("subtitle")}
        </motion.p>}

        <motion.div
          variants={fadeUp}
          custom={2}
          className={compact ? "mx-auto w-full max-w-2xl" : "w-full"}
        >
          <HomePrompt
            ref={promptRef}
            onSubmit={handlePromptSubmit}
            attachments={imageAttachments}
            onAddFiles={addFiles}
            onRemoveAttachment={removeAttachment}
            isUploading={isUploading}
            readyAttachments={readyAttachments}
            selectedSeed={selectedExample}
            onClearSelectedSeed={handleExampleClear}
            compact={compact}
          />
        </motion.div>

        {!compact && (
          <motion.div variants={fadeUp} custom={3} className="w-full">
            <HomeExampleBrowser
              categories={homeExampleCategories}
              selectedExample={selectedExample}
              onExampleSelect={handleExampleSelect}
            />
          </motion.div>
        )}
      </motion.div>
  );

  if (compact) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pt-32 pb-12 sm:px-6 md:pb-16">
      {content}
    </section>
  );
}
