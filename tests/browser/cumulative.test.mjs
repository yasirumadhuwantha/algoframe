import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { openBrowser, wait } from './browser.mjs';

test('operations carry forward live state across sequential runs', { timeout: 60000 }, async () => {
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
    for (let i = 0; i < 200; i++) {
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
    await until(() => browser.evaluate(`!!document.querySelector('[aria-label="Algorithm visualization"]') && document.querySelector('[aria-label="Algorithm visualization"]').textContent.includes('READY')`), 'Initial trace did not load');

    // Step 1: Define empty array
    await browser.evaluate(`document.querySelector('form button[type="submit"]').click()`);
    await until(() => browser.evaluate(`!!document.querySelector('[aria-label="Algorithm visualization"]')?.textContent?.includes('COMPLETED')`), 'Define did not complete');

    // Step 2: Insert 42 at index 0
    await browser.evaluate(`document.querySelector('button[data-operation="insert"]').click()`);
    await browser.evaluate(`
      (() => {
        const inputs = [...document.querySelectorAll('form input[type="number"]')];
        const setVal = (el, v) => {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
          setter.call(el, String(v));
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        setVal(inputs[0], 42);
        setVal(inputs[1], 0);
      })()
    `);
    await browser.evaluate(`document.querySelector('form button[type="submit"]').click()`);
    await until(() => browser.evaluate(`(() => { const t = document.querySelector('[aria-label="Algorithm visualization"]')?.textContent ?? ''; return t.includes('COMPLETED') && t.includes('42'); })()`), 'First insert did not show 42');

    // Step 3: Insert 99 at index 1 without retyping 42
    await browser.evaluate(`
      (() => {
        const inputs = [...document.querySelectorAll('form input[type="number"]')];
        const setVal = (el, v) => {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
          setter.call(el, String(v));
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        setVal(inputs[0], 99);
        setVal(inputs[1], 1);
      })()
    `);
    await browser.evaluate(`document.querySelector('form button[type="submit"]').click()`);
    await until(() => browser.evaluate(`
      (() => {
        const text = document.querySelector('[aria-label="Algorithm visualization"]')?.textContent ?? '';
        return text.includes('COMPLETED') && text.includes('42') && text.includes('99');
      })()
    `), 'Second insert should retain 42 and add 99');
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
