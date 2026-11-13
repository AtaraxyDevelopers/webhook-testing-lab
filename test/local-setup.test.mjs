import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
test('local setup generates a secret without printing it and preserves existing configuration', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'local-configuration-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const script = fileURLToPath(new URL('../scripts/setup-local.mjs', import.meta.url));
  const first = spawnSync(process.execPath, [script], { cwd: directory, encoding: 'utf8' });
  assert.equal(first.status, 0, first.stderr);
  const content = await fs.readFile(path.join(directory, '.env'), 'utf8'),
    token = content.split('\n')[0].split('=')[1];
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.ok(!first.stdout.includes(token));
  assert.ok(content.split('\n').some((line) => line.startsWith('PORT=')));
  const second = spawnSync(process.execPath, [script], { cwd: directory, encoding: 'utf8' });
  assert.equal(second.status, 2);
  assert.equal(await fs.readFile(path.join(directory, '.env'), 'utf8'), content);
});
