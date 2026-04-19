type Handler<T> = (payload: T) => void;

/**
 * Typed pub/sub. Listener exceptions are swallowed so one bad subscriber
 * cannot block others — telemetry plugins can observe failures via onError.
 */
export class EventBus<E> {
  private handlers: { [K in keyof E]?: Set<Handler<E[K]>> } = {};

  on<K extends keyof E>(event: K, fn: Handler<E[K]>): () => void {
    let set = this.handlers[event];
    if (!set) {
      set = new Set<Handler<E[K]>>();
      this.handlers[event] = set;
    }
    set.add(fn);
    return () => {
      this.off(event, fn);
    };
  }

  once<K extends keyof E>(event: K, fn: Handler<E[K]>): () => void {
    const wrapped: Handler<E[K]> = (p) => {
      this.off(event, wrapped);
      fn(p);
    };
    return this.on(event, wrapped);
  }

  off<K extends keyof E>(event: K, fn: Handler<E[K]>): void {
    this.handlers[event]?.delete(fn);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const hs = this.handlers[event];
    if (!hs) return;
    for (const h of hs) {
      try {
        h(payload);
      } catch {
        // Isolated per-listener — prevents one bad subscriber from blocking others.
      }
    }
  }
}
