import { fork, type ChildProcess } from 'child_process';
import { randomUUID, createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { Wallet } from 'ethers';
import { eciesEncrypt, generateKeyPair } from './crypto.js';
import { inft } from './chain.js';
import type { DeployedAgent, AgentCapability, AgentStatus, LLMProvider } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = join(__dirname, '../../agents/worker.js');

// In-memory store (swap for DB in prod)
const agents = new Map<string, DeployedAgent>();
const processes = new Map<string, ChildProcess>();

// Log ring buffer (last 200 lines per agent)
const LOG_LIMIT = 200;
const logBuffers = new Map<string, string[]>();
const logSubscribers = new Map<string, Set<(line: string) => void>>();

function appendLog(id: string, line: string) {
  if (!logBuffers.has(id)) logBuffers.set(id, []);
  const buf = logBuffers.get(id)!;
  buf.push(line);
  if (buf.length > LOG_LIMIT) buf.shift();
  logSubscribers.get(id)?.forEach(cb => cb(line));
}

export function getAgentLogs(id: string): string[] {
  return logBuffers.get(id) ?? [];
}

export function subscribeAgentLogs(id: string, cb: (line: string) => void): () => void {
  if (!logSubscribers.has(id)) logSubscribers.set(id, new Set());
  logSubscribers.get(id)!.add(cb);
  return () => logSubscribers.get(id)?.delete(cb);
}

export async function deployAgent(params: {
  ownerAddress: string;
  ownerPublicKey: string; // uncompressed secp256k1 hex — used to ECIES-encrypt the agent's private key
  name: string;
  instructions: string;
  provider: LLMProvider;
  model: string;
  apiKey: string;
  capabilities: AgentCapability[];
  storageRef?: string;
}): Promise<DeployedAgent> {
  // Generate a fresh secp256k1 keypair for this agent's on-chain identity
  const { privateKey, publicKey } = generateKeyPair();
  // Derive Ethereum address from the private key
  const walletAddress = new Wallet(`0x${privateKey}`).address;
  // ECIES-encrypt the private key to the owner's pubkey — only they can recover it
  const encryptedPrivateKey = eciesEncrypt(
    Buffer.from(privateKey, 'hex'),
    params.ownerPublicKey,
  ).toString('hex');

  // Mint an INFT for this agent (ERC-7857)
  // encryptedURI is empty at mint time — set after agent metadata is uploaded to 0G Storage
  // metadataHash is keccak256 of the agent's public identity
  let inftTokenId: number | undefined;
  if (inft) {
    try {
      const metadataHash = `0x${createHash('sha256').update(walletAddress + publicKey).digest('hex')}` as `0x${string}`;
      const tx = await (inft as any).mint(params.ownerAddress, '', metadataHash);
      const receipt = await tx.wait();
      // INFTMinted event: tokenId is first indexed arg
      const event = receipt?.logs?.find((l: any) => {
        try { return (inft as any).interface.parseLog(l)?.name === 'INFTMinted'; } catch { return false; }
      });
      if (event) {
        inftTokenId = Number((inft as any).interface.parseLog(event)?.args?.tokenId);
      }
    } catch (e) {
      console.warn('INFT mint failed (non-fatal):', (e as Error).message);
    }
  }

  const { ownerPublicKey: _omit, ...rest } = params;
  const agent: DeployedAgent = {
    id: randomUUID(),
    status: 'stopped',
    deployedAt: new Date().toISOString(),
    walletAddress,
    publicKey,
    encryptedPrivateKey,
    inftTokenId,
    ...rest,
  };
  agents.set(agent.id, agent);
  return agent;
}

export function startAgent(id: string): void {
  const agent = agents.get(id);
  if (!agent) throw new Error(`Agent ${id} not found`);
  if (processes.has(id)) return; // already running

  const child = fork(WORKER_PATH, [], {
    env: {
      ...process.env,
      AGENT_ID: agent.id,
      AGENT_NAME: agent.name,
      AGENT_INSTRUCTIONS: agent.instructions,
      AGENT_PROVIDER: agent.provider,
      AGENT_MODEL: agent.model,
      AGENT_API_KEY: agent.apiKey,
    },
    silent: true, // capture stdout/stderr
  });

  child.stdout?.on('data', (chunk: Buffer) => {
    chunk.toString().split('\n').filter(Boolean).forEach(line => appendLog(id, line));
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    chunk.toString().split('\n').filter(Boolean).forEach(line => appendLog(id, `[err] ${line}`));
  });

  child.on('exit', () => {
    processes.delete(id);
    const a = agents.get(id);
    if (a && a.status === 'running') a.status = 'stopped';
  });

  processes.set(id, child);
  agent.status = 'running';
}

export function pauseAgent(id: string): void {
  const child = processes.get(id);
  if (!child) throw new Error(`Agent ${id} is not running`);
  child.kill('SIGSTOP');
  const agent = agents.get(id)!;
  agent.status = 'paused';
}

export function stopAgent(id: string): void {
  const child = processes.get(id);
  if (child) {
    child.kill('SIGTERM');
    processes.delete(id);
  }
  const agent = agents.get(id);
  if (agent) agent.status = 'stopped';
}

export function getAgent(id: string): DeployedAgent | undefined {
  return agents.get(id);
}

export function listAgents(ownerAddress?: string): DeployedAgent[] {
  const all = Array.from(agents.values());
  return ownerAddress ? all.filter((a) => a.ownerAddress === ownerAddress) : all;
}
