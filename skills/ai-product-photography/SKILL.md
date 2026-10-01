---
name: ai-product-photography
description: >-
  Create professional product photography and commercial visual assets with
  Visdraft's native image generation workflow. Use for e-commerce listings,
  Amazon and Shopify imagery, advertising creatives, packaging mockups,
  studio shots, lifestyle scenes, and product photo variations.
license: MIT
source: community
---

# AI Product Photography

Use this skill when the user asks for product photos, commercial product
images, e-commerce visuals, packaging mockups, lifestyle product scenes, or
multiple product-photo variations.

## Runtime Contract

- Use Visdraft's `generate_image` tool for every image-generation request.
- Do not run `infsh`, `curl`, `npx`, package installers, or interactive login
  commands.
- Do not assume a particular provider, model ID, CLI, API key, or external
  image service. Let `generate_image` use the model selected by Visdraft or by
  the user's explicit model preference.
- When the user supplies product images, pass their asset URLs or IDs as
  `inputImages` so the product identity, shape, color, and branding are
  preserved.
- Use the tool's `title`, `quality`, `aspectRatio`, and `outputFormat` fields
  when they improve the requested deliverable. Prefer JPG for photographs and
  PNG when transparency is required.
- For multiple angles or variants, make separate `generate_image` calls and
  keep the product description, lighting direction, and brand style consistent
  across calls.

## Prompt Construction

Build a detailed prompt from these parts, in this order:

1. Product and visible identifying details.
2. Composition, camera angle, framing, and scale.
3. Background, setting, and supporting props.
4. Lighting direction, softness, contrast, reflections, and shadows.
5. Commercial style and intended channel.
6. Technical finish: sharp product edges, realistic materials, clean geometry,
   high detail, and a natural depth of field.
7. Constraints such as `no text`, `no watermark`, or `no extra products` when
   needed.

Do not invent logos, packaging copy, product specifications, or brand colors
that the user did not provide. If text must appear on packaging, warn that
generated typography may be inaccurate and offer a clean-label alternative.

## Product Identity

When a reference product image is available:

- Treat it as the source of truth for silhouette, proportions, materials,
  colors, controls, labels, and distinctive details.
- Change the environment, lighting, and composition without redesigning the
  product.
- Avoid adding duplicate products, extra buttons, altered logos, distorted
  labels, or physically impossible reflections.
- If the reference is ambiguous or low resolution, ask for a clearer image or
  state the uncertainty before generating.

## Standard Styles

### Studio White Background

Use a seamless pure-white or near-white background, soft diffused key light,
controlled contact shadow, accurate material rendering, and centered
e-commerce framing.

### Lifestyle Context

Place the product in a believable environment that communicates scale and use.
Keep props subordinate, leave visual breathing room, and preserve a clear focal
point on the product.

### Hero Shot

Use a deliberate three-quarter angle or floating composition, controlled rim
light, a premium background, and strong separation between the product and the
scene.

### Flat Lay

Use a top-down composition with a clear arrangement, consistent spacing,
coordinated props, and soft directional shadows. Keep the product readable at a
glance.

### In-Use or Action

Show a plausible interaction or motion context while keeping the product
recognizable. Do not introduce hands, people, or body parts unless requested.

## Lighting Recipes

- Soft studio: broad diffused key, gentle fill, minimal shadow, clean commercial
  finish.
- Dramatic rim: dark or graduated background, controlled edge light, selective
  contrast, premium technology feel.
- Natural window: warm directional daylight, soft falloff, believable ambient
  shadows, editorial lifestyle mood.
- Hard high-contrast: defined directional shadows, crisp highlights, graphic
  advertising look.

## E-Commerce Templates

- **Marketplace main image:** isolated product, pure white background, no text
  or graphics, product large enough to inspect while leaving a safe margin.
- **Marketplace lifestyle image:** product in natural use context, showing scale
  and a clear use case.
- **Shopify hero:** product-led composition with intentional negative space for
  a later text overlay; do not render the overlay text unless explicitly asked.
- **Product detail set:** generate consistent front, three-quarter, side, rear,
  and close-up views with matching light and background.

## Category Guidance

- Electronics: preserve ports, controls, seams, screens, and material finishes.
- Fashion and apparel: show construction, texture, drape, and believable
  contact with the environment.
- Beauty and cosmetics: emphasize package geometry, clean surfaces, controlled
  highlights, and hygienic styling.
- Food and beverage: use believable condensation, texture, serving context, and
  physically plausible shadows.
- Home and furniture: preserve scale, construction, and contact with the floor
  or surrounding objects.
- Jewelry: use controlled sparkle, accurate metal reflections, and macro-level
  sharpness without changing the design.

## Variations and Batch Requests

For a batch request, first extract the invariant product description and brand
style. Then generate each requested variant separately, changing only the
specified angle, environment, crop, or lighting. Name each call with a concise
title such as `wireless-earbuds-studio-front` or
`skincare-lifestyle-window-light`.

If the user requests upscaling, background removal, or another post-processing
operation that is not exposed by a Visdraft tool, generate the best source
image available and explain that the requested post-processing is not
automatically available in the current workspace.

## Quality Checklist

Before calling `generate_image`, verify:

- The product, use case, aspect ratio, and intended channel are clear.
- Reference images are passed through `inputImages` when supplied.
- Lighting and camera direction are physically coherent.
- Text, logos, labels, and product geometry are not being invented.
- The prompt includes unwanted-element constraints when they matter.

After generation, report the result briefly and identify any visible limitations
such as inaccurate small text, altered logos, or product-detail drift.
