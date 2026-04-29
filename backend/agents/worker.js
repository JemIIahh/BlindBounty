/**
 * Agent worker — forked child process per deployed agent.
 *
 * Env vars (set by agentRunner.ts):
 *   AGENT_ID, AGENT_NAME, AGENT_INSTRUCTIONS
 *   AGENT_PROVIDER  — openai | anthropic | groq | gemini
 *   AGENT_MODEL     — e.g. gpt-4o-mini, claude-3-haiku-20240307, llama3-8b-8192, gemini-1.5-flash
 *   AGENT_API_KEY
 *   BACKEND_URL, POLL_INTERVAL_MS
 *
 * Install deps:
 *   npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/groq --legacy-peer-deps
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';

const AGENT_ID = process.env.AGENT_ID ?? 'unknown';
const AGENT_NAME = process.env.AGENT_NAME ?? 'Agent';
const AGENT_INSTRUCTIONS = process.env.AGENT_INSTRUCTIONS ?? '';
const AGENT_PROVIDER = (process.env.AGENT_PROVIDER ?? 'openai').toLowerCase();
const AGENT_MODEL = process.env.AGENT_MODEL ?? 'gpt-4o-mini';
const AGENT_API_KEY = process.env.AGENT_API_KEY ?? '';
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 30_000);

function getModel() {
  switch (AGENT_PROVIDER) {
    case 'anthropic': return createAnthropic({ apiKey: AGENT_API_KEY })(AGENT_MODEL);
    case 'groq':      return createGroq({ apiKey: AGENT_API_KEY })(AGENT_MODEL);
    case 'gemini':    return createGoogleGenerativeAI({ apiKey: AGENT_API_KEY })(AGENT_MODEL);
    default:          return createOpenAI({ apiKey: AGENT_API_KEY })(AGENT_MODEL);
  }
}

log(`started | provider=${AGENT_PROVIDER} model=${AGENT_MODEL}`);

async function pollAndWork() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/tasks?status=open&limit=5`);
    if (!res.ok) { log(`poll failed: ${res.status}`); return; }
    const { data: tasks } = await res.json();
    if (!tasks?.length) { log('no open tasks'); return; }

    for (const task of tasks) {
      log(`working on task ${task.id}`);
      const result = await doWork(task);
      await submitResult(task.id, result);
    }
  } catch (err) {
    log(`error: ${err.message}`);
  }
}

async function doWork(task) {
  const { text } = await generateText({
    model: getModel(),
    system: AGENT_INSTRUCTIONS,
    prompt: `Task: ${task.title}\n\n${task.description ?? ''}`,
  });
  return text;
}

async function submitResult(taskId, result) {
  const res = await fetch(`${BACKEND_URL}/api/v1/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, agentId: AGENT_ID, result }),
  });
  log(`submitted task ${taskId}: ${res.status}`);
}

function log(msg) {
  const dim = '\x1b[2m', cyan = '\x1b[36m', reset = '\x1b[0m';
  console.log(`${dim}[agent:${cyan}${AGENT_ID.slice(0, 8)}${reset}${dim}]${reset} ${msg}`);
}

setInterval(pollAndWork, POLL_INTERVAL_MS);
pollAndWork();
