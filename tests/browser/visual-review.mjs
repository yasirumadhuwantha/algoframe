import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { withApp } from './session.mjs';
import { wait } from './browser.mjs';

// Manual visual evidence helper; output stays in the ignored local review folder.
await withApp(async ({ browser, ui, click }) => {
  mkdirSync('.local/ui-review', { recursive: true });
  await click('[data-mode="explore"]');
  await click('[data-action="try-example"]');
  await ui(`!document.querySelector('[data-operation="insert"]').disabled`);
  const report = [];
  for (const width of [390, 768, 1440]) {
    await browser.call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width === 390 });
    for (const dark of [false, true]) {
      if (await browser.evaluate(`document.documentElement.classList.contains('dark')`) !== dark) await click('button[aria-label*="theme"]');
      for (const lesson of ['dynamic_array', 'singly_linked_list', 'doubly_linked_list', 'stack', 'queue', 'binary_tree', 'hash_table', 'graph']) {
        await click(`[data-lesson="${lesson}"]`);
        await click('[data-action="try-example"]');
        await ui(`document.querySelector('[aria-label="Algorithm visualization"]')?.textContent.includes('COMPLETED') && !document.querySelector('form fieldset').disabled`);
        await browser.evaluate('window.scrollTo(0, 0)');
        await wait(400);
        const overflow = await browser.evaluate(`({ page: document.documentElement.scrollWidth, viewport: innerWidth, canvas: document.querySelector('.algo-dot-grid').scrollWidth })`);
        assert.ok(overflow.page <= width, `${lesson} page overflow at ${width}px`);
        const screenshot = await browser.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
        const file = `.local/ui-review/${lesson}-${width}-${dark ? 'dark' : 'light'}.png`;
        writeFileSync(file, Buffer.from(screenshot.data, 'base64'));
        report.push({ lesson, width, dark, overflow, screenshot: file });
      }
    }
    console.log(`Reviewed ${width}px in both themes.`);
  }
  await browser.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await click('[data-lesson="dynamic_array"]');
  await click('[data-action="try-example"]');
  await ui(`!document.querySelector('[data-operation="insert"]').disabled`);
  await click('[data-action="toggle-code"]');
  await click('[data-mode="predict"]');
  await click('form button[type="submit"]');
  await ui(`!!document.querySelector('[aria-label="Prediction challenge"]')`);
  await browser.evaluate('window.scrollTo(0, 0)');
  await wait(400);
  const prediction = await browser.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync('.local/ui-review/prediction-python.png', Buffer.from(prediction.data, 'base64'));
  await browser.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await browser.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  assert.ok(await browser.evaluate(`document.activeElement.hasAttribute('data-answer')`), 'Tab should move from the challenge heading to its answer controls');
  const focusOutline = await browser.evaluate(`getComputedStyle(document.activeElement).outlineStyle`);
  assert.equal(focusOutline, 'solid', 'Keyboard focus must remain visible');
  const ax = await browser.call('Accessibility.getFullAXTree');
  assert.equal(ax.nodes.filter(node => !node.ignored && node.role?.value === 'button' && !node.name?.value?.trim()).length, 0, 'Visible buttons must have accessible names');
  for (const width of [390, 1440]) {
    await browser.call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width === 390 });
    await wait(150);
    assert.ok(await browser.evaluate(`(() => { const canvas = document.querySelector('[aria-label="Algorithm visualization"]').getBoundingClientRect(); const code = document.querySelector('[aria-label="Synchronized Python Implementation"]').getBoundingClientRect(); return ${width} < 1024 ? code.top >= canvas.bottom : code.left >= canvas.right; })()`), 'Python must stack on phones and stay beside the desktop canvas');
  }
  await browser.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  report.push({ focusOutline, unnamedButtons: 0, codePlacement: 'phone below / desktop beside', reducedMotion: await browser.evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`), browser: await browser.call('Browser.getVersion') });
  writeFileSync('.local/ui-review/report.json', JSON.stringify(report, null, 2));
  console.log(`Saved ${report.length - 1} responsive screenshots plus prediction/code view; page overflow checks passed.`);
});
