declare function encode(input: Uint8Array): string;
declare function decodeUnsafe(input: string): Uint8Array | undefined;
declare function decode(input: string): Uint8Array;

declare const fast58: {
  encode: typeof encode;
  decodeUnsafe: typeof decodeUnsafe;
  decode: typeof decode;
};

export { decode, decodeUnsafe, encode };
export default fast58;
