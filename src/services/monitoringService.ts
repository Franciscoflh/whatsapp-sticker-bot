import { EventEmitter } from 'events';

interface MonitoringMetrics {
    totalStickers: number;
    stickersPerMinute: number;
    errors: number;
    averageProcessingTime: number;
    activeProcesses: number;
}

export class MonitoringService extends EventEmitter {
    private metrics: MonitoringMetrics = {
        totalStickers: 0,
        stickersPerMinute: 0,
        errors: 0,
        averageProcessingTime: 0,
        activeProcesses: 0
    };

    private processingTimes: number[] = [];
    private lastMinuteStickers: number = 0;
    private lastMinuteReset: number = Date.now();

    constructor() {
        super();
        setInterval(() => {
            this.metrics.stickersPerMinute = this.lastMinuteStickers;
            this.lastMinuteStickers = 0;
            this.lastMinuteReset = Date.now();
            this.emit('metricsUpdate', this.metrics);
        }, 60000);
    }

    startProcessing(): void {
        this.metrics.activeProcesses++;
        this.emit('metricsUpdate', this.metrics);
    }

    endProcessing(processingTime: number, success: boolean = true): void {
        this.metrics.activeProcesses--;
        this.metrics.totalStickers++;
        this.lastMinuteStickers++;
        
        this.processingTimes.push(processingTime);
        if (this.processingTimes.length > 100) {
            this.processingTimes.shift();
        }
        
        this.metrics.averageProcessingTime = 
            this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;

        if (!success) {
            this.metrics.errors++;
        }

        this.emit('metricsUpdate', this.metrics);
    }

    getMetrics(): MonitoringMetrics {
        return { ...this.metrics };
    }
} 