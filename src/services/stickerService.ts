import WAWebJS from 'whatsapp-web.js';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { StickerOptions, StickerService } from '../models/types';
import { MonitoringService } from './monitoringService';
import LoggerService from './loggerService';
import { BusinessLogicError, SystemError, ErrorCode } from '../utils/errors';
import { ErrorMiddleware } from '../middlewares/errorMiddleware';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@injectable()
export class StickerServiceImpl implements StickerService {
    private monitoringService: MonitoringService;
    private logger: LoggerService;
    private config: any;

    constructor(
        @inject(TYPES.MonitoringService) monitoringService: MonitoringService,
        @inject(TYPES.LoggerService) logger: LoggerService,
        @inject(TYPES.Config) config: any
    ) {
        this.monitoringService = monitoringService;
        this.logger = logger;
        this.config = config;
    }

    private async processWithMonitoring<T>(
    operation: string,
    processFn: () => Promise<T>,
    context?: any
): Promise<T> {
    return ErrorMiddleware.withPerformanceLogging(
        operation, 
        async () => {
            this.monitoringService.startProcessing();

            try {
                this.logger.info(`Iniciando ${operation}`, context);
                const result = await processFn();
                this.logger.info(`${operation} concluído com sucesso`, context);
                this.monitoringService.endProcessing(Date.now(), true);
                return result;
            } catch (error) {
                this.monitoringService.endProcessing(Date.now(), false);
                throw error;
            }
        },
        context 
    );
}


    async createSticker(client: WAWebJS.Client, message: WAWebJS.Message, options: StickerOptions = {}): Promise<void> {
        const context = {
            messageId: message.id._serialized,
            messageType: message.type,
            from: message.from,
            options
        };

        return this.processWithMonitoring(
            'createSticker',
            async () => {
                const media = await message.downloadMedia();
                if (!media || !media.mimetype) {
                    throw new BusinessLogicError(
                        'Mídia não pôde ser processada ou está corrompida',
                        ErrorCode.STICKER_CREATION_FAILED,
                        { messageId: message.id._serialized }
                    );
                }

                const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                if (!supportedTypes.includes(media.mimetype)) {
                    throw new BusinessLogicError(
                        `Tipo de arquivo não suportado: ${media.mimetype}`,
                        ErrorCode.UNSUPPORTED_FILE_TYPE,
                        { mimetype: media.mimetype }
                    );
                }

                const quality = options.quality || this.config.stickerQuality;
                const size = options.size || this.config.stickerSize;

            console.log('Configurações:', { quality, size });
            console.log('Processando imagem com sharp');
            
            const buffer = Buffer.from(media.data, 'base64');
            const processedBuffer = await sharp(buffer)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .webp({ quality })
                .toBuffer();

            console.log('Imagem processada, enviando sticker');
            const stickerMedia = new WAWebJS.MessageMedia('image/webp', processedBuffer.toString('base64'));
            await client.sendMessage(message.from, stickerMedia, {
                sendMediaAsSticker: true,
                stickerName: 'Sticker Bot',
                stickerAuthor: 'WhatsApp Sticker Bot'
            });
            console.log('Sticker enviado com sucesso');
        }, 'Erro ao criar sticker');
    }

    async createTextSticker(client: WAWebJS.Client, message: WAWebJS.Message, text: string, options: StickerOptions = {}): Promise<void> {
        return this.processWithMonitoring(
            'createTextSticker',
            async () => {
            console.log('Iniciando criação de sticker de texto');
            const size = options.size || this.config.stickerSize;
            const quality = options.quality || this.config.stickerQuality;

            console.log('Configurações:', { quality, size, text });
            
            const svgBuffer = Buffer.from(`
                <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="white"/>
                    <text x="50%" y="50%" font-family="Arial" font-size="24" fill="black" text-anchor="middle" dominant-baseline="middle">
                        ${text}
                    </text>
                </svg>
            `);

            console.log('Processando SVG com sharp');
            const processedBuffer = await sharp(svgBuffer)
                .webp({ quality })
                .toBuffer();

            console.log('Texto processado, enviando sticker');
            const stickerMedia = new WAWebJS.MessageMedia('image/webp', processedBuffer.toString('base64'));
            await client.sendMessage(message.from, stickerMedia, {
                sendMediaAsSticker: true,
                stickerName: 'Sticker Bot',
                stickerAuthor: 'WhatsApp Sticker Bot'
            });
            console.log('Sticker enviado com sucesso');
        }, 'Erro ao criar sticker de texto');
    }

    async createGifSticker(client: WAWebJS.Client, message: WAWebJS.Message, options: StickerOptions = {}): Promise<void> {
        return this.processWithMonitoring('createGifSticker', async () => {
            console.log('Iniciando criação de sticker GIF');
            const media = await message.downloadMedia();
            if (!media || !media.mimetype) {
                throw new Error('Mídia não pôde ser processada');
            }

            console.log('Tipo de mídia recebida:', media.mimetype);
            const size = options.size || this.config.stickerSize;
            const quality = options.quality || this.config.stickerQuality;

            console.log('Configurações:', { quality, size });
            
            const buffer = Buffer.from(media.data, 'base64');
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const tempInputPath = join(tmpdir(), `temp-${timestamp}-${random}-input.mp4`);
            const tempOutputPath = join(tmpdir(), `temp-${timestamp}-${random}-output.webp`);

            try {
                await writeFile(tempInputPath, buffer);

                await new Promise((resolve, reject) => {
                    ffmpeg(tempInputPath)
                        .addOutputOptions([
                            '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
                            '-vcodec', 'libwebp',
                            '-lossless', '1',
                            '-quality', quality.toString(),
                            '-preset', 'default',
                            '-loop', '0',
                            '-vsync', '0',
                            '-threads', '0'
                        ])
                        .on('end', resolve)
                        .on('error', reject)
                        .save(tempOutputPath);
                });

                const webpBuffer = await readFile(tempOutputPath);

                try {
                    await Promise.all([
                        unlink(tempInputPath).catch(() => {}),
                        unlink(tempOutputPath).catch(() => {})
                    ]);
                } catch (error) {
                    console.warn('Não foi possível deletar os arquivos temporários:', error);
                }

                console.log('GIF processado, enviando sticker');
                const stickerMedia = new WAWebJS.MessageMedia('image/webp', webpBuffer.toString('base64'));
                await client.sendMessage(message.from, stickerMedia, {
                    sendMediaAsSticker: true,
                    stickerName: 'Sticker Bot',
                    stickerAuthor: 'WhatsApp Sticker Bot'
                });
                console.log('Sticker enviado com sucesso');
            } catch (error) {
                try {
                    await Promise.all([
                        unlink(tempInputPath).catch(() => {}),
                        unlink(tempOutputPath).catch(() => {})
                    ]);
                } catch (cleanupError) {
                    console.warn('Não foi possível deletar os arquivos temporários:', cleanupError);
                }
                console.error('Erro detalhado ao processar GIF:', error);
                throw error;
            }
        }, 'Erro ao criar sticker GIF');
    }
}