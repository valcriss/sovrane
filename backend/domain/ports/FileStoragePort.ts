export interface FileUploadOptions {
  contentType?: string;
  public?: boolean;
}

/**
 * Abstracts file storage operations like upload and download.
 */
export interface FileStoragePort {
  /**
   * Upload a file to the specified path.
   *
   * @param file - File content as a Buffer.
   * @param path - Destination path/key in the storage.
   * @param options - Optional upload parameters.
   * @returns Public URL or internal path of the stored file.
   */
  upload(file: Buffer, path: string, options?: FileUploadOptions): Promise<string>;

  /**
   * Download a file from storage.
   *
   * @param path - Path/key to retrieve.
   * @returns File content as a Buffer.
   */
  download(path: string): Promise<Buffer>;

  /**
   * Delete a file from storage.
   *
   * @param path - Path/key of the file to remove.
   */
  delete(path: string): Promise<void>;

  /**
   * Get the public URL of a stored file.
   *
   * @param path - Path/key of the file.
   * @returns Publicly accessible URL.
   */
  getPublicUrl(path: string): Promise<string>;
}
