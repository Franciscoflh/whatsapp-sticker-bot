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
        '--disable-web-security',
        '--crash-dumps-dir=/tmp/chrome-crashes',
        '--disable-crash-reporter'
    ],
    headless: true,
    timeout: 60000,
    userDataDir: `${config.storage.persistentDir}/sessions`,
    ignoreDefaultArgs: ['--disable-extensions'],
    env: {
        CHROME_CRASHPAD_HANDLER_SKIP: 'true'
    }
};