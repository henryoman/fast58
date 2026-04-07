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

Bundle outputs:
- `dist/index.mjs`: production-minified ESM bundle
- `dist/index.cjs`: production-minified CommonJS bundle
- `dist/index.bun.mjs`: Bun-targeted minified bundle
