"""Opt-in snapshot of visible text from the active local Codex conversation only."""

from __future__ import annotations

import json
import os
from pathlib import Path
import re
import sys
import tempfile
from uuid import UUID


class BackupError(Exception):
    """A safe-to-display failure that never includes transcript content."""


_CREDENTIAL = re.compile(
    r"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----"
    r"|\b(?:sk-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}|AKIA[A-Z0-9]{16}"
    r"|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})"
    r"|\bBearer\s+[A-Za-z0-9._~+/-]+=*"
    r"|\b(?:[A-Za-z0-9_]*(?:api[_-]?key|access[_-]?token|auth[_-]?token)"
    r"|password|secret|token)\b\s*[:=]\s*[\"']?[^\s\"',;]+",
    re.IGNORECASE,
)


def _current_id(env: dict[str, str]) -> str:
    raw = env.get("CODEX_THREAD_ID") or env.get("CODEX_SESSION_ID")
    if not raw:
        raise BackupError("No active conversation ID is exposed in this process.")
    try:
        parsed = str(UUID(raw))
    except (ValueError, AttributeError):
        raise BackupError("The active conversation ID has an unsupported format.") from None
    if parsed != raw.lower():
        raise BackupError("The active conversation ID has an unsupported format.")
    return parsed


def _messages(source: Path, thread: str, project: Path) -> list[dict[str, str]]:
    messages = []
    metadata_seen = False
    with source.open(encoding="utf-8") as stream:
        for line in stream:
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                raise BackupError("Transcript JSON is incomplete or malformed; retry after writing stops.") from None
            if not isinstance(record, dict) or not isinstance(record.get("payload"), dict):
                raise BackupError("Unsupported transcript record format.")
            payload = record["payload"]
            if record.get("type") == "session_meta":
                if metadata_seen or payload.get("id") != thread or not isinstance(payload.get("cwd"), str):
                    raise BackupError("Transcript identity could not be verified.")
                if Path(payload["cwd"]).resolve() != project:
                    raise BackupError("The current conversation belongs to another workspace.")
                metadata_seen = True
                continue
            # Never read text from events, reasoning, tool calls, or tool results.
            if record.get("type") != "response_item" or payload.get("type") != "message":
                continue
            role = payload.get("role")
            if role not in ("user", "assistant") or payload.get("recipient") not in (None, "all"):
                continue
            if role == "assistant":
                if payload.get("channel") == "analysis" or payload.get("phase") == "analysis":
                    continue
                if payload.get("status") != "completed":
                    continue
                if payload.get("phase") not in ("commentary", "final") or payload.get("channel") not in (None, "commentary", "final"):
                    raise BackupError("Unsupported assistant message format; no snapshot was written.")
            content = payload.get("content")
            if not isinstance(content, list):
                raise BackupError("Unsupported message content format.")
            texts = []
            for block in content:
                if not isinstance(block, dict):
                    raise BackupError("Unsupported message content format.")
                if block.get("type") != ("input_text" if role == "user" else "output_text"):
                    continue  # Attachments and non-text blocks are never exported.
                value = block.get("text")
                if not isinstance(value, str):
                    raise BackupError("Unsupported message text format.")
                if role == "user" and value.lstrip().startswith("<environment_context>"):
                    continue
                if _CREDENTIAL.search(value):
                    raise BackupError("Credential-like text detected; no snapshot was written.")
                if value.strip():
                    texts.append(value)
            if texts:
                messages.append({"role": role, "text": "\n".join(texts)})
    if not metadata_seen:
        raise BackupError("Transcript identity metadata is missing.")
    if not messages:
        raise BackupError("No supported visible conversation text was found.")
    return messages


def backup_current(project: Path, sessions: Path, env: dict[str, str]) -> tuple[Path, int]:
    """Write atomically, failing closed before replacing any existing snapshot."""
    temporary = None
    try:
        project = project.resolve()
        thread = _current_id(env)
        # A final anchored rule prevents earlier root negations from exposing backups.
        rules = [line.strip() for line in (project / ".gitignore").read_text(encoding="utf-8").splitlines()
                 if line.strip() and not line.lstrip().startswith("#")]
        if not rules or rules[-1] != "/.local/":
            raise BackupError("Keep /.local/ as the final rule in the root .gitignore before backing up.")
        sessions = sessions.resolve()
        sources = list(sessions.rglob(f"*{thread}.jsonl")) if sessions.is_dir() else []
        if len(sources) != 1:
            raise BackupError("Expected exactly one local transcript matching the active conversation ID.")
        source = sources[0]
        if source.is_symlink() or not source.resolve().is_relative_to(sessions):
            raise BackupError("Transcript path leaves the local session directory.")
        messages = _messages(source, thread, project)
        folder = project
        for name in (".local", "chat-backups"):
            folder = folder / name
            if folder.is_symlink() or getattr(folder, "is_junction", lambda: False)():
                raise BackupError("Backup directories must not be links or junctions.")
            folder.mkdir(mode=0o700, exist_ok=True)
            if folder.resolve() != folder or (folder / ".gitignore").exists():
                raise BackupError("Backup directory containment or ignore rules could not be verified.")
        target = folder / f"{thread}.json"
        if target.is_symlink():
            raise BackupError("The backup destination must not be a link.")
        data = {"schema_version": 1, "conversation_id": thread, "messages": messages}
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=folder, delete=False) as output:
            temporary = Path(output.name)
            os.chmod(temporary, 0o600)
            json.dump(data, output, ensure_ascii=False, indent=2)
            output.write("\n")
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, target)
        temporary = None
        return target, len(messages)
    except (OSError, UnicodeError, ValueError) as error:
        # Do not echo filenames, source lines, credentials, or exception payloads.
        raise BackupError(f"Local backup could not be completed ({type(error).__name__}).") from None
    finally:
        if temporary is not None:
            try:
                temporary.unlink(missing_ok=True)
            except OSError:
                raise BackupError("Backup failed; a private temporary file could not be removed.") from None


def main() -> int:
    project = Path(__file__).resolve().parents[1]
    codex_root = Path(os.environ.get("CODEX_HOME", str(Path.home() / ".codex")))
    try:
        target, count = backup_current(project, codex_root / "sessions", dict(os.environ))
    except BackupError as error:
        print(f"Backup failed: {error}", file=sys.stderr)
        return 1
    print(f"Saved {count} visible messages to {target.relative_to(project)}")
    print("Manual snapshot only; later messages and attachments are not included.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
