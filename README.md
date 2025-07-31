# sovrane
La souveraineté de vos données, à portée de main

## Authentification multi-facteurs

Le backend prend en charge l'authentification par code TOTP ou par email. Les secrets TOTP sont chiffrés en AES‑256 à l'aide de la variable `MFA_ENCRYPTION_KEY`.
Les OTP sont stockés dans le cache configuré (Redis ou mémoire) et expirent automatiquement.
Le nombre de tentatives de vérification est limité.

Consultez [backend/docs/MFA.md](backend/docs/MFA.md) pour plus de détails sur la configuration.

Consultez [backend/docs/Audit.md](backend/docs/Audit.md) pour la configuration de l'audit des routes sensibles.

## Permissions

Les rôles et les utilisateurs disposent d'un système d'autorisations flexible.
Chaque permission attribuée peut désormais recevoir un `scopeId` optionnel pour
en limiter la portée (par exemple à un site ou un département). Lorsqu'une
permission est directement associée à un utilisateur, le champ
`denyPermission` permet de la révoquer explicitement.

## Temps réel via WebSocket

Le serveur expose une API WebSocket basée sur Socket.IO. Connectez-vous en fournissant un jeton JWT :

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: '<JWT>' }
});
```

La liste des événements disponibles est décrite dans [backend/docs/Websocket.md](backend/docs/Websocket.md).
