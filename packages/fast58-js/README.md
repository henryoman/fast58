# fast58-js

`fast58-js` is a zero-dependency Base58 package with a `bs58`-compatible API:

```ts
import fast58 from "fast58-js";

const encoded = fast58.encode(new Uint8Array([104, 101, 108, 108, 111]));
const decoded = fast58.decode(encoded);
const maybeDecoded = fast58.decodeUnsafe(encoded);
```

Exports:
- `encode(input: Uint8Array): string`
- `decodeUnsafe(input: string): Uint8Array | undefined`
- `decode(input: string): Uint8Array`

Scripts:
- `bun run build`
- `bun run bundle`
- `bun test`
- `bun run bench`
  Runs a fresh bundle first, then benchmarks `dist/index.bun.mjs`

Bundle outputs:
- `dist/index.mjs`: production-minified ESM bundle
- `dist/index.cjs`: production-minified CommonJS bundle
- `dist/index.bun.mjs`: Bun-targeted minified bundle

## Benchmark

Benchmarks were run on April 6, 2026 with:
- `Bun 1.3.11`
- `macOS 26.3.1 (a)`
- `arm64`
- bundled artifact under test: `dist/index.bun.mjs`
- external libraries: `bs58`, `base-x`, `@scure/base`
- methodology: 5 runs per suite, 3 samples per case, median of per-run geometric means

### Overall

Combined encode+decode throughput:

| Suite | fast58-js | Best external | fast58-js vs best external |
| --- | ---: | ---: | ---: |
| Broad Mix | 3,969,161/s | 2,567,311/s | 1.55x |
| 32B Hot Path | 1,287,343/s | 741,238/s | 1.74x |
| 64B Hot Path | 298,256/s | 157,559/s | 1.89x |
| Large Payloads | 8,872/s | 4,474/s | 1.98x |

### Broad Mix Detail

| Library | Encode gmean | Decode gmean | Combined gmean | Encode vs bs58 | Decode vs bs58 |
| --- | ---: | ---: | ---: | ---: | ---: |
| fast58-js | 2,772,290/s | 5,682,754/s | 3,969,161/s | 1.04x | 2.29x |
| bs58 | 2,658,892/s | 2,478,885/s | 2,567,311/s | 1.00x | 1.00x |
| base-x | 2,647,030/s | 2,481,231/s | 2,562,790/s | 1.00x | 1.00x |
| @scure/base | 638,363/s | 623,453/s | 630,864/s | 0.24x | 0.25x |

### Large Payload Detail

| Library | Encode gmean | Decode gmean | Combined gmean | Encode vs bs58 | Decode vs bs58 |
| --- | ---: | ---: | ---: | ---: | ---: |
| fast58-js | 4,726/s | 16,656/s | 8,872/s | 1.03x | 3.82x |
| bs58 | 4,595/s | 4,356/s | 4,474/s | 1.00x | 1.00x |
| base-x | 4,574/s | 4,371/s | 4,471/s | 1.00x | 1.00x |
| @scure/base | 2,644/s | 2,600/s | 2,622/s | 0.58x | 0.60x |

`fast58-js` is the overall winner in every suite above. The main reason is decode throughput: encode is competitive to slightly faster than `bs58`/`base-x`, while decode is materially faster across the full range.
