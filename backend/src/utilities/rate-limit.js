import { rateLimit } from 'express-rate-limit';
import { HttpError } from './http-error.js';

export function requestLimit(options, message) {
  return rateLimit({
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ...options,
    handler: (_request, _response, next) => next(new HttpError(429, 'RATE_LIMIT', message)),
  });
}
