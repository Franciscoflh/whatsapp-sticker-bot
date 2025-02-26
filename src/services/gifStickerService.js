const { MessageMedia } = require('whatsapp-web.js');
const { spawn } = require('child_process');
const { Readable } = require('stream');

async function createGifSticker(client, msg) {
    try {
        console.log('Baixando mídia...');
        const media = await msg.downloadMedia();

        if (!media || !media.mimetype) {
            console.log('Erro: Mídia inválida.');
            return msg.reply('Erro ao processar a figurinha. Tente reenviar o GIF/Vídeo.');
        }

        console.log(`Criando figurinha a partir de: ${media.mimetype}`);

        if (!(media.mimetype.startsWith('image/gif') || media.mimetype.startsWith('video/mp4'))) {
            return msg.reply('Envie um GIF ou um vídeo curto para transformar em figurinha.');
        }

        if (media.filesize > 5 * 1024 * 1024) {
            return msg.reply('O GIF/Vídeo é muito grande! Envie um com menos de 5MB.');
        }

        console.log('Convertendo para WebP animado...');

        const inputStream = Readable.from(Buffer.from(media.data, 'base64'));

        const ffmpeg = spawn('ffmpeg', [
            '-i', 'pipe:0',
            '-vf', 'scale=512:512:flags=lanczos',
            '-loop', '0',
            '-preset', 'default',
            '-an', '-vsync', '0',
            '-f', 'webp',
            'pipe:1'
        ]);

        let outputBuffer = Buffer.alloc(0);

        ffmpeg.stdout.on('data', (chunk) => {
            outputBuffer = Buffer.concat([outputBuffer, chunk]);
        });

        ffmpeg.stderr.on('data', (data) => {
            console.error(`FFmpeg erro: ${data.toString()}`);
        });

        ffmpeg.on('close', async (code) => {
            if (code !== 0) {
                console.error(`FFmpeg saiu com código ${code}`);
                return msg.reply('Ocorreu um erro ao criar sua figurinha animada.');
            }

            if (!outputBuffer.length) {
                console.error('Erro: Buffer de saída está vazio.');
                return msg.reply('Erro ao criar figurinha. Tente outro GIF/Vídeo.');
            }

            console.log('Conversão concluída.');

            try {
                const stickerMedia = new MessageMedia('image/webp', outputBuffer.toString('base64'), 'sticker.webp');
                await client.sendMessage(msg.from, stickerMedia, { sendMediaAsSticker: true });
                msg.reply('Figurinha enviada com sucesso!');
            } catch (sendError) {
                console.error('Erro ao enviar figurinha:', sendError);
                msg.reply('Erro ao enviar a figurinha. Tente novamente.');
            }
        });

        inputStream.pipe(ffmpeg.stdin);

    } catch (error) {
        console.error('Erro ao processar o GIF:', error);
        msg.reply('Ocorreu um erro ao criar sua figurinha animada.');
    }
}

module.exports = { createGifSticker };