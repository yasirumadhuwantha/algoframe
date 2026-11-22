import type { SimulationParams, StructureType } from '../types/traceTypes';

export interface Lesson {
  id: StructureType;
  week: number;
  title: string;
  description: string;
  principle: string;
  operations: string[];
  defaults: SimulationParams;
  exampleValues: number[];
}

export const OPERATION_LABELS: Record<string, string> = {
  define: 'Define (initial)', add_vertex: 'Add vertex', remove_vertex: 'Remove vertex', add_edge: 'Add edge', remove_edge: 'Remove edge', bfs: 'Breadth-first search', dfs: 'Depth-first search',
  insert: 'Insert', delete: 'Delete', search: 'Search', access: 'Access by index',
  push: 'Push', pop: 'Pop', peek: 'Peek', enqueue: 'Enqueue', dequeue: 'Dequeue', inorder: 'Inorder traversal',
};

const lesson = (id: StructureType, week: number, title: string, description: string, principle: string,
  operations: string[], values: number[], insertValue = 67): Lesson => ({
    id, week, title, description, principle, operations: ['define', ...operations], exampleValues: values,
    defaults: { structure: id, operation: 'define', values: [], insertValue, insertIndex: 0, capacity: id === 'hash_table' ? 7 : 6, payloadValue: 99, frontIndex: 0, edges: [], targetVertex: 1 },
  });

export const LESSONS: Lesson[] = [
  lesson('dynamic_array', 1, 'Arrays', 'Follow indexed access, element shifts, and buffer growth.', 'Contiguous slots · index-based access', ['insert', 'delete', 'search', 'access'], [10, 20, 30, 40], 25),
  lesson('singly_linked_list', 2, 'Singly linked list', 'Walk references, insert a node, and reconnect links when deleting.', 'Scattered nodes · one-way references', ['insert', 'delete', 'search'], [14, 29, 42]),
  lesson('doubly_linked_list', 2, 'Doubly linked list', 'Keep both next and previous references consistent.', 'Two-way references · predecessor traversal', ['insert', 'delete', 'search'], [14, 29, 42]),
  lesson('stack', 3, 'Stacks', 'Push and pop at the top, with explicit full and empty checks.', 'LIFO · last in, first out', ['push', 'pop', 'peek'], [10, 20, 30], 40),
  lesson('queue', 4, 'Queues', 'Watch front and rear wrap around a fixed circular buffer.', 'FIFO · first in, first out', ['enqueue', 'dequeue', 'peek'], [10, 20, 30], 40),
  lesson('binary_tree', 5, 'Trees', 'Compare keys, reconnect subtrees, and explore inorder traversal.', 'Unbalanced BST · left < node < right', ['insert', 'delete', 'search', 'inorder'], [50, 29, 75, 14, 42]),
  lesson('hash_table', 6, 'Hash tables', 'Hash integer keys into buckets and resolve collisions by chaining.', 'key % capacity · separate chaining', ['insert', 'delete', 'search'], [10, 17, 24], 31),
  lesson('graph', 7, 'Graphs', 'Connect vertices, edit edges, and follow breadth-first or depth-first traversal.', 'Undirected graph · adjacency lists', ['add_vertex', 'remove_vertex', 'add_edge', 'remove_edge', 'bfs', 'dfs'], [0, 1, 2, 3, 4], 0),
];
