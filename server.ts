import { execFile } from 'node:child_process';
import { createServer as createHttpServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// The bundled server lives in dist/, while Python modules remain at the project root.
const projectRoot = fs.existsSync(path.join(__dirname, 'python_engine', 'cli.py'))
  ? __dirname
  : path.resolve(__dirname, '..');

const ALLOWED_STRUCTURES = new Set([
  'singly_linked_list',
  'doubly_linked_list',
  'dynamic_array',
  'binary_tree',
  'stack',
  'queue',
  'hash_table',
  'graph',
]);

async function runPythonSimulation(params: {
  structure: string;
  values?: number[];
  insertValue?: number;
  insertIndex?: number;
  capacity?: number;
  operation?: string;
  payloadValue?: number;
  frontIndex?: number;
  edges?: number[][];
  targetVertex?: number;
}) {
  if (params.operation !== undefined && !ALLOWED_STRUCTURES.has(params.structure)) {
    throw new Error('Choose a supported data structure');
  }
  const structure = ALLOWED_STRUCTURES.has(params.structure)
    ? params.structure
    : 'singly_linked_list';

  const args = ['-m', 'python_engine.cli', '--structure', structure];
  if (params.operation !== undefined) {
    if (typeof params.operation !== 'string' || params.operation.length > 16) throw new Error('Choose a valid operation');
    if (params.values !== undefined && (!Array.isArray(params.values) || params.values.length > 24 || params.values.some(n => !Number.isSafeInteger(n) || Math.abs(n) > 1_000_000))) {
      throw new Error('Use at most 24 integers between -1000000 and 1000000');
    }
    for (const number of [params.insertValue, params.insertIndex, params.capacity, params.payloadValue, params.frontIndex, params.targetVertex]) {
      if (number !== undefined && (!Number.isSafeInteger(number) || Math.abs(number) > 1_000_000)) throw new Error('Parameters must be integers between -1000000 and 1000000');
    }
    if (params.edges !== undefined && (!Array.isArray(params.edges) || params.edges.length > 48 || params.edges.some(edge => !Array.isArray(edge) || edge.length !== 2 || edge.some(n => !Number.isSafeInteger(n) || Math.abs(n) > 1_000_000)))) {
      throw new Error('Use at most 48 edges, each containing two integer vertices');
    }
    args.push('--operation', params.operation);
  }
  if (Array.isArray(params.values) && (params.values.length > 0 || params.operation !== undefined)) {
    args.push(`--values=${params.values.map((n) => Math.trunc(Number(n))).join(',')}`);
  }
  if (params.insertValue !== undefined && Number.isFinite(Number(params.insertValue))) {
    args.push('--insert-value', String(Math.trunc(Number(params.insertValue))));
  }
  if (params.insertIndex !== undefined && Number.isFinite(Number(params.insertIndex))) {
    args.push('--insert-index', String(Math.trunc(Number(params.insertIndex))));
  }
  if (params.capacity !== undefined && Number.isFinite(Number(params.capacity))) {
    args.push('--capacity', String(Math.trunc(Number(params.capacity))));
  }
  if (params.payloadValue !== undefined) args.push('--payload-value', String(params.payloadValue));
  if (params.frontIndex !== undefined) args.push('--front-index', String(params.frontIndex));
  if (params.edges !== undefined) args.push('--edges', JSON.stringify(params.edges));
  if (params.targetVertex !== undefined) args.push('--target-vertex', String(params.targetVertex));

  try {
    const { stdout } = await execFileAsync('python3', args, {
      cwd: projectRoot,
      timeout: 5000,
      maxBuffer: 8 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  } catch (error) {
    if (params.operation !== undefined) {
      const details = error as { code?: string | number; stderr?: string };
      if (details.code === 2 && details.stderr && !details.stderr.includes('Traceback') && details.stderr.trim().length < 200) {
        throw new Error(details.stderr.trim());
      }
      throw new Error('Python could not complete this operation. Check your inputs and Python 3.11+ installation.');
    }
    throw error;
  }
}

async function createServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, engine: 'python3' });
  });

  app.post('/api/simulate', async (req, res) => {
    try {
      const body = req.body ?? {};
      if (body.operation !== undefined && body.values !== undefined && !Array.isArray(body.values)) {
        throw new Error('Initial values must be an array of integers');
      }
      const trace = await runPythonSimulation({
        structure: String(body.structure ?? 'singly_linked_list'),
        values: Array.isArray(body.values) ? body.values : undefined,
        insertValue: body.insertValue,
        insertIndex: body.insertIndex,
        capacity: body.capacity,
        operation: body.operation,
        payloadValue: body.payloadValue,
        frontIndex: body.frontIndex,
        edges: body.edges,
        targetVertex: body.targetVertex,
      });
      res.json(trace);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Simulation failed in Python engine';
      res.status(400).json({ error: message });
    }
  });

  app.get('/api/simulate', async (req, res) => {
    try {
      const learning = req.query.operation !== undefined;
      const parsedValues =
        typeof req.query.values === 'string' && req.query.values.trim()
          ? req.query.values
              .split(',')
              .map((v) => Number(v.trim()))
          : learning && req.query.values === '' ? [] : undefined;
      const rawValues = learning ? parsedValues : parsedValues?.filter(Number.isFinite);

      const trace = await runPythonSimulation({
        structure: String(req.query.structure ?? 'singly_linked_list'),
        values: rawValues,
        insertValue:
          req.query.insertValue !== undefined ? Number(req.query.insertValue) : undefined,
        insertIndex:
          req.query.insertIndex !== undefined ? Number(req.query.insertIndex) : undefined,
        capacity: req.query.capacity !== undefined ? Number(req.query.capacity) : undefined,
        operation: typeof req.query.operation === 'string' ? req.query.operation : undefined,
        payloadValue: req.query.payloadValue !== undefined ? Number(req.query.payloadValue) : undefined,
        frontIndex: req.query.frontIndex !== undefined ? Number(req.query.frontIndex) : undefined,
        edges: typeof req.query.edges === 'string' ? JSON.parse(req.query.edges) : undefined,
        targetVertex: req.query.targetVertex !== undefined ? Number(req.query.targetVertex) : undefined,
      });
      res.json(trace);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Simulation failed in Python engine';
      res.status(400).json({ error: message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(projectRoot, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found');
      }
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`AlgoFrame server running at http://localhost:${port}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start AlgoFrame server:', err);
  process.exit(1);
});
