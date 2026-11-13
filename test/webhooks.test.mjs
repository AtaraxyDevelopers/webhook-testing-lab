import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { sign, verify, createWebhookServer, sendEvent } from '../src/webhooks.mjs';
test('signatures bind bytes and timestamps', () => {
  const secret = randomBytes(32).toString('hex'),
    body = '{"id":"one"}',
    header = sign(body, secret, 1000);
  assert.equal(verify(body, header, secret, { now: 1001 }), true);
  assert.equal(verify(body + ' ', header, secret, { now: 1001 }), false);
  assert.equal(verify(body, header, secret, { now: 1400 }), false);
  assert.equal(verify(body, 'invalid', secret), false);
  assert.equal(verify(body, sign(body, secret, 2000), secret, { now: 1000 }), false);
});
test('receiver accepts, deduplicates, rejects conflicts and enforces capacity', async (t) => {
  const secret = randomBytes(32).toString('hex'),
    server = createWebhookServer({ secret, maxEvents: 1 });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((r) => server.close(r));
  });
  const url = 'http://127.0.0.1:' + server.address().port + '/webhooks',
    event = { id: 'one', type: 'test.created' };
  assert.equal((await sendEvent(url, event, secret)).status, 202);
  const duplicate = await sendEvent(url, event, secret);
  assert.equal((await duplicate.json()).duplicate, true);
  assert.equal((await sendEvent(url, { ...event, type: 'changed' }, secret)).status, 409);
  assert.equal((await sendEvent(url, { id: 'two', type: 'test.created' }, secret)).status, 503);
  assert.equal((await sendEvent(url, event, 'wrong-secret-with-enough-length')).status, 401);
  assert.equal((await sendEvent(url, { id: 5 }, secret)).status, 422);
  const invalid = '{';
  assert.equal(
    (
      await fetch(url, {
        method: 'POST',
        headers: { 'X-Lab-Signature': sign(invalid, secret) },
        body: invalid,
      })
    ).status,
    400,
  );
  const large = 'x'.repeat(70000);
  assert.equal(
    (
      await fetch(url, {
        method: 'POST',
        headers: { 'X-Lab-Signature': sign(large, secret) },
        body: large,
      })
    ).status,
    413,
  );
  assert.equal((await (await fetch(url.replace('/webhooks', '/events'))).json()).events.length, 1);
  await assert.rejects(sendEvent('https://example.com/webhooks', event, secret), /local HTTP/);
});
