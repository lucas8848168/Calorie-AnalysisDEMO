import React, { useState, useEffect } from 'react';
import { AnalysisDisplayProps, MealType } from '../types';
import { formatCalories, formatNutrition } from '../utils/dataParser';
import { saveMeal } from '../services/mealService';
import EmptyState from './EmptyState';
import MealTypeSelector from './MealManager/MealTypeSelector';
import ShareButton from './ShareButton';
import AISuggestions from './AISuggestions';
import './AnalysisDisplay.css';

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({
  result,
  onNewAnalysis,
}) => {
  const [animatedCalories, setAnimatedCalories] = useState(0);
  const [showSaveMeal, setShowSaveMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(MealType.BREAKFAST);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 数字滚动动画
  useEffect(() => {
    if (result && result.totalCalories > 0) {
      let start = 0;
      const end = Math.round(result.totalCalories * 10) / 10; // 保留1位小数
      const duration = 1000;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setAnimatedCalories(end);
          clearInterval(timer);
        } else {
          setAnimatedCalories(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [result]);

  if (!result || result.foods.length === 0) {
    let emptyType: 'no-food' | 'unclear' | 'not-food' = 'no-food';
    
    if (result?.confidence === 'unclear') {
      emptyType = 'unclear';
    } else if (result?.confidence === 'not_food') {
      emptyType = 'not-food';
    }
    
    return <EmptyState type={emptyType} onAction={onNewAnalysis} />;
  }

  // 计算营养成分总和
  const totalNutrition = result.foods.reduce(
    (acc, food) => ({
      protein: acc.protein + food.nutrition.protein,
      fat: acc.fat + food.nutrition.fat,
      carbs: acc.carbs + food.nutrition.carbs,
      fiber: acc.fiber + food.nutrition.fiber,
    }),
    { protein: 0, fat: 0, carbs: 0, fiber: 0 }
  );

  // 计算每日推荐摄入百分比（假设 2000 kcal）
  const dailyGoal = 2000;
  const caloriePercentage = Math.min((result.totalCalories / dailyGoal) * 100, 100);

  // 处理保存到餐次
  const handleSaveToMeal = () => {
    setShowSaveMeal(true);
  };

  const handleConfirmSave = () => {
    setIsSaving(true);
    
    try {
      // 保存餐次记录
      saveMeal({
        userId: 'default',
        mealType: selectedMealType,
        mealTime: new Date(),
        foods: result.foods,
        totalNutrition: totalNutrition,
      });

      setSaveSuccess(true);
      
      // 2秒后关闭成功提示
      setTimeout(() => {
        setShowSaveMeal(false);
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      alert(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSave = () => {
    setShowSaveMeal(false);
    setSaveSuccess(false);
  };

  return (
    <div className="analysis-display-v2 animate-fadeIn">
      {/* 总卡路里卡片 */}
      <div className="calories-card-compact card">
        <div className="calories-main">
          <div className="calories-info">
            <h2 className="calories-title-compact">总卡路里</h2>
            <div className="calories-number-compact">
              {animatedCalories === Math.floor(animatedCalories) 
                ? animatedCalories 
                : animatedCalories.toFixed(1)}
              <span className="calories-unit-compact">kcal</span>
            </div>
          </div>
          <div className="calories-progress-compact">
            <div className="progress-compact">
              <div
                className="progress-bar-compact"
                style={{ width: `${caloriePercentage}%` }}
              ></div>
            </div>
            <div className="progress-text-compact">
              已摄入 {Math.round(caloriePercentage)}% / 每日推荐 {dailyGoal} kcal
            </div>
          </div>
        </div>
      </div>

      {/* 营养成分速览 */}
      <div className="nutrition-overview card">
        <h3 className="section-title">营养成分速览</h3>
        
        {/* 食物列表 */}
        <div className="foods-list-simple">
          {result.foods.map((food, index) => (
            <div key={index} className="food-item-simple">
              <span className="food-item-name">{food.name}</span>
              {food.portion && <span className="food-item-portion">{food.portion}</span>}
              <div className="food-item-calories">{formatCalories(food.calories)}</div>
            </div>
          ))}
        </div>

        <div className="nutrition-grid">
          <div className="nutrition-item">
            <div className="nutrition-icon">🥩</div>
            <div className="nutrition-info">
              <div className="nutrition-label">蛋白质</div>
              <div className="nutrition-value">{formatNutrition(totalNutrition.protein)}</div>
            </div>
            <div className="nutrition-bar">
              <div className="bar" style={{ width: `${Math.min((totalNutrition.protein / 50) * 100, 100)}%`, background: 'var(--gradient-success)' }}></div>
            </div>
          </div>

          <div className="nutrition-item">
            <div className="nutrition-icon">🥑</div>
            <div className="nutrition-info">
              <div className="nutrition-label">脂肪</div>
              <div className="nutrition-value">{formatNutrition(totalNutrition.fat)}</div>
            </div>
            <div className="nutrition-bar">
              <div className="bar" style={{ width: `${Math.min((totalNutrition.fat / 65) * 100, 100)}%`, background: 'var(--gradient-warning)' }}></div>
            </div>
          </div>

          <div className="nutrition-item">
            <div className="nutrition-icon">🍚</div>
            <div className="nutrition-info">
              <div className="nutrition-label">碳水</div>
              <div className="nutrition-value">{formatNutrition(totalNutrition.carbs)}</div>
            </div>
            <div className="nutrition-bar">
              <div className="bar" style={{ width: `${Math.min((totalNutrition.carbs / 275) * 100, 100)}%`, background: 'var(--gradient-info)' }}></div>
            </div>
          </div>

          <div className="nutrition-item">
            <div className="nutrition-icon">🌾</div>
            <div className="nutrition-info">
              <div className="nutrition-label">纤维</div>
              <div className="nutrition-value">{formatNutrition(totalNutrition.fiber)}</div>
            </div>
            <div className="nutrition-bar">
              <div className="bar" style={{ width: `${Math.min((totalNutrition.fiber / 25) * 100, 100)}%`, background: 'var(--gradient-primary)' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 健康建议 */}
      {result.notes && (
        <div className="health-advice card">
          <div className="advice-icon">💡</div>
          <div className="advice-content">
            <h4 className="advice-title">健康建议</h4>
            <p className="advice-text">{result.notes}</p>
          </div>
        </div>
      )}

      {/* 保存到餐次 */}
      {!showSaveMeal && !saveSuccess && (
        <div className="save-meal-section card">
          <h3 className="section-title">保存记录</h3>
          <p className="save-hint">将此次分析结果保存到餐次记录，方便追踪每日饮食</p>
          <button onClick={handleSaveToMeal} className="btn btn-success btn-lg">
            💾 保存到餐次
          </button>
        </div>
      )}

      {/* 餐次类型选择 */}
      {showSaveMeal && !saveSuccess && (
        <div className="meal-save-form card">
          <h3 className="section-title">选择餐次类型</h3>
          <MealTypeSelector
            selectedType={selectedMealType}
            onTypeChange={setSelectedMealType}
            showRecommendation={true}
          />
          <div className="save-actions">
            <button
              onClick={handleConfirmSave}
              className="btn btn-primary btn-lg"
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '✓ 确认保存'}
            </button>
            <button
              onClick={handleCancelSave}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 保存成功提示 */}
      {saveSuccess && (
        <div className="save-success card">
          <div className="success-icon">✓</div>
          <h3>保存成功！</h3>
          <p>餐次记录已保存，您可以在餐次管理中查看</p>
        </div>
      )}

      {/* AI 健康建议 */}
      <AISuggestions currentResult={result} showHealthyFoods={true} />

      {/* 操作按钮 */}
      <div className="actions-section">
        <button onClick={onNewAnalysis} className="btn btn-primary btn-lg">
          📸 上传新图片
        </button>
        <ShareButton result={result} />
      </div>

      {/* 免责声明 */}
      <div className="disclaimer">
        <p>* 营养数据基于标准份量估算，实际值可能因食材、烹饪方式等因素有所不同</p>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
