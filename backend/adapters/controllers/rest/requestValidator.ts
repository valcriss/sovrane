import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Creates middleware validating that required parameters are present
 * in the request body. If any parameter is missing, the request is
 * rejected with status 400 and an error message listing the missing keys.
 *
 * @param fields - Required body field names.
 * @returns Express middleware performing the validation.
 */
export function requireBodyParams(fields: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing = fields.filter((f) => req.body?.[f] === undefined);
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required parameters: ${missing.join(', ')}` });
      return;
    }
    next();
  };
}
