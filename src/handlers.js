const PQueue = require('p-queue').default;
const { processSticker } = require('./services/imageStickerService');
const { createTextSticker } = require('./services/textStickerService');
const { createGifSticker } = require('./services/gifStickerService');

const queue = new PQueue({ concurrency: 1 });

async function handleMessage(client, msg) {
    const isGroup = msg.from.endsWith('@g.us');

    if (msg.body.startsWith('!imagem')) {
        if (!msg.hasMedia) {
            return msg.reply('Envie uma imagem ou vídeo com o comando `!imagem` para transformá-lo em figurinha.');
        }

        const media = await msg.downloadMedia();
        if (!media || !media.mimetype) {
            console.log('Erro: mídia não pôde ser processada.');
            return msg.reply('Erro ao processar a mídia. Tente novamente.');
        }

        console.log(`Processando Mídia - Tipo: ${media.mimetype}`);

        return queue.add(async () => { 
            if (media.mimetype === 'image/gif' || media.mimetype === 'video/mp4') {
                await createGifSticker(client, msg);
            } else {
                await processSticker(client, msg);
            }
        });
    }

    if (msg.body.startsWith('!texto ')) {
        const text = msg.body.replace('!texto ', '').trim();
        if (!text) return msg.reply('Envie um texto válido após o comando.');

        return queue.add(async () => { 
            await createTextSticker(client, msg, text);
        });
    }

    if (!isGroup && msg.hasMedia) {
        const media = await msg.downloadMedia();
        if (!media || !media.mimetype) {
            console.log('Erro: mídia não pôde ser processada.');
            return msg.reply('Erro ao processar a mídia. Tente novamente.');
        }

        console.log(`Processando Mídia - Tipo: ${media.mimetype}`);

        return queue.add(async () => { 
            if (media.mimetype === 'image/gif' || media.mimetype === 'video/mp4') {
                await createGifSticker(client, msg);
            } else {
                await processSticker(client, msg);
            }
        });
    }

    if (isGroup && msg.body === '!gif') {
        const quotedMsg = await msg.getQuotedMessage();

        if (quotedMsg && quotedMsg.hasMedia) {
            const media = await quotedMsg.downloadMedia();

            if (!media || !media.mimetype) {
                console.log('Erro: mídia não pôde ser processada.');
                return msg.reply('Erro ao processar a mídia. Tente novamente.');
            }

            console.log(`Processando Mídia - Tipo: ${media.mimetype}`);

            return queue.add(async () => { 
                if (media.mimetype === 'image/gif' || media.mimetype === 'video/mp4') {
                    await createGifSticker(client, quotedMsg);
                }
            });
        } else {
            return msg.reply('Responda a um GIF com o comando `!gif` para transformá-lo em figurinha.');
        }
    }
}

module.exports = { handleMessage };