import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
try {
  if (process.argv.length > 2) throw new Error('Usage: npm run setup:local');
  const contents = 'WEBHOOK_SECRET=' + randomBytes(32).toString('hex') + '\nPORT=4320\n';
  await fs.writeFile('.env', contents, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  console.log('Created .env with a generated local secret. Run npm run start:local.');
} catch (error) {
  console.error(
    error.code === 'EEXIST'
      ? '.env already exists; keep it or choose a new working directory. No file was changed.'
      : error.message,
  );
  process.exitCode = 2;
}
