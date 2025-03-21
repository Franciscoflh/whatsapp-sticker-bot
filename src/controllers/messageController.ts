import WAWebJS from 'whatsapp-web.js';
import PQueue from 'p-queue';
import { config } from '../config/environment';
import { StickerServiceImpl } from '../services/stickerService';
import { MonitoringService } from '../services/monitoringService';

const monitoringService = new MonitoringService();
const queue = new PQueue({ concurrency: 8 }); 
const stickerService = new StickerServiceImpl(monitoringService);

monitoringService.on('metricsUpdate', (metrics) => {
    console.log('\n=== Métricas de Uso ===');
    console.log(`Total de Stickers: ${metrics.totalStickers}`);
    console.log(`Stickers por Minuto: ${metrics.stickersPerMinute}`);
    console.log(`Processos Ativos: ${metrics.activeProcesses}`);
    console.log(`Tempo Médio de Processamento: ${metrics.averageProcessingTime.toFixed(2)}ms`);
    console.log(`Erros: ${metrics.errors}`);
    console.log('=====================\n');
});

export class MessageController {
    async handleMessage(client: WAWebJS.Client, message: WAWebJS.Message): Promise<void> {
        console.log('Processando mensagem:', message.body);
        const isGroup = message.from.endsWith('@g.us');
        console.log('É grupo?', isGroup);

        if (message.body.startsWith('!imagem')) {
            console.log('Comando !imagem detectado');
            if (!message.hasMedia) {
                console.log('Mensagem sem mídia');
                await message.reply('Envie uma imagem ou vídeo com o comando `!imagem` para transformá-lo em figurinha.');
                return;
            }

            console.log('Adicionando à fila de processamento');
            await queue.add(async () => {
                try {
                    console.log('Iniciando download da mídia');
                    const media = await message.downloadMedia();
                    console.log('Tipo de mídia:', media?.mimetype);
                    
                    if (media?.mimetype === 'image/gif' || media?.mimetype === 'video/mp4') {
                        console.log('Processando como GIF');
                        await stickerService.createGifSticker(client, message);
                    } else {
                        console.log('Processando como imagem normal');
                        await stickerService.createSticker(client, message);
                    }
                } catch (error) {
                    console.error('Erro ao processar sticker:', error);
                    await message.reply('Erro ao processar a mídia. Tente novamente.');
                }
            });
            return;
        }

        if (message.body.startsWith('!texto ')) {
            console.log('Comando !texto detectado');
            const text = message.body.replace('!texto ', '').trim();
            if (!text) {
                console.log('Texto vazio');
                await message.reply('Envie um texto válido após o comando.');
                return;
            }

            console.log('Texto a ser processado:', text);
            await queue.add(async () => {
                try {
                    console.log('Iniciando criação de sticker de texto');
                    await stickerService.createTextSticker(client, message, text);
                } catch (error) {
                    console.error('Erro ao criar sticker de texto:', error);
                    await message.reply('Erro ao criar o sticker. Tente novamente.');
                }
            });
            return;
        }

        if (!isGroup && message.hasMedia) {
            console.log('Mensagem com mídia em chat privado');
            await queue.add(async () => {
                try {
                    console.log('Iniciando download da mídia');
                    const media = await message.downloadMedia();
                    console.log('Tipo de mídia:', media?.mimetype);
                    
                    if (media?.mimetype === 'image/gif' || media?.mimetype === 'video/mp4') {
                        console.log('Processando como GIF');
                        await stickerService.createGifSticker(client, message);
                    } else {
                        console.log('Processando como imagem normal');
                        await stickerService.createSticker(client, message);
                    }
                } catch (error) {
                    console.error('Erro ao processar sticker:', error);
                    await message.reply('Erro ao processar a mídia. Tente novamente.');
                }
            });
            return;
        }

        if (isGroup && message.body === '!gif') {
            console.log('Comando !gif detectado em grupo');
            const quotedMsg = await message.getQuotedMessage();
            if (!quotedMsg?.hasMedia) {
                console.log('Mensagem citada sem mídia');
                await message.reply('Responda a um GIF com o comando `!gif` para transformá-lo em figurinha.');
                return;
            }

            console.log('Adicionando à fila de processamento');
            await queue.add(async () => {
                try {
                    console.log('Iniciando processamento de GIF');
                    await stickerService.createGifSticker(client, quotedMsg);
                } catch (error) {
                    console.error('Erro ao processar GIF:', error);
                    await message.reply('Erro ao processar o GIF. Tente novamente.');
                }
            });
        }
    }
} 