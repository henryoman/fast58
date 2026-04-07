import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const native = require(join(__dirname, `index.${process.platform}-${process.arch}.node`));
const bs58Npm = require("bs58").default;
import { encode as jsEncode, decode as jsDecode } from "./index.ts";

const ITERATIONS = 100000;

console.log("=".repeat(60));
console.log("FAST58 vs bs58 (NPM) - Higher is better");
console.log("=".repeat(60));

const sizes = [32, 64, 256];

for (const size of sizes) {
  const data = Buffer.from(crypto.getRandomValues(new Uint8Array(size)));
  const encoded = native.encode(data);

  console.log(`\n${size} bytes - ENCODE:`);
  
  let t = performance.now();
  for (let i = 0; i < ITERATIONS; i++) native.encode(data);
  const nativeEnc = ITERATIONS / (performance.now() - t) * 1000;
  
  t = performance.now();
  for (let i = 0; i < ITERATIONS; i++) jsEncode(data);
  const jsEnc = ITERATIONS / (performance.now() - t) * 1000;
  
  t = performance.now();
  for (let i = 0; i < ITERATIONS; i++) bs58Npm.encode(data);
  const bs58Enc = ITERATIONS / (performance.now() - t) * 1000;

  console.log(`  native fast58: ${Math.round(nativeEnc).toLocaleString()}/s (${(nativeEnc/bs58Enc).toFixed(2)}x vs bs58)`);
  console.log(`  js fast58:     ${Math.round(jsEnc).toLocaleString()}/s (${(jsEnc/bs58Enc).toFixed(2)}x vs bs58)`);
  console.log(`  bs58 (npm):    ${Math.round(bs58Enc).toLocaleString()}/s (baseline)`);

  console.log(`\n${size} bytes - DECODE:`);
  
  t = performance.now();
  for (let i = 0; i < ITERATIONS; i++) native.decode(encoded);
  const nativeDec = ITERATIONS / (performance.now() - t) * 1000;
  
  t = performance.now();
  for (let i = 0; i < ITERATIONS; i++) jsDecode(encoded);
  const jsDec = ITERATIONS / (performance.now() - t) * 1000;
  
  t = performance.now();
  for (let i = 0; i < ITERATIONS; i++) bs58Npm.decode(encoded);
  const bs58Dec = ITERATIONS / (performance.now() - t) * 1000;

  console.log(`  native fast58: ${Math.round(nativeDec).toLocaleString()}/s (${(nativeDec/bs58Dec).toFixed(2)}x vs bs58)`);
  console.log(`  js fast58:     ${Math.round(jsDec).toLocaleString()}/s (${(jsDec/bs58Dec).toFixed(2)}x vs bs58)`);
  console.log(`  bs58 (npm):    ${Math.round(bs58Dec).toLocaleString()}/s (baseline)`);

  // Verify
  const n = native.encode(data);
  const j = jsEncode(data);
  const b = bs58Npm.encode(data);
  console.log(`  ${n === j && j === b ? "✓" : "✗"} All match`);
}

console.log("\n" + "=".repeat(60));
