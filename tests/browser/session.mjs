import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { openBrowser, wait } from './browser.mjs';

export async function withApp(run) {
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const command = process.platform === 'win32' ? ['cmd.exe', ['/d', '/c', 'npm', 'run', 'dev']] : ['npm', ['run', 'dev']];
  const server = spawn(...command, { cwd: fileURLToPath(new URL('../../', import.meta.url)),
    env: { ...process.env, PORT: String(port) }, windowsHide: true, stdio: 'ignore', detached: process.platform !== 'win32' });
  const until = async (expression, message = 'Expected UI state did not appear') => {
    for (let i = 0; i < 180; i++) {
      if (await expression()) return;
      await wait(50);
    }
    assert.fail(message);
  };
  let browser;
  try {
    await until(async () => { try { return (await fetch(`http://127.0.0.1:${port}/api/health`)).ok; } catch { return false; } }, 'Server did not start');
    browser = await openBrowser();
    await browser.call('Page.navigate', { url: `http://127.0.0.1:${port}` });
    const ui = async (expression, message) => until(() => browser.evaluate(`Boolean(${expression})`), message);
    await ui(`!!document.querySelector('[aria-label="Algorithm visualization"]')`, 'Initial canvas did not load');
    const click = async selector => {
      await ui(`!!document.querySelector(${JSON.stringify(selector)}) && !document.querySelector(${JSON.stringify(selector)}).disabled`, `Control unavailable: ${selector}`);
      return browser.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    };
    const input = (selector, value) => browser.evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, ${JSON.stringify(String(value))});
      element.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    const finish = async () => {
      await ui(`!!document.querySelector('[aria-label="Execution step"]:not(:disabled)')`);
      await browser.evaluate(`(() => { const slider = document.querySelector('[aria-label="Execution step"]'); slider.focus(); })()`);
      await browser.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'End', code: 'End', windowsVirtualKeyCode: 35 });
      await browser.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'End', code: 'End', windowsVirtualKeyCode: 35 });
      await ui(`document.querySelector('[aria-label="Algorithm visualization"]')?.textContent.includes('COMPLETED')`, 'Trace did not finish');
    };
    await run({ browser, ui, click, input, finish, url: `http://127.0.0.1:${port}` });
    assert.deepEqual(browser.errors, [], 'Unexpected browser runtime exceptions');
  } finally {
    if (browser) await browser.close();
    if (server.exitCode === null) {
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
      else process.kill(-server.pid, 'SIGTERM');
    }
  }
}
