import { AnalysisResult, HistoryStorage } from '../types';
import { autoCleanup, hasEnoughSpace } from '../utils/storageOptimizer';

const STORAGE_KEY = 'food_analyzer_history';
const MAX_RECORDS = 20; // 存储压缩后的图片，增加到 20 条
const MAX_AGE_DAYS = 30;

class HistoryStorageService implements HistoryStorage {
  /**
   * 保存分析记录
   * 包含自动清理和空间检查
   * 注意：不存储图片以节省 LocalStorage 空间
   */
  saveRecord(record: AnalysisResult): void {
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

      const records = this.getRecords();
      
      // 添加新记录到开头（保留压缩后的图片）
      records.unshift(record);
      
      // 限制记录数量
      const limitedRecords = records.slice(0, MAX_RECORDS);
      
      // 清理过期记录
      const cleanedRecords = this.cleanOldRecords(limitedRecords);
      
      // 检查空间
      const dataSize = JSON.stringify(cleanedRecords).length;
      console.log(`💾 存储大小: ${(dataSize / 1024).toFixed(1)}KB, 记录数: ${cleanedRecords.length}`);
      
      if (!hasEnoughSpace(dataSize)) {
        // 尝试自动清理
        console.warn('⚠️ 存储空间不足，尝试自动清理...');
        autoCleanup();
        
        // 再次检查
        if (!hasEnoughSpace(dataSize)) {
          console.error('❌ 清理后仍然空间不足');
          throw new Error('STORAGE_FULL');
        }
      }
      
      // 保存到LocalStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedRecords));
      console.log('✅ 记录已保存到历史（含压缩图片）', { id: record.id, foods: record.foods.length });
    } catch (error) {
      console.error('保存记录失败:', error);
      
      if (this.isQuotaExceeded(error)) {
        throw new Error('STORAGE_FULL');
      }
      
      if (error instanceof Error && error.message === 'INVALID_RECORD') {
        throw error;
      }
      
      throw new Error('STORAGE_ERROR');
    }
  }

  /**
   * 获取所有记录
   */
  getRecords(): AnalysisResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }
      
      const records = JSON.parse(data) as AnalysisResult[];
      return this.cleanOldRecords(records);
    } catch (error) {
      // 如果解析失败，返回空数组
      return [];
    }
  }

  /**
   * 删除指定记录
   */
  deleteRecord(timestamp: number): void {
    try {
      const records = this.getRecords();
      const filteredRecords = records.filter(
        (record) => record.timestamp !== timestamp
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
    } catch (error) {
      throw new Error('STORAGE_ERROR');
    }
  }

  /**
   * 清空所有记录
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      throw new Error('STORAGE_ERROR');
    }
  }

  /**
   * 清理超过30天的记录
   */
  private cleanOldRecords(records: AnalysisResult[]): AnalysisResult[] {
    const now = Date.now();
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    
    return records.filter((record) => {
      return now - record.timestamp < maxAge;
    });
  }

  /**
   * 检查是否是存储配额超出错误
   */
  private isQuotaExceeded(error: any): boolean {
    return (
      error instanceof DOMException &&
      (error.code === 22 ||
        error.code === 1014 ||
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
  }

  /**
   * 检查LocalStorage是否可用
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取存储使用情况（估算）
   */
  getStorageInfo(): { used: number; total: number } {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const used = data ? data.length : 0;
      // LocalStorage通常限制为5-10MB，这里估算为5MB
      const total = 5 * 1024 * 1024;
      return { used, total };
    } catch (error) {
      return { used: 0, total: 0 };
    }
  }
}

// 导出单例
export const historyStorage = new HistoryStorageService();
