/**
 * Encryption API for the self-hosted Link Lock fork.
 *
 * Originally created by Jacob Strieb (May 2020). Rewritten to:
 *   - always use a random salt and IV (no insecure static fallbacks),
 *   - raise PBKDF2 to 600,000 iterations (OWASP 2024 guidance),
 *   - use a compact binary fragment format instead of base64(JSON(base64(...))).
 *
 * Fragment layout (then encoded once as base64url, no padding):
 *
 *   [ 1 byte  version ]
 *   [ 16 bytes salt    ]  (PBKDF2 salt, random per link)
 *   [ 12 bytes IV       ]  (AES-GCM nonce, random per link)
 *   [ N bytes ciphertext+tag ]  (AES-256-GCM of the UTF-8 destination URL)
 *
 * All encryption, decryption, and key derivation use the native SubtleCrypto API.
 */

var API_VERSION = 1;

var SALT_BYTES = 16;
var IV_BYTES = 12;
var HEADER_BYTES = 1 + SALT_BYTES + IV_BYTES; // version + salt + iv

var api = (function() {

  const _enc = new TextEncoder();
  const _dec = new TextDecoder();

  // Derive a 256-bit AES-GCM key from a password and salt using PBKDF2.
  async function deriveKey(password, salt) {
    const rawKey = await crypto.subtle.importKey(
      "raw",
      _enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        // OWASP 2024 guidance for PBKDF2-SHA256. Hardcoded by design — not a knob.
        iterations: 600000,
        hash: "SHA-256"
      },
      rawKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  return {

    // Encrypt a URL with a password. Returns the base64url fragment string.
    encryptUrl: async function(url, password) {
      const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
      const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
      const key = await deriveKey(password, salt);

      const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        _enc.encode(url)
      ));

      const packed = new Uint8Array(HEADER_BYTES + ciphertext.length);
      packed[0] = API_VERSION;
      packed.set(salt, 1);
      packed.set(iv, 1 + SALT_BYTES);
      packed.set(ciphertext, HEADER_BYTES);

      return b64.bytesToB64url(packed);
    },

    // Decrypt a base64url fragment string with a password. Returns the URL.
    // Throws if the version is unknown, the data is malformed, or the password
    // is wrong (AES-GCM authentication failure).
    decryptUrl: async function(fragment, password) {
      const packed = b64.b64urlToBytes(fragment);
      if (packed.length <= HEADER_BYTES) {
        throw new Error("Malformed link");
      }

      const version = packed[0];
      if (version !== API_VERSION) {
        throw new Error("Unsupported link version");
      }

      const salt = packed.slice(1, 1 + SALT_BYTES);
      const iv = packed.slice(1 + SALT_BYTES, HEADER_BYTES);
      const ciphertext = packed.slice(HEADER_BYTES);

      const key = await deriveKey(password, salt);
      const plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
      );

      return _dec.decode(plaintext);
    }

  };
})();
