const { processSticker } = require('./services/imageStickerService');
const { createTextSticker } = require('./services/textStickerService');
const { createGifSticker } = require('./services/gifStickerService');

async function handleMessage(client, msg) {
    if (msg.hasMedia && msg.body.toLowerCase().includes('!figurinha')) {
        const media = await msg.downloadMedia();

        if (!media || !media.mimetype) {
            console.log('Erro: mídia não pôde ser processada.');
            return msg.reply('Erro ao processar a mídia. Tente novamente.');
        }

        console.log(`📢 Processando mídia do tipo: ${media.mimetype}`);

        if (media.mimetype === 'image/gif' || media.mimetype === 'video/mp4') {
            return await createGifSticker(client, msg);
        }

        return await processSticker(client, msg);
    }

    if (msg.body.startsWith('!figurinha ')) {
        const text = msg.body.replace('!figurinha ', '').trim();
        if (!text) return msg.reply('Envie um texto válido após o comando.');
        return await createTextSticker(client, msg, text);
    }
}

module.exports = { handleMessage };