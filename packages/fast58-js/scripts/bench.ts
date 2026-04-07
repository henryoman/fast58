const proc = Bun.spawn(["bun", "run", "bundle"], {
  cwd: new URL("../", import.meta.url).pathname,
  stderr: "inherit",
  stdout: "inherit",
});

const exitCode = await proc.exited;
if (exitCode !== 0) {
  process.exit(exitCode);
}

await import(new URL("../bench/compare.ts", import.meta.url).href);
