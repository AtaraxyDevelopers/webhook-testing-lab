# Webhook Testing Lab

[![CI](https://github.com/AtaraxyDevelopers/webhook-testing-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/AtaraxyDevelopers/webhook-testing-lab/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A local signed webhook receiver and sender with replay and duplicate handling.

An open-source project from [Ataraxy Developers](https://github.com/AtaraxyDevelopers).

## Quick start

Requires Node.js 22 or 24 and npm. Git is optional if you download the source ZIP.

```sh
git clone https://github.com/AtaraxyDevelopers/webhook-testing-lab.git
cd webhook-testing-lab
npm ci
npm test
```

Run a complete local delivery, duplicate, and expired-signature demonstration:

```sh
npm run demo
```

## Run the receiver and sender separately

Generate a secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
Set `WEBHOOK_SECRET` to the generated value in **both terminals**. PowerShell uses
`$env:WEBHOOK_SECRET = 'your-generated-value'`; bash/zsh uses
`export WEBHOOK_SECRET='your-generated-value'`. Then:

```sh
# Terminal 1
npm start
# Terminal 2
npm run send -- demo-event-1
npm run send -- demo-event-1
```

First delivery returns 202; an exact duplicate returns 200 with duplicate:true.
Changing bytes for the same event ID returns 409. Inspect synthetic received events
with GET **http://127.0.0.1:4320/events**. Set PORT to change the receiver port and
pass the matching URL as the sender's second argument.

## Signature protocol

The header is `X-Lab-Signature: t=SECONDS,v1=HEX`. Compute HMAC-SHA256 over the
timestamp, a literal period, and the **original request bytes**. Verification uses
a timing-safe digest comparison and a five-minute clock tolerance. This is a lab
protocol; payment providers and other services may use different signing formats.

## Scope and limitations

Loopback-only educational receiver, synthetic events, no external service account.
The sender rejects nonlocal targets and redirects. The event list is local and
unauthenticated; do not expose the server or submit real personal data. Deduplication
is in memory, lasts until restart, and caps at 1,000 events. Bodies cap at 64 KiB.
Production consumers need durable storage, authorization, transactional side effects,
and provider-specific retry and verification policies.

## Validation

Tests cover tampered/expired/future signatures, duplicate delivery, ID conflicts,
capacity, invalid JSON, invalid events, oversized bodies, and nonlocal targets.

## Contributing and support

See [CONTRIBUTING.md](CONTRIBUTING.md), [community expectations](CODE_OF_CONDUCT.md),
and [SECURITY.md](SECURITY.md). Open an issue with a minimal synthetic reproduction.
This project is maintained on a best-effort basis. No paid service or account is
required to run the local examples.

## License

[MIT](LICENSE). You may use, adapt, and redistribute this project under its license.
