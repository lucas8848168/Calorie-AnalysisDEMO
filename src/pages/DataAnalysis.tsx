import React, { useCallback, useMemo } from 'react';
import {
  CalorieTrendChart,
  NutritionRadarChart,
  MealDistributionChart,
  TimePeriodSelector,
} from '../components/Charts';
import { useChartData } from '../hooks';
import { MealType, MacroNutrition } from '../types';
import SkeletonLoader from '../components/SkeletonLoader';
import ExportButton from '../components/ExportButton';
import { exportMealsToCSV, exportNutritionReportPDF } from '../utils/dataExport';
import './DataAnalysis.css';

/**
 * 数据分析页面
 * 集成所有图表组件，提供完整的数据可视化和分析功能
 * 使用自定义hooks和性能优化
 */
const DataAnalysis: React.FC = () => {
  // 使用自定义hook管理图表数据
  const {
    timePeriod,
    chartData,
    summary,
    actualNutrition,
    allMeals,
    isLoading,
    changePeriod,
  } = useChartData('week');

  // 默认目标值（使用useMemo缓存）
  const defaultGoal = useMemo(
    () => ({
      dailyCalories: 2000,
      nutrition: {
        protein: 50,
        fat: 65,
        carbs: 275,
        fiber: 25,
      },
    }),
    []
  );

  // 处理餐次点击（使用useCallback优化）
  const handleMealTypeClick = useCallback((mealType: MealType) => {
    console.log('Clicked meal type:', mealType);
    // 可以在这里导航到餐次详情或筛选数据
  }, []);

  // 处理导出
  const handleExport = useCallback((format: 'csv' | 'json' | 'pdf') => {
    if (format === 'csv') {
      exportMealsToCSV(allMeals);
    } else if (format === 'pdf') {
      const periodMap = {
        day: '今日',
        week: '本周',
        month: '本月',
      };
      exportNutritionReportPDF({
        period: periodMap[timePeriod],
        totalMeals: summary.totalMeals,
        avgCalories: summary.avgCalories,
        totalCalories: summary.totalCalories,
        nutrition: actualNutrition,
      });
    }
  }, [allMeals, timePeriod, summary, actualNutrition]);

  return (
    <div className="data-analysis-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">📊 数据分析</h1>
          <p className="page-subtitle">深入了解您的饮食习惯和营养摄入</p>
        </div>
        {!isLoading && summary.totalMeals > 0 && (
          <ExportButton onExport={handleExport} />
        )}
      </div>

      {/* 时间维度选择器 */}
      <div className="time-selector-section">
        <TimePeriodSelector selectedPeriod={timePeriod} onPeriodChange={changePeriod} />
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="charts-skeleton">
            <SkeletonLoader type="chart" />
            <SkeletonLoader type="chart" />
            <SkeletonLoader type="chart" />
          </div>
        </div>
      ) : chartData.length === 0 || summary.totalMeals === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <h3>暂无数据</h3>
          <p>开始记录您的饮食，查看详细的数据分析</p>
        </div>
      ) : (
        <>
          {/* 数据摘要卡片 */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">🔥</div>
              <div className="card-content">
                <div className="card-label">平均每日卡路里</div>
                <div className="card-value">{summary.averageDailyCalories}</div>
                <div className="card-unit">kcal</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">🍽️</div>
              <div className="card-content">
                <div className="card-label">总餐次</div>
                <div className="card-value">{summary.totalMeals}</div>
                <div className="card-unit">次</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📅</div>
              <div className="card-content">
                <div className="card-label">记录天数</div>
                <div className="card-value">{summary.totalDays}</div>
                <div className="card-unit">天</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">💯</div>
              <div className="card-content">
                <div className="card-label">总卡路里</div>
                <div className="card-value">
                  {Math.round(summary.totalCalories / 1000)}k
                </div>
                <div className="card-unit">kcal</div>
              </div>
            </div>
          </div>

          {/* 图表区域 */}
          <div className="charts-grid">
            {/* 卡路里趋势图 */}
            <div className="chart-container full-width">
              <CalorieTrendChart
                data={chartData}
                goalLine={defaultGoal.dailyCalories}
                timePeriod={timePeriod}
              />
            </div>

            {/* 营养雷达图 */}
            <div className="chart-container">
              <NutritionRadarChart
                actual={actualNutrition}
                target={defaultGoal.nutrition}
              />
            </div>

            {/* 餐次分布图 */}
            <div className="chart-container">
              <MealDistributionChart meals={allMeals} onSegmentClick={handleMealTypeClick} />
            </div>
          </div>

          {/* 营养详情表格 */}
          <div className="nutrition-details-section">
            <h3 className="section-title">营养详情对比</h3>
            <div className="nutrition-table">
              <div className="table-header">
                <div className="table-cell">营养素</div>
                <div className="table-cell">实际摄入</div>
                <div className="table-cell">目标值</div>
                <div className="table-cell">达成率</div>
              </div>
              {[
                { key: 'protein', label: '蛋白质', icon: '🥩' },
                { key: 'fat', label: '脂肪', icon: '🥑' },
                { key: 'carbs', label: '碳水化合物', icon: '🍚' },
                { key: 'fiber', label: '膳食纤维', icon: '🌾' },
              ].map((item) => {
                const actual = actualNutrition[item.key as keyof MacroNutrition];
                const target = defaultGoal.nutrition[item.key as keyof MacroNutrition];
                const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;
                const status =
                  percentage >= 80 && percentage <= 120
                    ? 'good'
                    : percentage < 80
                    ? 'low'
                    : 'high';

                return (
                  <div key={item.key} className="table-row">
                    <div className="table-cell">
                      <span className="nutrient-icon">{item.icon}</span>
                      {item.label}
                    </div>
                    <div className="table-cell">
                      <strong>{actual.toFixed(1)}g</strong>
                    </div>
                    <div className="table-cell">{target}g</div>
                    <div className="table-cell">
                      <span className={`percentage-badge ${status}`}>{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DataAnalysis;
