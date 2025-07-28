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

### **Comments**

- **Before every commit**, verify that every class, method, and property in the domain directory (including all subfolders) is fully commented. Each should have clear and complete documentation to describe its purpose and usage.


### **Linting**

- **Before every commit**, ensure the code passes linting without warnings or errors:
  ```
  npm run lint
  ```

### **Testing**

- The project aims for **100% code coverage** (lines, branches, and methods) on every change.
- Write unit, integration, and e2e tests for all modules and adapters.
- Check coverage reports and address any uncovered code.

### **Logging**

When developing or modifying the backend, always ensure that application logs are added at the appropriate level (error, warn, info, debug, trace) according to the documentation available in **backend/docs/Logging.md**.

All logs must use the project's logging service, not direct console calls.

Logs should include relevant context for traceability.

### Rules for `@openapi` Documentation

1. **Use Standard JSDoc Format**\
   Every controller method must include a JSDoc block with an `@openapi` tag.

2. **One Block per Endpoint**\
   Place the `@openapi` block immediately above the function that handles the route.

3. **Indentation of Asterisks is Mandatory**\
   Each line in the JSDoc block must begin with a properly indented `*` (aligned vertically) to ensure Swagger reads the block correctly. Example:

   ```ts
   /**
    * @openapi
    * /api/example:
    *   get:
    *     summary: Example endpoint
    */
   ```

4. **Mandatory Content in Each Block**\
   Each `@openapi` block must include:

  - **Path and Method**: Specify the HTTP method and route.
  - **Summary & Description**: Provide a concise summary and a clear description. If the route needs one or more permissions provide the list of permissions needed.
  - **Parameters**: Document all query, path, header, and body parameters.
  - **Request Body**: Define the body schema if the endpoint accepts one.
  - **Responses**: List all possible HTTP response codes with descriptions and schemas.
  - **Security**: Define authentication requirements (e.g., `bearerAuth`) if needed.
  - **Tags**: Group endpoints logically (e.g., `Auth`, `Users`).

5. **Valid JSON Under **``\
   The content inside the `@openapi` block must be valid YAML/JSON. Example:

   ```ts
    /**
     * @openapi
     * /users:
     *   get:
     *     summary: Get all users
     *     description: Returns a paginated and filterable list of users. this route use the read-users permission.
     *     tags:
     *       - User
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number (starts at 1).
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *         description: Number of users per page.
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search term to filter users by name or email.
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [active, suspended, archived]
     *         description: Filter users by status.
     *       - in: query
     *         name: departmentId
     *         schema:
     *           type: string
     *         description: Filter by department identifier.
     *       - in: query
     *         name: siteId
     *         schema:
     *           type: string
     *         description: Filter by site identifier.
     *     responses:
     *       200:
     *         description: Paginated user list
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 items:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/User'
     *                 page:
     *                   type: integer
     *                 limit:
     *                   type: integer
     *                 total:
     *                   type: integer
     *               example:
     *                 items: []
     *                 page: 1
     *                 limit: 20
     *                 total: 0
     *       204:
     *         description: No content.
     *       401:
     *         description: Invalid or expired authentication token.
     *       403:
     *         description: User lacks required permission.
     */
   ```

6. **Reuse Schemas with **``\
   Always reference predefined schemas (e.g., `AuthResponse`, `ErrorResponse`) from `#/components/schemas/...` instead of duplicating structures.

7. **Standardize Status Codes and Errors**\
   At a minimum, document these responses:

  - `200`: Success
  - `400`: Validation error
  - `401`: Unauthorized (if applicable)
  - `403`: Forbidden (if applicable)

8. **Keep Documentation Updated**\
   Every time you add or modify an endpoint, ensure the corresponding `@openapi` block is added or updated.

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
