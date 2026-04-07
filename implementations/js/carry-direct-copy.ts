import type { Implementation } from "../types.ts";
import { ALPHABET, BASE, BASE_MAP, DECODE_FACTOR, ENCODE_FACTOR, LEADING_ZERO } from "./shared.ts";

export function encode(input: Buffer | Uint8Array): string {
  const data = input instanceof Uint8Array ? input : new Uint8Array(input);
  const len = data.length;
  if (len === 0) {
    return "";
  }

  let zeroes = 0;
  while (zeroes < len && data[zeroes] === 0) zeroes++;
  if (zeroes === len) {
    return LEADING_ZERO.repeat(zeroes);
  }

  const size = ((len - zeroes) * ENCODE_FACTOR + 1) | 0;
  const digits = new Uint8Array(size);
  let length = 0;

  for (let i = zeroes; i < len; i++) {
    let carry = data[i];
    let j = size;
    let written = 0;

    while ((carry > 0 || written < length) && j > 0) {
      j--;
      carry += digits[j] << 8;
      digits[j] = carry % BASE;
      carry = (carry / BASE) | 0;
      written++;
    }

    length = written;
  }

  let first = size - length;
  while (first < size && digits[first] === 0) first++;

  let result = zeroes === 0 ? "" : LEADING_ZERO.repeat(zeroes);
  for (let i = first; i < size; i++) {
    result += ALPHABET[digits[i]];
  }

  return result;
}

export function decode(data: string): Buffer {
  const len = data.length;
  if (len === 0) {
    return Buffer.alloc(0);
  }

  let zeroes = 0;
  while (zeroes < len && data[zeroes] === LEADING_ZERO) zeroes++;
  if (zeroes === len) {
    return Buffer.alloc(zeroes);
  }

  const size = ((len - zeroes) * DECODE_FACTOR + 1) | 0;
  const bytes = new Uint8Array(size);
  let length = 0;

  for (let i = zeroes; i < len; i++) {
    const code = data.charCodeAt(i);
    let carry = code < 256 ? BASE_MAP[code] : 255;
    if (carry === 255) {
      return Buffer.alloc(0);
    }

    let j = size;
    let written = 0;

    while ((carry > 0 || written < length) && j > 0) {
      j--;
      carry += BASE * bytes[j];
      bytes[j] = carry & 255;
      carry >>>= 8;
      written++;
    }

    length = written;
  }

  let first = size - length;
  while (first < size && bytes[first] === 0) first++;

  const result = Buffer.allocUnsafe(zeroes + size - first);
  if (zeroes > 0) {
    result.fill(0, 0, zeroes);
  }
  for (let source = first, dest = zeroes; source < size; source++, dest++) {
    result[dest] = bytes[source];
  }

  return result;
}

export const implementation: Implementation = {
  id: "js/carry-direct-copy",
  kind: "js",
  encode,
  decode,
};
