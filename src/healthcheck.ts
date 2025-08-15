import { HealthCheck } from './utils/healthcheck';
import { InMemoryStatsRepository } from './repositories/inMemoryStatsRepository';

async function check() {
    try {
        const healthCheck = new HealthCheck(new InMemoryStatsRepository());
        const status = await healthCheck.getStatus();

        if (status.status === 'unhealthy') {
            console.error('Health check failed:', status);
            process.exit(1);
        }

        console.log('Health check passed:', status);
        process.exit(0);
    } catch (error) {
        console.error('Health check error:', error);
        process.exit(1);
    }
}

check();