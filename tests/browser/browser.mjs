import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function openBrowser() {
  const executable = [process.env.BROWSER_EXECUTABLE,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find(candidate => candidate && existsSync(candidate));
  if (!executable) throw new Error('Browser test requires installed Edge/Chromium/Chrome; set BROWSER_EXECUTABLE if needed.');
  const profile = mkdtempSync(path.join(os.tmpdir(), 'algoframe-browser-test-'));
  const child = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--window-size=1440,1000', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    const active = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !existsSync(active); i++) await wait(100);
    if (!existsSync(active)) throw new Error('Browser did not expose its local debugging endpoint');
    const port = readFileSync(active, 'utf8').split('\n')[0];
    const page = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let sequence = 0;
    const pending = new Map();
    socket.onmessage = ({ data }) => {
      const response = JSON.parse(data);
      const callback = pending.get(response.id);
      if (!callback) return;
      pending.delete(response.id);
      response.error ? callback.reject(new Error(JSON.stringify(response.error))) : callback.resolve(response.result);
    };
    const call = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
    });
    await call('Page.enable');
    return {
      call,
      async evaluate(expression) {
        const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
        return result.result.value;
      },
      async close() {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ id: ++sequence, method: 'Browser.close' }));
        socket.close(); await wait(500);
        if (child.exitCode === null) child.kill();
      },
    };
  } catch (error) {
    socket?.close(); child.kill(); throw error;
  }
}
