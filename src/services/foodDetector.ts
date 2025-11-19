/**
 * 本地食物检测服务
 * 使用 MobileNet 进行轻量级食物识别，减少不必要的 API 调用
 */

let mobilenetModel: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

// 食物相关的关键词
const FOOD_KEYWORDS = [
  'food', 'dish', 'meal', 'plate', 'bowl', 'cup',
  'pizza', 'burger', 'sandwich', 'salad', 'soup',
  'bread', 'cake', 'cookie', 'fruit', 'vegetable',
  'meat', 'chicken', 'fish', 'rice', 'noodle',
  'breakfast', 'lunch', 'dinner', 'snack', 'dessert',
  'drink', 'beverage', 'coffee', 'tea', 'juice',
  'restaurant', 'dining', 'cuisine', 'cooking'
];

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
      // 动态导入以实现代码分割
      const [tf, mobilenet] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/mobilenet')
      ]);

      // 设置后端（优先使用 WebGL）
      await tf.ready();
      
      // 加载模型
      mobilenetModel = await mobilenet.load({
        version: 2,
        alpha: 1.0,
      });

      console.log('MobileNet model loaded successfully');
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
 * 检测图片是否包含食物
 * @param imageDataUrl - Base64 图片数据
 * @returns Promise<boolean> - 是否为食物
 */
export async function detectFood(imageDataUrl: string): Promise<{
  isFood: boolean;
  confidence: number;
  predictions: Array<{ className: string; probability: number }>;
}> {
  try {
    // 加载模型
    const model = await loadModel();

    // 创建图片元素
    const img = new Image();
    img.src = imageDataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // 进行预测（获取前5个结果）
    const predictions = await model.classify(img, 5);

    // 检查是否包含食物相关的分类
    let maxFoodConfidence = 0;
    let isFood = false;

    for (const pred of predictions) {
      const className = pred.className.toLowerCase();
      const probability = pred.probability;

      // 检查是否匹配食物关键词
      const isFoodClass = FOOD_KEYWORDS.some(keyword => 
        className.includes(keyword)
      );

      if (isFoodClass) {
        isFood = true;
        maxFoodConfidence = Math.max(maxFoodConfidence, probability);
      }
    }

    return {
      isFood,
      confidence: maxFoodConfidence,
      predictions: predictions.map((p: any) => ({
        className: p.className,
        probability: p.probability
      }))
    };
  } catch (error) {
    console.error('Food detection error:', error);
    // 如果检测失败，默认认为是食物（避免误拦截）
    return {
      isFood: true,
      confidence: 0,
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
