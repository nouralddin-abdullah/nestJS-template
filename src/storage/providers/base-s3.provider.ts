import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import {
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
} from '../interfaces/storage-provider.interface';
import { StorageConfig } from '../interfaces/storage-config.interface';

// comptaible provider works with both s3 and r2
// contains all the shared logic which is
// upload and download and delete
// the another s3, r2 providers has the specific configuration for coorsponding storage
export abstract class BaseS3Provider implements IStorageProvider {
  protected client: S3Client;
  protected bucket: string;
  protected publicUrl?: string;

  constructor(protected readonly config: StorageConfig) {
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;
    this.client = this.createClient();
  }

  protected abstract createClient(): S3Client;

  async upload(options: UploadOptions): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType,
      Metadata: options.metadata,
      ACL: options.acl as any,
    });

    const result = await this.client.send(command);

    return {
      key: options.key,
      url: this.getPublicUrl(options.key),
      etag: result.ETag,
    };
  }

  async get(options: GetObjectOptions): Promise<GetObjectResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
    });

    const result = await this.client.send(command);

    return {
      body: result.Body as Readable,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
      metadata: result.Metadata,
    };
  }

  async delete(options: DeleteOptions): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
    });

    await this.client.send(command);
  }

  async getPresignedUrl(options: PresignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn ?? 3600,
    });
  }

  async getPresignedUploadUrl(
    options: PresignedUploadOptions,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
      ContentType: options.contentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn ?? 3600,
    });
  }

  async list(options?: ListOptions): Promise<ListResult> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: options?.prefix,
      MaxKeys: options?.maxKeys,
      ContinuationToken: options?.continuationToken,
    });

    const result = await this.client.send(command);

    return {
      objects: (result.Contents ?? []).map((obj) => ({
        key: obj.Key!,
        size: obj.Size!,
        lastModified: obj.LastModified,
      })),
      continuationToken: result.NextContinuationToken,
      isTruncated: result.IsTruncated ?? false,
    };
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  abstract getPublicUrl(key: string): string;
}
