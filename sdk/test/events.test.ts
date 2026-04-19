import { describe, expect, it, vi } from 'vitest';
import { EventBus, type SdkEvents } from '../src/events/index.js';

const txPayload = { hash: '0xabc' as `0x${string}`, from: '0x00' as `0x${string}`, to: '0x01' as `0x${string}` };

describe('EventBus', () => {
  it('delivers typed events to subscribers', () => {
    const bus = new EventBus<SdkEvents>();
    const fn = vi.fn();
    bus.on('tx.sent', fn);
    bus.emit('tx.sent', txPayload);
    expect(fn).toHaveBeenCalledWith(txPayload);
  });

  it('once fires only once', () => {
    const bus = new EventBus<SdkEvents>();
    const fn = vi.fn();
    bus.once('tx.sent', fn);
    bus.emit('tx.sent', txPayload);
    bus.emit('tx.sent', txPayload);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('off removes a specific listener', () => {
    const bus = new EventBus<SdkEvents>();
    const fn = vi.fn();
    bus.on('tx.sent', fn);
    bus.off('tx.sent', fn);
    bus.emit('tx.sent', txPayload);
    expect(fn).not.toHaveBeenCalled();
  });

  it('on returns an unsubscribe function', () => {
    const bus = new EventBus<SdkEvents>();
    const fn = vi.fn();
    const unsubscribe = bus.on('tx.sent', fn);
    unsubscribe();
    bus.emit('tx.sent', txPayload);
    expect(fn).not.toHaveBeenCalled();
  });

  it('isolates listener exceptions (all other listeners still fire)', () => {
    const bus = new EventBus<SdkEvents>();
    const bad = vi.fn(() => {
      throw new Error('boom');
    });
    const good = vi.fn();
    bus.on('tx.sent', bad);
    bus.on('tx.sent', good);
    bus.emit('tx.sent', txPayload);
    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();
  });

  it('emit with no subscribers is a no-op', () => {
    const bus = new EventBus<SdkEvents>();
    expect(() => bus.emit('tx.sent', txPayload)).not.toThrow();
  });
});
