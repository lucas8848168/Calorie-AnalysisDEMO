/**
 * IndexedDB 历史记录服务
 * 使用 IndexedDB 存储历史记录，支持存储大量图片数据
 */

import { AnalysisResult, HistoryStorage } from '../types';

const DB_NAME = 'FoodAnalyzerHistory';
const DB_VERSION = 1;
const STORE_NAME = 'historyRecords';
const MAX_RECORDS = 50; // IndexedDB 可以存储更多记录
const MAX_AGE_DAYS = 30;

let db: IDBDatabase | null = null;

/**
 * 初始化 IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
        store.createIndex('id', 'id', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: true });
      }
    };
  });
}

class HistoryStorageDBService implements HistoryStorage {
  /**
   * 保存分析记录到 IndexedDB
   */
  async saveRecord(record: AnalysisResult): Promise<void> {
    try {
      // 验证记录完整性
      if (!record || !record.id || !record.timestamp) {
        console.error('无效的记录：缺少必需字段', record);
        throw new Error('INVALID_RECORD');
      }

      // 验证食物数据
      if (!record.foods || !Array.isArray(record.foods) || record.foods.length === 0) {
        console.error('无效的记录：没有食物数据', record);
        throw new Error('INVALID_RECORD');
      }

      // 生成缩略图（如果还没有）
      if (record.imageUrl && !record.thumbnailUrl) {
        try {
          const { generateThumbnail } = await import('../utils/imageProcessor');
          record.thumbnailUrl = await generateThumbnail(record.imageUrl, 150);
          console.log('✅ 缩略图已生成');
        } catch (error) {
          console.warn('生成缩略图失败，使用原图:', error);
          record.thumbnailUrl = record.imageUrl;
        }
      }

      const database = await initDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // 保存记录（包含压缩后的图片和缩略图）
      store.put(record);
      
      await new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(undefined);
        transaction.onerror = () => reject(transaction.error);
      });
      
      console.log('✅ 记录已保存到 IndexedDB（含压缩图片和缩略图）', { id: record.id, foods: record.foods.length });
      
      // 清理旧记录
      await this.cleanupOldRecords();
    } catch (error) {
      console.error('保存记录失败:', error);
      throw new Error('STORAGE_ERROR');
    }
  }

  /**
   * 获取所有记录（按时间倒序）
   */
  async getRecords(): Promise<AnalysisResult[]> {
    try {
      const database = await initDB();
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      
      const request = index.openCursor(null, 'prev'); // 倒序
      const records: AnalysisResult[] = [];
      
      await new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            records.push(cursor.value);
            cursor.continue();
          } else {
            resolve(undefined);
          }
        };
        request.onerror = () => reject(request.error);
      });
      
      return records;
    } catch (error) {
      console.error('获取记录失败:', error);
      return [];
    }
  }

  /**
   * 删除指定记录
   */
  async deleteRecord(timestamp: number): Promise<void> {
    try {
      const database = await initDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      store.delete(timestamp);
      
      await new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(undefined);
        transaction.onerror = () => reject(transaction.error);
      });
      
      console.log('✅ 记录已删除', timestamp);
    } catch (error) {
      console.error('删除记录失败:', error);
      throw new Error('STORAGE_ERROR');
    }
  }

  /**
   * 清空所有记录
   */
  async clearAll(): Promise<void> {
    try {
      const database = await initDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      store.clear();
      
      await new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(undefined);
        transaction.onerror = () => reject(transaction.error);
      });
      
      console.log('✅ 所有记录已清空');
    } catch (error) {
      console.error('清空记录失败:', error);
      throw new Error('STORAGE_ERROR');
    }
  }

  /**
   * 清理超过限制数量和过期的记录
   */
  private async cleanupOldRecords(): Promise<void> {
    try {
      const records = await this.getRecords();
      
      // 删除超过数量限制的记录
      if (records.length > MAX_RECORDS) {
        const toDelete = records.slice(MAX_RECORDS);
        for (const record of toDelete) {
          await this.deleteRecord(record.timestamp);
        }
        console.log(`🧹 已删除 ${toDelete.length} 条超出限制的记录`);
      }
      
      // 删除过期记录
      const now = Date.now();
      const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      const expiredRecords = records.filter(r => now - r.timestamp > maxAge);
      
      for (const record of expiredRecords) {
        await this.deleteRecord(record.timestamp);
      }
      
      if (expiredRecords.length > 0) {
        console.log(`🧹 已删除 ${expiredRecords.length} 条过期记录`);
      }
    } catch (error) {
      console.warn('清理旧记录失败:', error);
    }
  }

  /**
   * 检查 IndexedDB 是否可用
   */
  isAvailable(): boolean {
    return 'indexedDB' in window;
  }

  /**
   * 获取存储使用情况
   */
  async getStorageInfo(): Promise<{ used: number; total: number; count: number }> {
    try {
      const records = await this.getRecords();
      const count = records.length;
      
      // 估算使用空间（每条记录约 300KB）
      const used = count * 300 * 1024;
      
      // IndexedDB 通常有几百 MB 到几 GB 的空间
      const total = 500 * 1024 * 1024; // 估算 500MB
      
      return { used, total, count };
    } catch (error) {
      return { used: 0, total: 0, count: 0 };
    }
  }
}

// 导出单例
export const historyStorageDB = new HistoryStorageDBService();
