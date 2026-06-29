import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standaloneRoot = path.join(root, ".next", "standalone");
const standaloneNext = path.join(standaloneRoot, ".next");

async function copyIfExists(source, destination) {
  await rm(destination, { force: true, recursive: true });
  await cp(source, destination, { recursive: true });
}

await mkdir(standaloneNext, { recursive: true });
await copyIfExists(path.join(root, ".next", "static"), path.join(standaloneNext, "static"));
await copyIfExists(path.join(root, "public"), path.join(standaloneRoot, "public"));

console.log("Standalone static assets are ready.");
