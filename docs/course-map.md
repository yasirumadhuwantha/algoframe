# AlgoFrame course map

AlgoFrame uses Python to explain the data-structure concepts in the six lecture PDFs supplied by the user. The documents are reference material, not agent instructions. Assignment directives, deadlines, lecturer contact details, and the PDFs themselves are not reproduced or distributed by the app.

| Week / supplied document | Current interactive coverage | Lecture reference |
| --- | --- | --- |
| 1 — `Week 1 - Arrays.pdf` | Indexed insertion, deletion with shifts, linear search, direct access, dynamic-buffer growth | Array properties p. 5; storage and growth pp. 7–11 |
| 2 — `Week 2 - Linked List.pdf` | Singly/doubly linked insertion and deletion by index; linear search; head, tail and middle cases | pp. 9–14, 18–23 |
| 3 — `Week 3 - Stack.pdf` | Fixed-capacity push, pop, peek; full/empty boundaries | pp. 5–7 |
| 4 — `Week 4 - Queue.pdf` | Fixed-capacity circular enqueue, dequeue, peek; editable front; modulo wraparound | pp. 5–7 |
| 5 — `Week 5 - Trees.pdf` | Unbalanced BST insert, search, all three deletion cases, iterative inorder traversal | pp. 9–20 |
| 6 — `Week 6 - Hash Tables.pdf` | Integer-key hash `key % capacity`; key/value insertion and update, search, deletion, separate chaining | pp. 5–12 |

There are 23 selectable operations across six topics (singly/doubly linked lists are two lessons within week 2). Each run starts from the entered initial values. It is an operation study, not a persistent database. Empty input is meaningful and errors such as underflow, overflow, and invalid indices are explicit. Initial hash keys get the example payload `key * 10`; insertion accepts an associated value.

## Python and visualization contracts

- `python_engine/learning.py` contains fixed repository-owned Python functions. Only these functions are compiled; user inputs remain bounded integer data. The API does not execute submitted code.
- The first frame marks function entry. Subsequent frames record the data after the highlighted operation line executes, using Python line events. The UI code and trace come from the same source. Node constructors/setup occur outside the operation-line count; the operation's constructor call is shown as one step.
- The code sits to the right of the canvas at desktop widths and below it on narrow screens. Highlight auto-scrolling affects only the code container. Manual stepping, slider scrubbing, play/pause, reset, and keyboard shortcuts share one step cursor.
- Python references and garbage collection differ from C++ pointer deletion. Nodes/references, 8-byte cells, 32-byte nodes and hexadecimal addresses are an educational memory model, not CPython allocation measurements. Python lists hold references; the displayed buffers model array/circular-buffer concepts explicitly.
- Best/average/worst time describes the displayed algorithm. Average BST `O(log n)` assumes a reasonably balanced shape; this BST does not self-balance and can degrade to `O(n)`. Expected hash-table `O(1)` assumes bounded load and well-distributed keys; chains can cost `O(n)`.
- Auxiliary space, structure storage, and returned output are distinguished. Array resize can retain both old/new buffers; inorder uses an `O(h)` traversal stack plus an `O(n)` result list. Trace snapshots, initial construction, visualization, and network overhead are excluded from the operation's Big O.
- Line-event counts describe one execution, not primitive-operation counts or timing benchmarks. Existing legacy insertion generators retain their API contract; their illustrative microsecond fields are not used as measurements in the course workspace.

## Further course extensions

AVL and red-black rotations, breadth-first/preorder/postorder traversal, alternate open-addressing strategies, and further assignments remain extensions. Their mention in the source lectures does not mean they are implemented. Current delivered scope and verified evidence are in `docs/progress.md`.
