FROM node:18-slim as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

RUN npm install -g typescript

COPY . .

RUN tsc || (cat tsconfig.json && exit 1)

FROM node:18-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ffmpeg \
    ca-certificates \
    fonts-liberation \
    libgbm1 \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    STORAGE_PATH=/app/data \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_CRASHPAD_HANDLER_SKIP=true

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data /app/temp /app/sessions /tmp/chrome-crashes && \
    chown -R node:node /app /tmp/chrome-crashes

VOLUME ["/app/data", "/app/sessions", "/tmp/chrome-crashes"]

USER node

CMD ["node", "--experimental-specifier-resolution=node", "dist/index.js"] 