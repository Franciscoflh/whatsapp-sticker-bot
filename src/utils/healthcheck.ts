import { StatsRepository } from '../repositories/types';

export class HealthCheck {
    constructor(private statsRepository: StatsRepository) {}

    async getStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        uptime: number;
        stats: {
            total: number;
            success: number;
            failure: number;
            averageTime: number;
        };
        memory: {
            used: number;
            total: number;
            percentage: number;
        };
    }> {
        const stats = await this.statsRepository.getProcessingStats();
        const memoryUsage = process.memoryUsage();

        return {
            status: this.calculateStatus(stats),
            uptime: process.uptime(),
            stats: {
                total: stats.totalProcessed,
                success: stats.successCount,
                failure: stats.failureCount,
                averageTime: stats.averageProcessingTime
            },
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
            }
        };
    }

    private calculateStatus(stats: { successCount: number; failureCount: number }): 'healthy' | 'degraded' | 'unhealthy' {
        if (stats.failureCount === 0) return 'healthy';
        
        const failureRate = stats.failureCount / (stats.successCount + stats.failureCount);
        if (failureRate > 0.5) return 'unhealthy';
        if (failureRate > 0.2) return 'degraded';
        return 'healthy';
    }
}