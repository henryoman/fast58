# fast58

Base58 encode/decode with benchmarkable JS and native algorithm variants.

## Layout

- `implementations/js/*`: named JS algorithm candidates
- `implementations/native.ts`: native binding loader and candidate registry
- `bench/run.ts`: shared benchmark runner
- `test/correctness.test.ts`: cross-implementation correctness coverage
- `src/algorithms/*`: Rust candidate implementations

## Commands

```sh
bun test
bun run benchmark.ts
bun run build:native
```

## Public API

```ts
import {
  decode,
  decodeBest,
  decodeStr,
  encode,
  encodeBest,
  encodeStr,
} from "fast58";
```

- `encode` / `decode`: fastest JS winners selected from the benchmarked JS candidates
- `encodeBest` / `decodeBest`: fixed native winner selected from the generic Rust implementations
- `encodeStr` / `decodeStr`: string helpers

## Benchmarking

The benchmark runner validates every implementation against `bs58`, measures encode and decode separately, and reports suite winners for:

- broad mixed payloads
- 32-byte hot paths
- 64-byte hot paths
- large payloads

That lets you add a new algorithm, register it once, and compare it against every existing candidate without rewriting the harness.

For the generic arbitrary-length implementations, the current fixed winners are:

- JS: `js/carry-string-copy`
- Rust encode: `native/bs58-u32`
- Rust decode: `native/bs58-rs`
