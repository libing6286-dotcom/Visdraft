import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ReplicateImageProvider } from "../src/generation/providers/replicate-image.js";

const outputDir = new URL("../../web/public/images/ai-product-photo-generator/", import.meta.url);
const provider = new ReplicateImageProvider(process.env.REPLICATE_API_TOKEN!);

const images = [
  {
    file: "case-skincare.jpg",
    prompt: "Premium commercial product photograph of one unbranded matte white skincare serum bottle with a blank label, on a pale blue bathroom stone shelf. Soft window light, subtle water reflections, clean editorial beauty photography, product centered with generous space around every edge, realistic materials, no people, no logo, no readable text.",
  },
  {
    file: "case-coffee.jpg",
    prompt: "Premium commercial product photograph of one unbranded kraft paper coffee bag with a completely blank label, standing on a warm sunlit kitchen counter beside a small ceramic cup and a few coffee beans. Refined natural lifestyle styling, soft morning light, product centered with generous space around every edge, realistic materials, no people, no logo, no readable text.",
  },
  {
    file: "case-earbuds.jpg",
    prompt: "Premium commercial product photograph of matte black wireless earbuds in an open charging case on a minimal warm gray desk. Gentle directional studio light, restrained modern technology editorial styling, product centered with generous space around every edge, realistic materials, no people, no logo, no readable text.",
  },
  {
    file: "case-candle.jpg",
    prompt: "Premium commercial product photograph of an unbranded amber glass scented candle with a blank cream label on a bedside wooden table. Soft warm bedroom daylight, linen fabric and a small dried branch in the background, calm home fragrance editorial styling, product centered with generous space around every edge, realistic materials, no people, no logo, no readable text.",
  },
  {
    file: "case-tote.jpg",
    prompt: "Premium commercial product photograph of a plain natural canvas tote bag with no print, arranged upright against a light beige textured fabric backdrop. Soft sculpting studio light, modern accessories campaign photography, product centered with generous space around every edge, realistic materials, no people, no logo, no readable text.",
  },
  {
    file: "case-sparkling-drink.jpg",
    prompt: "Premium commercial product photograph of a clear glass bottle of sparkling citrus drink with a blank white label, on a sunlit outdoor cafe table with a few citrus slices. Fresh restrained summer editorial styling, realistic condensation, product centered with generous space around every edge, no people, no logo, no readable text.",
  },
] as const;

await mkdir(outputDir, { recursive: true });

for (const image of images) {
  console.log(`Generating ${image.file}...`);
  const result = await provider.generate({
    prompt: image.prompt,
    model: "google/nano-banana-2",
    aspectRatio: "4:3",
    quality: "hd",
    outputFormat: "jpg",
  });
  const response = await fetch(result.url);
  if (!response.ok) throw new Error(`Download failed for ${image.file}: ${response.status}`);
  await writeFile(join(outputDir.pathname, image.file), Buffer.from(await response.arrayBuffer()));
  console.log(`Saved ${image.file} (${result.width}x${result.height})`);
}
