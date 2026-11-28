import type { SimulationParams, SimulationStep, SimulationTrace, StructureType } from '../types/traceTypes';
import type { Lesson } from './curriculum';

export type ExperienceMode = 'learn' | 'explore' | 'predict';
export type StepMode = 'concepts' | 'lines';

// Keep actual trace indices: both navigation modes share the exact Python cursor.
export function conceptFrames(trace: SimulationTrace): number[] {
  const frames = [1];
  const signature = (step: SimulationStep) => JSON.stringify([
    step.nodes.map(n => [n.id, n.val, n.next_addr, n.prev_addr, n.left_addr, n.right_addr, n.role_label, n.highlight_state, n.lane]),
    step.edges.map(e => [e.from_id, e.to_id]),
    step.variables?.order, step.variables?.queue, step.variables?.stack, step.memory_shift.shifted_elements,
  ]);
  let previous = signature(trace.steps[0]);
  trace.steps.slice(1).forEach((step, offset) => {
    const next = signature(step);
    if (next !== previous) frames.push(offset + 2);
    previous = next;
  });
  if (frames.at(-1) !== trace.steps.length) frames.push(trace.steps.length);
  return frames;
}

export function describeStep(trace: SimulationTrace, index: number): { title: string; text: string } {
  const step = trace.steps[index - 1];
  const previous = trace.steps[index - 2];
  const op = String(trace.metadata.operation);
  const vars = step.variables ?? {};
  if (!previous) return { title: 'Start here', text: op === 'define' ? 'Build the structure, one value at a time.' : 'This is the starting structure. Follow the highlighted values as the operation runs.' };
  if (index === trace.steps.length) return { title: 'All done', text: op === 'define' ? 'Your structure is ready. Pick an operation or click an element to explore.' : 'The operation is complete. Try another operation, or replay to follow the changes again.' };
  if (step.nodes.length > previous.nodes.length) return { title: trace.structure === 'dynamic_array' ? 'Make more room' : 'Create a new entry', text: trace.structure === 'dynamic_array' ? 'The buffer is full. Allocate more slots before copying the values across.' : 'A new entry appears. Watch how it becomes part of the structure.' };
  if (step.nodes.length < previous.nodes.length) return { title: 'Remove the entry', text: 'The entry leaves the structure. Remaining entries keep their relationships.' };
  const changed = step.nodes.filter(n => previous.nodes.find(old => old.id === n.id)?.val !== n.val);
  if (changed.length) {
    const node = changed[0];
    const line = trace.python_code.split('\n')[step.python_line - 1];
    if (trace.structure === 'dynamic_array' && /data\[i\] = (data\[i [+-] 1\]|old\[i\])/.test(line)) return { title: line.includes('old[i]') ? 'Copy into the new buffer' : 'Shift one value', text: `Copy ${node.val} into slot ${node.index}. ${line.includes('old[i]') ? 'Move each existing value into the larger allocation.' : 'The next slot opens up as values move one position at a time.'}` };
    if (trace.structure === 'hash_table') return { title: 'Update the bucket', text: `Bucket ${node.index} now contains ${node.val ?? 'no entries'}. Colliding keys share a chain.` };
    if (trace.structure === 'queue') return { title: node.val === null ? 'Leave the front slot' : 'Fill the rear slot', text: node.val === null ? 'Remove the front value. The front marker advances without shifting the other values.' : `Place ${node.val} in slot ${node.index}. The rear wraps to slot 0 when it reaches capacity.` };
    if (trace.structure === 'stack') return { title: node.val === null ? 'Lift off the top' : 'Place on the stack', text: node.val === null ? 'The most recently added value leaves first. The top moves down.' : `Place ${node.val} above the previous values. Only the top is used for push and pop.` };
    if (step.memory_shift.shifted_elements > previous.memory_shift.shifted_elements) return { title: 'Move one value', text: `Copy ${node.val} into slot ${node.index}. Copies and shifts make room while preserving the sequence.` };
    return { title: node.val === null ? 'Clear the slot' : 'Place the value', text: node.val === null ? `Slot ${node.index} is now empty.` : `Place ${node.val}${node.index !== null ? ` at index ${node.index}` : ' in the structure'}.` };
  }
  const rewired = step.nodes.some(n => {
    const old = previous.nodes.find(p => p.id === n.id);
    return old && (n.next_addr !== old.next_addr || n.prev_addr !== old.prev_addr || n.left_addr !== old.left_addr || n.right_addr !== old.right_addr);
  });
  if (rewired || JSON.stringify(step.edges) !== JSON.stringify(previous.edges)) return { title: 'Reconnect the links', text: trace.structure === 'graph' ? 'Update the connection in both directions: this graph is undirected.' : 'Update the highlighted references. The values stay in their nodes while the links change.' };
  if (Array.isArray(vars.order) && vars.order.length !== (previous.variables?.order as number[] | undefined)?.length) return { title: 'Visit a vertex', text: `Traversal so far: ${vars.order.join(' → ')}. Each reachable vertex is visited once.` };
  const active = step.nodes.find(n => n.highlight_state === 'active');
  if (active) return { title: trace.structure === 'hash_table' ? 'Find the bucket' : 'Follow the next step', text: trace.structure === 'hash_table' ? `The key maps to bucket ${active.index}. Search its chain for a matching key.` : `Focus on ${active.val ?? `slot ${active.index}`}. ${trace.structure === 'binary_tree' ? 'Compare the key: smaller goes left, larger goes right.' : 'This is the position currently being checked or updated.'}` };
  return { title: 'Check the state', text: 'Update the local bookkeeping before the next visible change. Open Python lines to inspect every instruction.' };
}

export interface Prediction { question: string; choices: string[]; answer: string; explanation: string }
export function makePrediction(params: SimulationParams, trace: SimulationTrace): Prediction | null {
  if (params.operation === 'define') return null;
  let question: string, answer: string, explanation: string;
  const values = params.values;
  const op = params.operation;
  if (params.structure === 'dynamic_array' && ['insert', 'delete'].includes(op!)) {
    const shifts = op === 'insert' ? values.length - params.insertIndex : values.length - params.insertIndex - 1;
    question = 'How many existing values must shift position?'; answer = String(shifts);
    explanation = `${shifts} value${shifts === 1 ? '' : 's'} after index ${params.insertIndex} must shift. ${op === 'insert' && values.length === params.capacity ? 'A full buffer also copies its existing values into a larger allocation.' : 'Values before this position stay in place.'}`;
  } else if (params.structure === 'stack' && values.length) {
    question = 'Which value is at the top before this operation?'; answer = String(values.at(-1));
    explanation = `${answer} was added last, so it is at the top. Stacks follow last in, first out.`;
  } else if (params.structure === 'queue' && values.length) {
    question = 'Which value is at the front before this operation?'; answer = String(values[0]);
    explanation = `${answer} is next to leave. Queue order is logical; the physical slots may wrap around.`;
  } else if (params.structure === 'hash_table') {
    answer = String(((params.insertValue % params.capacity) + params.capacity) % params.capacity);
    question = `Which bucket does key ${params.insertValue} map to?`;
    explanation = `Python's key % capacity maps ${params.insertValue} to bucket ${answer}. Collisions stay in that bucket's chain.`;
  } else if (params.structure === 'binary_tree' && values.length && op !== 'inorder') {
    question = `At root ${values[0]}, where does key ${params.insertValue} go?`;
    answer = params.insertValue === values[0] ? 'Match at root' : params.insertValue < values[0] ? 'Left' : 'Right';
    explanation = `Compare ${params.insertValue} with ${values[0]}. Smaller keys go left, larger keys go right, and equal keys match.`;
    return { question, answer, explanation, choices: ['Left', 'Right', 'Match at root'] };
  } else if (params.structure === 'graph' && ['bfs', 'dfs'].includes(op!)) {
    const order = trace.metadata.result as number[];
    question = 'How many vertices will this traversal reach?'; answer = String(order.length);
    explanation = `Starting at ${params.insertValue} reaches ${answer} vertices. Disconnected vertices are not visited.`;
  } else if (['singly_linked_list', 'doubly_linked_list'].includes(params.structure) && op === 'insert') {
    question = 'How many existing values must shift in memory?'; answer = '0';
    explanation = 'Linked lists reconnect references. Existing values remain in their nodes, even when the diagram moves to make room.';
  } else {
    const final = trace.metadata.final_values as number[];
    question = 'How many live entries will remain after this operation?'; answer = String(final.length);
    explanation = `The operation finishes with ${answer} live entries. Search, access, peek, and traversal do not remove entries.`;
  }
  const numeric = Number(answer);
  const choices = [...new Set([answer, String(numeric + 1), String(numeric === 0 ? 2 : numeric - 1)])].sort((a, b) => Number(a) - Number(b));
  return { question, choices, answer, explanation };
}

export interface Experiment { id: string; title: string; description: string; params: SimulationParams }
export function experimentsFor(lesson: Lesson): Experiment[] {
  const base = { ...lesson.defaults, values: [...lesson.exampleValues] };
  const make = (id: string, title: string, description: string, patch: Partial<SimulationParams>): Experiment => ({ id, title, description, params: { ...base, ...patch } });
  switch (lesson.id) {
    case 'dynamic_array': return [
      make('growth', 'Full array', 'Watch a full buffer grow before insertion.', { values: [10, 20, 30, 40], capacity: 4, operation: 'insert', insertIndex: 1, insertValue: 25 }),
      make('front', 'Insert at the front', 'Every existing value has to move.', { operation: 'insert', insertIndex: 0, insertValue: 5 }),
    ];
    case 'singly_linked_list': case 'doubly_linked_list': return [
      make('splice', 'Splice in the middle', 'Reconnect links without shifting stored values.', { operation: 'insert', insertIndex: 1, insertValue: 25 }),
      make('head', 'Remove the head', 'Watch the next node become the head.', { operation: 'delete', insertIndex: 0 }),
    ];
    case 'stack': return [
      make('pop', 'Last in, first out', 'Lift the newest value off the top.', { operation: 'pop' }),
      make('last-slot', 'Fill the last slot', 'Push into the final available position.', { values: [10, 20, 30], capacity: 4, operation: 'push', insertValue: 40 }),
    ];
    case 'queue': return [
      make('wrap', 'Queue wraparound', 'The rear moves from the last slot back to zero.', { values: [10, 20], capacity: 4, frontIndex: 1, operation: 'enqueue', insertValue: 30 }),
      make('front', 'Advance the front', 'Dequeue without shifting the remaining values.', { values: [10, 20, 30], capacity: 4, frontIndex: 3, operation: 'dequeue' }),
    ];
    case 'binary_tree': return [
      make('unbalanced', 'An unbalanced tree', 'Sorted insertions make a long search path.', { values: [10, 20, 30, 40], operation: 'insert', insertValue: 50 }),
      make('two-children', 'Delete a branching node', 'Follow the successor and reconnect subtrees.', { operation: 'delete', insertValue: 50 }),
    ];
    case 'hash_table': return [
      make('collision', 'Hash collision', 'Several keys land in the same bucket.', { values: [10, 17, 24], capacity: 7, operation: 'insert', insertValue: 31, payloadValue: 310 }),
      make('missing', 'A missing key', 'Search a chain all the way to the end.', { values: [10, 17, 24], capacity: 7, operation: 'search', insertValue: 38 }),
    ];
    case 'graph': return [
      make('disconnected', 'Disconnected graph', 'A traversal visits only reachable vertices.', { values: [0, 1, 2, 3, 4], edges: [[0, 1], [0, 2], [1, 3]], operation: 'bfs', insertValue: 0 }),
      make('cycle', 'A cycle, visited once', 'DFS remembers vertices to avoid looping forever.', { values: [0, 1, 2, 3], edges: [[0, 1], [1, 2], [2, 0], [2, 3]], operation: 'dfs', insertValue: 0 }),
    ];
  }
}

export function exampleParams(lesson: Lesson): SimulationParams {
  return { ...lesson.defaults, values: [...lesson.exampleValues], edges: lesson.id === 'graph' ? [[0, 1], [0, 2], [1, 3], [2, 4]] : [], operation: 'define' };
}

export function nextOperation(structure: StructureType): string {
  return ({ stack: 'push', queue: 'enqueue', graph: 'bfs' } as Partial<Record<StructureType, string>>)[structure] ?? 'insert';
}
