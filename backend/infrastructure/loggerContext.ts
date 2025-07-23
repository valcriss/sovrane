import { AsyncLocalStorage } from 'async_hooks';

/** Storage used to keep contextual values for the current async execution. */
const storage = new AsyncLocalStorage<Record<string, unknown>>();

/**
 * Execute the provided function within the given context.
 *
 * @param context - Context object shared across the execution.
 * @param fn - Function to run inside the context.
 * @returns Result of the function execution.
 */
export function withContext<T>(context: Record<string, unknown>, fn: () => T): T {
  return storage.run(context, fn);
}

/**
 * Retrieve the current context or undefined if none is set.
 *
 * @returns The stored context for the current async execution.
 */
export function getContext(): Record<string, unknown> | undefined {
  return storage.getStore();
}
