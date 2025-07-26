import {Request, Response, NextFunction, RequestHandler} from 'express';

/** Validation rules allowed for each body parameter. */
export interface BodyParamRules {
  /** Validator type to apply on the value. */
  validator?: 'string' | 'email' | 'int' | 'float' | 'bool';
  /** Minimum string length or numeric value. */
  minLength?: number;
  /** Maximum string length or numeric value. */
  maxLength?: number;
  /** Minimum numeric value. */
  min?: number;
  /** Maximum numeric value. */
  max?: number;
}

export type BodyParamsSchema = string[] | Record<string, BodyParamRules>;

/**
 * Validate request body parameters according to a schema. When called with an
 * array, only presence of the listed fields is checked (legacy behaviour).
 * When called with an object, values are also validated using the specified
 * {@link BodyParamRules}.
 *
 * @param schema - Required fields or a mapping of field names to rules.
 * @returns Express middleware performing the validation.
 */
export function requireBodyParams(schema: BodyParamsSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const fields = Array.isArray(schema) ? schema : Object.keys(schema);
    const missing = fields.filter((f) => req.body?.[f] === undefined);
    if (missing.length > 0) {
      res
        .status(400)
        .json({error: `Missing required parameters: ${missing.join(', ')}`});
      return;
    }

    if (!Array.isArray(schema)) {
      const invalid = Object.entries(schema).reduce<string[]>((acc, [key, rules]) => {
        const value = req.body[key];
        if (!validate(value, rules)) {
          acc.push(key);
        }
        return acc;
      }, []);
      if (invalid.length > 0) {
        res
          .status(422)
          .json({error: `Invalid parameters value : ${invalid.join(', ')}`});
        return;
      }
    }

    next();
  };
}

function validate(value: unknown, rules: BodyParamRules): boolean {
  switch (rules.validator) {
  case 'email':
    if (typeof value !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  case 'string':
    if (typeof value !== 'string') return false;
    if (rules.minLength !== undefined && value.length < rules.minLength) return false;
    if (rules.maxLength !== undefined && value.length > rules.maxLength) return false;
    return true;
  case 'int':
    if (typeof value !== 'number' || !Number.isInteger(value)) return false;
    if (rules.min !== undefined && value < rules.min) return false;
    if (rules.max !== undefined && value > rules.max) return false;
    return true;
  case 'float':
    if (typeof value !== 'number') return false;
    if (rules.min !== undefined && value < rules.min) return false;
    if (rules.max !== undefined && value > rules.max) return false;
    return true;
  case 'bool':
    return typeof value === 'boolean';
  default:
    return true;
  }
}
