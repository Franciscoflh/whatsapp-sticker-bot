import winston from 'winston';
import { config } from '../config/environment';
import * as fs from 'fs';
import * as path from 'path';

class LoggerService {
  private logger: winston.Logger;

  constructor() {
    if (!fs.existsSync(config.logging.logDirectory)) {
      fs.mkdirSync(config.logging.logDirectory, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const logObject = {
            timestamp,
            level,
            message,
            ...(stack ? { stack } : {}),
            ...(meta && Object.keys(meta).length > 0 ? { meta } : {})
          };
          return JSON.stringify(logObject);
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: path.join(config.logging.logDirectory, 'error.log'),
          level: 'error',
          maxsize: config.logging.maxFileSize,
          maxFiles: config.logging.maxFiles
        }),
        new winston.transports.File({
          filename: path.join(config.logging.logDirectory, 'combined.log'),
          maxsize: config.logging.maxFileSize,
          maxFiles: config.logging.maxFiles
        })
      ],
      exceptionHandlers: [
        new winston.transports.File({ 
          filename: path.join(config.logging.logDirectory, 'exceptions.log'),
          maxsize: config.logging.maxFileSize,
          maxFiles: config.logging.maxFiles
        })
      ],
      rejectionHandlers: [
        new winston.transports.File({ 
          filename: path.join(config.logging.logDirectory, 'rejections.log'),
          maxsize: config.logging.maxFileSize,
          maxFiles: config.logging.maxFiles
        })
      ]
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error | any, meta?: any): void {
    const stack = error?.stack;
    const errorInfo = {
      error: error?.message || error,
      ...(stack ? { stack } : {}),
      ...(meta || {})
    };
    this.logger.error(message, errorInfo);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  verbose(message: string, meta?: any): void {
    this.logger.verbose(message, meta);
  }

  performance(operation: string, duration: number, meta?: any): void {
    this.logger.info(`Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      ...meta
    });
  }

  business(event: string, data?: any): void {
    this.logger.info(`Business Event: ${event}`, {
      event,
      data
    });
  }

  security(event: string, details?: any): void {
    this.logger.warn(`Security Event: ${event}`, {
      event,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

export const logger = new LoggerService();
export default LoggerService;