export interface ApiError {
  success: false;
  error: string;
  code: string;
}

export function parseApiError(error: unknown): string {
  // Network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Không thể kết nối server';
  }

  // Timeout
  if (error instanceof Error && error.message.includes('timeout')) {
    return 'Request timed out';
  }

  // API error response
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const apiError = error as ApiError;
    switch (apiError.code) {
      case 'TOOL_UNAVAILABLE':
        return 'Tool đang offline';
      case 'EXECUTION_TIMEOUT':
        return 'Request timed out';
      case 'VALIDATION_ERROR':
        return apiError.error || 'Dữ liệu không hợp lệ';
      case 'NOT_FOUND':
        return 'Không tìm thấy';
      case 'LLM_ERROR':
        return 'AI service lỗi, thử lại sau';
      default:
        return apiError.error || 'Đã xảy ra lỗi';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Đã xảy ra lỗi';
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes('fetch');
}
