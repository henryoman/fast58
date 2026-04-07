import { mkdir, rm } from "node:fs/promises";

const dist = new URL("../dist/", import.meta.url);
const entrypoint = new URL("../src/index.ts", import.meta.url);
const root = new URL("../", import.meta.url);
const distPath = dist.pathname;
const entryPath = entrypoint.pathname;

async function run(args: string[]): Promise<void> {
  const proc = Bun.spawn(["bun", ...args], {
    cwd: root.pathname,
    stderr: "inherit",
    stdout: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

async function bundleOne(
  format: "esm" | "cjs",
  target: "browser" | "node" | "bun",
  outfile: string,
): Promise<void> {
  await run([
    "build",
    "--production",
    "--minify",
    `--target=${target}`,
    `--format=${format}`,
    "--packages=bundle",
    "--sourcemap=none",
    `--outfile=${distPath}${outfile}`,
    entryPath,
  ]);
}

await rm(dist, { force: true, recursive: true });
await mkdir(dist, { recursive: true });
await bundleOne("esm", "browser", "index.mjs");
await bundleOne("cjs", "node", "index.cjs");
await bundleOne("esm", "bun", "index.bun.mjs");

console.log(`Bundled optimized fast58-js into ${dist.pathname}`);
