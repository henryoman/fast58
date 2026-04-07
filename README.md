<p align="center">
  <img src="./logo.png" alt="fast58 logo" width="400" />
</p>

<p align="center">
  <img alt="Bun" src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Rust" src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" />
  <img alt="Oxlint" src="https://img.shields.io/badge/Oxlint-111827?style=for-the-badge&logo=oxc&logoColor=white" />
</p>

# fast58

Base58 encode/decode with benchmarkable JS and native algorithm variants.

## Monorepo Layout

The main purpose of this repository is to build bundle and release the javascript version of fast58. It also includes benchmark suites and a rust implmentation we are currently testing.

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

## Benchmark lookup table (fast58 vs npm `bs58`)

Measured with `bun run benchmark.ts` on April 7, 2026 (UTC). Values are exact throughput from the benchmark output.

### Broad Mix (0B–256B)

| Operation | fast58 winner | fast58 gmean ops/s | npm `bs58` gmean ops/s | fast58 vs `bs58` |
| --- | --- | ---: | ---: | ---: |
| Encode | `js/carry-direct-copy` | 1,082,236 | 647,266 | **1.67x faster** |
| Decode | `js/carry-direct-copy` | 1,249,988 | 660,987 | **1.89x faster** |

### 32-byte Hot Path

| Operation | fast58 winner | fast58 gmean ops/s | npm `bs58` gmean ops/s | fast58 vs `bs58` |
| --- | --- | ---: | ---: | ---: |
| Encode | `js/carry-string-copy` | 290,203 | 271,919 | **1.07x faster** |
| Decode | `js/carry-string-copy` | 600,013 | 271,038 | **2.21x faster** |

### 64-byte Hot Path

| Operation | fast58 winner | fast58 gmean ops/s | npm `bs58` gmean ops/s | fast58 vs `bs58` |
| --- | --- | ---: | ---: | ---: |
| Encode | `js/carry-string-copy` | 76,633 | 71,624 | **1.07x faster** |
| Decode | `js/carry-direct-copy` | 168,335 | 76,953 | **2.19x faster** |

### Large Payloads (128B–1024B)

| Operation | fast58 winner | fast58 gmean ops/s | npm `bs58` gmean ops/s | fast58 vs `bs58` |
| --- | --- | ---: | ---: | ---: |
| Encode | `js/carry-string-copy` | 2,391 | 2,390 | **1.00x (~parity)** |
| Decode | `js/carry-direct-copy` | 5,421 | 2,307 | **2.35x faster** |

### Broad Mix detail by payload size (`fast58 js current` vs npm `bs58`)

| Size | Encode fast58 | Encode `bs58` | Encode ratio | Decode fast58 | Decode `bs58` | Decode ratio |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0B | 163,004,577/s | 12,254,965/s | **13.30x** | 20,260,470/s | 9,091,695/s | **2.23x** |
| 1B | 17,721,574/s | 6,821,322/s | **2.60x** | 11,642,883/s | 8,122,025/s | **1.43x** |
| 2B | 13,589,697/s | 6,152,730/s | **2.21x** | 11,580,813/s | 6,999,932/s | **1.65x** |
| 4B | 7,441,452/s | 4,672,429/s | **1.59x** | 8,810,821/s | 5,340,750/s | **1.65x** |
| 8B | 3,700,100/s | 2,901,587/s | **1.28x** | 4,322,890/s | 3,342,653/s | **1.29x** |
| 16B | 1,071,937/s | 962,850/s | **1.11x** | 2,021,392/s | 888,173/s | **2.28x** |
| 32B | 311,038/s | 292,438/s | **1.06x** | 605,899/s | 315,124/s | **1.92x** |
| 64B | 72,215/s | 72,109/s | **1.00x** | 166,977/s | 72,850/s | **2.29x** |
| 128B | 18,167/s | 18,778/s | 0.97x | 40,319/s | 18,205/s | **2.21x** |
| 256B | 4,662/s | 4,855/s | 0.96x | 10,854/s | 4,648/s | **2.34x** |

For the generic arbitrary-length implementations, the current fixed winners are:

- JS: `js/carry-string-copy`
- Rust encode: `native/bs58-u32`
- Rust decode: `native/bs58-rs`
