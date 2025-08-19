import { MessageContext, MessageMiddleware } from './types';
import { validateWhatsAppMessage, validateTextMessage, validateImageFile } from '../validation/schemas';
import { ValidationError, createValidationError } from '../utils/errors';
import { logger } from '../services/loggerService';

export class ValidationMiddleware implements MessageMiddleware {
  async validateMessage(context: MessageContext): Promise<void> {
    await this.handle(context, async () => {});
  }

  async handle(context: MessageContext, next: () => Promise<void>): Promise<void> {
    try {
      this.validateWhatsAppMessage(context.message);
      
      await this.validateMessageContent(context);
      
      logger.debug('Mensagem validada com sucesso', {
        messageId: context.message.id._serialized,
        messageType: context.message.type,
        from: context.message.from
      });
      
      await next();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Message validation failed', {
          messageId: context.message.id?._serialized,
          messageType: context.message.type,
          from: context.message.from,
          validationError: error.message,
          error: error 
        });
      }
      throw error;
    }
  }

  private validateWhatsAppMessage(message: any): void {
    try {
      validateWhatsAppMessage(message);
    } catch (error) {
      throw createValidationError(
        `Estrutura de mensagem inválida: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'message',
        message
      );
    }
  }

  private async validateMessageContent(context: MessageContext): Promise<void> {
    const { message } = context;

    switch (message.type) {
      case 'chat':
        this.validateTextMessage(message.body);
        break;
        
      case 'image':
        await this.validateImageMessage(context);
        break;
        
      case 'document':
        await this.validateDocumentMessage(context);
        break;
        
      case 'sticker':
        break;
        
      case 'notification_template':
        // Mensagens de template de notificação são ignoradas silenciosamente
        break;
        
      default:
        if (!this.isSupportedMessageType(message.type)) {
          throw createValidationError(
            `Tipo de mensagem não suportado: ${message.type}`,
            'messageType',
            message.type
          );
        }
    }
  }

  private validateTextMessage(text: string): void {
    if (!text || typeof text !== 'string') {
      throw createValidationError(
        'Mensagem de texto é obrigatória',
        'body',
        text
      );
    }

    if (text.length > 4096) {
      throw createValidationError(
        'Mensagem muito longa (máximo 4096 caracteres)',
        'body',
        text.length
      );
    }

    if (text.trim().length === 0) {
      throw createValidationError(
        'Mensagem não pode conter apenas espaços em branco',
        'body',
        text
      );
    }

    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(text)) {
        throw createValidationError(
          'Mensagem contém conteúdo não permitido',
          'body',
          'dangerous_content'
        );
      }
    }
  }

  private async validateImageMessage(context: MessageContext): Promise<void> {
    const { message } = context;

    if (!message.hasMedia) {
      throw createValidationError(
        'Mensagem de imagem deve conter mídia',
        'hasMedia',
        false
      );
    }

    try {
      const media = await message.downloadMedia();
      
      if (!media) {
        throw createValidationError(
          'Não foi possível baixar a mídia',
          'media',
          null
        );
      }

      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!supportedTypes.includes(media.mimetype)) {
        throw createValidationError(
          `Tipo de arquivo não suportado: ${media.mimetype}`,
          'mimetype',
          media.mimetype
        );
      }

      const sizeInBytes = (media.data.length * 3) / 4;
      const maxSizeInBytes = 10 * 1024 * 1024; 
      
      if (sizeInBytes > maxSizeInBytes) {
        throw createValidationError(
          `Arquivo muito grande: ${Math.round(sizeInBytes / 1024 / 1024)}MB (máximo 10MB)`,
          'fileSize',
          sizeInBytes
        );
      }

      context.validatedMedia = media;
      
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw createValidationError(
        `Erro ao validar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'mediaValidation',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }

  private async validateDocumentMessage(context: MessageContext): Promise<void> {
    const { message } = context;

    if (!message.hasMedia) {
      throw createValidationError(
        'Mensagem de documento deve conter mídia',
        'hasMedia',
        false
      );
    }

    try {
      const media = await message.downloadMedia();
      
      if (!media) {
        throw createValidationError(
          'Não foi possível baixar o documento',
          'media',
          null
        );
      }

      const supportedDocTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm'
      ];
      
      if (!supportedDocTypes.includes(media.mimetype)) {
        throw createValidationError(
          `Tipo de documento não suportado: ${media.mimetype}`,
          'mimetype',
          media.mimetype
        );
      }

      const sizeInBytes = (media.data.length * 3) / 4;
      const maxSizeInBytes = 25 * 1024 * 1024; 
      
      if (sizeInBytes > maxSizeInBytes) {
        throw createValidationError(
          `Documento muito grande: ${Math.round(sizeInBytes / 1024 / 1024)}MB (máximo 25MB)`,
          'fileSize',
          sizeInBytes
        );
      }

      context.validatedMedia = media;
      
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw createValidationError(
        `Erro ao validar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'documentValidation',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }

  private isSupportedMessageType(type: string): boolean {
    const supportedTypes = [
      'chat', 'image', 'document', 'sticker', 'video', 'notification_template'
    ];
    return supportedTypes.includes(type);
  }

  static validateTextInput(text: string): void {
    try {
      validateTextMessage({ text });
    } catch (error) {
      throw createValidationError(
        `Texto inválido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'text',
        text
      );
    }
  }

  static validateCommand(commandText: string): { command: string; args: string[] } {
    if (!commandText.startsWith('/')) {
      throw createValidationError(
        'Comando deve começar com /',
        'command',
        commandText
      );
    }

    const parts = commandText.slice(1).split(' ').filter(part => part.length > 0);
    
    if (parts.length === 0) {
      throw createValidationError(
        'Comando não pode estar vazio',
        'command',
        commandText
      );
    }

    const [command, ...args] = parts;

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(command)) {
      throw createValidationError(
        'Nome do comando inválido. Use apenas letras, números e underscore',
        'command',
        command
      );
    }

    if (args.length > 10) {
      throw createValidationError(
        'Muitos argumentos (máximo 10)',
        'args',
        args.length
      );
    }

    return { command, args };
  }
}

export const validationMiddleware = new ValidationMiddleware();