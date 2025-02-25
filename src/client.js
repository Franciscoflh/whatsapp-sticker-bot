const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./handlers');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    }
});

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
        if (msg.body === '!ajuda') {
            msg.reply(`
            *Lista de Comandos*:
        - \`!figurinha\` → Envie uma imagem seguido desse comando na legenda para transformar em figurinha.
        - \`!gif\` → Envie um GIF e responda a mensagem com esse comando para transformar em figurinha gif.
        - \`!figurinha <texto>\` → Faz uma figurinha a partir do texto fornecido
            `);
        }
    });

    client.on('message', (msg) => handleMessage(client, msg));

    client.initialize();
}

module.exports = { client, initializeClient };