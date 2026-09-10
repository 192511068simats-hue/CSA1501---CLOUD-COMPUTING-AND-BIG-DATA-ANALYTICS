/**
 * Storage Service — Mock cloud storage
 * Replace with Firebase Cloud Storage in production.
 */

export interface StorageService {
  uploadFile(file: File, path: string): Promise<string>;
  getDownloadUrl(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
}

class MockStorageService implements StorageService {
  async uploadFile(file: File, path: string): Promise<string> {
    // Simulate upload progress
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return `/mock/storage/${path}/${file.name}`;
  }

  async getDownloadUrl(path: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return `/mock/storage/${path}`;
  }

  async deleteFile(_path: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

export const storageService: StorageService = new MockStorageService();
