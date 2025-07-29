# Configuration MFA

La fonctionnalité MFA repose sur un service TOTP par défaut.

- `MFA_ENCRYPTION_KEY` : clé hexadécimale utilisée pour chiffrer le secret TOTP stocké sur l'utilisateur.
- `REDIS_HOST` et variables associées : définissent le cache utilisé pour stocker temporairement les OTP ainsi que les compteurs d'essais.

Lorsqu'un utilisateur active ou désactive le MFA, tous ses refresh tokens sont révoqués afin d'obliger une reconnexion.
