import { DynamicModule, Module, Provider } from '@nestjs/common';
import { StorageService } from './storage.service';
import {
  STORAGE_CONFIG,
  STORAGE_PROVIDER,
  StorageProviderType,
} from './storage.constants';
import {
  StorageConfig,
  StorageModuleAsyncOptions,
} from './interfaces/storage-config.interface';
import { S3Provider } from './providers/s3.provider';
import { R2Provider } from './providers/r2.provider';
import { IStorageProvider } from './interfaces/storage-provider.interface';

// make isGlobal:true if u want it available in the app
@Module({})
export class StorageModule {
  // register the storage module
  static forRoot(
    config: StorageConfig & { isGlobal?: boolean },
  ): DynamicModule {
    const { isGlobal = false, ...storageConfig } = config;

    const configProvider: Provider = {
      provide: STORAGE_CONFIG,
      useValue: storageConfig,
    };

    const storageProvider: Provider = {
      provide: STORAGE_PROVIDER,
      useFactory: (cfg: StorageConfig): IStorageProvider => {
        return StorageModule.createProvider(cfg);
      },
      inject: [STORAGE_CONFIG],
    };

    return {
      module: StorageModule,
      global: isGlobal,
      providers: [configProvider, storageProvider, StorageService],
      exports: [StorageService, STORAGE_PROVIDER],
    };
  }

  // register with async
  static forRootAsync(options: StorageModuleAsyncOptions): DynamicModule {
    const configProvider: Provider = {
      provide: STORAGE_CONFIG,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    const storageProvider: Provider = {
      provide: STORAGE_PROVIDER,
      useFactory: (config: StorageConfig): IStorageProvider => {
        return StorageModule.createProvider(config);
      },
      inject: [STORAGE_CONFIG],
    };

    return {
      module: StorageModule,
      global: options.isGlobal ?? false,
      imports: options.imports || [],
      providers: [configProvider, storageProvider, StorageService],
      exports: [StorageService, STORAGE_PROVIDER],
    };
  }

  // create the provider based on configurations of .env
  private static createProvider(config: StorageConfig): IStorageProvider {
    switch (config.provider) {
      case StorageProviderType.S3:
        return new S3Provider(config);
      case StorageProviderType.R2:
        return new R2Provider(config);
      default:
        throw new Error(`Unknown storage provider: ${config.provider}`);
    }
  }
}
