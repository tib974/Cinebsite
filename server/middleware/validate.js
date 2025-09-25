import { ZodError } from 'zod';

export function validateBody(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.validatedBody = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        error.status = 400;
        error.message = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      }
      next(error);
    }
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req.query);
      req.validatedQuery = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        error.status = 400;
        error.message = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      }
      next(error);
    }
  };
}
