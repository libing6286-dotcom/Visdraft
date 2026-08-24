export const HERO_MODES = [
  {
    id: "image",
    icon: "sparkles",
    previewImage: "/images/showcase/showcase-1.jpg",
  },
  {
    id: "canvas",
    icon: "layers",
    previewImage: "/images/showcase/showcase-12.jpg",
  },
] as const;

export type HeroModeId = (typeof HERO_MODES)[number]["id"];

export function getHeroMode(id: HeroModeId = "image") {
  return HERO_MODES.find((mode) => mode.id === id) ?? HERO_MODES[0];
}
