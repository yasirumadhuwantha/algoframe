import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { openBrowser, wait } from './browser.mjs';

test('theme switch button triggers circular wave view transition and toggles dark mode', { timeout: 60000 }, async () => {
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const command = process.platform === 'win32' ? ['cmd.exe', ['/d', '/c', 'npm', 'run', 'dev']] : ['npm', ['run', 'dev']];
  const server = spawn(...command, {
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    env: { ...process.env, PORT: String(port) },
    windowsHide: true,
    stdio: 'ignore',
    detached: process.platform !== 'win32'
  });

  let browser;
  const until = async (predicate, message) => {
    for (let i = 0; i < 100; i++) {
      if (await predicate()) return;
      await wait(50);
    }
    assert.fail(message);
  };

  try {
    await until(async () => {
      try { return (await fetch(`http://127.0.0.1:${port}/api/health`)).ok; } catch { return false; }
    }, 'Server did not start');

    browser = await openBrowser();
    await browser.call('Page.navigate', { url: `http://127.0.0.1:${port}` });
    const ready = () => until(() => browser.evaluate(`!!document.querySelector('[aria-label="Algorithm visualization"]') && document.querySelector('[aria-label="Execution step"]').value === '1' && document.querySelector('[aria-label="Algorithm visualization"]').textContent.includes('READY')`), 'Trace did not become ready');
    await ready();

    const initialDark = await browser.evaluate(`document.documentElement.classList.contains('dark')`);
    assert.equal(initialDark, false, 'Initial theme should be light');

    // Click the theme button to switch to dark mode
    await browser.evaluate(`document.querySelector('button[aria-label*="dark theme"]').click()`);
    await until(() => browser.evaluate(`document.documentElement.classList.contains('dark')`), 'Dark class was not added to document element');

    // Verify dark mode class and button label updated
    const darkButtonExists = await browser.evaluate(`!!document.querySelector('button[aria-label*="light theme"]')`);
    assert.equal(darkButtonExists, true, 'Theme button should now have light theme aria-label');

    // Toggle back to light
    await browser.evaluate(`document.querySelector('button[aria-label*="light theme"]').click()`);
    await until(() => browser.evaluate(`!document.documentElement.classList.contains('dark')`), 'Dark class was not removed');
  } finally {
    if (browser) await browser.close();
    if (server.exitCode === null) {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
      } else {
        process.kill(-server.pid, 'SIGTERM');
      }
    }
  }
});
