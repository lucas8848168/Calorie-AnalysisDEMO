import React, { useState, useEffect } from 'react';
import { AnalysisResult } from '../types';
import {
  DietarySuggestion,
  generateComprehensiveSuggestions,
  recommendHealthyFoods,
} from '../services/aiSuggestionsService';
import './AISuggestions.css';

interface AISuggestionsProps {
  currentResult?: AnalysisResult;
  showHealthyFoods?: boolean;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({
  currentResult,
  showHealthyFoods = true,
}) => {
  const [suggestions, setSuggestions] = useState<DietarySuggestion[]>([]);
  const [healthyFoods, setHealthyFoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [currentResult]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const suggestions = await generateComprehensiveSuggestions(currentResult);
      setSuggestions(suggestions);

      if (showHealthyFoods && currentResult) {
        const totalNutrition = currentResult.foods.reduce(
          (total, food) => ({
            protein: total.protein + food.nutrition.protein,
            fat: total.fat + food.nutrition.fat,
            carbs: total.carbs + food.nutrition.carbs,
            fiber: total.fiber + food.nutrition.fiber,
          }),
          { protein: 0, fat: 0, carbs: 0, fiber: 0 }
        );
        const foods = recommendHealthyFoods(totalNutrition);
        setHealthyFoods(foods);
      }
    } catch (error) {
      console.error('加载建议失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-suggestions card">
        <div className="suggestions-header">
          <h3>🤖 AI 健康建议</h3>
        </div>
        <div className="suggestions-loading">
          <div className="loading-spinner"></div>
          <p>正在分析您的饮食数据...</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const displayedSuggestions = expanded ? suggestions : suggestions.slice(0, 3);

  return (
    <div className="ai-suggestions card">
      <div className="suggestions-header">
        <h3>🤖 AI 健康建议</h3>
        <button className="btn-refresh" onClick={loadSuggestions} title="刷新建议">
          🔄
        </button>
      </div>

      <div className="suggestions-list">
        {displayedSuggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`suggestion-item suggestion-${suggestion.type}`}
          >
            <div className="suggestion-icon">{suggestion.icon}</div>
            <div className="suggestion-content">
              <h4 className="suggestion-title">{suggestion.title}</h4>
              <p className="suggestion-message">{suggestion.message}</p>
            </div>
          </div>
        ))}
      </div>

      {suggestions.length > 3 && (
        <button
          className="btn-expand"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '收起' : `查看更多 (${suggestions.length - 3})`}
        </button>
      )}

      {showHealthyFoods && healthyFoods.length > 0 && (
        <div className="healthy-foods-section">
          <h4 className="healthy-foods-title">💚 推荐健康食物</h4>
          <div className="healthy-foods-list">
            {healthyFoods.map((food, index) => (
              <span key={index} className="healthy-food-tag">
                {food}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AISuggestions;
