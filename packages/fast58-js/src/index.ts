const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE = 58;
const LEADING_ZERO = 49;
const ENCODE_FACTOR = Math.log(256) / Math.log(58);
const DECODE_FACTOR = 733 / 1000;
const MID_ENCODE_MIN_LENGTH = 8;
const MID_ENCODE_MAX_LENGTH = 64;

const BASE_MAP = new Uint8Array(256);
BASE_MAP.fill(255);
for (let i = 0; i < ALPHABET.length; i++) {
  BASE_MAP[ALPHABET.charCodeAt(i)] = i;
}

function asBytes(input: Uint8Array): Uint8Array {
  return input;
}

function encodeMidSized(input: Uint8Array): string {
  const len = input.length;
  let zeroes = 0;
  let length = 0;
  let offset = 0;

  while (offset < len && input[offset] === 0) {
    offset++;
    zeroes++;
  }
  if (offset === len) {
    return "1".repeat(zeroes);
  }

  const size = ((len - offset) * ENCODE_FACTOR + 1) >>> 0;
  const digits = new Uint8Array(size);

  while (offset < len) {
    let carry = input[offset];
    let written = 0;

    for (let i = size - 1; (carry !== 0 || written < length) && i !== -1; i--, written++) {
      carry += (256 * digits[i]) >>> 0;
      digits[i] = (carry % BASE) >>> 0;
      carry = (carry / BASE) >>> 0;
    }

    length = written;
    offset++;
  }

  let first = size - length;
  while (first < size && digits[first] === 0) {
    first++;
  }

  let result = "1".repeat(zeroes);
  for (; first < size; first++) {
    result += ALPHABET.charAt(digits[first]);
  }

  return result;
}

export function encode(input: Uint8Array): string {
  const data = asBytes(input);
  const len = data.length;
  if (len === 0) {
    return "";
  }
  if (len >= MID_ENCODE_MIN_LENGTH && len <= MID_ENCODE_MAX_LENGTH) {
    return encodeMidSized(data);
  }

  let zeroes = 0;
  while (zeroes < len && data[zeroes] === 0) zeroes++;
  if (zeroes === len) {
    return "1".repeat(zeroes);
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

  let result = zeroes === 0 ? "" : "1".repeat(zeroes);
  for (let i = first; i < size; i++) {
    result += ALPHABET[digits[i]];
  }

  return result;
}

export function decodeUnsafe(input: string): Uint8Array | undefined {
  const len = input.length;
  if (len === 0) {
    return new Uint8Array(0);
  }

  let zeroes = 0;
  while (zeroes < len && input.charCodeAt(zeroes) === LEADING_ZERO) zeroes++;
  if (zeroes === len) {
    return new Uint8Array(zeroes);
  }

  const size = ((len - zeroes) * DECODE_FACTOR + 1) | 0;
  const bytes = new Uint8Array(size);
  let length = 0;

  for (let i = zeroes; i < len; i++) {
    const code = input.charCodeAt(i);
    let carry = code < 256 ? BASE_MAP[code] : 255;
    if (carry === 255) {
      return undefined;
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

  const result = new Uint8Array(zeroes + size - first);
  for (let source = first, dest = zeroes; source < size; source++, dest++) {
    result[dest] = bytes[source];
  }

  return result;
}

export function decode(input: string): Uint8Array {
  const output = decodeUnsafe(input);
  if (output !== undefined) {
    return output;
  }

  throw new Error("Non-base58 character");
}

const fast58 = {
  encode,
  decodeUnsafe,
  decode,
};

export default fast58;
