/**
 * IndexedDB 缓存服务
 * 用于缓存图片识别结果，减少重复 API 调用
 */

const DB_NAME = 'FoodAnalyzerCache';
const DB_VERSION = 1;
const STORE_NAME = 'analysisResults';
const CACHE_EXPIRY_DAYS = 7; // 缓存有效期 7 天

interface CachedResult {
  imageHash: string;
  result: any;
  timestamp: number;
}

let db: IDBDatabase | null = null;

/**
 * 初始化 IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'imageHash' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * 计算图片 Hash（使用简化的 SHA-256）
 */
async function computeImageHash(dataUrl: string): Promise<string> {
  // 提取 base64 数据部分
  const base64Data = dataUrl.split(',')[1];
  
  // 使用 Web Crypto API 计算 SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(base64Data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * 保存分析结果到缓存
 */
export async function saveCachedResult(imageDataUrl: string, result: any): Promise<void> {
  try {
    const database = await initDB();
    const imageHash = await computeImageHash(imageDataUrl);
    
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const cachedData: CachedResult = {
      imageHash,
      result,
      timestamp: Date.now()
    };
    
    store.put(cachedData);
    
    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    });
    
    console.log('💾 分析结果已缓存');
  } catch (error) {
    console.warn('缓存保存失败:', error);
  }
}

/**
 * 从缓存获取分析结果
 */
export async function getCachedResult(imageDataUrl: string): Promise<any | null> {
  try {
    const database = await initDB();
    const imageHash = await computeImageHash(imageDataUrl);
    
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(imageHash);
    
    const cachedData = await new Promise<CachedResult | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!cachedData) {
      console.log('📭 缓存未命中');
      return null;
    }
    
    // 检查缓存是否过期
    const age = Date.now() - cachedData.timestamp;
    const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    if (age > maxAge) {
      console.log('⏰ 缓存已过期');
      await deleteCachedResult(imageHash);
      return null;
    }
    
    console.log('✅ 缓存命中（节省 API 调用）');
    return cachedData.result;
  } catch (error) {
    console.warn('缓存读取失败:', error);
    return null;
  }
}

/**
 * 删除指定缓存
 */
async function deleteCachedResult(imageHash: string): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.delete(imageHash);
    
    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('缓存删除失败:', error);
  }
}

/**
 * 清理过期缓存
 */
export async function cleanExpiredCache(): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAge;
    
    const request = index.openCursor();
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const record = cursor.value as CachedResult;
        if (record.timestamp < cutoffTime) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
    
    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    });
    
    console.log('🧹 过期缓存已清理');
  } catch (error) {
    console.warn('缓存清理失败:', error);
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats(): Promise<{ count: number; totalSize: number }> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const countRequest = store.count();
    const count = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
    
    return { count, totalSize: 0 }; // totalSize 需要遍历所有记录计算
  } catch (error) {
    console.warn('获取缓存统计失败:', error);
    return { count: 0, totalSize: 0 };
  }
}
