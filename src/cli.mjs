import { createWebhookServer } from './webhooks.mjs';
try {
  const port = Number(process.env.PORT ?? 4320);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  const server = createWebhookServer({ secret: process.env.WEBHOOK_SECRET });
  server.on('error', (e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => console.log('Webhook lab: http://127.0.0.1:' + port));
  for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => server.close());
} catch (e) {
  console.error(e.message);
  process.exitCode = 2;
}
