/**
 * Types related to API interactions
 */

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * API success response structure
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
