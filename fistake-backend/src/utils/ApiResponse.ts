class ApiResponse {
  statusCode: number;
  success: boolean;
  data: any;
  message: string;
  error: string | null;

  constructor(
    statusCode: number,
    data: any = null,
    message: string = "Success",
    error: string | null = null
  ) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.data = data;
    this.message = message;
    this.error = error;
  }
}

export default ApiResponse;
