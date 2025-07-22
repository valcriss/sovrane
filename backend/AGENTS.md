# Backend Agents Instructions

## Project Architecture: Hexagonal (Ports & Adapters)

This backend uses a **hexagonal (ports & adapters) architecture** to maximize modularity, scalability, and testability. The core business logic is decoupled from infrastructure concerns. This allows for:

- Easy swapping of technical implementations (DB, storage, event bus, etc.)
- High test coverage and independent unit testing
- Support for multiple adapters (e.g., different authentication, storage, event bus solutions)

### **Key Principles**

- **Domain Layer** contains entities and business use cases, with no dependency on external libs or infra.
- **Ports** are interfaces that define interactions the domain expects (repositories, services, event bus, etc.).
- **Adapters** implement these ports for specific technologies (PostgreSQL/Prisma, S3/MinIO, Redis, Keycloak, etc.).
- **Application Layer** wires everything together (dependency injection, routing, initialization).

---

## Main Backend Modules

- **Authentication:**

  - Modular: supports both local login/password and Keycloak/OIDC integration.
  - Auth logic handled via AuthPort (interface), with adapters for JWT (local) and Keycloak (OIDC).
  - Users, groups, and roles management is part of the core.

- **Documents:**

  - Upload, delete, and list documents with a folder structure.
  - Supports multiple storage backends via DocumentStoragePort (local filesystem, S3/MinIO).
  - File metadata managed in PostgreSQL via repository port/adapters.
  - Permissions managed via roles/groups/users.

- **Collaborative Editing:**

  - Integration with OnlyOffice or Collabora (selectable, interchangeable).
  - Uses WOPI protocol for secure document editing sessions.
  - Adapter (EditorPort) abstracts the editing service.

- **Chat (External Integration):**

  - External chat service integration (Matrix, Rocket.Chat, etc.).
  - Modular adapter/port for connecting or swapping services.

- **Calendar & Meetings:**

  - Event management via a dedicated domain module.
  - Meetings (video calls) can be linked to events via adapters to external services (Jitsi, BBB, etc.).
  - Uses an EventBus (e.g., Redis/NATS) for cross-module communication (publish/subscribe).

- **Indexing & Search:**

  - Content and metadata are indexed in Elasticsearch/OpenSearch for high-quality search.
  - Text extraction via Apache Tika (or equivalent) is triggered on file events.

---

## Event-Driven Architecture

- All cross-module communication (e.g., when an event is created and needs a meeting link) is done via events published on an **EventBusPort** abstraction.
- Adapters for event bus (Redis, RabbitMQ, NATS, etc.) allow for easy replacement.
- Event-driven actions MUST NOT create strong coupling between services: publish events and let listeners react independently.

---

## Code Quality and Test Coverage

### **Linting**

- **Before every commit**, ensure the code passes linting without warnings or errors:
  ```
  npm run lint
  ```

### **Testing**

- The project aims for **100% code coverage** (lines, branches, and methods) on every change.
- Write unit, integration, and e2e tests for all modules and adapters.
- Check coverage reports and address any uncovered code.

---

## Guidelines for AI Agents

- Always respect the separation between domain, ports, and adapters: never mix business logic with infrastructure code.
- New adapters/implementations must implement their respective ports/interfaces.
- When adding or modifying features:
  - Document all public APIs and adapters.
  - Add/extend tests to maintain 100% coverage.
  - Ensure all linting rules pass before merging.
- Use environment variables and configuration files for adapter selection (e.g., which event bus, which editor service, etc.).
- Never hardcode technology-specific logic in the domain layer.

---

## Directory Structure (Example)

```
/backend/
  /src/
    /domain/
      /entities/
      /ports/
    /adapters/
      /repositories/
      /eventbus/
      /storage/
      /editor/
    /usecases/
    /infrastructure/
  package.json
  prisma/schema.prisma (or other ORM schema)
  .env
```

---

## References

- [Hexagonal Architecture Pattern](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://dddcommunity.org/)
- [Prisma ORM Docs](https://www.prisma.io/docs)
- [Jest Testing](https://jestjs.io/)
- [Node.js Event-Driven Architecture](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick)

---

**Agents are expected to preserve the modular, maintainable, and extensible spirit of the project at all times.**
