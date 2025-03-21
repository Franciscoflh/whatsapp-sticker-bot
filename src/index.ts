import WAWebJS from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { config } from './config/environment';
import { MessageController } from './controllers/messageController';

const client = new WAWebJS.Client({
    authStrategy: new WAWebJS.LocalAuth(),
    puppeteer: {
        executablePath: config.chromePath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--single-process'
        ],
        headless: true
    }
});

const messageController = new MessageController();

function initializeClient() {
    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('Bot iniciado');
    });

    client.on('group_join', async (notification) => {
        console.log(`Fui adicionado ao grupo: ${notification.chatId}`);
        const chat = await client.getChatById(notification.chatId);
        chat.sendMessage('Olá, fui adicionado! Digite !ajuda para ver os comandos disponíveis.');
    });

    client.on('message', async (msg) => {
        console.log('Mensagem recebida:', msg.body);
        
        if (msg.body === '!ajuda') {
            msg.reply(`*Lista de Comandos*:

            -\`!imagem\` → Envie uma imagem seguido desse comando na legenda para transformar em figurinha.

            -\`!gif\` → Envie um GIF e responda a mensagem com esse comando para transformar em figurinha gif.

            -\`!texto <mensagem>\` → Faz uma figurinha a partir do texto fornecido.`);
            return;
        }

        try {
            await messageController.handleMessage(client, msg);
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            msg.reply('Ocorreu um erro ao processar sua mensagem. Tente novamente.');
        }
    });

    client.initialize();
}

initializeClient(); 