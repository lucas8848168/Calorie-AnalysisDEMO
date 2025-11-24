/**
 * 本地食物检测服务
 * 使用 MobileNet 进行轻量级食物识别，减少不必要的 API 调用
 */

let mobilenetModel: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

// 食物相关的关键词（扩展至 50+ 个）
const FOOD_KEYWORDS = [
  // 通用食物词
  'food', 'dish', 'meal', 'plate', 'bowl', 'cup', 'tray', 'platter',
  
  // 主食类
  'pizza', 'burger', 'sandwich', 'hotdog', 'taco', 'burrito', 'wrap',
  'bread', 'baguette', 'toast', 'bagel', 'croissant', 'muffin',
  'rice', 'noodle', 'pasta', 'spaghetti', 'ramen', 'dumpling',
  
  // 肉类
  'meat', 'steak', 'beef', 'pork', 'chicken', 'turkey', 'duck',
  'fish', 'salmon', 'tuna', 'shrimp', 'seafood', 'sushi',
  
  // 蔬菜水果
  'salad', 'vegetable', 'fruit', 'apple', 'banana', 'orange',
  'tomato', 'potato', 'carrot', 'broccoli', 'corn',
  
  // 汤类
  'soup', 'stew', 'broth', 'chowder',
  
  // 甜点
  'cake', 'cookie', 'pie', 'ice cream', 'dessert', 'chocolate',
  'pudding', 'donut', 'waffle', 'pancake',
  
  // 饮料
  'drink', 'beverage', 'coffee', 'tea', 'juice', 'smoothie', 'latte',
  
  // 餐次
  'breakfast', 'lunch', 'dinner', 'snack', 'brunch',
  
  // 场景
  'restaurant', 'dining', 'cuisine', 'cooking', 'kitchen', 'cafeteria'
];

// 检测阈值
const FOOD_CONFIDENCE_THRESHOLD = 0.25; // 食物置信度阈值（≥0.25 放行）
const NON_FOOD_CONFIDENCE_THRESHOLD = 0.6; // 非食物置信度阈值（≥0.6 警告）

/**
 * 懒加载 MobileNet 模型
 */
async function loadModel() {
  if (mobilenetModel) {
    return mobilenetModel;
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      console.log('🚀 开始加载 TensorFlow.js 和 MobileNet...');
      
      // 动态导入以实现代码分割
      const [tf, mobilenet] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/mobilenet')
      ]);

      console.log('📦 TensorFlow.js 导入成功');
      
      // 设置后端（优先使用 WebGL）
      await tf.ready();
      const backend = tf.getBackend();
      console.log(`🎮 TensorFlow.js 后端: ${backend}`);
      
      // 加载模型
      console.log('📥 开始下载 MobileNet 模型（约 16MB，首次需要 20-30 秒）...');
      console.log('💡 提示：模型会被浏览器永久缓存，只需下载一次');
      const startTime = Date.now();
      mobilenetModel = await mobilenet.load({
        version: 2,
        alpha: 1.0,
      });
      const loadTime = Date.now() - startTime;

      if (loadTime > 1000) {
        console.log(`✅ MobileNet 模型加载成功！耗时: ${(loadTime/1000).toFixed(1)} 秒`);
      } else {
        console.log(`✅ MobileNet 模型加载成功！耗时: ${loadTime} 毫秒（已缓存）`);
      }
      console.log('💾 模型已缓存到浏览器，下次访问将秒开');
      return mobilenetModel;
    } catch (error) {
      console.error('Failed to load MobileNet model:', error);
      throw error;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * 检测图片是否包含食物（优化版：Top3 分类 + 智能阈值）
 * @param imageDataUrl - Base64 图片数据
 * @returns Promise - 检测结果
 */
export async function detectFood(imageDataUrl: string): Promise<{
  isFood: boolean;
  confidence: number;
  shouldWarn: boolean;
  reason: string;
  predictions: Array<{ className: string; probability: number }>;
}> {
  try {
    console.log('🔄 加载 MobileNet 模型...');
    const model = await loadModel();
    console.log('✅ 模型已就绪');

    // 创建图片元素
    const img = new Image();
    img.src = imageDataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    console.log(`📸 图片已加载: ${img.width}x${img.height}`);

    // 进行预测（获取 Top3 结果）
    console.log('🤖 开始 AI 分类（Top3）...');
    const startTime = Date.now();
    const predictions = await model.classify(img, 3);
    const classifyTime = Date.now() - startTime;
    
    console.log(`⚡ 分类完成，耗时: ${classifyTime}ms`);

    // 分析 Top3 预测结果
    let maxFoodConfidence = 0;
    let maxNonFoodConfidence = 0;
    let foodMatches: string[] = [];
    let nonFoodMatches: string[] = [];

    for (const pred of predictions) {
      const className = pred.className.toLowerCase();
      const probability = pred.probability;

      // 检查是否匹配食物关键词
      const isFoodClass = FOOD_KEYWORDS.some(keyword => 
        className.includes(keyword)
      );

      if (isFoodClass) {
        maxFoodConfidence = Math.max(maxFoodConfidence, probability);
        foodMatches.push(`${pred.className} (${(probability * 100).toFixed(1)}%)`);
      } else {
        maxNonFoodConfidence = Math.max(maxNonFoodConfidence, probability);
        nonFoodMatches.push(`${pred.className} (${(probability * 100).toFixed(1)}%)`);
      }
    }

    // 智能判断逻辑
    let isFood = false;
    let shouldWarn = false;
    let reason = '';

    if (maxFoodConfidence >= FOOD_CONFIDENCE_THRESHOLD) {
      // 食物置信度 ≥ 0.25，放行
      isFood = true;
      reason = `检测到食物（置信度 ${(maxFoodConfidence * 100).toFixed(1)}%）`;
    } else if (maxNonFoodConfidence >= NON_FOOD_CONFIDENCE_THRESHOLD) {
      // 非食物置信度 ≥ 0.6，警告
      isFood = false;
      shouldWarn = true;
      reason = `检测到非食物内容（置信度 ${(maxNonFoodConfidence * 100).toFixed(1)}%）`;
    } else {
      // 置信度不足，无法判断，允许继续（交给豆包 API 判断）
      isFood = true;
      shouldWarn = false;
      reason = `置信度不足，将由云端 AI 进一步分析`;
    }

    // 输出详细的检测结果
    console.log('📊 本地检测结果:', {
      isFood,
      shouldWarn,
      reason,
      foodConfidence: `${(maxFoodConfidence * 100).toFixed(1)}%`,
      nonFoodConfidence: `${(maxNonFoodConfidence * 100).toFixed(1)}%`,
      top3: predictions.map((p: any) => 
        `${p.className} (${(p.probability * 100).toFixed(1)}%)`
      )
    });

    return {
      isFood,
      confidence: maxFoodConfidence,
      shouldWarn,
      reason,
      predictions: predictions.map((p: any) => ({
        className: p.className,
        probability: p.probability
      }))
    };
  } catch (error) {
    console.error('❌ 本地检测失败:', error);
    // 如果检测失败，允许继续（交给豆包 API 判断）
    return {
      isFood: true,
      confidence: 0,
      shouldWarn: false,
      reason: '本地检测失败，将由云端 AI 分析',
      predictions: []
    };
  }
}

/**
 * 预加载模型（可选，用于提前加载）
 */
export async function preloadModel(): Promise<void> {
  try {
    await loadModel();
  } catch (error) {
    console.warn('Failed to preload model:', error);
  }
}

/**
 * 卸载模型以释放内存
 */
export function unloadModel(): void {
  if (mobilenetModel) {
    mobilenetModel.dispose();
    mobilenetModel = null;
    loadPromise = null;
    isLoading = false;
  }
}
