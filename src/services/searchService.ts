import { AnalysisResult } from '../types';

/**
 * 搜索服务 - 提供食物搜索和模糊匹配功能
 */

/**
 * 计算两个字符串的相似度（使用Levenshtein距离）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // 完全匹配
  if (s1 === s2) return 1;
  
  // 包含匹配
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Levenshtein距离
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j] + 1      // 删除
        );
      }
    }
  }
  
  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - distance / maxLength;
}

/**
 * 搜索历史记录中的食物
 */
export function searchRecords(
  records: AnalysisResult[],
  query: string,
  threshold: number = 0.5
): AnalysisResult[] {
  if (!query || query.trim() === '') {
    return records;
  }
  
  const normalizedQuery = query.trim().toLowerCase();
  
  return records.filter((record) => {
    // 检查每个食物项
    return record.foods.some((food) => {
      const similarity = calculateSimilarity(food.name, normalizedQuery);
      return similarity >= threshold;
    });
  }).sort((a, b) => {
    // 按相关性排序（最相关的在前）
    const maxSimilarityA = Math.max(
      ...a.foods.map((food) => calculateSimilarity(food.name, normalizedQuery))
    );
    const maxSimilarityB = Math.max(
      ...b.foods.map((food) => calculateSimilarity(food.name, normalizedQuery))
    );
    
    return maxSimilarityB - maxSimilarityA;
  });
}

/**
 * 从历史记录中提取所有唯一的食物名称
 */
export function extractUniqueFoodNames(records: AnalysisResult[]): string[] {
  const foodNames = new Set<string>();
  
  records.forEach((record) => {
    record.foods.forEach((food) => {
      foodNames.add(food.name);
    });
  });
  
  return Array.from(foodNames).sort();
}

/**
 * 生成搜索建议（基于输入的前缀）
 */
export function generateSearchSuggestions(
  records: AnalysisResult[],
  query: string,
  maxSuggestions: number = 5
): string[] {
  if (!query || query.trim() === '') {
    return [];
  }
  
  const normalizedQuery = query.trim().toLowerCase();
  const allFoodNames = extractUniqueFoodNames(records);
  
  // 找到匹配的食物名称
  const suggestions = allFoodNames
    .filter((name) => {
      const similarity = calculateSimilarity(name, normalizedQuery);
      return similarity >= 0.3; // 较低的阈值用于建议
    })
    .sort((a, b) => {
      // 按相似度排序
      const simA = calculateSimilarity(a, normalizedQuery);
      const simB = calculateSimilarity(b, normalizedQuery);
      return simB - simA;
    })
    .slice(0, maxSuggestions);
  
  return suggestions;
}

/**
 * 高亮搜索关键词
 */
export function highlightSearchTerm(text: string, query: string): string {
  if (!query || query.trim() === '') {
    return text;
  }
  
  const normalizedQuery = query.trim();
  const regex = new RegExp(`(${normalizedQuery})`, 'gi');
  
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * 按食物名称分组历史记录
 */
export function groupRecordsByFood(records: AnalysisResult[]): Map<string, AnalysisResult[]> {
  const grouped = new Map<string, AnalysisResult[]>();
  
  records.forEach((record) => {
    record.foods.forEach((food) => {
      const existing = grouped.get(food.name) || [];
      existing.push(record);
      grouped.set(food.name, existing);
    });
  });
  
  return grouped;
}

/**
 * 获取最常见的食物（按出现频率）
 */
export function getMostCommonFoods(
  records: AnalysisResult[],
  limit: number = 10
): Array<{ name: string; count: number }> {
  const foodCounts = new Map<string, number>();
  
  records.forEach((record) => {
    record.foods.forEach((food) => {
      const count = foodCounts.get(food.name) || 0;
      foodCounts.set(food.name, count + 1);
    });
  });
  
  return Array.from(foodCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
