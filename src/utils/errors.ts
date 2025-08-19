export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  STICKER_CREATION_FAILED = 'STICKER_CREATION_FAILED',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  WHATSAPP_CONNECTION_ERROR = 'WHATSAPP_CONNECTION_ERROR',
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DEPENDENCY_ERROR = 'DEPENDENCY_ERROR',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: any;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: any) {
    super(message, ErrorCode.INVALID_INPUT, 400, true, context);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, code: ErrorCode, context?: any) {
    super(message, code, 422, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: any) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true, context);
  }
}

export class WhatsAppError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.WHATSAPP_CONNECTION_ERROR, context?: any) {
    super(message, code, 503, true, context);
  }
}

export class SystemError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR, context?: any) {
    super(message, code, 500, false, context);
  }
}

export const createValidationError = (message: string, field?: string, value?: any) => {
  return new ValidationError(message, { field, value });
};

export const createBusinessError = (message: string, code: ErrorCode, details?: any) => {
  return new BusinessLogicError(message, code, details);
};

export const createWhatsAppError = (message: string, operation?: string, details?: any) => {
  return new WhatsAppError(message, ErrorCode.WHATSAPP_CONNECTION_ERROR, { operation, details });
};

export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const isOperationalError = (error: any): boolean => {
  return isAppError(error) && error.isOperational;
};