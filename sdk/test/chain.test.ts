import { ethers } from 'ethers';
import { describe, expect, it } from 'vitest';
import {
  BlindEscrowAbi,
  BlindEscrowClient,
  BlindReputationAbi,
  BlindReputationClient,
  ChainClient,
  TaskRegistryAbi,
  TaskRegistryClient,
  wrapChainError,
} from '../src/chain/index.js';
import { networks } from '../src/network/index.js';
import { PrivateKeySigner } from '../src/signer/index.js';
import type { Address } from '../src/types.js';

const FIXED_PK = '0x0123456789012345678901234567890123456789012345678901234567890123';
const RAND_ADDR = '0xFd4F93F5A7BE144c405D1D8fbEC63Fb776207681' as Address;

describe('ABIs', () => {
  it('BlindEscrow ABI exposes the expected surface', () => {
    const iface = new ethers.Interface(BlindEscrowAbi);
    for (const name of [
      'createTask',
      'assignWorker',
      'submitEvidence',
      'completeVerification',
      'cancelTask',
      'getTask',
      'nextTaskId',
    ]) {
      expect(iface.getFunction(name), `missing ${name}`).not.toBeNull();
    }
  });

  it('TaskRegistry ABI exposes the expected surface', () => {
    const iface = new ethers.Interface(TaskRegistryAbi);
    for (const name of ['getOpenTasks', 'getTaskMeta', 'totalTasks', 'openTaskCount']) {
      expect(iface.getFunction(name), `missing ${name}`).not.toBeNull();
    }
  });

  it('BlindReputation ABI exposes the expected surface', () => {
    const iface = new ethers.Interface(BlindReputationAbi);
    for (const name of ['rate', 'getReputation', 'hasBeenRated']) {
      expect(iface.getFunction(name), `missing ${name}`).not.toBeNull();
    }
  });
});

describe('encoding round-trips (Interface level, no live RPC)', () => {
  it('BlindEscrow.createTask encodes to a call-data blob matching the ABI', () => {
    const iface = new ethers.Interface(BlindEscrowAbi);
    const data = iface.encodeFunctionData('createTask', [
      '0x' + '11'.repeat(32),
      RAND_ADDR,
      1_000000n,
      'photography',
      'Lagos, NG',
      3600n,
    ]);
    const decoded = iface.decodeFunctionData('createTask', data);
    expect(decoded[0]).toBe('0x' + '11'.repeat(32));
    expect((decoded[1] as string).toLowerCase()).toBe(RAND_ADDR.toLowerCase());
    expect(decoded[2]).toBe(1_000000n);
    expect(decoded[3]).toBe('photography');
    expect(decoded[4]).toBe('Lagos, NG');
    expect(decoded[5]).toBe(3600n);
  });

  it('BlindReputation.rate encodes args correctly', () => {
    const iface = new ethers.Interface(BlindReputationAbi);
    const data = iface.encodeFunctionData('rate', [RAND_ADDR, 5, 42n]);
    const decoded = iface.decodeFunctionData('rate', data);
    expect((decoded[0] as string).toLowerCase()).toBe(RAND_ADDR.toLowerCase());
    expect(Number(decoded[1])).toBe(5);
    expect(decoded[2]).toBe(42n);
  });
});

describe('ChainClient wiring', () => {
  it('constructs with a signer and exposes typed sub-clients at the testnet addresses', () => {
    const signer = new PrivateKeySigner(FIXED_PK);
    // No provider attached — reads will fail, but construction should succeed
    // because EthersSigner exposes .provider = null and we fall through to
    // defaultProvider(network) for the RPC runner.
    const c = new ChainClient({ network: networks.testnet, signer });
    expect(c.escrow).toBeInstanceOf(BlindEscrowClient);
    expect(c.registry).toBeInstanceOf(TaskRegistryClient);
    expect(c.reputation).toBeInstanceOf(BlindReputationClient);
    expect(c.escrow.address.toLowerCase()).toBe(networks.testnet.contracts.escrow.toLowerCase());
    expect(c.registry.address.toLowerCase()).toBe(networks.testnet.contracts.registry.toLowerCase());
    expect(c.reputation.address.toLowerCase()).toBe(networks.testnet.contracts.reputation.toLowerCase());
  });

  it('constructs read-only with only a provider', () => {
    const provider = new ethers.JsonRpcProvider(networks.testnet.rpc[0], {
      chainId: Number(networks.testnet.chainId),
      name: networks.testnet.name,
    });
    const c = new ChainClient({ network: networks.testnet, provider });
    expect(c.escrow).toBeInstanceOf(BlindEscrowClient);
  });
});

describe('wrapChainError', () => {
  it('maps INSUFFICIENT_FUNDS to CHAIN/INSUFFICIENT_BALANCE', () => {
    const err = wrapChainError({ code: 'INSUFFICIENT_FUNDS', message: 'no funds' });
    expect(err.code).toBe('CHAIN/INSUFFICIENT_BALANCE');
    expect(err.retriable).toBe(false);
  });

  it('maps NONCE_EXPIRED to CHAIN/NONCE_CONFLICT (retriable)', () => {
    const err = wrapChainError({ code: 'NONCE_EXPIRED', message: 'nonce' });
    expect(err.code).toBe('CHAIN/NONCE_CONFLICT');
    expect(err.retriable).toBe(true);
  });

  it('maps TIMEOUT to CHAIN/TX_TIMED_OUT (retriable)', () => {
    const err = wrapChainError({ code: 'TIMEOUT', message: 't' });
    expect(err.code).toBe('CHAIN/TX_TIMED_OUT');
    expect(err.retriable).toBe(true);
  });

  it('maps CALL_EXCEPTION to CHAIN/TX_REVERTED and surfaces revert data', () => {
    const err = wrapChainError({
      code: 'CALL_EXCEPTION',
      shortMessage: 'reverted',
      data: '0xdeadbeef',
    });
    expect(err.code).toBe('CHAIN/TX_REVERTED');
    expect(err.context).toEqual({ data: '0xdeadbeef' });
  });

  it('defaults unknown errors to CHAIN/TX_REVERTED', () => {
    const err = wrapChainError(new Error('boom'));
    expect(err.code).toBe('CHAIN/TX_REVERTED');
    expect(err.retriable).toBe(false);
  });

  it('prefixes the hint', () => {
    const err = wrapChainError({ message: 'x' }, 'createTask');
    expect(err.message).toMatch(/^createTask:/);
  });
});
