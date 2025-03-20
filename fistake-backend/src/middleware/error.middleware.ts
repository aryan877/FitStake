import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError";

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("ERROR: ", err);

  // Default error object
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: any[] = [];

  // Handle ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // Handle Mongoose validation errors
  else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    // @ts-ignore
    errors = Object.values(err.errors).map((item) => item.message);
  }
  // Handle Mongoose cast errors (e.g. invalid ObjectId)
  else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid data format";
    // @ts-ignore
    errors = [`Invalid ${err.path}: ${err.value}`];
  }
  // Handle Mongoose duplicate key errors
  else if (err.name === "MongoError" && (err as any).code === 11000) {
    statusCode = 409;
    message = "Duplicate value error";
    // @ts-ignore
    const field = Object.keys(err.keyValue)[0];
    // @ts-ignore
    errors = [`${field} already exists with value ${err.keyValue[field]}`];
  }

  // Format the error response
  res.status(statusCode).json({
    success: false,
    error: message,
    errors: errors.length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};
