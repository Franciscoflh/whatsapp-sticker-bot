import { MessageContext, MessageMiddleware } from './types';
import { logger } from '../services/loggerService';
import { AppError, isAppError, isOperationalError } from '../utils/errors';

export class ErrorMiddleware implements MessageMiddleware {
  async handle(context: MessageContext, next: () => Promise<void>): Promise<void> {
    try {
      await next();
    } catch (error) {
      await this.handleError(error, context);
    }
  }

  private async handleError(error: any, context: MessageContext): Promise<void> {
    this.logError(error, context);

    const userMessage = this.getUserMessage(error);
    
    try {
      await context.message.reply(userMessage);
    } catch (replyError) {
      logger.error('Falha ao enviar mensagem de erro para o usuário', replyError, {
        originalError: error.message,
        userId: context.message.from,
        messageId: context.message.id._serialized
      });
    }

    if (!isOperationalError(error)) {
      throw error;
    }
  }

  private logError(error: any, context: MessageContext): void {
    const errorContext = {
      userId: context.message.from,
      messageId: context.message.id._serialized,
      messageType: context.message.type,
      messageBody: context.message.body?.substring(0, 100), 
      timestamp: new Date().toISOString()
    };

    if (isAppError(error)) {
      logger.error(
        `${error.constructor.name}: ${error.message}`,
        error,
        {
          ...errorContext,
          errorCode: error.code,
          statusCode: error.statusCode,
          isOperational: error.isOperational,
          errorContext: error.context
        }
      );
    } else {
      logger.error(
        `Erro não tratado: ${error.message || 'Erro desconhecido'}`,
        error,
        errorContext
      );
    }
  }

  private getUserMessage(error: any): string {
    if (isAppError(error)) {
      switch (error.code) {
        case 'RATE_LIMIT_EXCEEDED':
          return '⏰ Você está enviando muitas mensagens. Aguarde um momento antes de tentar novamente.';
        
        case 'INVALID_INPUT':
          return '❌ Formato inválido. Verifique sua mensagem e tente novamente.';
        
        case 'UNSUPPORTED_FILE_TYPE':
          return '📎 Tipo de arquivo não suportado. Envie uma imagem, GIF ou texto.';
        
        case 'FILE_TOO_LARGE':
          return '📏 Arquivo muito grande. Envie um arquivo menor.';
        
        case 'STICKER_CREATION_FAILED':
          return '🚫 Não foi possível criar o sticker. Tente novamente com outro arquivo.';
        
        case 'WHATSAPP_CONNECTION_ERROR':
        case 'MESSAGE_SEND_FAILED':
          return '📱 Problema de conexão com o WhatsApp. Tente novamente em alguns instantes.';
        
        default:
          return '⚠️ Ocorreu um erro inesperado. Nossa equipe foi notificada.';
      }
    }

    return '🔧 Estamos enfrentando problemas técnicos. Tente novamente mais tarde.';
  }

  static async withPerformanceLogging<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      logger.performance(operation, duration, context);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(
        `Operação ${operation} falhou após ${duration}ms`,
        error,
        { operation, duration, context }
      );
      
      throw error;
    }
  }

  static logBusinessEvent(event: string, data?: any): void {
    logger.business(event, data);
  }

  static logSecurityEvent(event: string, details?: any): void {
    logger.security(event, details);
  }
}

export const errorMiddleware = new ErrorMiddleware();