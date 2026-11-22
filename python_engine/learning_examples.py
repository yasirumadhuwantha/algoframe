"""Repository-owned initialization and simple undirected graph examples."""

BUFFER_DEFINE = """
def operate(items, capacity):
    data = [None] * capacity
    size = 0
    for value in items:
        data[size] = value
        size += 1
    return data, size, size
"""

QUEUE_DEFINE = """
def operate(items, capacity, front):
    data = [None] * capacity
    size = 0
    for value in items:
        rear = (front + size) % capacity
        data[rear] = value
        size += 1
    return data, front, size, size
"""

TREE_DEFINE = """
def operate(items):
    root = None
    size = 0
    for value in items:
        if root is None:
            root = Node(value)
            size += 1
            continue
        current = root
        while value != current.value:
            if value < current.value:
                if current.left is None:
                    current.left = Node(value)
                    size += 1
                    break
                current = current.left
            else:
                if current.right is None:
                    current.right = Node(value)
                    size += 1
                    break
                current = current.right
    return root, size
"""

HASH_DEFINE = """
def operate(items, capacity):
    table = [[] for _ in range(capacity)]
    for key in items:
        bucket = key % capacity
        if not any(stored_key == key for stored_key, _ in table[bucket]):
            table[bucket].append((key, key * 10))
    return sum(len(bucket) for bucket in table)
"""


def linked_define(doubly: bool) -> str:
    return """def operate(items):
    head = None
    tail = None
    for value in items:
        node = Node(value)
        if head is None:
            head = node
        else:
            tail.next = node
{previous}        tail = node
    return head, len(items)
""".format(previous="            node.prev = tail\n" if doubly else "")


GRAPH = {
    "define": """
    def operate(items, edges):
        graph = {}
        for vertex in items:
            graph[vertex] = []
        for left, right in edges:
            graph[left].append(right)
            graph[right].append(left)
        return len(graph)
    """,
    "add_vertex": """
    def operate(graph, vertex, target):
        if vertex in graph:
            return False
        graph[vertex] = []
        return True
    """,
    "remove_vertex": """
    def operate(graph, vertex, target):
        if vertex not in graph:
            raise ValueError("Vertex does not exist")
        while graph[vertex]:
            neighbor = graph[vertex].pop()
            graph[neighbor].remove(vertex)
        del graph[vertex]
        return True
    """,
    "add_edge": """
    def operate(graph, vertex, target):
        if vertex not in graph or target not in graph:
            raise ValueError("Both edge endpoints must exist")
        if vertex == target:
            raise ValueError("Self links are not supported")
        if target in graph[vertex]:
            return False
        graph[vertex].append(target)
        graph[target].append(vertex)
        return True
    """,
    "remove_edge": """
    def operate(graph, vertex, target):
        if vertex not in graph or target not in graph:
            raise ValueError("Both edge endpoints must exist")
        if target not in graph[vertex]:
            return False
        graph[vertex].remove(target)
        graph[target].remove(vertex)
        return True
    """,
    "bfs": """
    def operate(graph, vertex, target):
        if vertex not in graph:
            raise ValueError("Start vertex does not exist")
        visited = {vertex}
        queue = [vertex]
        order = []
        front = 0
        while front < len(queue):
            current = queue[front]
            front += 1
            order.append(current)
            for neighbor in graph[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return order
    """,
    "dfs": """
    def operate(graph, vertex, target):
        if vertex not in graph:
            raise ValueError("Start vertex does not exist")
        visited = set()
        stack = [iter([vertex])]
        order = []
        while stack:
            current = next(stack[-1], None)
            if current is None:
                stack.pop()
                continue
            if current in visited:
                continue
            visited.add(current)
            order.append(current)
            stack.append(iter(graph[current]))
        return order
    """,
}
