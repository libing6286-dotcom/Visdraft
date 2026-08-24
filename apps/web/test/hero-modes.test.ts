import { describe, expect, it } from "vitest";

import { getHeroMode, HERO_MODES } from "@/components/landing/hero-modes";

describe("hero modes", () => {
  it("exposes image and canvas modes with image selected by default", () => {
    expect(HERO_MODES.map((mode) => mode.id)).toEqual(["image", "canvas"]);
    expect(getHeroMode()).toMatchObject({ id: "image" });
  });

  it("falls back to image mode when given an unknown id", () => {
    expect(getHeroMode("unknown" as never).id).toBe("image");
  });
});
