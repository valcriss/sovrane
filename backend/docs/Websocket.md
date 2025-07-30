# API WebSocket

Le backend expose une API temps réel basée sur Socket.IO. Toutes les connexions doivent fournir un jeton JWT valide.

## Connexion

```ts
import { io } from 'socket.io-client';

const socket = io('https://mon.sovrane', {
  auth: { token: '<JWT>' }
});
```

Sans jeton ou avec un jeton invalide, la connexion est rejetée avec l'erreur `Unauthorized`.

## Événements disponibles

Les évènements sont regroupés par type de ressource. Chaque requête reçoit une réponse portant le même nom suivi de `-response`.

### Système

| Événement | Réponse | Exemple de payload |
|-----------|---------|--------------------|
| `ping` | `pong` | `{}` |

### Utilisateurs

| Événement | Réponse | Exemple de requête | Exemple de réponse |
|-----------|---------|--------------------|--------------------|
| `user-list-request` | `user-list-response` | `{ "page": 1, "limit": 20 }` | `{ "items": [], "page": 1, "limit": 20, "total": 0 }` |
| `user-get` | `user-get-response` | `{ "id": "u1" }` | `{ "id": "u1", "firstName": "Alice" }` |
| `user-create` | `user-create-response` | `{ "id": "u1", "firstName": "Alice", "lastName": "Doe", "email": "alice@example.com" }` | `{ "id": "u1" }` |
| `user-update` | `user-update-response` | `{ "id": "u1", "firstName": "Alice" }` | `{ "id": "u1" }` |
| `auth-login` | `auth-login-response` | `{ "email": "alice@example.com", "password": "secret" }` | `{ "accessToken": "..." }` |
| `auth-request-reset` | `auth-request-reset-response` | `{ "email": "alice@example.com" }` | `{ "success": true }` |
| `auth-reset` | `auth-reset-response` | `{ "token": "t", "password": "new" }` | `{ "success": true }` |
| `auth-mfa-setup` | `auth-mfa-setup-response` | `{}` | `{ "secret": "XXXX" }` |
| `auth-mfa-enable` | `auth-mfa-enable-response` | `{ "type": "totp" }` | `{ "id": "u1" }` |
| `auth-mfa-disable` | `auth-mfa-disable-response` | `{}` | `{ "success": true }` |
| `auth-mfa-verify` | `auth-mfa-verify-response` | `{ "userId": "u1", "code": "123456" }` | `{ "accessToken": "..." }` |

### Rôles

| Événement | Réponse |
|-----------|---------|
| `role-list-request` | `role-list-response` |
| `role-get` | `role-get-response` |
| `role-create` | `role-create-response` |
| `role-update` | `role-update-response` |
| `role-delete` | `role-delete-response` |

### Sites

| Événement | Réponse |
|-----------|---------|
| `site-list-request` | `site-list-response` |
| `site-get` | `site-get-response` |
| `site-create` | `site-create-response` |
| `site-update` | `site-update-response` |
| `site-delete` | `site-delete-response` |

### Départements

| Événement | Réponse |
|-----------|---------|
| `department-list-request` | `department-list-response` |
| `department-get` | `department-get-response` |
| `department-create` | `department-create-response` |
| `department-update` | `department-update-response` |
| `department-delete` | `department-delete-response` |
| `department-children-request` | `department-children-response` |
| `department-manager-get` | `department-manager-response` |
| `department-manager-set` | `department-manager-set-response` |
| `department-manager-remove` | `department-manager-remove-response` |
| `department-parent-get` | `department-parent-response` |
| `department-parent-set` | `department-parent-set-response` |
| `department-parent-remove` | `department-parent-remove-response` |
| `department-add-child` | `department-add-child-response` |
| `department-remove-child` | `department-remove-child-response` |
| `department-add-user` | `department-add-user-response` |
| `department-remove-user` | `department-remove-user-response` |

### Groupes

| Événement | Réponse |
|-----------|---------|
| `group-list-request` | `group-list-response` |
| `group-get` | `group-get-response` |
| `group-members-request` | `group-members-response` |
| `group-responsibles-request` | `group-responsibles-response` |
| `group-create` | `group-create-response` |
| `group-update` | `group-update-response` |
| `group-delete` | `group-delete-response` |
| `group-add-user` | `group-add-user-response` |
| `group-remove-user` | `group-remove-user-response` |
| `group-add-responsible` | `group-add-responsible-response` |
| `group-remove-responsible` | `group-remove-responsible-response` |

### Permissions

| Événement | Réponse |
|-----------|---------|
| `permission-list-request` | `permission-list-response` |
| `permission-get` | `permission-get-response` |
| `permission-create` | `permission-create-response` |
| `permission-update` | `permission-update-response` |
| `permission-delete` | `permission-delete-response` |

### Invitations

| Événement | Réponse |
|-----------|---------|
| `invitation-create` | `invitation-create-response` |
| `invitation-fetch` | `invitation-fetch-response` |

### Configuration

| Événement | Réponse |
|-----------|---------|
| `config-get` | `config-get-response` |
| `config-update` | `config-update-response` |
| `config-delete` | `config-delete-response` |

### Journalisation

| Événement | Réponse |
|-----------|---------|
| `audit-log-request` | `audit-log-response` |
| `audit-config-get` | `audit-config-get-response` |
| `audit-config-update` | `audit-config-update-response` |

## Événements `*-changed`

Après chaque création, modification ou suppression d'une ressource, un évènement de la forme `*-changed` est émis à tous les clients connectés. Le nom reprend la ressource concernée. Exemples :

- `user-changed`
- `role-changed`
- `group-changed`
- `site-changed`
- `department-changed`
- `permission-changed`
- `config-changed`
- `audit-config-changed`
- `invitation-changed`

Le payload minimal contient l'identifiant ou le jeton de la ressource modifiée, par exemple `{ "id": "u1" }` ou `{ "token": "abc" }`.
