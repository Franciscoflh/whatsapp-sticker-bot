export const TYPES = {
  Config: Symbol.for('Config'),
  
  LoggerService: Symbol.for('LoggerService'),
  StickerService: Symbol.for('StickerService'),
  MonitoringService: Symbol.for('MonitoringService'),
  
  StatsRepository: Symbol.for('StatsRepository'),
  
  MessageController: Symbol.for('MessageController'),
  
  ValidationMiddleware: Symbol.for('ValidationMiddleware'),
  ErrorMiddleware: Symbol.for('ErrorMiddleware'),
  RateLimitMiddleware: Symbol.for('RateLimitMiddleware'),
  LoggingMiddleware: Symbol.for('LoggingMiddleware'),
  
  WhatsAppClient: Symbol.for('WhatsAppClient'),
  
  FileSystem: Symbol.for('FileSystem'),
  ImageProcessor: Symbol.for('ImageProcessor'),
  VideoProcessor: Symbol.for('VideoProcessor')
} as const;

export interface ContainerConfig {
  enableLogging?: boolean;
  enableMonitoring?: boolean;
  enableRateLimit?: boolean;
  testMode?: boolean;
}

export interface ServiceFactory<T> {
  create(): T;
}

export interface ServiceLifecycle {
  onInit?(): Promise<void>;
  onDestroy?(): Promise<void>;
}

export const injectable = (target: any) => {
  return target;
};

export const inject = (token: symbol) => {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
  };
};