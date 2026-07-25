import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const handlerPath = path.join(
  appDir,
  ".open-next",
  "server-functions",
  "default",
  "apps",
  "web",
  "handler.mjs",
);

const original =
  "getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}";
const patched =
  "getMiddlewareManifest(){return {version:3,middleware:{},functions:{},sortedMiddleware:[]}}";

const source = await readFile(handlerPath, "utf8");

if (source.includes(patched)) {
  console.log("OpenNext Cloudflare middleware manifest patch already applied.");
} else if (source.includes(original)) {
  await writeFile(handlerPath, source.replace(original, patched));
  console.log("Applied OpenNext Cloudflare middleware manifest patch.");
} else {
  throw new Error(
    `Unable to find Next middleware manifest loader in ${handlerPath}. ` +
      "OpenNext or Next.js may have changed its generated output.",
  );
}
