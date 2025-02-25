const { MessageMedia } = require('whatsapp-web.js');
const sharp = require('sharp');

async function processSticker(client, msg) {
    msg.reply('Processando sua figurinha... Aguarde.');

    try {
        const media = await msg.downloadMedia();

        if (!media.mimetype.startsWith('image')) {
            return msg.reply('Por favor, envie uma imagem válida.');
        }

        if (media.filesize > 2 * 1024 * 1024) {
            return msg.reply('A imagem é muito grande! Envie uma com menos de 2MB.');
        }

        const imageBuffer = Buffer.from(media.data, 'base64');

        const stickerBuffer = await sharp(imageBuffer)
            .resize(512, 512)
            .webp({ lossless: true })
            .toBuffer();

        const stickerBase64 = stickerBuffer.toString('base64');
        const stickerMedia = new MessageMedia('image/webp', stickerBase64);

        await client.sendMessage(msg.from, stickerMedia, { sendMediaAsSticker: true });

        msg.reply('Figurinha enviada com sucesso!');

    } catch (error) {
        console.error('Erro ao processar a figurinha:', error);
        msg.reply('Ocorreu um erro ao gerar sua figurinha. Tente novamente!');
    }
}

module.exports = { processSticker };