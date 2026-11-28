import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './session.mjs';
import { wait } from './browser.mjs';

test('one-click example, guided playback, line mode and canvas editing share real state', { timeout: 60000 }, async () => withApp(async ({ browser, ui, click, input, finish }) => {
  assert.equal(await browser.evaluate(`!!document.querySelector('[data-action="try-example"]')`), true, 'A beginner needs a one-click runnable example');
  assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Synchronized Python Implementation"]')`), false, 'Code should be optional on first entry');
  await click('[data-action="try-example"]');
  await ui(`!document.querySelector('[data-operation="insert"]').disabled`);
  await click('[data-operation="insert"]');
  await click('form button[type="submit"]');
  await ui(`!!document.querySelector('[aria-label="Pause playback"]')`, 'Learn should automatically play instead of jumping to the result');
  await click('[aria-label="Pause playback"]');
  const conceptMax = await browser.evaluate(`Number(document.querySelector('[aria-label="Execution step"]').max)`);
  await click('[data-playback="lines"]');
  assert.ok(await browser.evaluate(`Number(document.querySelector('[aria-label="Execution step"]').max)`) > conceptMax, 'Concept mode should omit housekeeping lines');
  await click('[data-action="toggle-code"]');
  const steps = await browser.evaluate(`(async () => {
    const response = await fetch('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structure: 'dynamic_array', operation: 'insert', values: [10,20,30,40], capacity: 6, insertIndex: 0, insertValue: 25 }) });
    const trace = await response.json();
    return { copy: trace.steps.find(step => trace.python_code.split('\\n')[step.python_line - 1].includes('data[i] = data[i - 1]')).step_index,
      firstChangeLine: trace.steps.find(step => step.variables?.i === 4).python_line };
  })()`);
  await input('[aria-label="Execution step"]', 2);
  await click('[data-playback="concepts"]');
  await click('[aria-label="Next step"]');
  assert.equal(await browser.evaluate(`Number(document.querySelector('[aria-current="step"]').dataset.line)`), steps.firstChangeLine, 'Switching to key steps must not skip the next visible change');
  await click('[data-playback="lines"]');
  await input('[aria-label="Execution step"]', steps.copy);
  await ui(`!!document.querySelector('[data-transfer="element-copy"]')`, 'A real array shift should animate between its source and destination slots');
  const fromX = await browser.evaluate(`document.querySelector('[data-transfer="element-copy"]').getBoundingClientRect().left`);
  await wait(250);
  assert.ok(await browser.evaluate(`document.querySelector('[data-transfer="element-copy"]').getBoundingClientRect().left`) > fromX, 'The value should travel right during insertion');
  await finish();
  assert.ok(await browser.evaluate(`document.querySelector('.algo-dot-grid').getAttribute('aria-label').endsWith(' ' + document.querySelector('[aria-current="step"]').dataset.line)`));
  await click('[data-mode="explore"]');
  await click('[data-node-id="1"]');
  await input('[aria-label="Edit selected value"]', 88);
  await click('[data-action="save-value"]');
  await ui(`document.querySelector('[aria-label="Algorithm visualization"]')?.textContent.includes('COMPLETED') && !!document.querySelector('[data-node-value="88"]')`, 'Canvas editing must update engine state');
  await click('[aria-label="Insert at index 2"]');
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Position (index)"]').value`), '2');
  await input('[aria-label="Value"]', 77);
  await click('form button[type="submit"]');
  await ui(`!!document.querySelector('[data-node-value="77"]') && !!document.querySelector('[data-node-value="88"]')`, 'Direct insertion must preserve the edited value');
}));

test('prediction retries, lesson reset, edge experiments and graph connections', { timeout: 60000 }, async () => withApp(async ({ browser, ui, click }) => {
  await click('[data-action="try-example"]');
  await ui(`!document.querySelector('[data-operation="insert"]').disabled`);
  await click('[data-mode="predict"]');
  await click('[data-operation="insert"]');
  await click('form button[type="submit"]');
  await ui(`!!document.querySelector('[aria-label="Prediction challenge"]')`);
  const step = await browser.evaluate(`document.querySelector('[aria-label="Execution step"]').value`);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Execution step"]').disabled`), true, 'Challenge playback should remain locked');
  await browser.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await browser.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await wait(1300);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Execution step"]').value`), step, 'Prediction must pause before revealing the result');
  await click('[data-answer="wrong"]');
  await ui(`document.querySelector('[role="status"]').textContent.includes('Try again')`);
  await click('[data-answer="correct"]');
  await ui(`document.querySelector('[aria-label="Prediction challenge"]').textContent.includes('Exactly')`);
  await click('[data-action="reveal-prediction"]');
  await ui(`!!document.querySelector('[aria-label="Pause playback"]')`);
  await click('[data-mode="explore"]');
  await click('[data-experiment="growth"]');
  await ui(`document.querySelector('[aria-label="Algorithm visualization"]')?.textContent.includes('COMPLETED') && document.querySelectorAll('[data-slot]').length === 8`, 'Full-array experiment must actually grow capacity');
  await click('[data-lesson="graph"]');
  await ui(`!!document.querySelector('[data-action="try-example"]') && document.querySelector('[data-operation="bfs"]').disabled`);
  assert.equal(await browser.evaluate(`!!document.querySelector('[aria-label="Prediction challenge"]')`), false, 'Stale prediction must not survive lesson switch');
  await click('[data-action="try-example"]');
  await ui(`!!document.querySelector('[data-vertex="3"]') && !document.querySelector('[data-operation="bfs"]').disabled`);
  await click('[data-vertex="3"]');
  await click('[data-vertex="4"]');
  await click('[data-action="connect-vertices"]');
  await ui(`!!document.querySelector('[data-edge="g:3:4"]')`, 'Clicking two graph endpoints should create a real undirected edge');
  await click('[data-experiment="disconnected"]');
  await ui(`document.querySelector('[aria-label="Algorithm visualization"]')?.textContent.includes('COMPLETED') && document.querySelector('[data-vertex="4"]')?.parentElement.textContent.includes('VERTEX') && !document.querySelector('[data-edge="g:3:4"]')`, 'Disconnected traversal must leave an isolated vertex unvisited');
}));

test('real array/list comparison and responsive reduced-motion layouts', { timeout: 60000 }, async () => withApp(async ({ browser, ui, click }) => {
  await click('[data-action="open-comparison"]');
  await click('[data-action="run-comparison"]');
  await ui(`document.querySelector('[aria-label="Insertion comparison"]')?.textContent.includes('Same result')`, 'Comparison must run both Python traces');
  assert.ok(await browser.evaluate(`document.querySelector('[data-comparison="dynamic_array"]').textContent.includes('4 element moves')`));
  assert.ok(await browser.evaluate(`document.querySelector('[data-comparison="singly_linked_list"]').textContent.includes('0 element moves')`));
  await browser.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const width of [390, 768, 1440]) {
    await browser.call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width === 390 });
    for (const dark of [false, true]) {
      if (await browser.evaluate(`document.documentElement.classList.contains('dark')`) !== dark) await click('button[aria-label*="theme"]');
      await wait(120);
      assert.ok(await browser.evaluate(`document.documentElement.scrollWidth <= innerWidth`), `Page overflow at ${width}px, dark=${dark}`);
      assert.ok(await browser.evaluate(`getComputedStyle(document.querySelector('button')).animationName === 'none'`), 'Reduced motion should disable decorative animations');
    }
  }
}));
