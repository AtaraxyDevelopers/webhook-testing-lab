<p><a href="https://ataraxydevelopers.com"><img src="docs/brand/ataraxy-developers-logo.png" alt="Ataraxy Developers — Turning Digital Visions Into Reality" width="520"></a></p>

# Webhook Testing Lab

[![CI](https://github.com/AtaraxyDevelopers/webhook-testing-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/AtaraxyDevelopers/webhook-testing-lab/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A local signed webhook receiver and sender with replay and duplicate handling.

An open-source project from [Ataraxy Developers](https://github.com/AtaraxyDevelopers).

## Quick start

Install [Node.js](https://nodejs.org/en/download) 22 or 24 (npm is included). Check
`node --version` and `npm --version` in your terminal. The commands below run from
this repository's root folder, the one containing `package.json`.

**With Git:**

```sh
git clone https://github.com/AtaraxyDevelopers/webhook-testing-lab.git
cd webhook-testing-lab
npm ci
npm test
```

**Without Git:** choose **Code → Download ZIP** on GitHub, extract the archive,
and open a terminal in the extracted `webhook-testing-lab-main` folder (release archives may
include the version in the folder name). Run `npm ci` and `npm test` there.
Use the **source-code ZIP**, not an npm `.tgz` package, to follow this developer walkthrough.
The install step may need internet access; the examples run locally afterward.

On Windows PowerShell, if `npm.ps1` is blocked by execution policy, use `npm.cmd`
in place of `npm` in these commands. No execution-policy change is required.

Run a complete local delivery, duplicate, and expired-signature demonstration:

```sh
npm run demo
```

## Run the receiver and sender separately

In the repository root, run this **once** to create a local `.env` containing a
random secret shared by both commands. Its value is not printed or committed.

```sh
npm run setup:local
```

If `.env` already exists, setup refuses to overwrite it. Keep it and continue.
Open two terminals in the same repository folder.

**Terminal 1:**

```sh
npm run start:local
```

Wait for `Webhook lab: http://127.0.0.1:4320` and leave that terminal running.

**Terminal 2:**

```sh
npm run send:local -- demo-event-1
npm run send:local -- demo-event-1
```

The first delivery returns 202; the exact duplicate returns 200 with duplicate:true.
Open **http://127.0.0.1:4320/events** in a browser to inspect the synthetic event.
Press **Ctrl+C** in Terminal 1 when finished. Restarting clears the in-memory events.

Change PORT in `.env` to use a different port; both local commands read it. A URL
passed as the sender's second argument overrides the default. To supply configuration
through your shell instead, use the original `npm start` and `npm run send -- demo-event-1`
commands with the same WEBHOOK_SECRET (at least 16 characters) in both terminals.
Existing shell variables take precedence over values in the env file.

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

## Expected first run

The self-contained demo prints 202 for the first event, 200 for the duplicate, and 401 for an expired signature, then exits successfully.

## Contributing and support

See [CONTRIBUTING.md](CONTRIBUTING.md), [community expectations](CODE_OF_CONDUCT.md),
and [SECURITY.md](SECURITY.md). Open an issue with a minimal synthetic reproduction.
This project is maintained on a best-effort basis. No paid service or account is
required to run the local examples.

## License

[MIT](LICENSE). You may use, adapt, and redistribute this project under its license.
