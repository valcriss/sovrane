# Logging Guide

This project uses a port and adapter approach for logging. `LoggerPort` defines
logging methods that accept an optional context object allowing request specific
information to be included in every log entry.

## Context propagation pattern

A simple way to share the same context across a request lifecycle is to store
context in an `AsyncLocalStorage` instance. At the beginning of each request,
initialize the storage with a context object (e.g. `{ requestId }`) and retrieve
it wherever you need to log:

```ts
import { AsyncLocalStorage } from 'async_hooks';
import { LoggerPort } from '../domain/ports/LoggerPort';

const storage = new AsyncLocalStorage<Record<string, unknown>>();

export function withContext<T>(context: Record<string, unknown>, fn: () => T): T {
  return storage.run(context, fn);
}

export function getContext(): Record<string, unknown> | undefined {
  return storage.getStore();
}
```

Use `withContext` when handling requests and pass `getContext()` to the logger
so each log entry shares the same identifiers.

## Prisma integration

When creating the `PrismaClient`, enable query logging and forward events to the
logger's `trace` method:

```ts
import { PrismaClient } from '@prisma/client';
import { LoggerPort } from '../domain/ports/LoggerPort';
import { getContext } from './context';

export function createPrisma(logger: LoggerPort): PrismaClient {
  const prisma = new PrismaClient({ log: ['query'] });

  prisma.$on('query', (e) => {
    logger.trace(`SQL: ${e.query} -- ${e.params}`, getContext());
  });

  return prisma;
}
```

## Usage example

Logging inside a use case:

```ts
export class RegisterUserUseCase {
  constructor(
    private readonly repo: UserRepositoryPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(user: User): Promise<User> {
    this.logger.info('Registering user', getContext());
    const created = await this.repo.create(user);
    this.logger.debug('User registered', getContext());
    return created;
  }
}
```

And within the Prisma event handler described above, the log entry already
includes the context from `getContext()`.
