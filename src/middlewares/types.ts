import { Message, MessageMedia, Client } from 'whatsapp-web.js';

export interface MessageContext {
    message: Message;
    client: Client;
    command?: string;
    args?: string[];
    userId?: string;
    timestamp?: Date;
    validatedMedia?: MessageMedia;
    metadata: {
        isGroup: boolean;
        timestamp: string;
        processingStartTime?: number;
        validationPassed?: boolean;
        rateLimitChecked?: boolean;
        [key: string]: any;
    };
}

export interface MessageMiddleware {
    handle(context: MessageContext, next: () => Promise<void>): Promise<void>;
}

export interface ErrorHandler {
    handleError(error: Error, context: MessageContext): Promise<void>;
}