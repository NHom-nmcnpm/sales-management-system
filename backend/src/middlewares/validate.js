import { HttpError } from '../utilities/http-error.js';
import { z } from 'zod';

export function validate(schema, target = 'body') {
  return (request, _response, next) => {
    const result = schema.safeParse(request[target]);
    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join('.') || 'form';
        fieldErrors[field] ??= issue.message;
      }
      return next(new HttpError(400, 'VALIDATION_ERROR', 'Vui lòng kiểm tra thông tin đã nhập.', fieldErrors));
    }
    request.validated ??= {};
    request.validated[target] = result.data;
    next();
  };
}

export function requireIdempotencyKey(request, _response, next) {
  const result = z.uuid().safeParse(request.get('Idempotency-Key'));
  if (!result.success) throw new HttpError(400, 'INVALID_KEY', 'Idempotency-Key phải là UUID hợp lệ.');
  request.idempotencyKey = result.data;
  next();
}
