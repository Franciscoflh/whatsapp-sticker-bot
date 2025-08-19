import WAWebJS from 'whatsapp-web.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { StickerService } from '../models/types';
import { MonitoringService } from '../services/monitoringService';
import LoggerService from '../services/loggerService';
import { ValidationMiddleware } from '../middlewares/validationMiddleware';
import { RateLimitMiddleware } from '../middlewares/rateLimitMiddleware';
import { ErrorMiddleware } from '../middlewares/errorMiddleware';
import { MessageContext } from '../middlewares/types';

@injectable()
export class MessageController {
    private stickerService: StickerService;
    private monitoringService: MonitoringService;
    private logger: LoggerService;
    private validationMiddleware: ValidationMiddleware;
    private rateLimitMiddleware: RateLimitMiddleware;

    constructor(
        @inject(TYPES.StickerService) stickerService: StickerService,
        @inject(TYPES.MonitoringService) monitoringService: MonitoringService,
        @inject(TYPES.LoggerService) logger: LoggerService,
        @inject(TYPES.ValidationMiddleware) validationMiddleware: ValidationMiddleware,
        @inject(TYPES.RateLimitMiddleware) rateLimitMiddleware: RateLimitMiddleware
    ) {
        this.stickerService = stickerService;
        this.monitoringService = monitoringService;
        this.logger = logger;
        this.validationMiddleware = validationMiddleware;
        this.rateLimitMiddleware = rateLimitMiddleware;

        this.setupMetricsListeners();
    }

    private setupMetricsListeners(): void {
        this.monitoringService.on('metricsUpdate', (metrics) => {
            this.logger.info('Métricas de uso atualizadas', {
                totalStickers: metrics.totalStickers,
                stickersPerMinute: metrics.stickersPerMinute,
                activeProcesses: metrics.activeProcesses,
                averageProcessingTime: metrics.averageProcessingTime,
                errors: metrics.errors
            });

            ErrorMiddleware.logBusinessEvent('metrics_updated', metrics);
        });
    }
    async handleMessage(client: WAWebJS.Client, message: WAWebJS.Message): Promise<void> {
        const context: MessageContext = {
            message,
            client,
            validatedMedia: undefined,
            metadata: {
                isGroup: message.from.endsWith('@g.us'),
                timestamp: new Date().toISOString()
            }
        };

        try {
            await this.rateLimitMiddleware.checkRateLimit(context);
            await this.validationMiddleware.validateMessage(context);

            this.logger.info('Processando mensagem', {
                messageId: message.id._serialized,
                from: message.from,
                body: message.body,
                isGroup: context.metadata.isGroup
            });

            await this.processCommand(context);
        } catch (error) {
            this.logger.error('Erro ao processar mensagem no controller', error, {
                messageId: message.id._serialized,
                from: message.from
            });
            throw error;
        }
    }

    private async processCommand(context: MessageContext): Promise<void> {
        const { message, client } = context;
        const isGroup = context.metadata.isGroup;

        if (message.body.startsWith('!imagem')) {
            this.logger.info('Comando !imagem detectado', { messageId: message.id._serialized });
            
            if (!message.hasMedia) {
                this.logger.warn('Comando !imagem sem mídia', { messageId: message.id._serialized });
                await message.reply('Envie uma imagem ou vídeo com o comando `!imagem` para transformá-lo em figurinha.');
                return;
            }

            try {
                this.logger.info('Processando sticker', { messageId: message.id._serialized });
                await this.stickerService.createSticker(client, message);
            } catch (error) {
                this.logger.error('Erro ao processar sticker', error, { messageId: message.id._serialized });
                throw error;  
            }
            return;
        }

        if (message.body.startsWith('!texto ')) {
            this.logger.info('Comando !texto detectado', { messageId: message.id._serialized });
            const text = message.body.replace('!texto ', '').trim();
            
            if (!text) {
                this.logger.warn('Comando !texto com texto vazio', { messageId: message.id._serialized });
                await message.reply('Envie um texto válido após o comando.');
                return;
            }

            try {
                this.logger.info('Processando sticker de texto', { 
                    messageId: message.id._serialized, 
                    textLength: text.length 
                });
                await this.stickerService.createTextSticker(client, message, text);
            } catch (error) {
                this.logger.error('Erro ao criar sticker de texto', error, { messageId: message.id._serialized });
                throw error; 
            }
            return;
        }

        if (!isGroup && message.hasMedia) {
            this.logger.info('Mensagem com mídia em chat privado', { messageId: message.id._serialized });
            
            try {
                this.logger.info('Processando mídia automaticamente', { messageId: message.id._serialized });
                await this.stickerService.createSticker(client, message);
            } catch (error) {
                this.logger.error('Erro ao processar mídia automaticamente', error, { messageId: message.id._serialized });
                throw error; 
            }
            return;
        }

        if (isGroup && message.body === '!gif') {
            this.logger.info('Comando !gif detectado em grupo', { messageId: message.id._serialized });
            const quotedMsg = await message.getQuotedMessage();
            
            if (!quotedMsg?.hasMedia) {
                this.logger.warn('Comando !gif sem mensagem citada com mídia', { messageId: message.id._serialized });
                await message.reply('Responda a um GIF com o comando `!gif` para transformá-lo em figurinha.');
                return;
            }

            try {
                this.logger.info('Processando GIF citado', { 
                    messageId: message.id._serialized,
                    quotedMessageId: quotedMsg.id._serialized 
                });
                await this.stickerService.createSticker(client, quotedMsg);
            } catch (error) {
                this.logger.error('Erro ao processar GIF citado', error, { messageId: message.id._serialized });
                throw error;
            }
        }
    }
}