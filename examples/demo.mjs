import { randomBytes } from 'node:crypto';
import { createWebhookServer, sendEvent } from '../src/webhooks.mjs';
const secret = randomBytes(32).toString('hex'),
  server = createWebhookServer({ secret });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
try {
  const url = 'http://127.0.0.1:' + server.address().port + '/webhooks';
  const event = { id: 'demo-1', type: 'order.created', data: { synthetic: true } };
  for (const label of ['First delivery', 'Duplicate delivery']) {
    const response = await sendEvent(url, event, secret);
    console.log(label, response.status, await response.text());
  }
  const rejected = await sendEvent(url, event, secret, { timestamp: 1 });
  console.log('Expired signature', rejected.status, await rejected.text());
} finally {
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
