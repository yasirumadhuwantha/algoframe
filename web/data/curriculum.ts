import type { SimulationParams, StructureType } from '../types/traceTypes';

export interface Lesson {
  id: StructureType;
  week: number;
  title: string;
  description: string;
  principle: string;
  operations: string[];
  defaults: SimulationParams;
}

export const OPERATION_LABELS: Record<string, string> = {
  insert: 'Insert', delete: 'Delete', search: 'Search', access: 'Access by index',
  push: 'Push', pop: 'Pop', peek: 'Peek', enqueue: 'Enqueue', dequeue: 'Dequeue', inorder: 'Inorder traversal',
};

const lesson = (id: StructureType, week: number, title: string, description: string, principle: string,
  operations: string[], values: number[], insertValue = 67): Lesson => ({
    id, week, title, description, principle, operations,
    defaults: { structure: id, operation: operations[0], values, insertValue, insertIndex: 1, capacity: id === 'hash_table' ? 7 : 6, payloadValue: 99, frontIndex: 0 },
  });

export const LESSONS: Lesson[] = [
  lesson('dynamic_array', 1, 'Arrays', 'Follow indexed access, element shifts, and buffer growth.', 'Contiguous slots · index-based access', ['insert', 'delete', 'search', 'access'], [10, 20, 30, 40], 25),
  lesson('singly_linked_list', 2, 'Singly linked list', 'Walk references, insert a node, and reconnect links when deleting.', 'Scattered nodes · one-way references', ['insert', 'delete', 'search'], [14, 29, 42]),
  lesson('doubly_linked_list', 2, 'Doubly linked list', 'Keep both next and previous references consistent.', 'Two-way references · predecessor traversal', ['insert', 'delete', 'search'], [14, 29, 42]),
  lesson('stack', 3, 'Stacks', 'Push and pop at the top, with explicit full and empty checks.', 'LIFO · last in, first out', ['push', 'pop', 'peek'], [10, 20, 30], 40),
  lesson('queue', 4, 'Queues', 'Watch front and rear wrap around a fixed circular buffer.', 'FIFO · first in, first out', ['enqueue', 'dequeue', 'peek'], [10, 20, 30], 40),
  lesson('binary_tree', 5, 'Trees', 'Compare keys, reconnect subtrees, and explore inorder traversal.', 'Unbalanced BST · left < node < right', ['insert', 'delete', 'search', 'inorder'], [50, 29, 75, 14, 42]),
  lesson('hash_table', 6, 'Hash tables', 'Hash integer keys into buckets and resolve collisions by chaining.', 'key % capacity · separate chaining', ['insert', 'delete', 'search'], [10, 17, 24], 31),
];
