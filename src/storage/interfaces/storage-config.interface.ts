import { StorageProviderType } from '../storage.constants';

export interface StorageConfig {
  provider: StorageProviderType;
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  // only optional if u have a custom domain for your bucket
  publicUrl?: string;
}

export interface StorageModuleOptions {
  isGlobal?: boolean;
}

export interface StorageModuleAsyncOptions {
  isGlobal?: boolean;
  imports?: any[];
  useFactory: (...args: any[]) => Promise<StorageConfig> | StorageConfig;
  inject?: any[];
}
