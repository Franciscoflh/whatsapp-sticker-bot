const { MessageMedia } = require('whatsapp-web.js');
const sharp = require('sharp');

async function createTextSticker(client, msg, text) {
    msg.reply('Criando figurinha com texto... Aguarde.');

    try {
        const textBuffer = await generateTextSticker(text);
        const stickerBase64 = textBuffer.toString('base64');
        const stickerMedia = new MessageMedia('image/webp', stickerBase64);

        await client.sendMessage(msg.from, stickerMedia, { sendMediaAsSticker: true });

        msg.reply('Figurinha com texto enviada!');

    } catch (error) {
        console.error('Erro ao criar figurinha com texto:', error);
        msg.reply('Ocorreu um erro ao gerar a figurinha com texto.');
    }
}

async function generateTextSticker(text) {
    const svgText = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50%" y="50%" font-size="50" text-anchor="middle" alignment-baseline="middle" fill="black">${text}</text>
    </svg>`;

    return await sharp(Buffer.from(svgText))
        .webp()
        .toBuffer();
}

module.exports = { createTextSticker };