"""Pytest-compatible test runner for environments with or without pytest installed."""

from __future__ import annotations

import importlib
import inspect
import pkgutil
import sys
import types
from contextlib import contextmanager


def _install_pytest_shim() -> None:
    if "pytest" in sys.modules:
        return
    try:
        import pytest  # noqa: F401
        return
    except ImportError:
        pass

    shim = types.ModuleType("pytest")

    @contextmanager
    def raises(expected_exc: type[BaseException]):
        try:
            yield
        except expected_exc:
            return
        except BaseException as exc:
            raise AssertionError(
                f"Expected {expected_exc.__name__}, got {type(exc).__name__}: {exc}"
            ) from exc
        raise AssertionError(f"Expected {expected_exc.__name__} to be raised, but nothing was raised")

    shim.raises = raises  # type: ignore[attr-defined]
    sys.modules["pytest"] = shim


def main() -> int:
    _install_pytest_shim()
    import python_engine.tests as tests_pkg

    passed = 0
    failed = 0
    for mod_info in pkgutil.iter_modules(tests_pkg.__path__, prefix="python_engine.tests."):
        mod = importlib.import_module(mod_info.name)
        for name, fn in inspect.getmembers(mod, inspect.isfunction):
            if not name.startswith("test_"):
                continue
            try:
                fn()
                print(f"PASS {mod_info.name}::{name}")
                passed += 1
            except Exception as exc:
                print(f"FAIL {mod_info.name}::{name} -> {type(exc).__name__}: {exc}")
                failed += 1

    print(f"\nSummary: {passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
