"""Privacy and failure behavior for the optional local conversation snapshot."""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from scripts.chat_backup import BackupError, backup_current


THREAD = "11111111-2222-4333-8444-555555555555"
OTHER = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"


def message(role, text, **extra):
    return {"type": "response_item", "payload": {
        "type": "message", "role": role,
        "content": [{"type": "input_text" if role == "user" else "output_text", "text": text}],
        **extra,
    }}


class ChatBackupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.project = self.root / "project"
        self.project.mkdir()
        (self.project / ".gitignore").write_text("/.local/\n", encoding="utf-8")
        self.sessions = self.root / "sessions"
        self.sessions.mkdir()
        self.source = self.sessions / f"rollout-{THREAD}.jsonl"
        self.env = {"CODEX_THREAD_ID": THREAD}
        self.records = [
            {"type": "session_meta", "payload": {"id": THREAD, "cwd": str(self.project)}},
            message("user", "Please fix the empty state."),
            message("assistant", "I will test the empty state.", phase="commentary", status="completed"),
            message("assistant", "The fix passes its regression test.", phase="final", status="completed"),
        ]
        self.write_records()

    def write_records(self):
        self.source.write_text("".join(json.dumps(r) + "\n" for r in self.records), encoding="utf-8")

    def backup(self):
        return backup_current(self.project, self.sessions, self.env)

    def test_exports_only_visible_text_from_current_conversation(self):
        self.records += [
            message("system", "SYSTEM_SENTINEL"),
            message("developer", "DEVELOPER_SENTINEL"),
            message("assistant", "REASONING_SENTINEL", phase="analysis"),
            message("assistant", "CHANNEL_REASONING_SENTINEL", channel="analysis", phase="final"),
            message("assistant", "TOOL_MESSAGE_SENTINEL", phase="commentary", recipient="tools.exec"),
            message("assistant", "INCOMPLETE_SENTINEL", phase="final", status="in_progress"),
            message("user", "<environment_context>ENV_SENTINEL</environment_context>"),
            {"type": "response_item", "payload": {"type": "function_call_output", "output": "TOOL_SENTINEL"}},
            {"type": "event_msg", "payload": {"type": "agent_reasoning", "text": "EVENT_SENTINEL"}},
        ]
        self.write_records()
        # An unrelated malformed file must never be opened or exported.
        (self.sessions / f"rollout-{OTHER}.jsonl").write_text("OTHER_CHAT_SENTINEL", encoding="utf-8")
        target, count = self.backup()
        data = json.loads(target.read_text(encoding="utf-8"))
        self.assertEqual(count, 3)
        self.assertEqual(data, {"schema_version": 1, "conversation_id": THREAD, "messages": [
            {"role": "user", "text": "Please fix the empty state."},
            {"role": "assistant", "text": "I will test the empty state."},
            {"role": "assistant", "text": "The fix passes its regression test."},
        ]})
        self.assertTrue(target.is_relative_to(self.project / ".local" / "chat-backups"))
        if os.name != "nt":
            self.assertEqual(target.stat().st_mode & 0o777, 0o600)

    def test_missing_or_invalid_current_id_fails_without_export(self):
        for env in ({}, {"CODEX_THREAD_ID": "../../outside"}):
            with self.subTest(env=env), self.assertRaises(BackupError):
                backup_current(self.project, self.sessions, env)
        self.assertFalse((self.project / ".local").exists())

    def test_missing_or_ambiguous_transcript_fails(self):
        self.source.unlink()
        with self.assertRaises(BackupError):
            self.backup()
        self.write_records()
        (self.sessions / f"duplicate-{THREAD}.jsonl").write_text("", encoding="utf-8")
        with self.assertRaises(BackupError):
            self.backup()

    def test_wrong_session_or_workspace_fails(self):
        for change in ({"id": OTHER}, {"cwd": str(self.root / "another-project")}):
            with self.subTest(change=change):
                self.records[0]["payload"] = {"id": THREAD, "cwd": str(self.project), **change}
                self.write_records()
                with self.assertRaises(BackupError):
                    self.backup()

    def test_malformed_or_truncated_input_preserves_previous_snapshot(self):
        target, _ = self.backup()
        previous = target.read_bytes()
        with self.source.open("a", encoding="utf-8") as source:
            source.write('{"type":')
        with self.assertRaises(BackupError):
            self.backup()
        self.assertEqual(target.read_bytes(), previous)

    def test_unknown_visible_message_format_fails_closed(self):
        self.records.append(message("assistant", "Unknown format", phase="new_phase", status="completed"))
        self.write_records()
        with self.assertRaises(BackupError):
            self.backup()

    def test_credential_like_text_is_not_written_or_reported(self):
        samples = ["api_key = 'sensitive-value'", "Bearer abcdef12345", "sk-" + "a" * 40,
                   "-----BEGIN PRIVATE KEY-----", "ghp_" + "x" * 36]
        for sample in samples:
            with self.subTest(sample=sample):
                self.records[-1] = message("assistant", sample, phase="final", status="completed")
                self.write_records()
                with self.assertRaises(BackupError) as result:
                    self.backup()
                self.assertNotIn(sample, str(result.exception))
        self.assertFalse((self.project / ".local").exists())

    def test_missing_ignore_rule_fails(self):
        (self.project / ".gitignore").write_text("dist/\n", encoding="utf-8")
        with self.assertRaises(BackupError):
            self.backup()
        self.assertFalse((self.project / ".local").exists())

    def test_conflicting_ignore_rule_fails(self):
        (self.project / ".gitignore").write_text("/.local/\n!/.local/\n", encoding="utf-8")
        with self.assertRaises(BackupError):
            self.backup()

    def test_output_path_collision_fails_clearly(self):
        (self.project / ".local").write_text("occupied", encoding="utf-8")
        with self.assertRaises(BackupError):
            self.backup()

    def test_write_and_cleanup_failure_still_reports_safe_error(self):
        with patch("scripts.chat_backup.os.replace", side_effect=PermissionError("PRIVATE_PATH_SENTINEL")), \
             patch("scripts.chat_backup.Path.unlink", side_effect=PermissionError("PRIVATE_PATH_SENTINEL")):
            with self.assertRaises(BackupError) as result:
                self.backup()
        self.assertNotIn("PRIVATE_PATH_SENTINEL", str(result.exception))

    def test_empty_visible_conversation_is_not_success(self):
        self.records = self.records[:1]
        self.write_records()
        with self.assertRaises(BackupError):
            self.backup()

    def test_cli_reports_failure_without_dumping_transcript(self):
        env = dict(os.environ)
        env.pop("CODEX_THREAD_ID", None)
        env.pop("CODEX_SESSION_ID", None)
        script = Path(__file__).resolve().parents[1] / "scripts" / "chat_backup.py"
        result = subprocess.run([sys.executable, str(script)], env=env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stdout, "")
        self.assertIn("Backup failed:", result.stderr)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
