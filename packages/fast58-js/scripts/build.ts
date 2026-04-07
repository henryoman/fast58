import { mkdir, rm } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const dist = new URL("../dist/", import.meta.url);
const entrypoint = new URL("../src/index.ts", import.meta.url);
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

async function buildOne(format: "esm" | "cjs", target: "browser" | "node", outfile: string): Promise<void> {
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
await buildOne("esm", "browser", "index.mjs");
await buildOne("cjs", "node", "index.cjs");

console.log(`Built production fast58-js into ${new URL("./dist/", root).pathname}`);
