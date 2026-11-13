import { sendEvent } from './webhooks.mjs';
try {
  if (!process.env.WEBHOOK_SECRET || process.env.WEBHOOK_SECRET.length < 16)
    throw new Error('Set WEBHOOK_SECRET (at least 16 characters).');
  const args = process.argv.slice(2);
  if (args.length > 2) throw new Error('Usage: npm run send -- [event-id] [local-url]');
  const response = await sendEvent(
    args[1] ?? 'http://127.0.0.1:4320/webhooks',
    {
      id: args[0] ?? 'demo-event-1',
      type: 'order.created',
      data: { orderId: 'synthetic-100', amountCents: 2500 },
    },
    process.env.WEBHOOK_SECRET,
  );
  console.log(response.status, await response.text());
  if (!response.ok) process.exitCode = 1;
} catch (e) {
  console.error(e.message);
  process.exitCode = 2;
}
