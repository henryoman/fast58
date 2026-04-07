use napi::bindgen_prelude::*;
use napi_derive::napi;

const ALPHABET: &[u8; 58] = b"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE: usize = 58;

const fn make_decode() -> [i8; 256] {
    let mut map = [-1i8; 256];
    let mut i = 0;
    while i < 58 {
        map[ALPHABET[i] as usize] = i as i8;
        i += 1;
    }
    map
}
const DECODE: [i8; 256] = make_decode();

#[inline(always)]
pub fn encode(data: &[u8]) -> String {
    if data.is_empty() {
        return String::new();
    }

    let zeros = data.iter().take_while(|&&b| b == 0).count();
    if zeros == data.len() {
        return "1".repeat(data.len());
    }

    let size = ((data.len() - zeros) * 138) / 100 + 1;
    let mut digits = vec![0u8; size];
    let mut len = 0;

    for &byte in &data[zeros..] {
        let mut carry = byte as usize;
        let mut j = size;
        let mut written = 0;

        while (carry != 0 || written < len) && j > 0 {
            j -= 1;
            carry += (digits[j] as usize) << 8;
            digits[j] = (carry % BASE) as u8;
            carry /= BASE;
            written += 1;
        }
        len = written;
    }

    let mut first = size.saturating_sub(len);
    while first < size && digits[first] == 0 {
        first += 1;
    }

    let mut result = vec![b'1'; zeros + size - first];
    for (i, &d) in digits[first..].iter().enumerate() {
        result[zeros + i] = ALPHABET[d as usize];
    }

    unsafe { String::from_utf8_unchecked(result) }
}

#[inline(always)]
pub fn decode(data: &str) -> Vec<u8> {
    if data.is_empty() {
        return Vec::new();
    }

    let bytes = data.as_bytes();
    let zeros = bytes.iter().take_while(|&&b| b == b'1').count();
    if zeros == bytes.len() {
        return vec![0u8; zeros];
    }

    let size = ((bytes.len() - zeros) * 733) / 1000 + 1;
    let mut decoded = vec![0u8; size];
    let mut len = 0;

    for &b in &bytes[zeros..] {
        let val = DECODE[b as usize];
        if val < 0 {
            return Vec::new();
        }

        let mut carry = val as usize;
        let mut j = size;
        let mut written = 0;

        while (carry != 0 || written < len) && j > 0 {
            j -= 1;
            carry += BASE * decoded[j] as usize;
            decoded[j] = (carry & 0xff) as u8;
            carry >>= 8;
            written += 1;
        }
        len = written;
    }

    let mut first = size.saturating_sub(len);
    while first < size && decoded[first] == 0 {
        first += 1;
    }

    let mut result = vec![0u8; zeros + size - first];
    for (i, &d) in decoded[first..].iter().enumerate() {
        result[zeros + i] = d;
    }
    result
}

#[napi(js_name = "encode")]
#[inline(always)]
pub fn napi_encode(data: Buffer) -> String {
    encode(&data)
}

#[napi(js_name = "decode")]
#[inline(always)]
pub fn napi_decode(data: String) -> Buffer {
    Buffer::from(decode(&data))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic() {
        assert_eq!(encode(b"hello"), "Cn8eVZg");
        assert_eq!(decode("Cn8eVZg"), b"hello");
    }

    #[test]
    fn test_zeros() {
        assert_eq!(encode(b"\x00\x00"), "11");
        assert_eq!(decode("11"), b"\x00\x00");
    }

    #[test]
    fn test_roundtrip() {
        let data = [0, 0, 1, 2, 3, 255];
        let encoded = encode(&data);
        assert_eq!(decode(&encoded), data);
    }
}
