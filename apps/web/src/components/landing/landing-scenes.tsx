import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type LandingScene = {
  title: string;
  description: string;
  visual?: ReactNode;
};

type LandingSceneInput = LandingScene | readonly [title: string, description: string];

function normalizeScene(scene: LandingSceneInput): LandingScene {
  if ("title" in scene) return scene;
  return { title: scene[0], description: scene[1] };
}

type LandingScenesProps = {
  scenes: readonly LandingSceneInput[];
  ctaLabel?: string;
  ctaHref?: "/login";
};

export function LandingScenes({ scenes, ctaLabel = "Create this look", ctaHref = "/login" }: LandingScenesProps) {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {scenes.map((item, index) => {
          const scene = normalizeScene(item);
          const reversed = index % 2 === 1;
          return (
            <article key={scene.title} className="border-b py-14 text-center last:border-b-0 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
              <div className={reversed ? "mx-auto max-w-3xl lg:order-2" : "mx-auto max-w-3xl"}>
                <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{scene.title}</h2>
                <p className="mt-5 text-base leading-8 text-muted-foreground">{scene.description}</p>
                <Link href={ctaHref} className="mt-7 inline-flex items-center gap-2 text-sm font-medium hover:underline">{ctaLabel} <ArrowRight className="size-4" /></Link>
              </div>
              <div className={reversed ? "mx-auto mt-10 flex h-[320px] w-[480px] max-w-full items-center justify-center rounded-xl border border-dashed bg-background text-sm text-muted-foreground lg:order-1 lg:mt-0" : "mx-auto mt-10 flex h-[320px] w-[480px] max-w-full items-center justify-center rounded-xl border border-dashed bg-background text-sm text-muted-foreground lg:mt-0"}>
                {scene.visual ?? <span>Scene image placeholder</span>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
