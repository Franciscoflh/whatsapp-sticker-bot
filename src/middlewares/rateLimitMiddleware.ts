import { MessageContext, MessageMiddleware } from './types';

export class RateLimitMiddleware implements MessageMiddleware {
    private requestMap: Map<string, number[]> = new Map();
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(windowMs: number = 60000, maxRequests: number = 10) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    async checkRateLimit(context: MessageContext): Promise<void> {
        const now = Date.now();
        const userId = context.message.from;
        
        await this.handle(context, async () => {});
    }

    async handle(context: MessageContext, next: () => Promise<void>): Promise<void> {
        const now = Date.now();
        const userId = context.message.from;

        if (!this.requestMap.has(userId)) {
            this.requestMap.set(userId, []);
        }

        const userTimestamps = this.requestMap.get(userId)!;
        const windowStart = now - this.windowMs;
        
        while (userTimestamps.length > 0 && userTimestamps[0] < windowStart) {
            userTimestamps.shift();
        }

        if (userTimestamps.length >= this.maxRequests) {
            const oldestTimestamp = userTimestamps[0];
            const resetTime = oldestTimestamp + this.windowMs - now;
            const error = new Error(`Rate limit exceeded. Try again in ${Math.ceil(resetTime / 1000)} seconds.`);
            error.name = 'RateLimitError';
            throw error;
        }

        userTimestamps.push(now);
        this.requestMap.set(userId, userTimestamps);

        await next();
    }
}