import { config } from './environment';

export const puppeteerConfig = {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--single-process',
        '--disable-web-security'
    ],
    headless: 'new',
    timeout: 60000,
    userDataDir: `${config.storage.persistentDir}/sessions`
}; 