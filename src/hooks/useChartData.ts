import { useState, useEffect, useCallback } from 'react';
import { ChartDataPoint, MacroNutrition, MealType } from '../types';
import {
  getDayViewData,
  getWeekViewData,
  getMonthViewData,
  getDataSummary,
  calculateAverageNutrition,
} from '../services/chartDataService';
import { getMealsByDateRange } from '../services/mealService';

export type TimePeriod = 'day' | 'week' | 'month';

interface ChartDataSummary {
  totalDays: number;
  totalMeals: number;
  totalCalories: number;
  averageDailyCalories: number;
  averageNutrition: MacroNutrition;
  mealDistribution: Record<MealType, number>;
}

/**
 * 自定义Hook：管理图表数据
 * 提供图表数据的获取、聚合和计算功能
 */
export function useChartData(initialPeriod: TimePeriod = 'week') {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(initialPeriod);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载图表数据
  const loadData = useCallback(async () => {
    console.log('🔄 useChartData: 开始加载数据, 时间段:', timePeriod);
    setIsLoading(true);
    setError(null);

    try {
      let data: ChartDataPoint[];

      switch (timePeriod) {
        case 'day':
          console.log('📅 加载今日数据');
          data = await getDayViewData(new Date());
          break;
        case 'week':
          console.log('📅 加载本周数据');
          data = await getWeekViewData();
          break;
        case 'month':
          console.log('📅 加载本月数据');
          data = await getMonthViewData();
          break;
        default:
          data = await getWeekViewData();
      }

      console.log('✅ useChartData: 数据加载完成, 数据点数:', data.length);
      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载图表数据失败');
      console.error('❌ useChartData: 加载失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timePeriod]);

  // 数据摘要状态
  const [summary, setSummary] = useState<ChartDataSummary>({
    totalDays: 0,
    totalMeals: 0,
    totalCalories: 0,
    averageDailyCalories: 0,
    averageNutrition: { protein: 0, fat: 0, carbs: 0, fiber: 0 },
    mealDistribution: {
      [MealType.BREAKFAST]: 0,
      [MealType.LUNCH]: 0,
      [MealType.DINNER]: 0,
      [MealType.SNACK]: 0,
    },
  });

  // 计算数据摘要
  useEffect(() => {
    if (chartData.length === 0) {
      setSummary({
        totalDays: 0,
        totalMeals: 0,
        totalCalories: 0,
        averageDailyCalories: 0,
        averageNutrition: { protein: 0, fat: 0, carbs: 0, fiber: 0 },
        mealDistribution: {
          [MealType.BREAKFAST]: 0,
          [MealType.LUNCH]: 0,
          [MealType.DINNER]: 0,
          [MealType.SNACK]: 0,
        },
      });
      return;
    }

    const startDate = chartData[0].date;
    const endDate = chartData[chartData.length - 1].date;
    
    getDataSummary(startDate, endDate).then(setSummary);
  }, [chartData]);

  // 实际营养摄入状态
  const [actualNutrition, setActualNutrition] = useState<MacroNutrition>({
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
  });

  // 所有餐次状态
  const [allMeals, setAllMeals] = useState<any[]>([]);

  // 计算实际营养摄入和餐次
  useEffect(() => {
    if (chartData.length === 0) {
      setActualNutrition({ protein: 0, fat: 0, carbs: 0, fiber: 0 });
      setAllMeals([]);
      return;
    }

    const startDate = chartData[0].date;
    const endDate = chartData[chartData.length - 1].date;
    
    getMealsByDateRange(startDate, endDate).then((meals) => {
      setAllMeals(meals);
      setActualNutrition(calculateAverageNutrition(meals, chartData.length));
    });
  }, [chartData]);

  // 切换时间维度
  const changePeriod = useCallback((period: TimePeriod) => {
    setTimePeriod(period);
  }, []);

  // 刷新数据
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // 自动加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    timePeriod,
    chartData,
    summary,
    actualNutrition,
    allMeals,
    isLoading,
    error,
    changePeriod,
    refresh,
  };
}
