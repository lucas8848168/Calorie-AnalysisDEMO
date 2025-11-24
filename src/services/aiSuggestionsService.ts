import { AnalysisResult, NutritionInfo } from '../types';
import { getMealsByDateRange } from './mealService';

/**
 * AI建议服务 - 基于历史数据提供饮食建议
 */

export interface DietarySuggestion {
  type: 'warning' | 'tip' | 'recommendation' | 'achievement';
  title: string;
  message: string;
  icon: string;
  priority: number; // 1-5, 5最高
}

/**
 * 分析营养均衡度
 */
function analyzeNutritionBalance(nutrition: NutritionInfo): {
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // 理想比例：蛋白质 15-30%, 脂肪 20-35%, 碳水 45-65%
  const totalMacros = nutrition.protein * 4 + nutrition.fat * 9 + nutrition.carbs * 4;
  
  if (totalMacros === 0) {
    return { score: 0, issues: ['营养数据不足'] };
  }

  const proteinPercent = (nutrition.protein * 4 / totalMacros) * 100;
  const fatPercent = (nutrition.fat * 9 / totalMacros) * 100;
  const carbsPercent = (nutrition.carbs * 4 / totalMacros) * 100;

  // 检查蛋白质
  if (proteinPercent < 15) {
    issues.push('蛋白质摄入偏低');
    score -= 15;
  } else if (proteinPercent > 30) {
    issues.push('蛋白质摄入偏高');
    score -= 10;
  }

  // 检查脂肪
  if (fatPercent < 20) {
    issues.push('脂肪摄入偏低');
    score -= 10;
  } else if (fatPercent > 35) {
    issues.push('脂肪摄入偏高');
    score -= 15;
  }

  // 检查碳水
  if (carbsPercent < 45) {
    issues.push('碳水化合物摄入偏低');
    score -= 10;
  } else if (carbsPercent > 65) {
    issues.push('碳水化合物摄入偏高');
    score -= 15;
  }

  // 检查膳食纤维
  if (nutrition.fiber < 25) {
    issues.push('膳食纤维不足');
    score -= 10;
  }

  return { score: Math.max(0, score), issues };
}

/**
 * 分析最近7天的饮食数据
 */
async function analyzeRecentDiet(): Promise<{
  avgCalories: number;
  avgNutrition: NutritionInfo;
  mealCount: number;
  daysWithData: number;
}> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const meals = await getMealsByDateRange(startDate, endDate);

  if (meals.length === 0) {
    return {
      avgCalories: 0,
      avgNutrition: { protein: 0, fat: 0, carbs: 0, fiber: 0 },
      mealCount: 0,
      daysWithData: 0,
    };
  }

  // 计算总营养
  const totalNutrition = meals.reduce(
    (total, meal) => ({
      protein: total.protein + meal.totalNutrition.protein,
      fat: total.fat + meal.totalNutrition.fat,
      carbs: total.carbs + meal.totalNutrition.carbs,
      fiber: total.fiber + meal.totalNutrition.fiber,
    }),
    { protein: 0, fat: 0, carbs: 0, fiber: 0 }
  );

  // 计算总卡路里
  const totalCalories = meals.reduce((sum, meal) => {
    return sum + meal.foods.reduce((mealSum, food) => mealSum + food.calories, 0);
  }, 0);

  // 计算有数据的天数
  const uniqueDays = new Set(
    meals.map((meal) => new Date(meal.mealTime).toDateString())
  );
  const daysWithData = uniqueDays.size;

  return {
    avgCalories: totalCalories / daysWithData,
    avgNutrition: {
      protein: totalNutrition.protein / daysWithData,
      fat: totalNutrition.fat / daysWithData,
      carbs: totalNutrition.carbs / daysWithData,
      fiber: totalNutrition.fiber / daysWithData,
    },
    mealCount: meals.length,
    daysWithData,
  };
}

/**
 * 生成基于历史数据的建议
 */
export async function generateHistoricalSuggestions(): Promise<DietarySuggestion[]> {
  const suggestions: DietarySuggestion[] = [];

  try {
    const recentData = await analyzeRecentDiet();

    if (recentData.daysWithData === 0) {
      suggestions.push({
        type: 'tip',
        title: '开始记录',
        message: '开始记录您的饮食，我们将为您提供个性化的营养建议！',
        icon: '📝',
        priority: 3,
      });
      return suggestions;
    }

    // 分析营养均衡
    const balance = analyzeNutritionBalance(recentData.avgNutrition);

    if (balance.score < 70) {
      suggestions.push({
        type: 'warning',
        title: '营养不均衡',
        message: `您的营养均衡度为 ${balance.score}/100。${balance.issues.join('，')}。建议调整饮食结构。`,
        icon: '⚠️',
        priority: 5,
      });
    } else if (balance.score >= 90) {
      suggestions.push({
        type: 'achievement',
        title: '营养均衡',
        message: `太棒了！您的营养均衡度达到 ${balance.score}/100，继续保持！`,
        icon: '🎉',
        priority: 2,
      });
    }

    // 卡路里分析
    const dailyGoal = 2000; // 可以从用户设置中获取
    if (recentData.avgCalories < dailyGoal * 0.8) {
      suggestions.push({
        type: 'warning',
        title: '卡路里摄入不足',
        message: `您最近7天平均每日摄入 ${Math.round(recentData.avgCalories)} 千卡，低于推荐值。建议适当增加摄入。`,
        icon: '📉',
        priority: 4,
      });
    } else if (recentData.avgCalories > dailyGoal * 1.2) {
      suggestions.push({
        type: 'warning',
        title: '卡路里摄入过高',
        message: `您最近7天平均每日摄入 ${Math.round(recentData.avgCalories)} 千卡，高于推荐值。建议适当控制摄入。`,
        icon: '📈',
        priority: 4,
      });
    }

    // 膳食纤维建议
    if (recentData.avgNutrition.fiber < 25) {
      suggestions.push({
        type: 'recommendation',
        title: '增加膳食纤维',
        message: '建议多吃全谷物、蔬菜和水果，以增加膳食纤维摄入。',
        icon: '🥗',
        priority: 3,
      });
    }

    // 记录频率建议
    if (recentData.daysWithData < 5) {
      suggestions.push({
        type: 'tip',
        title: '坚持记录',
        message: `您最近7天只记录了 ${recentData.daysWithData} 天。坚持每天记录，可以获得更准确的分析！`,
        icon: '📅',
        priority: 2,
      });
    }

  } catch (error) {
    console.error('生成历史建议失败:', error);
  }

  return suggestions.sort((a, b) => b.priority - a.priority);
}

/**
 * 生成基于当前分析结果的即时建议
 */
export function generateInstantSuggestions(result: AnalysisResult): DietarySuggestion[] {
  const suggestions: DietarySuggestion[] = [];

  // 分析当前餐次的营养
  const totalNutrition = result.foods.reduce(
    (total, food) => ({
      protein: total.protein + food.nutrition.protein,
      fat: total.fat + food.nutrition.fat,
      carbs: total.carbs + food.nutrition.carbs,
      fiber: total.fiber + food.nutrition.fiber,
    }),
    { protein: 0, fat: 0, carbs: 0, fiber: 0 }
  );

  const balance = analyzeNutritionBalance(totalNutrition);

  // 高卡路里警告
  if (result.totalCalories > 800) {
    suggestions.push({
      type: 'warning',
      title: '高卡路里餐次',
      message: '这是一顿高卡路里餐次。建议下一餐选择低卡食物，或增加运动量。',
      icon: '🔥',
      priority: 4,
    });
  }

  // 营养不均衡提示
  if (balance.score < 70 && balance.issues.length > 0) {
    suggestions.push({
      type: 'tip',
      title: '营养搭配建议',
      message: `本餐${balance.issues[0]}。建议搭配相应食物以达到营养均衡。`,
      icon: '💡',
      priority: 3,
    });
  }

  // 健康食物推荐
  const hasVegetables = result.foods.some((food) =>
    ['蔬菜', '青菜', '菠菜', '西兰花', '胡萝卜'].some((veg) => food.name.includes(veg))
  );

  if (!hasVegetables) {
    suggestions.push({
      type: 'recommendation',
      title: '增加蔬菜',
      message: '建议在餐中增加蔬菜，以获取更多维生素和膳食纤维。',
      icon: '🥬',
      priority: 2,
    });
  }

  return suggestions.sort((a, b) => b.priority - a.priority);
}

/**
 * 推荐健康食物
 */
export function recommendHealthyFoods(currentNutrition: NutritionInfo): string[] {
  const recommendations: string[] = [];

  // 基于当前营养状况推荐食物
  const balance = analyzeNutritionBalance(currentNutrition);

  balance.issues.forEach((issue) => {
    if (issue.includes('蛋白质') && issue.includes('偏低')) {
      recommendations.push('鸡胸肉', '鱼肉', '豆腐', '鸡蛋');
    }
    if (issue.includes('脂肪') && issue.includes('偏低')) {
      recommendations.push('坚果', '牛油果', '橄榄油');
    }
    if (issue.includes('碳水') && issue.includes('偏低')) {
      recommendations.push('糙米', '燕麦', '全麦面包', '红薯');
    }
    if (issue.includes('膳食纤维')) {
      recommendations.push('西兰花', '菠菜', '苹果', '香蕉', '燕麦');
    }
  });

  // 去重
  return Array.from(new Set(recommendations));
}

/**
 * 生成综合建议（历史+即时）
 */
export async function generateComprehensiveSuggestions(
  currentResult?: AnalysisResult
): Promise<DietarySuggestion[]> {
  const historicalSuggestions = await generateHistoricalSuggestions();
  const instantSuggestions = currentResult
    ? generateInstantSuggestions(currentResult)
    : [];

  // 合并并去重
  const allSuggestions = [...historicalSuggestions, ...instantSuggestions];
  const uniqueSuggestions = allSuggestions.filter(
    (suggestion, index, self) =>
      index === self.findIndex((s) => s.title === suggestion.title)
  );

  return uniqueSuggestions.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
