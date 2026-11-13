import http from 'node:http';
import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
export function sign(body, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const digest = createHmac('sha256', secret)
    .update(String(timestamp) + '.')
    .update(body)
    .digest('hex');
  return 't=' + timestamp + ',v1=' + digest;
}
export function verify(
  body,
  header,
  secret,
  { now = Math.floor(Date.now() / 1000), tolerance = 300 } = {},
) {
  if (typeof header !== 'string' || !/^t=\d+,v1=[a-f0-9]{64}$/.test(header)) return false;
  const timestamp = Number(header.split(',')[0].slice(2));
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > tolerance) return false;
  const expected = Buffer.from(sign(body, secret, timestamp).split('v1=')[1], 'hex'),
    actual = Buffer.from(header.split('v1=')[1], 'hex');
  return timingSafeEqual(expected, actual);
}
export function createWebhookServer({
  secret,
  maxEvents = 1000,
  maxBytes = 65536,
  now = () => Math.floor(Date.now() / 1000),
} = {}) {
  if (typeof secret !== 'string' || secret.length < 16)
    throw new Error('Use a webhook secret of at least 16 characters.');
  if (!Number.isInteger(maxEvents) || maxEvents < 1 || !Number.isInteger(maxBytes) || maxBytes < 1)
    throw new Error('Invalid limits');
  const events = new Map();
  const server = http.createServer(async (req, res) => {
    const reply = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(body));
    };
    if (req.url === '/health' && req.method === 'GET') return reply(200, { ok: true });
    if (req.url === '/events' && req.method === 'GET')
      return reply(200, { events: [...events.values()].map((e) => e.event) });
    if (req.url !== '/webhooks') return reply(404, { error: 'Not found' });
    if (req.method !== 'POST') return reply(405, { error: 'Use POST' });
    const chunks = [];
    let bytes = 0;
    try {
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          reply(413, { error: 'Payload too large' });
          return;
        }
        chunks.push(chunk);
      }
    } catch {
      return;
    }
    const raw = Buffer.concat(chunks);
    if (!verify(raw, req.headers['x-lab-signature'], secret, { now: now() }))
      return reply(401, { error: 'Invalid or expired signature' });
    let event;
    try {
      event = JSON.parse(raw.toString('utf8'));
    } catch {
      return reply(400, { error: 'Invalid JSON' });
    }
    if (
      !event ||
      typeof event.id !== 'string' ||
      !event.id ||
      event.id.length > 200 ||
      typeof event.type !== 'string' ||
      !event.type ||
      event.type.length > 200
    )
      return reply(422, { error: 'Event requires id and type strings (1..200 characters).' });
    const digest = createHash('sha256').update(raw).digest('hex'),
      existing = events.get(event.id);
    if (existing)
      return existing.digest === digest
        ? reply(200, { accepted: true, duplicate: true, id: event.id })
        : reply(409, { error: 'Event ID already used for different bytes' });
    if (events.size >= maxEvents)
      return reply(503, { error: 'Event capacity reached; restart the local lab.' });
    events.set(event.id, { digest, event });
    return reply(202, { accepted: true, duplicate: false, id: event.id });
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  return server;
}
export async function sendEvent(url, event, secret, { timestamp } = {}) {
  const target = new URL(url);
  if (
    target.protocol !== 'http:' ||
    !['127.0.0.1', '[::1]', 'localhost'].includes(target.hostname) ||
    target.username ||
    target.password
  )
    throw new Error('The lab sender only supports local HTTP targets.');
  const body = JSON.stringify(event);
  return fetch(target, {
    method: 'POST',
    redirect: 'error',
    headers: {
      'Content-Type': 'application/json',
      'X-Lab-Signature': sign(body, secret, timestamp),
    },
    body,
    signal: AbortSignal.timeout(5000),
  });
}
