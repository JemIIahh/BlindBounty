import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.blind');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface Config {
  apiKey?: string;
  agentWallet?: string;
  agentName?: string;
  apiBase: string;
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) return { apiBase: 'http://localhost:3001' };
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) as Config;
}

export function saveConfig(cfg: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}
