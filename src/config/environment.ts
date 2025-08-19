import dotenv from 'dotenv';

dotenv.config();

interface Config {
    stickerSize: number;
    stickerQuality: number;
    chromePath: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
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
    logging: {
        maxFileSize: number;
        maxFiles: number;
        logDirectory: string;
    };
}

const developmentConfig: Config = {
    stickerSize: 512,
    stickerQuality: 80,
    chromePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'debug',
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
    },
    logging: {
        maxFileSize: 5242880, 
        maxFiles: 5,
        logDirectory: './logs'
    }
};

const productionConfig: Config = {
    stickerSize: 512,
    stickerQuality: 80,
    chromePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
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
    },
    logging: {
        maxFileSize: 10485760, 
        maxFiles: 10,
        logDirectory: process.env.LOG_DIRECTORY || '/app/logs'
    }
};

export const config: Config = process.env.NODE_ENV === 'production' 
    ? productionConfig 
    : developmentConfig;