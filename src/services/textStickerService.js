const { MessageMedia } = require('whatsapp-web.js');
const sharp = require('sharp');

async function createTextSticker(client, msg, text) {
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
    const MAX_WIDTH = 400;  
    const LINE_HEIGHT = 60; 
    const FONT_SIZE = 50; 
    const PADDING = 30; 

    function wrapText(text, maxCharsPerLine) {
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';

        for (let word of words) {
            if ((currentLine + word).length <= maxCharsPerLine) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        if (currentLine) lines.push(currentLine);

        return lines;
    }

    const maxCharsPerLine = Math.floor(MAX_WIDTH / (FONT_SIZE * 0.6));
    const lines = wrapText(text, maxCharsPerLine);

    let finalFontSize = FONT_SIZE;
    if (lines.length > 5) {
        finalFontSize = Math.max(30, FONT_SIZE - (lines.length * 2)); 
    }

    let svgText = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
    `;

    lines.forEach((line, index) => {
        const yPos = 200 + index * LINE_HEIGHT; 
        svgText += `<text x="50%" y="${yPos}" font-size="${finalFontSize}" text-anchor="middle" alignment-baseline="middle" fill="black">${line}</text>`;
    });

    svgText += `</svg>`;

    return await sharp(Buffer.from(svgText))
        .webp()
        .toBuffer();
}

module.exports = { createTextSticker };