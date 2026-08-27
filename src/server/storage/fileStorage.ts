import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../config/env';

export class FileStorage {
  private static storageDir = path.join(process.cwd(), 'data');
  private static memoryFallback = new Map<string, any>();

  private static async ensureDir() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch {
      // Ignore if exists
    }
  }

  public static async getItem<T>(key: string): Promise<T | null> {
    try {
      await this.ensureDir();
      const filePath = path.join(this.storageDir, `${key}.json`);
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      return this.memoryFallback.get(key) || null;
    }
  }

  public static async setItem<T>(key: string, value: T): Promise<void> {
    this.memoryFallback.set(key, value);
    try {
      await this.ensureDir();
      const filePath = path.join(this.storageDir, `${key}.json`);
      await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
    } catch (err) {
      Logger.warn(`Local file storage write skipped for key ${key}: ${String(err)}`);
    }
  }

  public static async removeItem(key: string): Promise<void> {
    this.memoryFallback.delete(key);
    try {
      const filePath = path.join(this.storageDir, `${key}.json`);
      await fs.unlink(filePath);
    } catch {
      // Ignore
    }
  }
}
