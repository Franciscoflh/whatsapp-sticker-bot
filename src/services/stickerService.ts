import WAWebJS from 'whatsapp-web.js';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { config } from '../config/environment';
import { StickerOptions, StickerService } from '../models/types';
import { MonitoringService } from './monitoringService';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export class StickerServiceImpl implements StickerService {
    private monitoringService: MonitoringService;

    constructor(monitoringService: MonitoringService) {
        this.monitoringService = monitoringService;
    }

    private async processWithMonitoring<T>(
        processFn: () => Promise<T>,
        errorMessage: string
    ): Promise<T> {
        const startTime = Date.now();
        this.monitoringService.startProcessing();

        try {
            console.log('Iniciando processamento monitorado');
            const result = await processFn();
            console.log('Processamento concluído com sucesso');
            this.monitoringService.endProcessing(Date.now() - startTime, true);
            return result;
        } catch (error) {
            console.error('Erro durante o processamento:', error);
            this.monitoringService.endProcessing(Date.now() - startTime, false);
            throw new Error(errorMessage);
        }
    }

    async createSticker(client: WAWebJS.Client, message: WAWebJS.Message, options: StickerOptions = {}): Promise<void> {
        return this.processWithMonitoring(async () => {
            console.log('Iniciando criação de sticker');
            const media = await message.downloadMedia();
            if (!media || !media.mimetype) {
                throw new Error('Mídia não pôde ser processada');
            }

            const quality = options.quality || config.stickerQuality;
            const size = options.size || config.stickerSize;

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
        return this.processWithMonitoring(async () => {
            console.log('Iniciando criação de sticker de texto');
            const size = options.size || config.stickerSize;
            const quality = options.quality || config.stickerQuality;

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
        return this.processWithMonitoring(async () => {
            console.log('Iniciando criação de sticker GIF');
            const media = await message.downloadMedia();
            if (!media || !media.mimetype) {
                throw new Error('Mídia não pôde ser processada');
            }

            console.log('Tipo de mídia recebida:', media.mimetype);
            const size = options.size || config.stickerSize;
            const quality = options.quality || config.stickerQuality;

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