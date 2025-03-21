import { ProcessingStats, StatsRepository } from './types';

export class InMemoryStatsRepository implements StatsRepository {
    private totalProcessed: number = 0;
    private successCount: number = 0;
    private failureCount: number = 0;
    private totalProcessingTime: number = 0;

    async incrementProcessingCount(success: boolean, processingTime: number): Promise<void> {
        this.totalProcessed++;
        if (success) {
            this.successCount++;
        } else {
            this.failureCount++;
        }
        this.totalProcessingTime += processingTime;
    }

    async getProcessingStats(): Promise<ProcessingStats> {
        return {
            totalProcessed: this.totalProcessed,
            successCount: this.successCount,
            failureCount: this.failureCount,
            averageProcessingTime: this.totalProcessed > 0 
                ? this.totalProcessingTime / this.totalProcessed 
                : 0
        };
    }

    async resetStats(): Promise<void> {
        this.totalProcessed = 0;
        this.successCount = 0;
        this.failureCount = 0;
        this.totalProcessingTime = 0;
    }
} 