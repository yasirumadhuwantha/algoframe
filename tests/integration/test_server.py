"""Real HTTP smoke tests for the npm development and built server entry points."""

import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import tempfile
import time
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]


class ServerSmokeTests(unittest.TestCase):
    def check_server(self, script):
        with socket.socket() as port_socket:
            port_socket.bind(("127.0.0.1", 0))
            port = port_socket.getsockname()[1]
        env = {**os.environ, "PORT": str(port)}
        env.pop("NODE_ENV", None)
        env.pop("GEMINI_API_KEY", None)
        command = ["cmd.exe", "/d", "/c", "npm", "run", script] if os.name == "nt" else ["npm", "run", script]
        with tempfile.TemporaryFile(mode="w+b") as logs:
            process = subprocess.Popen(command, cwd=ROOT, env=env, stdout=logs, stderr=logs,
                                       start_new_session=os.name != "nt")
            try:
                base = f"http://127.0.0.1:{port}"
                deadline = time.monotonic() + 45
                while time.monotonic() < deadline:
                    if process.poll() is not None:
                        logs.seek(0)
                        self.fail(f"npm run {script} exited before becoming ready:\n{logs.read().decode(errors='replace')}")
                    try:
                        with urlopen(base + "/api/health", timeout=1) as response:
                            self.assertTrue(json.load(response)["ok"])
                        break
                    except (URLError, TimeoutError):
                        time.sleep(0.2)
                else:
                    logs.seek(0)
                    self.fail(f"Server did not become ready:\n{logs.read().decode(errors='replace')}")

                with urlopen(base + "/", timeout=10) as response:
                    self.assertEqual(response.status, 200)
                    html = response.read().decode()
                    self.assertIn('id="root"', html)
                    self.assertIn("AlgoFrame", html)
                if script == "dev":
                    with urlopen(base + "/src/main.tsx", timeout=20) as response:
                        self.assertEqual(response.status, 200)
                        self.assertIn("createRoot", response.read().decode())

                for structure in ("singly_linked_list", "doubly_linked_list", "dynamic_array", "binary_tree"):
                    with self.subTest(mode=script, structure=structure):
                        request = Request(base + "/api/simulate", method="POST",
                                          data=json.dumps({"structure": structure}).encode(),
                                          headers={"Content-Type": "application/json"})
                        with urlopen(request, timeout=10) as response:
                            trace = json.load(response)
                        self.assertEqual(trace["structure"], structure)
                        self.assertGreater(len(trace["steps"]), 0)
                        self.assertEqual([s["step_index"] for s in trace["steps"]], list(range(1, len(trace["steps"]) + 1)))
                        self.assertTrue(trace["python_code"].strip())

                with urlopen(base + "/api/simulate?structure=dynamic_array&values=10,20&insertValue=99&insertIndex=1&capacity=4", timeout=10) as response:
                    trace = json.load(response)
                values = [node["val"] for node in trace["steps"][-1]["nodes"] if node["val"] is not None]
                self.assertEqual(values, [10, 99, 20])

                # Empty input must stay empty, and operation must reach the Python engine.
                for payload, expected in (
                    ({"structure": "stack", "operation": "push", "values": [], "insertValue": 7}, [7]),
                    ({"structure": "queue", "operation": "dequeue", "values": [7, 8]}, [8]),
                    ({"structure": "dynamic_array", "operation": "delete", "values": [7, 8], "insertIndex": 0}, [8]),
                    ({"structure": "binary_tree", "operation": "delete", "values": [4, 2, 6], "insertValue": 4}, [6, 2]),
                    ({"structure": "hash_table", "operation": "insert", "values": [1, 6], "insertValue": 11, "capacity": 5}, [1, 6, 11]),
                ):
                    with self.subTest(mode=script, learning=payload["structure"]):
                        request = Request(base + "/api/simulate", method="POST", data=json.dumps(payload).encode(),
                                          headers={"Content-Type": "application/json"})
                        with urlopen(request, timeout=10) as response:
                            lesson = json.load(response)
                        self.assertEqual(lesson["metadata"]["operation"], payload["operation"])
                        self.assertEqual(lesson["metadata"]["final_values"], expected)
                        self.assertIn("auxiliary_space", lesson["analysis"])

                for payload in (
                    {"structure": "not_a_structure", "operation": "insert"},
                    {"structure": "stack", "operation": "pop", "values": []},
                    {"structure": "stack", "operation": "push", "values": "not-an-array"},
                    {"structure": "dynamic_array", "operation": "insert", "values": [1.5]},
                ):
                    with self.subTest(mode=script, invalid=payload):
                        request = Request(base + "/api/simulate", method="POST", data=json.dumps(payload).encode(),
                                          headers={"Content-Type": "application/json"})
                        with self.assertRaises(HTTPError) as caught:
                            urlopen(request, timeout=10)
                        self.assertEqual(caught.exception.code, 400)
                        body = json.load(caught.exception)
                        caught.exception.close()
                        self.assertIn("error", body)
                        self.assertNotIn("Traceback", body["error"])

                with urlopen(base + "/api/simulate?structure=stack&operation=push&values=&insertValue=7", timeout=10) as response:
                    self.assertEqual(json.load(response)["metadata"]["final_values"], [7])
                with urlopen(base + "/api/simulate?structure=dynamic_array&operation=delete&values=-1,-2,-3&insertIndex=1", timeout=10) as response:
                    self.assertEqual(json.load(response)["metadata"]["final_values"], [-1, -3])
            finally:
                if process.poll() is None:
                    if os.name == "nt":
                        subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], capture_output=True)
                    else:
                        os.killpg(process.pid, signal.SIGTERM)
                    process.wait(timeout=10)

    def test_development_server_serves_frontend_and_all_simulations(self):
        self.check_server("dev")

    def test_production_server_serves_built_frontend_and_all_simulations(self):
        self.check_server("start")


if __name__ == "__main__":
    unittest.main()
