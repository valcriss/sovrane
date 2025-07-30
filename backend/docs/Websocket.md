# API WebSocket

Le backend expose une API temps réel via Socket.IO. Toutes les connexions doivent fournir un jeton JWT valide.

## Connexion

```ts
import { io } from 'socket.io-client';

const socket = io('https://mon.sovrane', {
  auth: { token: '<JWT>' }
});
```

Sans jeton ou avec un jeton invalide, la connexion est rejetée avec l'erreur `Unauthorized`.

## Événements principaux

### `ping` / `pong`
Vérifie que la connexion est ouverte.

### `user-list-request` / `user-list-response`
Demande la liste des utilisateurs.

Exemple de requête :
```json
{ "page": 1, "limit": 20 }
```

Exemple de réponse :
```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

### `user-update` / `user-update-response`
Met à jour un profil utilisateur.

Exemple de requête :
```json
{
  "id": "u1",
  "firstName": "Alice",
  "lastName": "Doe",
  "email": "alice@example.com",
  "department": { "id": "d1", "label": "IT", "site": { "id": "s1", "label": "Paris" } },
  "site": { "id": "s1", "label": "Paris" }
}
```

### Diffusion

Quand une ressource est modifiée, un événement `*-changed` est diffusé à tous les clients (par exemple `user-changed`, `role-changed`, `site-changed`).

La liste complète des événements se trouve dans les fichiers du dossier `backend/adapters/controllers/websocket`.
