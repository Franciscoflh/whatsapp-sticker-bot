import dotenv from 'dotenv';

dotenv.config();

interface Config {
    stickerSize: number;
    stickerQuality: number;
    chromePath: string;
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    storage: {
        tempDir: string;
        persistentDir: string;
    };
    monitoring: {
        enabled: boolean;
        logLevel: 'debug' | 'info' | 'warn' | 'error';
    };
}

const developmentConfig: Config = {
    stickerSize: 512,
    stickerQuality: 80,
    chromePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    rateLimit: {
        windowMs: 60000,
        maxRequests: 10
    },
    storage: {
        tempDir: './temp',
        persistentDir: './data'
    },
    monitoring: {
        enabled: true,
        logLevel: 'debug'
    }
};

const productionConfig: Config = {
    stickerSize: 512,
    stickerQuality: 80,
    chromePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    rateLimit: {
        windowMs: 60000,
        maxRequests: 30
    },
    storage: {
        tempDir: '/tmp',
        persistentDir: process.env.STORAGE_PATH || '/app/data'
    },
    monitoring: {
        enabled: true,
        logLevel: 'info'
    }
};

export const config: Config = process.env.NODE_ENV === 'production' 
    ? productionConfig 
    : developmentConfig;