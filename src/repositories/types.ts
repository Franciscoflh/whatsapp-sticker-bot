export interface UserStats {
    userId: string;
    stickersCreated: number;
    lastUsage: Date;
}

export interface UserRepository {
    incrementStickerCount(userId: string): Promise<void>;
    getUserStats(userId: string): Promise<UserStats>;
    updateLastUsage(userId: string): Promise<void>;
}

export interface ProcessingStats {
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    averageProcessingTime: number;
}

export interface StatsRepository {
    incrementProcessingCount(success: boolean, processingTime: number): Promise<void>;
    getProcessingStats(): Promise<ProcessingStats>;
    resetStats(): Promise<void>;
} 