import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './session.mjs';

test('all topic examples and edge experiments execute, and errors preserve the current structure', { timeout: 120000 }, async () => withApp(async ({ browser, ui, click, input }) => {
  await click('[data-mode="explore"]');
  const lessons = ['dynamic_array', 'singly_linked_list', 'doubly_linked_list', 'stack', 'queue', 'binary_tree', 'hash_table', 'graph'];
  for (const lesson of lessons) {
    await click(`[data-lesson="${lesson}"]`);
    await click('[data-action="try-example"]');
    await ui(`document.querySelector('[aria-label="Algorithm visualization"]')?.textContent.includes('COMPLETED') && !document.querySelector('form fieldset').disabled`, `${lesson} example did not execute`);
    assert.equal(await browser.evaluate(`!!document.querySelector('[role="alert"]')`), false, `${lesson} example returned an error`);
    const experiments = await browser.evaluate(`[...document.querySelectorAll('[data-experiment]')].map(button => button.dataset.experiment)`);
    assert.equal(experiments.length, 2);
    for (const experiment of experiments) {
      await click(`[data-experiment="${experiment}"]`);
      await ui(`!document.querySelector('form fieldset').disabled && document.querySelector('[aria-label="Algorithm visualization"]')?.textContent.includes('COMPLETED')`, `${lesson}/${experiment} did not finish`);
      assert.equal(await browser.evaluate(`!!document.querySelector('[role="alert"]')`), false, `${lesson}/${experiment} returned an error`);
    }
  }
  await click('[data-lesson="stack"]');
  await click('[data-action="try-example"]');
  await ui(`!document.querySelector('[data-operation="pop"]').disabled`);
  await click('[data-operation="push"]');
  await browser.evaluate(`document.querySelector('form details').open = true`);
  await input('[aria-label="Capacity"]', 3);
  await click('form button[type="submit"]');
  await ui(`document.querySelector('[role="alert"]')?.textContent.includes('Stack is full')`, 'Full-stack error should explain why the operation failed');
  assert.equal(await browser.evaluate(`document.querySelectorAll('[aria-label="Algorithm visualization"] [data-node-id]').length`), 3, 'A rejected push must preserve the existing stack');
  await input('[aria-label="Capacity"]', 4);
  await click('form button[type="submit"]');
  await ui(`!document.querySelector('[role="alert"]') && document.querySelector('[data-node-value="40"]')`, 'Corrected inputs should recover without resetting the structure');
  await click('[data-lesson="queue"]');
  await click('[data-action="try-example"]');
  await ui(`!document.querySelector('[data-operation="dequeue"]').disabled`);
  for (let i = 0; i < 3; i++) {
    await click('[data-operation="dequeue"]');
    await click('form button[type="submit"]');
    await ui(`!document.querySelector('form fieldset').disabled && document.querySelector('[aria-label="Algorithm visualization"]').textContent.includes('COMPLETED')`);
  }
  await click('form button[type="submit"]');
  await ui(`document.querySelector('[role="alert"]')?.textContent.includes('Queue is empty')`, 'Empty queues should report underflow');
}));
