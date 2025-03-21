import WAWebJS from 'whatsapp-web.js';

export interface StickerOptions {
    quality?: number;
    size?: number;
}

export interface MessageHandler {
    handle(client: WAWebJS.Client, message: WAWebJS.Message): Promise<void>;
}

export interface StickerService {
    createSticker(client: WAWebJS.Client, message: WAWebJS.Message, options?: StickerOptions): Promise<void>;
    createTextSticker(client: WAWebJS.Client, message: WAWebJS.Message, text: string, options?: StickerOptions): Promise<void>;
    createGifSticker(client: WAWebJS.Client, message: WAWebJS.Message, options?: StickerOptions): Promise<void>;
} 