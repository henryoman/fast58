import { createRequire } from "node:module";
import type { ByteInput, Implementation } from "./types.ts";
import { decode as decodeJsFallback, encode as encodeJsFallback } from "./js/carry-string-copy.ts";

const require = createRequire(import.meta.url);

type NativeBinding = {
  encode(data: Buffer): string;
  decode(data: string): Buffer;
  encodeIter?(data: Buffer): string;
  decodeIter?(data: string): Buffer;
  encodeWhile?(data: Buffer): string;
  decodeWhile?(data: string): Buffer;
  encodeBs58Rs?(data: Buffer): string;
  decodeBs58Rs?(data: string): Buffer;
  encodeFdFixed?(data: Buffer): string;
  decodeFdFixed?(data: string): Buffer;
  encodeFive8Fixed?(data: Buffer): string;
  decodeFive8Fixed?(data: string): Buffer;
  encodeHybridFive8Bs58?(data: Buffer): string;
  decodeHybridFive8Bs58?(data: string): Buffer;
  encodeHybridFive8Carry?(data: Buffer): string;
  decodeHybridFive8Carry?(data: string): Buffer;
};

function loadNativeBinding(): NativeBinding | null {
  const candidates = [
    `../index.${process.platform}-${process.arch}.node`,
    "../index.darwin-universal.node",
  ];

  for (const path of candidates) {
    try {
      return require(path) as NativeBinding;
    } catch {
      continue;
    }
  }

  return null;
}

const nativeBinding = loadNativeBinding();

function wrapEncode(fn: ((data: Buffer) => string) | undefined): ((data: ByteInput) => string) | null {
  if (!fn) return null;
  return (data) => fn(Buffer.from(data));
}

function wrapDecode(fn: ((data: string) => Buffer) | undefined): ((data: string) => Buffer) | null {
  if (!fn) return null;
  return (data) => Buffer.from(fn(data));
}

function makeImplementation(
  id: string,
  encodeFn: ((data: ByteInput) => string) | null,
  decodeFn: ((data: string) => Buffer) | null,
): Implementation | null {
  if (!encodeFn || !decodeFn) return null;

  return {
    id,
    kind: "native",
    encode: encodeFn,
    decode: decodeFn,
  };
}

const encodeIter = wrapEncode(nativeBinding?.encodeIter);
const decodeIter = wrapDecode(nativeBinding?.decodeIter);
const encodeWhile = wrapEncode(nativeBinding?.encodeWhile ?? nativeBinding?.encode);
const decodeWhile = wrapDecode(nativeBinding?.decodeWhile ?? nativeBinding?.decode);
const encodeBs58Rs = wrapEncode(nativeBinding?.encodeBs58Rs);
const decodeBs58Rs = wrapDecode(nativeBinding?.decodeBs58Rs);
const encodeFdFixed = wrapEncode(nativeBinding?.encodeFdFixed);
const decodeFdFixed = wrapDecode(nativeBinding?.decodeFdFixed);
const encodeFive8Fixed = wrapEncode(nativeBinding?.encodeFive8Fixed);
const decodeFive8Fixed = wrapDecode(nativeBinding?.decodeFive8Fixed);
const encodeHybridFive8Bs58 = wrapEncode(nativeBinding?.encodeHybridFive8Bs58 ?? nativeBinding?.encode);
const decodeHybridFive8Bs58 = wrapDecode(nativeBinding?.decodeHybridFive8Bs58 ?? nativeBinding?.decode);
const encodeHybridFive8Carry = wrapEncode(nativeBinding?.encodeHybridFive8Carry);
const decodeHybridFive8Carry = wrapDecode(nativeBinding?.decodeHybridFive8Carry);

export const nativeImplementations = [
  makeImplementation("native/carry-iter", encodeIter, decodeIter),
  makeImplementation("native/carry-while", encodeWhile, decodeWhile),
  makeImplementation("native/bs58-rs", encodeBs58Rs, decodeBs58Rs),
  makeImplementation("native/fd-fixed", encodeFdFixed, decodeFdFixed),
  makeImplementation("native/five8-fixed", encodeFive8Fixed, decodeFive8Fixed),
  makeImplementation("native/hybrid-five8-bs58", encodeHybridFive8Bs58, decodeHybridFive8Bs58),
  makeImplementation("native/hybrid-five8-carry", encodeHybridFive8Carry, decodeHybridFive8Carry),
].filter((implementation): implementation is Implementation => implementation !== null);

export const nativeLoaded = nativeImplementations.length > 0;
export const nativeEncodeWinnerId = "native/hybrid-five8-bs58";
export const nativeDecodeWinnerId = "native/hybrid-five8-bs58";

export function getNativeEncode(): (data: ByteInput) => string {
  return (
    encodeHybridFive8Bs58 ??
    encodeHybridFive8Carry ??
    encodeFive8Fixed ??
    encodeBs58Rs ??
    encodeIter ??
    encodeWhile ??
    encodeJsFallback
  );
}

export function getNativeDecode(): (data: string) => Buffer {
  return (
    decodeHybridFive8Bs58 ??
    decodeHybridFive8Carry ??
    decodeFive8Fixed ??
    decodeBs58Rs ??
    decodeIter ??
    decodeWhile ??
    decodeJsFallback
  );
}
