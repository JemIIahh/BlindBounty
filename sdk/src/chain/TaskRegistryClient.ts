import { ethers } from 'ethers';
import type { Address, Hex, TaskId, TxReceiptLike } from '../types.js';
import { TaskRegistryAbi } from './abi/index.js';
import { wrapChainError } from './errors.js';

export interface OpenTaskMeta {
  taskId: TaskId;
  token: Address;
  category: string;
  locationZone: string;
  reward: bigint;
  createdAt: Date;
}

export class TaskRegistryClient {
  readonly contract: ethers.Contract;
  readonly address: Address;

  constructor(address: Address, runner: ethers.ContractRunner) {
    this.address = address;
    this.contract = new ethers.Contract(address, TaskRegistryAbi, runner);
  }

  async getTaskMeta(taskId: TaskId): Promise<OpenTaskMeta> {
    try {
      const raw = (await this.contract.getTaskMeta!(taskId)) as unknown as unknown[];
      return {
        taskId,
        token: raw[0] as Address,
        category: raw[1] as string,
        locationZone: raw[2] as string,
        reward: BigInt(raw[3] as bigint | number),
        createdAt: new Date(Number(raw[4] as bigint | number) * 1000),
      };
    } catch (err) {
      throw wrapChainError(err, 'getTaskMeta');
    }
  }

  async getOpenTasks(offset: bigint, limit: bigint): Promise<TaskId[]> {
    try {
      const ids = (await this.contract.getOpenTasks!(offset, limit)) as unknown as unknown[];
      return ids.map((x) => BigInt(x as bigint | number));
    } catch (err) {
      throw wrapChainError(err, 'getOpenTasks');
    }
  }

  async totalTasks(): Promise<bigint> {
    try {
      return BigInt(await this.contract.totalTasks!());
    } catch (err) {
      throw wrapChainError(err, 'totalTasks');
    }
  }

  async openTaskCount(): Promise<bigint> {
    try {
      return BigInt(await this.contract.openTaskCount!());
    } catch (err) {
      throw wrapChainError(err, 'openTaskCount');
    }
  }

  async taskExists(taskId: TaskId): Promise<boolean> {
    try {
      return Boolean(await this.contract.taskExists!(taskId));
    } catch (err) {
      throw wrapChainError(err, 'taskExists');
    }
  }

  async closeTask(taskId: TaskId): Promise<TxReceiptLike> {
    try {
      const tx = await this.contract.closeTask!(taskId);
      const rec = await tx.wait(1);
      return { hash: rec.hash as Hex, blockNumber: rec.blockNumber, gasUsed: rec.gasUsed };
    } catch (err) {
      throw wrapChainError(err, 'closeTask');
    }
  }
}
