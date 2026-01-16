// tokens for dependency injection because interfaces disappear in JS
export const STORAGE_CONFIG = 'STORAGE_CONFIG';
export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

export enum StorageProviderType {
  S3 = 's3',
  R2 = 'r2',
}
