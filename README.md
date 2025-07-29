# sovrane
La souveraineté de vos données, à portée de main

## Authentification multi-facteurs

Le backend prend en charge l'authentification par code TOTP ou par email. Les secrets TOTP sont chiffrés en AES‑256 à l'aide de la variable `MFA_ENCRYPTION_KEY`.
Les OTP sont stockés dans le cache configuré (Redis ou mémoire) et expirent automatiquement.
Le nombre de tentatives de vérification est limité.

Consultez [backend/docs/MFA.md](backend/docs/MFA.md) pour plus de détails sur la configuration.
