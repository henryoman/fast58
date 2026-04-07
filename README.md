# based58

Fast Base58 encoding/decoding for JavaScript.

## Usage

```typescript
import { encode, decode, encodeStr, decodeStr } from "based58";

// Encode a Buffer to base58 string
encode(Buffer.from("hello"))
// "Cn8eVZg"

// Decode a base58 string to Buffer
decode("Cn8eVZg")
// Buffer<68 65 6c 6c 6f>

// String convenience methods
encodeStr("hello")
// "Cn8eVZg"

decodeStr("Cn8eVZg")
// "hello"
```

## API

### `encode(data: Buffer | Uint8Array): string`
Encode bytes to base58 string.

### `decode(data: string): Buffer`
Decode base58 string to bytes.

### `encodeStr(str: string): string`
Encode a string to base58.

### `decodeStr(data: string): string`
Decode base58 to a string.

## Performance

Benchmarked against bs58 and native implementations on Apple M3:

| Operation | based58 | bs58 |
|-----------|---------|------|
| Encode 32B | 571K/s | 52K/s |
| Decode 32B | 1.8M/s | 91K/s |
| Encode 256B | 9K/s | 13K/s |
| Decode 256B | 32K/s | 35K/s |

**based58 is 10-20x faster than bs58** for typical use cases.
