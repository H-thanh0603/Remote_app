import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../utils/errors.js';

const isProd = process.env.NODE_ENV === 'production';

export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.id;
  const method = request.method;
  const url = request.url;

  if (error instanceof AppError) {
    request.log.warn({ requestId, method, url, code: error.code, statusCode: error.statusCode }, error.message);
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
      code: error.code,
    });
  }

  // Fastify validation error
  if ((error as FastifyError).statusCode === 400) {
    request.log.warn({ requestId, method, url }, error.message);
    return reply.status(400).send({
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR',
    });
  }

  // Unexpected error
  request.log.error({ requestId, method, url, err: error }, 'Unhandled error');
  return reply.status(500).send({
    success: false,
    error: isProd ? 'Internal server error' : error.message,
    code: 'INTERNAL_ERROR',
  });
}
