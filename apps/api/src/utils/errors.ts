export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  VALIDATION_ERROR: (msg: string) => new AppError(400, 'VALIDATION_ERROR', msg),
  NOT_FOUND: (msg: string) => new AppError(404, 'NOT_FOUND', msg),
  TOOL_UNAVAILABLE: (msg: string) => new AppError(503, 'TOOL_UNAVAILABLE', msg),
  EXECUTION_TIMEOUT: (msg: string) => new AppError(408, 'EXECUTION_TIMEOUT', msg),
  LLM_ERROR: (msg: string) => new AppError(502, 'LLM_ERROR', msg),
  INTERNAL_ERROR: (msg: string) => new AppError(500, 'INTERNAL_ERROR', msg),
};
