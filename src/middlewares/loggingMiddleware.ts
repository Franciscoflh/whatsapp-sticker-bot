import { MessageContext, MessageMiddleware } from './types';

export class LoggingMiddleware implements MessageMiddleware {
    async handle(context: MessageContext, next: () => Promise<void>): Promise<void> {
        const startTime = Date.now();
        
        console.log(`[${new Date().toISOString()}] Recebida mensagem de ${context.userId}`);
        if (context.command) {
            console.log(`Comando: ${context.command}`);
            if (context.args && context.args.length > 0) {
                console.log(`Argumentos: ${context.args.join(', ')}`);
            }
        }

        try {
            await next();
            
            const processingTime = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] Mensagem processada em ${processingTime}ms`);
        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(
                `[${new Date().toISOString()}] Erro ao processar mensagem (${processingTime}ms):`,
                error
            );
            throw error;
        }
    }
} 