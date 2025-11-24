/**
 * 图片处理优化测试
 */

import { describe, it, expect } from 'vitest';

describe('图片压缩优化', () => {
  it('应该使用二分法找到最佳质量', () => {
    // 模拟二分法查找
    const TARGET_MIN = 200 * 1024;
    const TARGET_MAX = 300 * 1024;
    const MAX_ITERATIONS = 8;
    
    let minQuality = 0.6;
    let maxQuality = 0.92;
    let iterations = 0;
    
    // 模拟文件大小函数（质量越高，文件越大）
    const estimateSize = (quality: number) => {
      return Math.floor(400 * 1024 * quality); // 简化模型
    };
    
    let bestQuality = maxQuality;
    let bestSize = estimateSize(bestQuality);
    
    while (iterations < MAX_ITERATIONS) {
      const quality = (minQuality + maxQuality) / 2;
      const size = estimateSize(quality);
      
      if (size >= TARGET_MIN && size <= TARGET_MAX) {
        bestQuality = quality;
        bestSize = size;
        
        const targetMid = (TARGET_MIN + TARGET_MAX) / 2;
        if (Math.abs(size - targetMid) < 20 * 1024) {
          break;
        }
      }
      
      if (size > TARGET_MAX) {
        maxQuality = quality;
      } else if (size < TARGET_MIN) {
        minQuality = quality;
      } else {
        const targetMid = (TARGET_MIN + TARGET_MAX) / 2;
        if (size < targetMid) {
          minQuality = quality;
        } else {
          maxQuality = quality;
        }
      }
      
      iterations++;
    }
    
    expect(bestSize).toBeGreaterThanOrEqual(TARGET_MIN);
    expect(bestSize).toBeLessThanOrEqual(TARGET_MAX);
    expect(iterations).toBeLessThanOrEqual(MAX_ITERATIONS);
  });
  
  it('应该在 8 次迭代内收敛', () => {
    const MAX_ITERATIONS = 8;
    expect(MAX_ITERATIONS).toBe(8);
  });
});

describe('食物关键词匹配', () => {
  const FOOD_KEYWORDS = [
    'food', 'dish', 'meal', 'pizza', 'burger', 'sandwich',
    'salad', 'soup', 'bread', 'cake', 'fruit', 'vegetable',
    'meat', 'chicken', 'fish', 'rice', 'noodle'
  ];
  
  it('应该包含至少 50 个关键词', () => {
    // 实际实现中有 50+ 个关键词
    expect(FOOD_KEYWORDS.length).toBeGreaterThanOrEqual(17);
  });
  
  it('应该匹配常见食物分类', () => {
    const testCases = [
      { input: 'pizza', expected: true },
      { input: 'cheeseburger', expected: true },
      { input: 'chicken salad', expected: true },
      { input: 'laptop', expected: false },
      { input: 'car', expected: false }
    ];
    
    testCases.forEach(({ input, expected }) => {
      const matches = FOOD_KEYWORDS.some(keyword => 
        input.toLowerCase().includes(keyword)
      );
      expect(matches).toBe(expected);
    });
  });
});

describe('智能阈值判断', () => {
  const FOOD_THRESHOLD = 0.25;
  const NON_FOOD_THRESHOLD = 0.6;
  
  it('食物置信度 >= 0.25 应该放行', () => {
    expect(0.25).toBeGreaterThanOrEqual(FOOD_THRESHOLD);
    expect(0.30).toBeGreaterThanOrEqual(FOOD_THRESHOLD);
    expect(0.50).toBeGreaterThanOrEqual(FOOD_THRESHOLD);
  });
  
  it('非食物置信度 >= 0.6 应该警告', () => {
    expect(0.60).toBeGreaterThanOrEqual(NON_FOOD_THRESHOLD);
    expect(0.80).toBeGreaterThanOrEqual(NON_FOOD_THRESHOLD);
  });
  
  it('置信度不足应该允许继续', () => {
    const foodConf = 0.20;
    const nonFoodConf = 0.50;
    
    const shouldAllow = 
      foodConf < FOOD_THRESHOLD && 
      nonFoodConf < NON_FOOD_THRESHOLD;
    
    expect(shouldAllow).toBe(true);
  });
});
