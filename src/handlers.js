const { processSticker } = require('./services/imageStickerService');
const { createTextSticker } = require('./services/textStickerService');
const { createGifSticker } = require('./services/gifStickerService');

async function handleMessage(client, msg) {
    const isGroup = msg.from.endsWith('@g.us');

    if (msg.body.startsWith('!figurinha')) {
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();

            if (!media || !media.mimetype) {
                console.log('Erro: mídia não pôde ser processada.');
                return msg.reply('Erro ao processar a mídia. Tente novamente.');
            }

            console.log(`Processando mídia do tipo: ${media.mimetype}`);

            if (media.mimetype === 'image/gif' || media.mimetype === 'video/mp4') {
                return await createGifSticker(client, msg);
            }

            return await processSticker(client, msg);
        } else if (msg.body.startsWith('!figurinha ')) {
            const text = msg.body.replace('!figurinha ', '').trim();
            if (!text) return msg.reply('Envie um texto válido após o comando.');
            return await createTextSticker(client, msg, text);
        }
    }

    if (!isGroup && msg.hasMedia) {
        const media = await msg.downloadMedia();

        if (!media || !media.mimetype) {
            console.log('Erro: mídia não pôde ser processada.');
            return msg.reply('Erro ao processar a mídia. Tente novamente.');
        }

        console.log(`Processando mídia do tipo: ${media.mimetype}`);

        if (media.mimetype === 'image/gif' || media.mimetype === 'video/mp4') {
            return await createGifSticker(client, msg);
        }
    }

    if (isGroup && msg.body === '!gif') {
        const quotedMsg = await msg.getQuotedMessage(); 

        if (quotedMsg && quotedMsg.hasMedia) {
            const media = await quotedMsg.downloadMedia();

            if (!media || !media.mimetype) {
                console.log('Erro: mídia não pôde ser processada.');
                return msg.reply('Erro ao processar a mídia. Tente novamente.');
            }

            console.log(`Processando mídia do tipo: ${media.mimetype}`);

            if (media.mimetype === 'image/gif' || media.mimetype === 'video/mp4') {
                return await createGifSticker(client, quotedMsg);
            }
        } else {
            return msg.reply('Responda a um GIF com o comando !gif para transformá-lo em figurinha.');
        }
    }
}

module.exports = { handleMessage };