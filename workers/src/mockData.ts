/**
 * Mock 数据 - 用于 API 限制时的测试
 */

export const mockFoodResponses = [
  {
    foods: [
      {
        name: '披萨',
        portion: '1片（约150克）',
        ingredients: '面粉、番茄酱、奶酪、意大利香肠',
        calories: 285,
        nutrition: {
          protein: 12.5,
          fat: 10.8,
          carbs: 35.2,
          fiber: 2.1
        }
      }
    ],
    totalCalories: 285,
    confidence: 'high',
    notes: '披萨热量较高，建议搭配蔬菜沙拉食用。'
  },
  {
    foods: [
      {
        name: '汉堡',
        portion: '1个（约200克）',
        ingredients: '面包、牛肉饼、生菜、番茄、奶酪',
        calories: 540,
        nutrition: {
          protein: 25.3,
          fat: 28.5,
          carbs: 45.8,
          fiber: 3.2
        }
      }
    ],
    totalCalories: 540,
    confidence: 'high',
    notes: '汉堡热量较高，建议减少油炸食品摄入。'
  },
  {
    foods: [
      {
        name: '沙拉',
        portion: '1份（约250克）',
        ingredients: '生菜、番茄、黄瓜、鸡胸肉、橄榄油',
        calories: 180,
        nutrition: {
          protein: 18.5,
          fat: 8.2,
          carbs: 12.5,
          fiber: 4.8
        }
      }
    ],
    totalCalories: 180,
    confidence: 'high',
    notes: '沙拉营养均衡，是健康的选择。'
  }
];

export function getRandomMockResponse() {
  const random = mockFoodResponses[Math.floor(Math.random() * mockFoodResponses.length)];
  return {
    success: true,
    data: random
  };
}
