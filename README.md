# Link Lock (self-hosted fork)

Password-protect a link using AES-256-GCM, entirely in the browser. This is a
minimized, hardened fork intended to be **self-hosted** for sharing
**low-stakes** document links with clients.

> **Attribution.** This is a fork of [Link Lock](https://github.com/jstrieb/link-lock)
> by Jacob Strieb, used under the MIT License (see [`LICENSE`](LICENSE), which
> retains the original copyright notice). The Polish translation in this fork is
> original to this fork.

## What it does (and what it does not)

You give it an `https://` URL and a password; it encrypts the URL in your browser
and produces a link whose fragment (`#...`) contains the ciphertext. When someone
opens that link and enters the password, their browser decrypts the URL and
redirects there. Nothing is ever sent to or stored on a server.

It **encrypts the destination URL, not the document**. Once a recipient decrypts
the link, they have the real URL and can reshare it; there is no revocation,
expiry, or audit. Use it as a privacy/obfuscation layer for low-stakes links —
not as access control for sensitive material.

## Pages

- `/` — **unlock** page (the page recipients open).
- `/create/` — **create** page (used internally to make locked links).

There is intentionally no decrypt-inspector, hidden-bookmark, or brute-force page.

## Security design

- **AES-256-GCM** with a key derived via **PBKDF2-SHA256, 600,000 iterations**
  (OWASP 2024), using the native `SubtleCrypto` API.
- **Random salt (16 B) and IV (12 B) per link, always** — there is no option to
  disable them.
- **`https://`-only** destinations (blocks `javascript:`/`data:` redirects).
- **Strong passwords:** the create page generates a 20-character random password
  and enforces a 12-character minimum. Because anyone with the link can brute-force
  the password offline, password strength is the whole ballgame — prefer the
  generated password and send it through a **separate channel** from the link.
- **No external requests, no trackers, no cookies.** A strict
  `Content-Security-Policy` (`default-src 'none'; script-src 'self'; ...`) is set
  via `<meta>`; all scripts are same-origin and there are no inline handlers.

### Fragment format

`base64url( [1B version][16B salt][12B IV][AES-GCM ciphertext+tag] )` — a single
compact binary blob (no JSON, no double base64). This keeps locked links roughly
35% shorter than the upstream format. Link length scales with the destination URL
length; the only way to shorten further is a shorter destination.

## Deploying

The site is plain static files with **relative paths** — copy the repository
contents to any static host and serve over **HTTPS** (required for `SubtleCrypto`;
`http://localhost` also works for local testing).

Current target is **Fastmail Files** under `kupczynski.info`. Because that host
serves files without custom response headers, the CSP and referrer policy are set
via `<meta>` tags. The following protections are **header-only** and cannot be set
via meta — add them at the edge if you later move to S3+CloudFront / Cloudflare:

- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: frame-ancestors 'none'` (clickjacking) /
  `X-Frame-Options: DENY`

## Local development / testing

```sh
python3 -m http.server 8000
# then open http://localhost:8000/create/
```

`localhost` counts as a secure context, so WebCrypto works without TLS.

## Operating procedure (recommended)

1. Store the document in your normal platform; prefer that platform's own access
   controls when the content warrants it.
2. Create the locked link here using the generated password.
3. Send the locked link and the password through **separate** channels.
4. Remember the underlying URL is exposed to the recipient after they unlock, and
   revoke access at the document platform when needed.
