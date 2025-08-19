import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

import LoggerService, { logger } from '../services/loggerService';
import { StickerService } from '../models/types';
import { StickerServiceImpl } from '../services/stickerService';
import { MonitoringService } from '../services/monitoringService';

import { InMemoryStatsRepository } from '../repositories/inMemoryStatsRepository';
import { StatsRepository } from '../repositories/types';

import { MessageController } from '../controllers/messageController';

import { ValidationMiddleware, validationMiddleware } from '../middlewares/validationMiddleware';
import { ErrorMiddleware, errorMiddleware } from '../middlewares/errorMiddleware';
import { RateLimitMiddleware } from '../middlewares/rateLimitMiddleware';

import { config } from '../config/environment';

class DIContainer {
  private container: Container;

  constructor() {
    this.container = new Container();
    this.bindDependencies();
  }

  private bindDependencies(): void {
    this.container.bind(TYPES.Config).toConstantValue(config);

    this.container.bind<LoggerService>(TYPES.LoggerService).toConstantValue(logger);
    this.container.bind<StickerService>(TYPES.StickerService).to(StickerServiceImpl).inSingletonScope();
    this.container.bind<MonitoringService>(TYPES.MonitoringService).to(MonitoringService).inSingletonScope();

    this.container.bind<StatsRepository>(TYPES.StatsRepository).to(InMemoryStatsRepository).inSingletonScope();

    this.container.bind<MessageController>(TYPES.MessageController).to(MessageController).inSingletonScope();

    this.container.bind<ValidationMiddleware>(TYPES.ValidationMiddleware).toConstantValue(validationMiddleware);
    this.container.bind<ErrorMiddleware>(TYPES.ErrorMiddleware).toConstantValue(errorMiddleware);
    this.container.bind<RateLimitMiddleware>(TYPES.RateLimitMiddleware).to(RateLimitMiddleware).inSingletonScope();
  }

  public get<T>(serviceIdentifier: symbol): T {
    return this.container.get<T>(serviceIdentifier);
  }

  public getContainer(): Container {
    return this.container;
  }

  public rebind<T>(serviceIdentifier: symbol, implementation: any): void {
    this.container.rebind<T>(serviceIdentifier).to(implementation);
  }

  public bindConditional<T>(serviceIdentifier: symbol, implementation: any, condition: boolean): void {
    if (condition) {
      this.container.bind<T>(serviceIdentifier).to(implementation);
    }
  }

  public isBound(serviceIdentifier: symbol): boolean {
    return this.container.isBound(serviceIdentifier);
  }

  public unbindAll(): void {
    this.container.unbindAll();
  }

  public snapshot(): void {
    this.container.snapshot();
  }

  public restore(): void {
    this.container.restore();
  }
}

export const diContainer = new DIContainer();
export { DIContainer };