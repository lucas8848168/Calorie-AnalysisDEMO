/**
 * MobileNet 分类名称翻译
 * 将英文分类名翻译成中文
 */

// 常见分类的中文翻译
const TRANSLATIONS: Record<string, string> = {
  // 风景和自然
  'lakeside': '湖边风景',
  'seashore': '海滨风景',
  'valley': '山谷',
  'cliff': '悬崖',
  'promontory': '海角',
  'sandbar': '沙洲',
  'beach': '海滩',
  'volcano': '火山',
  'alp': '高山',
  'mountain': '山',
  'geyser': '间歇泉',
  'coral reef': '珊瑚礁',
  
  // 建筑
  'palace': '宫殿',
  'monastery': '修道院',
  'church': '教堂',
  'mosque': '清真寺',
  'castle': '城堡',
  'barn': '谷仓',
  'boathouse': '船库',
  'greenhouse': '温室',
  
  // 电子设备
  'laptop': '笔记本电脑',
  'notebook': '笔记本电脑',
  'desktop computer': '台式电脑',
  'monitor': '显示器',
  'screen': '屏幕',
  'keyboard': '键盘',
  'mouse': '鼠标',
  'remote control': '遥控器',
  'cellular telephone': '手机',
  'mobile phone': '手机',
  'iPod': '音乐播放器',
  'television': '电视',
  'projector': '投影仪',
  
  // 交通工具
  'car': '汽车',
  'sports car': '跑车',
  'convertible': '敞篷车',
  'racer': '赛车',
  'limousine': '豪华轿车',
  'minivan': '面包车',
  'taxi': '出租车',
  'police van': '警车',
  'ambulance': '救护车',
  'fire engine': '消防车',
  'truck': '卡车',
  'pickup': '皮卡',
  'tow truck': '拖车',
  'trailer truck': '拖挂车',
  'moving van': '搬家车',
  'bus': '公交车',
  'trolleybus': '无轨电车',
  'minibus': '小巴',
  'bicycle': '自行车',
  'mountain bike': '山地车',
  'motorcycle': '摩托车',
  'moped': '轻便摩托',
  'scooter': '滑板车',
  'tricycle': '三轮车',
  'go-kart': '卡丁车',
  
  // 船只
  'speedboat': '快艇',
  'lifeboat': '救生艇',
  'canoe': '独木舟',
  'yawl': '帆船',
  'catamaran': '双体船',
  'trimaran': '三体船',
  'container ship': '集装箱船',
  'aircraft carrier': '航空母舰',
  'submarine': '潜艇',
  'wreck': '沉船',
  
  // 飞行器
  'airliner': '客机',
  'warplane': '战斗机',
  'airship': '飞艇',
  'balloon': '热气球',
  'space shuttle': '航天飞机',
  
  // 家具
  'table': '桌子',
  'desk': '书桌',
  'chair': '椅子',
  'bench': '长凳',
  'sofa': '沙发',
  'bed': '床',
  'wardrobe': '衣柜',
  'bookcase': '书柜',
  'cabinet': '柜子',
  'chest': '箱子',
  
  // 动物 - 通用
  'dog': '狗',
  'cat': '猫',
  'bird': '鸟',
  'tiger': '老虎',
  'lion': '狮子',
  'bear': '熊',
  'elephant': '大象',
  'monkey': '猴子',
  'horse': '马',
  'cow': '牛',
  'sheep': '羊',
  'pig': '猪',
  
  // 动物 - 狗的品种
  'lhasa': '拉萨犬',
  'lhasa apso': '拉萨犬',
  'golden retriever': '金毛犬',
  'labrador retriever': '拉布拉多犬',
  'german shepherd': '德国牧羊犬',
  'bulldog': '斗牛犬',
  'poodle': '贵宾犬',
  'chihuahua': '吉娃娃',
  'husky': '哈士奇',
  'corgi': '柯基犬',
  'pug': '巴哥犬',
  'beagle': '比格犬',
  'dachshund': '腊肠犬',
  'shih-tzu': '西施犬',
  'yorkshire terrier': '约克夏犬',
  'pomeranian': '博美犬',
  'samoyed': '萨摩耶犬',
  'border collie': '边境牧羊犬',
  
  // 动物 - 猫的品种
  'persian cat': '波斯猫',
  'siamese cat': '暹罗猫',
  'tabby': '虎斑猫',
  'egyptian cat': '埃及猫',
  'maine coon': '缅因猫',
  
  // 动物 - 其他
  'rabbit': '兔子',
  'hamster': '仓鼠',
  'guinea pig': '豚鼠',
  'parrot': '鹦鹉',
  'goldfish': '金鱼',
  'turtle': '乌龟',
  
  // 物品
  'book': '书',
  'bottle': '瓶子',
  'cup': '杯子',
  'glass': '玻璃杯',
  'vase': '花瓶',
  'pot': '锅',
  'pan': '平底锅',
  'wok': '炒锅',
  'spatula': '锅铲',
  'ladle': '勺子',
  'strainer': '滤网',
  'can opener': '开罐器',
  'corkscrew': '开瓶器',
  'cleaver': '菜刀',
  'knife': '刀',
  'scissors': '剪刀',
  
  // 衣物
  'suit': '西装',
  'jean': '牛仔裤',
  'shirt': '衬衫',
  'sweater': '毛衣',
  'jacket': '夹克',
  'coat': '外套',
  'dress': '连衣裙',
  'skirt': '裙子',
  'shoe': '鞋',
  'boot': '靴子',
  'sandal': '凉鞋',
  'hat': '帽子',
  'cap': '棒球帽',
  'tie': '领带',
  'bow tie': '领结',
  'scarf': '围巾',
  'glove': '手套',
  'sock': '袜子',
  
  // 运动器材
  'basketball': '篮球',
  'soccer ball': '足球',
  'volleyball': '排球',
  'tennis ball': '网球',
  'golf ball': '高尔夫球',
  'baseball': '棒球',
  'ping-pong ball': '乒乓球',
  'dumbbell': '哑铃',
  'barbell': '杠铃',
  
  // 乐器
  'piano': '钢琴',
  'guitar': '吉他',
  'violin': '小提琴',
  'drum': '鼓',
  'flute': '长笛',
  'saxophone': '萨克斯',
  
  // 其他
  'umbrella': '雨伞',
  'backpack': '背包',
  'handbag': '手提包',
  'wallet': '钱包',
  'sunglasses': '太阳镜',
  'watch': '手表',
  'clock': '时钟',
  'lamp': '台灯',
  'candle': '蜡烛',
  'pillow': '枕头',
  'blanket': '毯子',
  'towel': '毛巾',
  'soap': '肥皂',
  'toothbrush': '牙刷',
  'comb': '梳子',
  'mirror': '镜子',
  'toilet tissue': '卫生纸',
  'paper towel': '纸巾',
};

/**
 * 翻译分类名称
 * @param className - 英文分类名（可能包含逗号分隔的多个名称）
 * @returns 中文翻译，如果没有翻译则返回原文
 */
export function translateClassName(className: string): string {
  const lowerClassName = className.toLowerCase().trim();
  
  // 处理逗号分隔的多个分类名（如 "Lhasa, Lhasa Apso"）
  if (lowerClassName.includes(',')) {
    const parts = lowerClassName.split(',').map(p => p.trim());
    // 尝试翻译每个部分，返回第一个成功的翻译
    for (const part of parts) {
      const translated = translateSingleClassName(part);
      if (translated !== part) {
        return translated;
      }
    }
    // 如果都没有翻译，返回第一个部分
    return formatClassName(parts[0]);
  }
  
  return translateSingleClassName(lowerClassName);
}

/**
 * 翻译单个分类名称
 */
function translateSingleClassName(lowerClassName: string): string {
  // 精确匹配
  if (TRANSLATIONS[lowerClassName]) {
    return TRANSLATIONS[lowerClassName];
  }
  
  // 模糊匹配（包含关键词）
  for (const [key, value] of Object.entries(TRANSLATIONS)) {
    if (lowerClassName.includes(key) || key.includes(lowerClassName)) {
      return value;
    }
  }
  
  // 没有翻译，返回原文
  return lowerClassName;
}

/**
 * 格式化分类名称（首字母大写）
 */
export function formatClassName(className: string): string {
  return className
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * 获取友好的分类名称（中文优先）
 */
export function getFriendlyClassName(className: string): string {
  const translated = translateClassName(className);
  
  // 如果翻译成功（不等于原文），返回中文
  if (translated !== className) {
    return translated;
  }
  
  // 否则返回格式化的英文
  return formatClassName(className);
}
