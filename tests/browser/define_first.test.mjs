import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { openBrowser, wait } from './browser.mjs';

test('define must be completed before other operations unlock, and resets per lesson', { timeout: 60000 }, async () => {
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
    const ready = () => until(() => browser.evaluate(`!!document.querySelector('[aria-label="Algorithm visualization"]') && document.querySelector('[aria-label="Algorithm visualization"]').textContent.includes('READY')`), 'Trace did not become ready');
    await ready();

    // Before defining, non-define operation tabs must be disabled
    const lockedBeforeDefine = await browser.evaluate(`
      (() => {
        const defineTab = document.querySelector('button[data-operation="define"]');
        const insertTab = document.querySelector('button[data-operation="insert"]');
        return defineTab?.getAttribute('aria-selected') === 'true' && !!insertTab && insertTab.disabled === true;
      })()
    `);
    assert.equal(lockedBeforeDefine, true, 'Non-define operations should be disabled before defining structure');

    // Submit the define form (shows COMPLETED immediately)
    await browser.evaluate(`document.querySelector('form button[type="submit"]').click()`);
    await until(() => browser.evaluate(`!!document.querySelector('[aria-label="Algorithm visualization"]') && document.querySelector('[aria-label="Algorithm visualization"]').textContent.includes('COMPLETED')`), 'Define did not complete');

    // After defining, insert tab should be unlocked
    const unlockedAfterDefine = await browser.evaluate(`
      (() => {
        const insertTab = document.querySelector('button[data-operation="insert"]');
        return !!insertTab && insertTab.disabled === false;
      })()
    `);
    assert.equal(unlockedAfterDefine, true, 'Operations should unlock after defining structure');

    // Switching to another lesson should re-lock operations until defined
    await browser.evaluate(`[...document.querySelectorAll('nav button')].find(e => e.textContent.includes('Stacks')).click()`);
    await ready();

    const lockedOnNewLesson = await browser.evaluate(`
      (() => {
        const defineTab = document.querySelector('button[data-operation="define"]');
        const pushTab = document.querySelector('button[data-operation="push"]');
        return defineTab?.getAttribute('aria-selected') === 'true' && !!pushTab && pushTab.disabled === true;
      })()
    `);
    assert.equal(lockedOnNewLesson, true, 'Switching lessons should require defining the new structure first');
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
