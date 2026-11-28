import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { openBrowser, wait } from './browser.mjs';

test('native slider End stays synchronized across equally sized operation traces', { timeout: 60000 }, async () => {
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const command = process.platform === 'win32' ? ['cmd.exe', ['/d', '/c', 'npm', 'run', 'dev']] : ['npm', ['run', 'dev']];
  const server = spawn(...command, { cwd: fileURLToPath(new URL('../../', import.meta.url)),
    env: { ...process.env, PORT: String(port) }, windowsHide: true, stdio: 'ignore', detached: process.platform !== 'win32' });
  let browser;
  const until = async (predicate, message) => {
    for (let i = 0; i < 100; i++) { if (await predicate()) return; await wait(50); }
    assert.fail(message);
  };
  try {
    await until(async () => { try { return (await fetch(`http://127.0.0.1:${port}/api/health`)).ok; } catch { return false; } }, 'Server did not start');
    browser = await openBrowser();
    await browser.call('Page.navigate', { url: `http://127.0.0.1:${port}` });
    const ready = () => until(() => browser.evaluate(`!!document.querySelector('[aria-label="Algorithm visualization"]') && document.querySelector('[aria-label="Execution step"]').value === '1' && document.querySelector('[aria-label="Algorithm visualization"]').textContent.includes('READY')`), 'Trace did not become ready');
    const completed = () => until(() => browser.evaluate(`!document.querySelector('form fieldset').disabled && !!document.querySelector('[aria-label="Algorithm visualization"]') && document.querySelector('[aria-label="Algorithm visualization"]').textContent.includes('COMPLETED')`), 'Trace did not complete');
    await ready();
    await browser.evaluate(`document.querySelector('[data-mode="explore"]').click()`);
    await browser.evaluate(`document.querySelector('[data-playback="lines"]').click()`);
    await browser.evaluate(`document.querySelector('[data-action="toggle-code"]').click()`);
    await browser.evaluate(`[...document.querySelectorAll('nav button')].find(e => e.textContent.includes('Queues')).click()`);
    await ready();
    await browser.evaluate(`document.querySelector('input[name="definition"][value="custom"]').click()`);
    await browser.evaluate(`document.querySelector('form button[type="submit"]').click()`);
    await completed();
    let previousTotal;
    for (const operation of ['enqueue', 'dequeue', 'enqueue', 'dequeue']) {
      await browser.evaluate(`document.querySelector('button[data-operation="${operation}"]').click()`);
      await browser.evaluate(`document.querySelector('form button[type="submit"]').click()`);
      await completed(); await wait(100);
      await browser.evaluate(`document.querySelector('button[aria-label="Reset to first step"]').click()`);
      await ready();
      const total = await browser.evaluate(`Number(document.querySelector('[aria-label="Execution step"]').max)`);
      if (previousTotal !== undefined) assert.equal(total, previousTotal, 'Regression requires equally sized traces');
      previousTotal = total;
      await browser.evaluate(`document.querySelector('[aria-label="Execution step"]').focus()`);
      await browser.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'End', code: 'End', windowsVirtualKeyCode: 35 });
      await browser.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'End', code: 'End', windowsVirtualKeyCode: 35 });
      await until(() => browser.evaluate(`document.querySelector('[aria-label="Steps playback"]').textContent.includes('Step ${total} / ${total}') && document.querySelector('[aria-label="Algorithm visualization"]').textContent.includes('COMPLETED')`), `${operation}: range moved without advancing the shared canvas/code cursor`);
      const synchronized = await browser.evaluate(`document.querySelector('.algo-dot-grid').getAttribute('aria-label').endsWith(' ' + document.querySelector('[aria-current="step"]').dataset.line)`);
      assert.ok(synchronized, 'Canvas and highlighted Python source diverged');
    }
  } finally {
    if (browser) await browser.close();
    if (server.exitCode === null) {
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
      else process.kill(-server.pid, 'SIGTERM');
    }
  }
});
