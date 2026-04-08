import { describe, expect, test } from "bun:test";
import bs58 from "bs58";
import fast58, { decode, decodeUnsafe, encode } from "../src/index.ts";

function makeVector(size: number, seed: number): Uint8Array {
  const bytes = new Uint8Array(size);
  let state = seed | 0;

  for (let i = 0; i < size; i++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    bytes[i] = state & 0xff;
  }

  return bytes;
}

const vectors = [
  new Uint8Array(0),
  new Uint8Array([0]),
  new Uint8Array([0, 0]),
  new Uint8Array([0, 0, 1, 2, 3, 255]),
  new TextEncoder().encode("hello"),
  makeVector(8, 0x0badc0de),
  makeVector(16, 0x1234abcd),
  makeVector(32, 0x1234abcd),
  makeVector(64, 0x87654321),
  makeVector(256, 0xdeadbeef),
];

describe("fast58-js", () => {
  test("matches bs58 on known vectors", () => {
    for (const vector of vectors) {
      const encoded = bs58.encode(vector);
      expect(encode(vector)).toBe(encoded);
      expect(decode(encoded)).toEqual(vector);
      expect(fast58.encode(vector)).toBe(encoded);
      expect(fast58.decode(encoded)).toEqual(vector);
    }
  });

  test("decodeUnsafe matches bs58 behavior", () => {
    expect(decodeUnsafe("0")).toBeUndefined();
    expect(fast58.decodeUnsafe("0")).toBeUndefined();
  });

  test("decode throws on invalid input", () => {
    expect(() => decode("0")).toThrow("Non-base58 character");
    expect(() => fast58.decode("0")).toThrow("Non-base58 character");
  });
});
