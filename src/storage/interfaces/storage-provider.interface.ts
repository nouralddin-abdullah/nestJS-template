import { Readable } from 'stream';

// since both clouds use S3 SDK we will define some shared / common interfaces
export interface UploadOptions {
  key: string;
  body: Buffer | Readable | string;
  contentType?: string;
  metadata?: Record<string, string>;
  // access control
  acl?: string;
}

// interfaces for options and results.
// most of those interfaces are used only whe clinet upload with signed url
// not backend handling upload

export interface UploadResult {
  key: string;
  url: string;
  etag?: string;
}

export interface GetObjectOptions {
  key: string;
}

export interface GetObjectResult {
  body: Readable;
  contentType?: string;
  contentLength?: number;
  metadata?: Record<string, string>;
}

export interface DeleteOptions {
  key: string;
}

export interface PresignedUrlOptions {
  key: string;
  // expiry time in seconds, default is 3600s.
  expiresIn?: number;
}

export interface PresignedUploadOptions extends PresignedUrlOptions {
  contentType?: string;
}

export interface ListOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListResult {
  objects: {
    key: string;
    size: number;
    lastModified?: Date;
  }[];
  continuationToken?: string;
  isTruncated: boolean;
}

// getting/uploading/del

export interface IStorageProvider {
  // upload file to the storage
  upload(options: UploadOptions): Promise<UploadResult>;

  // get the file
  get(options: GetObjectOptions): Promise<GetObjectResult>;

  // delete the file
  delete(options: DeleteOptions): Promise<void>;

  // generate presigned url for downloading (INCASE PRIVATE)
  getPresignedUrl(options: PresignedUrlOptions): Promise<string>;

  // generate presigned url to upload
  getPresignedUploadUrl(options: PresignedUploadOptions): Promise<string>;

  // list objects in the storage
  list(options?: ListOptions): Promise<ListResult>;

  // check if the object exist
  exists(key: string): Promise<boolean>;

  // get the full public url of the objest
  getPublicUrl(key: string): string;
}
