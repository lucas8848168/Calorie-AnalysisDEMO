/**
 * 数据迁移工具
 * 将 LocalStorage 中的历史记录迁移到 IndexedDB
 */

import { historyStorageDB } from '../services/historyStorageDB';
import { AnalysisResult } from '../types';

const OLD_STORAGE_KEY = 'food_analyzer_history';

/**
 * 执行数据迁移
 */
export async function migrateToIndexedDB(): Promise<void> {
  try {
    // 检查是否已经迁移过
    const migrated = localStorage.getItem('storage_migrated');
    if (migrated === 'true') {
      console.log('✅ 数据已迁移，跳过');
      return;
    }

    // 从 LocalStorage 读取旧数据
    const oldData = localStorage.getItem(OLD_STORAGE_KEY);
    if (!oldData) {
      console.log('📭 没有旧数据需要迁移');
      localStorage.setItem('storage_migrated', 'true');
      return;
    }

    const oldRecords = JSON.parse(oldData) as AnalysisResult[];
    console.log(`🔄 开始迁移 ${oldRecords.length} 条记录到 IndexedDB...`);

    // 逐条保存到 IndexedDB
    let successCount = 0;
    for (const record of oldRecords) {
      try {
        await historyStorageDB.saveRecord(record);
        successCount++;
      } catch (error) {
        console.warn('迁移记录失败:', record.id, error);
      }
    }

    console.log(`✅ 成功迁移 ${successCount}/${oldRecords.length} 条记录`);

    // 清理旧数据
    localStorage.removeItem(OLD_STORAGE_KEY);
    localStorage.setItem('storage_migrated', 'true');

    console.log('🎉 数据迁移完成！');
  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
  }
}
