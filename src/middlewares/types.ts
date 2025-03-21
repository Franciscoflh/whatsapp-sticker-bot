import { Message } from 'whatsapp-web.js';

export interface MessageContext {
    message: Message;
    command?: string;
    args?: string[];
    userId: string;
    timestamp: Date;
}

export interface MessageMiddleware {
    handle(context: MessageContext, next: () => Promise<void>): Promise<void>;
}

export interface ErrorHandler {
    handleError(error: Error, context: MessageContext): Promise<void>;
} 