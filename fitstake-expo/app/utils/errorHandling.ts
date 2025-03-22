import axios, { AxiosError } from 'axios';
import {
  showErrorToast as showToastError,
  showSuccessToast as showToastSuccess,
} from '../components/Toast';

export interface ApiErrorResponse {
  success: boolean;
  error: string;
  errors?: string[];
  stack?: string;
}

export const handleApiError = (
  error: unknown,
  fallbackMessage: string = 'Something went wrong'
): string => {
  console.error('API Error:', error);

  // Check if it's an Axios error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // If we have a response with error data from our API
    if (axiosError.response?.data) {
      const { error: errorMessage, errors } = axiosError.response.data;

      // If we have specific errors, show the first one
      if (errors && errors.length > 0) {
        return errors[0];
      }

      // Otherwise show the main error message
      return errorMessage || fallbackMessage;
    }

    // Network error
    if (axiosError.message === 'Network Error') {
      return 'Network error. Please check your connection.';
    }

    // Other Axios errors
    return axiosError.message || fallbackMessage;
  }

  // For non-Axios errors (shouldn't happen often)
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback for unknown error types
  return fallbackMessage;
};

export const showErrorToast = (
  error: unknown,
  fallbackMessage: string = 'Something went wrong'
) => {
  const errorMessage = handleApiError(error, fallbackMessage);
  showToastError(errorMessage);
};

export const showSuccessToast = (message: string) => {
  showToastSuccess(message);
};

// Add default export
const errorHandling = {
  handleApiError,
  showErrorToast,
  showSuccessToast,
};

export default errorHandling;
