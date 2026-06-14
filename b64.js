/**
 * Base64url helpers (no padding).
 *
 * Originally created by Jacob Strieb (May 2020) for Link Lock.
 * Rewritten for the self-hosted fork: only the byte<->base64url conversions
 * needed by the compact binary fragment format are kept.
 */

var b64 = (function() {
  // URL-safe alphabet. Standard "+"/"/" are also accepted when decoding so
  // that links pasted from older/standard-base64 sources still work.
  const _a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const _aRev = {};
  for (let i = 0; i < _a.length; i++) {
    _aRev[_a[i]] = i;
  }
  _aRev["+"] = 62;
  _aRev["/"] = 63;

  return {

    // Encode a Uint8Array as a base64url string without padding.
    bytesToB64url: function(bytes) {
      let output = "";
      for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i];
        const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;

        output += _a[b0 >>> 2];
        output += _a[((b0 & 0x3) << 4) | (b1 >>> 4)];
        if (i + 1 < bytes.length) {
          output += _a[((b1 & 0xF) << 2) | (b2 >>> 6)];
        }
        if (i + 2 < bytes.length) {
          output += _a[b2 & 0x3F];
        }
      }
      return output;
    },

    // Decode a base64url (or standard base64) string into a Uint8Array.
    // Trailing "=" padding is tolerated. Throws on invalid characters.
    b64urlToBytes: function(s) {
      s = s.replace(/=+$/, "");
      if (!/^[A-Za-z0-9\-_+/]*$/.test(s)) {
        throw new Error("Invalid base64url input");
      }

      const bytes = [];
      for (let i = 0; i < s.length; i += 4) {
        const n0 = _aRev[s[i]];
        const n1 = _aRev[s[i + 1]];
        const n2 = _aRev[s[i + 2]]; // undefined past the end
        const n3 = _aRev[s[i + 3]]; // undefined past the end

        if (n0 === undefined || n1 === undefined) {
          throw new Error("Invalid base64url input");
        }

        bytes.push((n0 << 2) | (n1 >>> 4));
        if (n2 !== undefined) {
          bytes.push(((n1 & 0xF) << 4) | (n2 >>> 2));
        }
        if (n3 !== undefined) {
          bytes.push(((n2 & 0x3) << 6) | n3);
        }
      }

      return new Uint8Array(bytes);
    }

  };
})();
