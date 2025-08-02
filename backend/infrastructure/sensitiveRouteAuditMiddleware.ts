import { RequestHandler } from 'express';
import { AuditPort } from '../domain/ports/AuditPort';
import { AuthServicePort } from '../domain/ports/AuthServicePort';
import { LoggerPort } from '../domain/ports/LoggerPort';
import { GetConfigUseCase } from '../usecases/config/GetConfigUseCase';
import { AuditEvent } from '../domain/entities/AuditEvent';
import { AuditEventType } from '../domain/entities/AuditEventType';
import { getContext } from './loggerContext';

const DEFAULT_PATTERNS = ['/api/admin/*', '/api/audit', '/api/config/*'];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compile(pattern: string): RegExp {
  return new RegExp('^' + pattern.split('*').map(escapeRegex).join('.*') + '$');
}

/**
 * Create an Express middleware that logs access to sensitive routes.
 *
 * The middleware loads path patterns from the `audit_sensitive_routes`
 * configuration entry. When absent, a default list is used. Requests matching
 * one of the patterns result in an audit event with type
 * {@link AuditEventType.SENSITIVE_ROUTE_ACCESSED}.
 *
 * @param audit - Adapter used to persist audit events.
 * @param auth - Service used to resolve the current user from a token.
 * @param config - Use case to fetch configuration values.
 * @param logger - Logger for debug information.
 * @returns Configured Express request handler.
 */
export function createSensitiveRouteAuditMiddleware(
  audit: AuditPort,
  auth: AuthServicePort,
  config: GetConfigUseCase,
  logger: LoggerPort,
): RequestHandler {
  let regexps: RegExp[] | null = null;

  return async (req, _res, next) => {
    if (!regexps) {
      const patterns =
        (await config.execute<string[]>('audit_sensitive_routes')) ?? DEFAULT_PATTERNS;
      regexps = patterns.map(compile);
    }

    const matched = regexps.some((r) => r.test(req.path));
    if (matched) {
      logger.debug('Sensitive route accessed', getContext());
      let userId: string | null = null;
      const header = req.headers.authorization;
      if (header?.startsWith('Bearer ')) {
        const token = header.slice(7);
        try {
          const user = await auth.verifyToken(token);
          userId = user.id;
        } catch (err) {
          logger.warn('Failed to resolve user for audit', { ...getContext(), error: err });
        }
      }

      await audit.log(
        new AuditEvent(
          new Date(),
          userId,
          userId ? 'user' : 'system',
          AuditEventType.SENSITIVE_ROUTE_ACCESSED,
          undefined,
          undefined,
          { method: req.method, path: req.path, ip: req.ip },
        ),
      );
    }
    // Blocage 401 si route sensible et token absent/mal formé
    if (matched && (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))) {
      _res.status(401).end();
      return;
    }
    // Blocage 401 si route sensible et token invalide
    if (matched && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.slice(7);
      try {
        await auth.verifyToken(token);
      } catch{
        _res.status(401).end();
        return;
      }
    }
    next();
  };
}
