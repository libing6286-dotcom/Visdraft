"use client";

import type { HomeExampleSelection } from "@/lib/home-example-seeds";

type ProductPhotoTemplate = HomeExampleSelection & { label: string };

const templates: ProductPhotoTemplate[] = [
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Desert lamp campaign",
    label: "Desk lamp",
    prompt: "Place [Image 1] among desert sand and varied rock formations under clear warm light.",
    previewImages: ["/images/ai-product-photo-generator/desk-lamp.png"],
    inputMentions: [{ type: "image", name: "Desk lamp product", imgSrc: "/images/ai-product-photo-generator/desk-lamp-cutout.png" }],
  },
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Redwood lipstick campaign",
    label: "Lipstick",
    prompt: "Place [Image 1] on dark textured redwood with a small flowering branch and deep red background.",
    previewImages: ["/images/ai-product-photo-generator/lipstick.png"],
    inputMentions: [{ type: "image", name: "Lipstick product", imgSrc: "/images/ai-product-photo-generator/lipstick-cutout.png" }],
  },
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Blue studio burger campaign",
    label: "Burger",
    prompt: "Place [Image 1] held by hands against a pure blue gradient studio background.",
    previewImages: ["/images/ai-product-photo-generator/burger.png"],
    inputMentions: [{ type: "image", name: "Burger product", imgSrc: "/images/ai-product-photo-generator/burger-cutout.png" }],
  },
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Liquid vortex drink campaign",
    label: "Drink",
    prompt: "Place [Image 1] within a swirling liquid vortex on a reflective water surface.",
    previewImages: ["/images/ai-product-photo-generator/drink.png"],
    inputMentions: [{ type: "image", name: "Drink product", imgSrc: "/images/ai-product-photo-generator/drink-cutout.png" }],
  },
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Volcanic rock headphones campaign",
    label: "Headphones",
    prompt: "Place [Image 1] among small delicate flowers and dark soil or rocks under low-key light.",
    previewImages: ["/images/ai-product-photo-generator/headphones.png"],
    inputMentions: [{ type: "image", name: "Headphones product", imgSrc: "/images/ai-product-photo-generator/headphones-cutout.png" }],
  },
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Brutalist sofa interior",
    label: "Sofa",
    prompt: "Place [Image 1] in a brutalist concrete interior with wooden furniture and strong diagonal shadows. A cat is sleeping on the chair",
    previewImages: ["/images/ai-product-photo-generator/sofa.png"],
    inputMentions: [{ type: "image", name: "Sofa product", imgSrc: "/images/ai-product-photo-generator/sofa-cutout.png" }],
  },
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Blue gradient watch campaign",
    label: "Watch",
    prompt: "Place [Image 1] floating in a clean blue-white gradient space with no base or flowers.",
    previewImages: ["/images/ai-product-photo-generator/watch.png"],
    inputMentions: [{ type: "image", name: "Watch product", imgSrc: "/images/ai-product-photo-generator/watch-cutout.png" }],
  },
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Botanical handbag campaign",
    label: "Handbag",
    prompt: "Place [Image 1] among sparse green leaves in a clean floating botanical composition.",
    previewImages: ["/images/ai-product-photo-generator/handbag.png"],
    inputMentions: [{ type: "image", name: "Handbag product", imgSrc: "/images/ai-product-photo-generator/handbag-cutout.png" }],
  },
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Pink camera editorial",
    label: "Camera",
    prompt: "Place [Image 1] on a textured mound against a soft pink background with orchid branches.",
    previewImages: ["/images/ai-product-photo-generator/camera.png"],
    inputMentions: [{ type: "image", name: "Camera product", imgSrc: "/images/ai-product-photo-generator/camera-cutout.png" }],
  },
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Volcanic boulder fan campaign",
    label: "Desk fan",
    prompt: "Place [Image 1] naturally wedged between two chunky black porous volcanic boulders on opposing diagonals.",
    previewImages: ["/images/ai-product-photo-generator/desk-fan.png"],
    inputMentions: [{ type: "image", name: "Desk fan product", imgSrc: "/images/ai-product-photo-generator/desk-fan-cutout.png" }],
  },
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Bohemian chair interior",
    label: "Chair",
    prompt: "Place [Image 1] in a cozy bohemian pet-friendly interior with sheer curtains, rugs, and soft sunlight.",
    previewImages: ["/images/ai-product-photo-generator/chair.png"],
    inputMentions: [{ type: "image", name: "Chair product", imgSrc: "/images/ai-product-photo-generator/chair-cutout.png" }],
  },
  {
    categoryKey: "product-photo",
    categoryLabel: "Product photos",
    title: "Stacked stone can campaign",
    label: "Can",
    prompt: "Place [Image 1] balanced on stacked stones with small pebbles and large green leaves.",
    previewImages: ["/images/ai-product-photo-generator/can.png"],
    inputMentions: [{ type: "image", name: "Can product", imgSrc: "/images/ai-product-photo-generator/can-cutout.png" }],
  },
];

export function ProductPhotoTemplates() {
  function recreate(template: ProductPhotoTemplate) {
    window.dispatchEvent(new CustomEvent("visdraft:recreate-template", { detail: template }));
  }

  return (
    <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
      {templates.map((template) => (
        <figure key={template.title} className="group relative overflow-hidden rounded-lg">
          <img src={template.previewImages[0]} alt={template.label} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10 text-sm font-medium text-white">
            {template.label}
          </figcaption>
          <button type="button" onClick={() => recreate(template)} className="absolute bottom-12 left-1/2 w-max -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black opacity-100 shadow-lg transition sm:opacity-0 sm:group-hover:opacity-100">
            Recreate
          </button>
        </figure>
      ))}
    </div>
  );
}
