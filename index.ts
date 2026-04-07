const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE = 58;
const iFACTOR = Math.log(256) / Math.log(58);

const BASE_MAP = new Uint8Array(256);
for (let i = 0; i < 256; i++) BASE_MAP[i] = 255;
for (let i = 0; i < 58; i++) BASE_MAP[ALPHABET.charCodeAt(i)] = i;

export function encode(data: Buffer | Uint8Array): string {
  const len = data.length;
  if (len === 0) return "";
  
  let zeroes = 0;
  while (zeroes < len && data[zeroes] === 0) zeroes++;
  
  const size = ((len - zeroes) * iFACTOR + 1) | 0;
  const b58 = new Uint8Array(size);
  let length = 0;
  
  for (let pi = zeroes; pi < len; pi++) {
    let carry = data[pi];
    let j = size;
    let taken = 0;
    while ((carry > 0 || taken < length) && j > 0) {
      j--;
      carry += b58[j] << 8;
      b58[j] = carry % BASE;
      carry = (carry / BASE) | 0;
      taken++;
    }
    length = taken;
  }
  
  let first = size - length;
  while (first < size && b58[first] === 0) first++;
  
  let result = "";
  for (let i = 0; i < zeroes; i++) result += "1";
  for (let i = first; i < size; i++) result += ALPHABET[b58[i]];
  return result;
}

export function decode(data: string): Buffer {
  const len = data.length;
  if (len === 0) return Buffer.alloc(0);
  
  let zeroes = 0;
  while (zeroes < len && data[zeroes] === "1") zeroes++;
  
  const size = ((len - zeroes) * 1.4 + 1) | 0;
  const b256 = new Uint8Array(size);
  let length = 0;
  
  for (let i = zeroes; i < len; i++) {
    const code = data.charCodeAt(i);
    let carry = code < 256 ? BASE_MAP[code] : 255;
    if (carry === 255) return Buffer.alloc(0);
    
    let j = size;
    let taken = 0;
    while ((carry > 0 || taken < length) && j > 0) {
      j--;
      carry += BASE * b256[j];
      b256[j] = carry & 255;
      carry >>>= 8;
      taken++;
    }
    length = taken;
  }
  
  let first = size - length;
  while (first < size && b256[first] === 0) first++;
  
  const result = Buffer.alloc(zeroes + size - first);
  for (let i = first; i < size; i++) result[zeroes + i - first] = b256[i];
  return result;
}