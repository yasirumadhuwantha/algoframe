"""Small, repository-owned Python examples traced after each executed operation line.

Only these fixed examples are compiled. User input is data, never executable source.
Setup and visualization overhead are excluded from the operation complexity model.
"""

from __future__ import annotations

import sys
from textwrap import dedent
from typing import Any

from .trace_schema import (
    ComplexityAnalysis, MemoryShiftSummary, PointerEdge, SimulationStep,
    SimulationTrace, TimeBreakdown, VisualEntity,
)

OPERATIONS = {
    "dynamic_array": ("insert", "delete", "search", "access"),
    "singly_linked_list": ("insert", "delete", "search"),
    "doubly_linked_list": ("insert", "delete", "search"),
    "stack": ("push", "pop", "peek"),
    "queue": ("enqueue", "dequeue", "peek"),
    "binary_tree": ("insert", "delete", "search", "inorder"),
    "hash_table": ("insert", "delete", "search"),
}
TITLES = {
    "dynamic_array": "Dynamic Array", "singly_linked_list": "Singly Linked List",
    "doubly_linked_list": "Doubly Linked List", "stack": "Stack",
    "queue": "Circular Queue", "binary_tree": "Binary Search Tree", "hash_table": "Hash Table",
}
DEFAULTS = {
    "dynamic_array": [10, 20, 30, 40], "singly_linked_list": [14, 29, 42],
    "doubly_linked_list": [14, 29, 42], "stack": [10, 20, 30],
    "queue": [10, 20, 30], "binary_tree": [50, 29, 75, 14, 42],
    "hash_table": [10, 17, 24],
}

ARRAY = {
    "insert": """
    def operate(data, size, index, value):
        moves = 0
        if size == len(data):
            old = data
            data = [None] * max(1, 2 * len(old))
            for i in range(size):
                data[i] = old[i]
                moves += 1
            del old
        for i in range(size, index, -1):
            data[i] = data[i - 1]
            moves += 1
        data[index] = value
        size += 1
        return data, size, value
    """,
    "delete": """
    def operate(data, size, index, value):
        moves = 0
        removed = data[index]
        for i in range(index, size - 1):
            data[i] = data[i + 1]
            moves += 1
        size -= 1
        data[size] = None
        return data, size, removed
    """,
    "search": """
    def operate(data, size, index, value):
        for i in range(size):
            if data[i] == value:
                return data, size, i
        return data, size, -1
    """,
    "access": """
    def operate(data, size, index, value):
        result = data[index]
        return data, size, result
    """,
}
STACK = {
    "push": """
    def operate(data, size, value):
        if size == len(data):
            raise ValueError("Stack is full")
        data[size] = value
        size += 1
        return data, size, value
    """,
    "pop": """
    def operate(data, size, value):
        if size == 0:
            raise ValueError("Stack is empty")
        size -= 1
        removed = data[size]
        data[size] = None
        return data, size, removed
    """,
    "peek": """
    def operate(data, size, value):
        if size == 0:
            raise ValueError("Stack is empty")
        result = data[size - 1]
        return data, size, result
    """,
}
QUEUE = {
    "enqueue": """
    def operate(data, front, size, value):
        if size == len(data):
            raise ValueError("Queue is full")
        rear = (front + size) % len(data)
        data[rear] = value
        size += 1
        rear = (rear + 1) % len(data)
        return data, front, size, value
    """,
    "dequeue": """
    def operate(data, front, size, value):
        if size == 0:
            raise ValueError("Queue is empty")
        removed = data[front]
        data[front] = None
        front = (front + 1) % len(data)
        size -= 1
        return data, front, size, removed
    """,
    "peek": """
    def operate(data, front, size, value):
        if size == 0:
            raise ValueError("Queue is empty")
        result = data[front]
        return data, front, size, result
    """,
}
LINK_NODE = """class Node:
    def __init__(self, value):
        self.value = value
        self.next = None
{previous}
"""


def linked_source(operation: str, doubly: bool) -> str:
    if operation == "insert":
        code = """def operate(head, index, value):
    node = Node(value)
    if index == 0:
        node.next = head
{head_prev}        head = node
        return head, value
    current = head
    for i in range(index - 1):
        current = current.next
    node.next = current.next
{node_prev}    current.next = node
    return head, value
""".format(
            head_prev="        if head is not None:\n            head.prev = node\n" if doubly else "",
            node_prev="    node.prev = current\n    if node.next is not None:\n        node.next.prev = node\n" if doubly else "",
        )
    elif operation == "delete":
        code = """def operate(head, index, value):
    if index == 0:
        removed = head.value
        head = head.next
{head_prev}        return head, removed
    current = head
    for i in range(index - 1):
        current = current.next
    target = current.next
    removed = target.value
    current.next = target.next
{next_prev}    return head, removed
""".format(
            head_prev="        if head is not None:\n            head.prev = None\n" if doubly else "",
            next_prev="    if current.next is not None:\n        current.next.prev = current\n" if doubly else "",
        )
    else:
        code = """def operate(head, index, value):
    current = head
    position = 0
    while current is not None:
        if current.value == value:
            return head, position
        current = current.next
        position += 1
    return head, -1
"""
    return LINK_NODE.format(previous="        self.prev = None\n" if doubly else "") + "\n" + code


TREE_NODE = """class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

"""
TREE = {
    "insert": """
    def operate(root, key):
        if root is None:
            root = Node(key)
            return root, True
        current = root
        while True:
            if key == current.value:
                return root, False
            if key < current.value:
                if current.left is None:
                    current.left = Node(key)
                    return root, True
                current = current.left
            else:
                if current.right is None:
                    current.right = Node(key)
                    return root, True
                current = current.right
    """,
    "search": """
    def operate(root, key):
        current = root
        while current is not None:
            if key == current.value:
                return root, True
            if key < current.value:
                current = current.left
            else:
                current = current.right
        return root, False
    """,
    "delete": """
    def operate(root, key):
        parent = None
        current = root
        while current is not None and current.value != key:
            parent = current
            if key < current.value:
                current = current.left
            else:
                current = current.right
        if current is None:
            return root, False
        if current.left is not None and current.right is not None:
            parent = current
            successor = current.right
            while successor.left is not None:
                parent = successor
                successor = successor.left
            current.value = successor.value
            current = successor
        child = current.left if current.left is not None else current.right
        if parent is None:
            root = child
        elif parent.left is current:
            parent.left = child
        else:
            parent.right = child
        return root, True
    """,
    "inorder": """
    def operate(root, key):
        stack = []
        output = []
        current = root
        while current is not None or stack:
            while current is not None:
                stack.append(current)
                current = current.left
            current = stack.pop()
            output.append(current.value)
            current = current.right
        return root, output
    """,
}
HASH = {
    "insert": """
    def operate(table, key, value):
        bucket = key % len(table)
        for i, (stored_key, stored_value) in enumerate(table[bucket]):
            if stored_key == key:
                table[bucket][i] = (key, value)
                return "updated"
        table[bucket].append((key, value))
        return "inserted"
    """,
    "delete": """
    def operate(table, key, value):
        bucket = key % len(table)
        for i, (stored_key, stored_value) in enumerate(table[bucket]):
            if stored_key == key:
                table[bucket].pop(i)
                return stored_value
        return None
    """,
    "search": """
    def operate(table, key, value):
        bucket = key % len(table)
        for stored_key, stored_value in table[bucket]:
            if stored_key == key:
                return stored_value
        return None
    """,
}


def generate_learning_trace(structure: str, operation: str, *, values: list[int] | None = None,
                            value: int = 67, index: int = 1, capacity: int = 6,
                            front: int = 0, payload: int = 99) -> SimulationTrace:
    if operation not in OPERATIONS.get(structure, ()):
        raise ValueError("Unsupported structure or operation")
    values = list(DEFAULTS[structure] if values is None else values)
    if len(values) > 24 or any(type(v) is not int or abs(v) > 1_000_000 for v in values):
        raise ValueError("Use at most 24 integer values between -1000000 and 1000000")
    if any(type(v) is not int for v in (value, index, capacity, front, payload)) or not 1 <= capacity <= 32:
        raise ValueError("Use integer parameters and capacity between 1 and 32")
    if structure in ("dynamic_array", "stack", "queue") and len(values) > capacity:
        raise ValueError("Capacity must hold the initial values")
    if structure in ("dynamic_array", "singly_linked_list", "doubly_linked_list") and operation in ("insert", "delete", "access"):
        bound = len(values) + (operation == "insert")
        if not 0 <= index < bound:
            raise ValueError("Index is outside the valid range for this operation")
    if not 0 <= front < capacity:
        raise ValueError("Queue front must be within the buffer")

    linked = structure in ("singly_linked_list", "doubly_linked_list")
    if linked:
        source = linked_source(operation, structure == "doubly_linked_list")
    elif structure == "binary_tree":
        source = TREE_NODE + dedent(TREE[operation]).strip() + "\n"
    else:
        source = dedent({"dynamic_array": ARRAY, "stack": STACK, "queue": QUEUE, "hash_table": HASH}[structure][operation]).strip() + "\n"
    namespace: dict[str, Any] = {}
    # Fixed source comes only from the dictionaries above, never request content.
    exec(compile(source, "<algoframe-lesson>", "exec"), namespace)
    function = namespace["operate"]
    initial: dict[str, Any]
    if linked:
        head = None
        previous = None
        for number in values:
            node = namespace["Node"](number)
            if previous is None:
                head = node
            else:
                previous.next = node
                if structure == "doubly_linked_list":
                    node.prev = previous
            previous = node
        initial = {"head": head, "index": index, "value": value}
    elif structure == "binary_tree":
        root = None
        for number in values:
            if root is None:
                root = namespace["Node"](number)
                continue
            current = root
            while number != current.value:
                branch = "left" if number < current.value else "right"
                if getattr(current, branch) is None:
                    setattr(current, branch, namespace["Node"](number))
                    break
                current = getattr(current, branch)
        initial = {"root": root, "key": value}
    elif structure == "hash_table":
        table: list[list[tuple[int, int]]] = [[] for _ in range(capacity)]
        for number in dict.fromkeys(values):
            table[number % capacity].append((number, number * 10))
        initial = {"table": table, "key": value, "value": payload}
    else:
        data = [None] * capacity
        for i, number in enumerate(values):
            data[(front + i) % capacity if structure == "queue" else i] = number
        initial = {"data": data, "size": len(values), "value": value}
        if structure == "dynamic_array":
            initial["index"] = index
        if structure == "queue":
            initial["front"] = front

    addresses: dict[int, str] = {}

    def address(node):
        if node is None:
            return None
        return addresses.setdefault(id(node), f"0x{0x1000 + len(addresses) * 32:04x}")

    def snapshot(local):
        nodes = []
        edges = []
        variables = {}
        for name, item in local.items():
            if name.startswith("_") or name in ("data", "old", "table"):
                continue
            if item is None or type(item) in (int, bool, str):
                variables[name] = item
            elif isinstance(item, list) and all(type(x) is int for x in item):
                variables[name] = list(item)
            elif isinstance(item, list):
                variables[name] = f"{len(item)} items"
            elif hasattr(item, "value"):
                variables[name] = f"Node({item.value}) @ {address(item)}"
        if linked or structure == "binary_tree":
            ordered = []
            depths = {}
            positions = {}
            seen = set()

            def visit(node, depth=0):
                if node is None or id(node) in seen:
                    return
                seen.add(id(node))
                ordered.append(node)
                depths[id(node)] = depth
                if linked:
                    visit(node.next, depth)
                else:
                    visit(node.left, depth + 1)
                    positions[id(node)] = len(positions)
                    visit(node.right, depth + 1)

            visit(local.get("head" if linked else "root"))
            final_values = [node.value for node in ordered]
            reachable = len(ordered)
            if linked and operation == "insert" and local.get("node") is not None and id(local["node"]) not in seen:
                ordered.append(local["node"])
            for i, node in enumerate(ordered):
                addr = address(node)
                active = node is local.get("current") or node is local.get("node") or node is local.get("successor")
                nodes.append(VisualEntity(
                    id=addr, role_label="ROOT" if not linked and i == 0 else ("HEAD" if linked and i == 0 else f"[{i}]"),
                    addr=addr, val=node.value, next_addr=address(node.next) if linked else None,
                    prev_addr=address(getattr(node, "prev", None)) if linked else None,
                    left_addr=address(node.left) if not linked else None, right_addr=address(node.right) if not linked else None,
                    status_tag="Current node" if active else "Retained", highlight_state="active" if active else "default",
                    lane="staging" if linked and i >= reachable else "primary", byte_size=32,
                    tree_x=10 + 80 * (positions.get(id(node), 0) + .5) / max(1, len(positions)) if not linked else None,
                    tree_y=12 + 70 * depths.get(id(node), 0) / max(1, max(depths.values(), default=0)) if not linked else None,
                ))
                for target, label in ((node.next, "next"),) if linked else ((node.left, "L"), (node.right, "R")):
                    if target is not None:
                        edges.append(PointerEdge(f"{addr}-{label}", addr, address(target), label, bidirectional=structure == "doubly_linked_list"))
            slots = len(ordered)
            details = {"height": max(depths.values(), default=-1) + 1} if not linked else {}
        elif structure == "hash_table":
            table = local["table"]
            final_values = [key for bucket in table for key, _ in bucket]
            for i, bucket in enumerate(table):
                nodes.append(VisualEntity(str(i), f"BUCKET {i}", f"0x{0x2000+i*8:04x}",
                                          " → ".join(f"{k}: {v}" for k, v in bucket) or None,
                                          None, f"{len(bucket)} entries", "active" if i == local.get("bucket") else "default", index=i, byte_size=8))
            slots = len(table) + len(final_values)
            details = {"table": [[[k, v] for k, v in bucket] for bucket in table], "capacity": len(table)}
        else:
            data, size = local["data"], local["size"]
            first = local.get("front", 0)
            final_values = [data[(first + i) % len(data)] for i in range(size)] if structure == "queue" else list(data[:size])
            for i, number in enumerate(data):
                active = i == local.get("i", local.get("index")) or i == local.get("rear")
                role = f"[{i}]"
                if structure == "stack" and i == size - 1:
                    role += " · TOP"
                if structure == "queue":
                    if i == first:
                        role += " · FRONT"
                    if i == (first + size) % len(data):
                        role += " · REAR"
                nodes.append(VisualEntity(str(i), role, f"0x{0x2000+i*8:04x}", number, None,
                                          "Empty" if number is None else "Occupied", "active" if active else "default", index=i, byte_size=8))
            slots = len(data) + len(local.get("old", []))
            details = {"capacity": len(data), "front": first, "rear": (first + size) % len(data)}
        return tuple(nodes), tuple(edges), variables, final_values, slots, details

    frames = []
    pending = None
    peak = 0

    def record(line, local):
        nonlocal peak
        state = snapshot(local)
        peak = max(peak, state[4])
        frames.append((line, state, local.get("moves", 0)))
        if len(frames) > 800:
            raise ValueError("Trace is too large; use fewer input values")

    record(function.__code__.co_firstlineno, initial)

    def tracer(frame, event, arg):
        nonlocal pending
        if frame.f_code is not function.__code__:
            return None
        if event in ("line", "return"):
            if pending is not None:
                record(pending, frame.f_locals)
            pending = frame.f_lineno if event == "line" else None
        return tracer

    previous_trace = sys.gettrace()
    try:
        sys.settrace(tracer)
        result = function(**initial)
    finally:
        sys.settrace(previous_trace)
    final_state = frames[-1][1]
    metadata = {"operation": operation, "final_values": final_state[3], **final_state[5],
                "result": result[-1] if isinstance(result, tuple) else result,
                "trace_note": "The first frame shows function entry; subsequent snapshots show state after the highlighted operation line. Setup and visualization are excluded from complexity."}
    n = len(values)
    best, average, worst = "O(1)", "O(1)", "O(1)"
    auxiliary = "O(1)"
    storage = "O(c)" if structure in ("dynamic_array", "stack", "queue") else "O(n)"
    time_note = "This operation touches a constant number of slots; unused capacity does not change the operation cost."
    space_note = "A constant number of temporary references is used. n = live entries; c = allocated capacity."
    if structure == "dynamic_array" and operation in ("insert", "delete", "search"):
        average = worst = "O(n)"
        time_note = "Indexed insertion/deletion shifts following elements. Linear search can inspect every value; direct access is O(1)."
        if operation == "insert" and n == capacity:
            auxiliary = "O(n)"
            time_note += " Full capacity requires a new buffer and copying. Appending has amortized O(1) time, not every indexed insertion."
            space_note = "Resizing temporarily keeps the old and new buffers. In-place insertion otherwise needs O(1) auxiliary space."
    elif linked:
        average = worst = "O(n)"
        time_note = "Finding an indexed predecessor requires traversal; head operations are O(1). Rewiring known pointers is O(1)."
    elif structure == "binary_tree":
        average, worst = "O(log n)", "O(n)"
        time_note = "Search/insert/delete cost O(h). Average O(log n) assumes a reasonably balanced tree; this BST does not rebalance. A chain has h = n."
        if operation == "inorder":
            best = average = worst = "O(n)"
            auxiliary = "O(h)"
            time_note = "Inorder visits every node once. h is tree height."
            space_note = "The explicit traversal stack uses O(h); the returned output list additionally occupies O(n)."
    elif structure == "hash_table":
        worst, storage = "O(n)", "O(c + n)"
        time_note = "Integer hash k % c uses separate chaining. Expected O(1) assumes well-distributed keys and bounded load; collisions can require O(n). Python bucket append is amortized."
    analysis = ComplexityAnalysis(
        best, average, worst, auxiliary, storage, time_note, space_note,
        "Slots, 8-byte cells and 32-byte nodes are an educational model, not CPython object sizes, physical addresses, or measured runtime. Trace snapshots/setup are excluded.",
        len(frames) - 1, len(frames[0][1][3]), len(metadata["final_values"]), peak,
    )
    steps = []
    lines = source.splitlines()
    for i, (line, state, moves) in enumerate(frames, 1):
        nodes, edges, variables, _, _, _ = state
        complete = i == len(frames)
        ready = i == 1
        steps.append(SimulationStep(
            i, len(frames), "Complete" if complete else "Ready" if ready else "Execute", "COMPLETED" if complete else "READY" if ready else "EXECUTING",
            f"{TITLES[structure]} · {operation.title()}", lines[line-1].strip(), worst,
            "Educational memory model", nodes, edges, lines[line-1].strip(),
            "Operation complete" if complete else f"After Python line {line}",
            "State after the highlighted line. Step through to follow data and references.", (),
            TimeBreakdown(0, ()), MemoryShiftSummary(moves, "Actual element copies/shifts in this example; pointer changes do not shift values."),
            line, variables,
        ))
    return SimulationTrace(structure, f"{TITLES[structure]} · {operation.title()}", ("Ready", "Execute", "Complete"),
                           f"{structure}.py", source, 1, tuple(steps), metadata, analysis)
