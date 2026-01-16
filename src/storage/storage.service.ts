import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage.constants';
import type {
  IStorageProvider,
  UploadOptions,
  UploadResult,
  GetObjectOptions,
  GetObjectResult,
  DeleteOptions,
  PresignedUrlOptions,
  PresignedUploadOptions,
  ListOptions,
  ListResult,
} from './interfaces/storage-provider.interface';

/**
 * StorageService acts as a facade for the underlying storage provider.
 * It delegates all operations to the configured provider (S3, R2, etc.)
 */
@Injectable()
export class StorageService implements IStorageProvider {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly provider: IStorageProvider,
  ) {}

  /**
   * Upload a file to storage
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    return this.provider.upload(options);
  }

  /**
   * Get a file from storage
   */
  async get(options: GetObjectOptions): Promise<GetObjectResult> {
    return this.provider.get(options);
  }

  /**
   * Delete a file from storage
   */
  async delete(options: DeleteOptions): Promise<void> {
    return this.provider.delete(options);
  }

  /**
   * Generate a presigned URL for downloading
   */
  async getPresignedUrl(options: PresignedUrlOptions): Promise<string> {
    return this.provider.getPresignedUrl(options);
  }

  /**
   * Generate a presigned URL for uploading directly to storage
   */
  async getPresignedUploadUrl(
    options: PresignedUploadOptions,
  ): Promise<string> {
    return this.provider.getPresignedUploadUrl(options);
  }

  /**
   * List objects in storage
   */
  async list(options?: ListOptions): Promise<ListResult> {
    return this.provider.list(options);
  }

  /**
   * Check if an object exists
   */
  async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  /**
   * Get the public URL for an object
   */
  getPublicUrl(key: string): string {
    return this.provider.getPublicUrl(key);
  }
}
