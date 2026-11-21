"""CLI entry point for AlgoFrame Python simulation engine."""

from __future__ import annotations

import argparse
import json
import sys

from .binary_tree import generate_binary_tree_insert_trace
from .doubly_linked_list import generate_doubly_linked_insert_trace
from .dynamic_array import generate_dynamic_array_insert_trace
from .singly_linked_list import generate_singly_linked_insert_trace
from .learning import generate_learning_trace, OPERATIONS


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate deterministic AlgoFrame DSA trace JSON")
    parser.add_argument(
        "--structure",
        required=True,
        choices=list(OPERATIONS),
    )
    parser.add_argument("--values", default=None, help="Comma-separated integer values; empty means an empty structure")
    parser.add_argument("--operation")
    parser.add_argument("--payload-value", type=int, default=99)
    parser.add_argument("--front-index", type=int, default=0)
    parser.add_argument("--insert-value", type=int, default=67)
    parser.add_argument("--insert-index", type=int, default=2)
    parser.add_argument("--capacity", type=int, default=6)
    args = parser.parse_args()

    parsed_values = (
        [int(v.strip()) for v in args.values.split(",") if v.strip()]
        if args.values is not None
        else None
    )
    if args.operation is not None:
        try:
            trace = generate_learning_trace(args.structure, args.operation, values=parsed_values,
                                            value=args.insert_value, index=args.insert_index,
                                            capacity=args.capacity, front=args.front_index, payload=args.payload_value)
        except ValueError as error:
            print(str(error), file=sys.stderr)
            return 2
        json.dump(trace.to_dict(), sys.stdout)
        return 0
    if args.structure not in ("singly_linked_list", "doubly_linked_list", "dynamic_array", "binary_tree"):
        print("Choose an operation for this structure", file=sys.stderr)
        return 2

    if args.structure == "singly_linked_list":
        trace = generate_singly_linked_insert_trace(
            initial_values=parsed_values,
            insert_value=args.insert_value,
            insert_index=args.insert_index,
        )
    elif args.structure == "doubly_linked_list":
        trace = generate_doubly_linked_insert_trace(
            initial_values=parsed_values,
            insert_value=args.insert_value,
            insert_index=args.insert_index,
        )
    elif args.structure == "dynamic_array":
        trace = generate_dynamic_array_insert_trace(
            initial_values=parsed_values,
            capacity=args.capacity,
            insert_value=args.insert_value,
            insert_index=args.insert_index,
        )
    else:
        trace = generate_binary_tree_insert_trace(
            initial_values=parsed_values,
            insert_value=args.insert_value,
        )

    json.dump(trace.to_dict(), sys.stdout)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
