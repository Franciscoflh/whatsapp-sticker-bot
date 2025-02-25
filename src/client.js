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

    client.on('message', (msg) => handleMessage(client, msg));

    client.initialize();
}

module.exports = { client, initializeClient };