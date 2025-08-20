import 'reflect-metadata';
import WAWebJS from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { diContainer } from './container/container';
import { TYPES } from './container/types';
import { MessageController } from './controllers/messageController';
import LoggerService from './services/loggerService';
import { ErrorMiddleware } from './middlewares/errorMiddleware';
import { isAppError } from './utils/errors';

const client = new WAWebJS.Client({
    authStrategy: new WAWebJS.LocalAuth({
        dataPath: (diContainer.get(TYPES.Config) as { storage: { persistentDir: string } }).storage.persistentDir
    }),
    webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/pedroslopez/whatsapp-web.js/main/webVersionCache.json'
   },
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (diContainer.get(TYPES.Config) as { chromePath: string }).chromePath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-default-apps'
        ],
        headless: true,
        timeout: 60000,
        ignoreDefaultArgs: false
    }
});

const config = diContainer.get(TYPES.Config);
const logger = diContainer.get<LoggerService>(TYPES.LoggerService);
const messageController = diContainer.get<MessageController>(TYPES.MessageController);

function initializeClient() {
    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        logger.info('WhatsApp Bot iniciado com sucesso', {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
        
        logger.info('bot_started', {
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        });
    });

    client.on('group_join', async (notification) => {
        try {
            logger.info('Bot adicionado a novo grupo', {
                chatId: notification.chatId,
                timestamp: new Date().toISOString()
            });
            
            const chat = await client.getChatById(notification.chatId);
            await chat.sendMessage('Olá, fui adicionado! Digite !ajuda para ver os comandos disponíveis.');
            
            logger.info('group_joined', {
                chatId: notification.chatId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Erro ao processar entrada em grupo', error, {
                chatId: notification.chatId
            });
        }
    });

    client.on('message', async (msg) => {
        const messageContext = {
            messageId: msg.id._serialized,
            from: msg.from,
            body: msg.body,
            type: msg.type,
            hasMedia: msg.hasMedia
        };
        
        logger.debug('Mensagem recebida', messageContext);
        
        if (msg.body === '!ajuda') {
            try {
                await msg.reply(`*Lista de Comandos*:
\`\`\`
-\`!imagem\` → Envie uma imagem seguido desse comando na legenda para transformar em figurinha.

-\`!gif\` → Envie um GIF e responda a mensagem com esse comando para transformar em figurinha gif.

-\`!texto <mensagem>\` → Faz uma figurinha a partir do texto fornecido.\`\`\``);
                
                logger.info('help_requested', messageContext);
            } catch (error) {
                logger.error('Erro ao enviar mensagem de ajuda', error, messageContext);
            }
            return;
        }

        try {
            await messageController.handleMessage(client, msg);
        } catch (error) {
            logger.error('Erro ao processar mensagem', error, messageContext);
            
            let userMessage = 'Ocorreu um erro ao processar sua mensagem. Tente novamente.';
            
            if (isAppError(error)) {
                switch (error.code) {
                    case 'VALIDATION_FAILED':
                        userMessage = 'Formato de mensagem inválido. Verifique os dados enviados.';
                        break;
                    case 'RATE_LIMIT_EXCEEDED':
                        userMessage = 'Muitas solicitações. Aguarde um momento antes de tentar novamente.';
                        break;
                    case 'UNSUPPORTED_FILE_TYPE':
                        userMessage = 'Tipo de arquivo não suportado. Envie uma imagem válida.';
                        break;
                    case 'FILE_TOO_LARGE':
                        userMessage = 'Arquivo muito grande. Envie uma imagem menor.';
                        break;
                    default:
                        userMessage = error.message || userMessage;
                }
            }
            
            try {
                await msg.reply(userMessage);
            } catch (replyError) {
                logger.error('Erro ao enviar mensagem de erro para usuário', replyError, messageContext);
            }
        }
    });

    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', error, {
            type: 'uncaughtException',
            timestamp: new Date().toISOString()
        });
        
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection', reason as Error, {
            type: 'unhandledRejection',
            promise: promise.toString(),
            timestamp: new Date().toISOString()
        });
    });
    
    process.on('SIGTERM', () => {
        logger.info('SIGTERM recebido, iniciando shutdown graceful');
        client.destroy();
        process.exit(0);
    });
    
    process.on('SIGINT', () => {
        logger.info('SIGINT recebido, iniciando shutdown graceful');
        client.destroy();
        process.exit(0);
    });
    
    logger.info('Inicializando cliente WhatsApp', {
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
    
    client.initialize();
}

initializeClient();