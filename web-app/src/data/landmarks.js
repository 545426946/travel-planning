// 重点突出国内特色景点数据 - 聚焦中国各大城市特色景点
export const landmarks = [
  // 北京景点（6个）
  {
    id: 1,
    name: '故宫博物院',
    city: '北京',
    country: '中国',
    position: [116.397056, 39.917974],
    type: 'culture',
    description: '世界上现存规模最大、保存最为完整的木质结构古建筑群',
    address: '北京市东城区景山前街4号',
    icon: '🏯',
    tags: ['历史建筑', '文化遗产', '皇家宫殿']
  },
  {
    id: 2,
    name: '长城',
    city: '北京',
    country: '中国',
    position: [116.570374, 40.431907],
    type: 'culture',
    description: '中国古代的军事防御工程，世界文化遗产',
    address: '北京市延庆区八达岭长城',
    icon: '🏔️',
    tags: ['世界奇迹', '防御工程', '历史遗迹']
  },
  {
    id: 3,
    name: '天安门广场',
    city: '北京',
    country: '中国',
    position: [116.397947, 39.908527],
    type: 'culture',
    description: '中国国家象征，世界上最大的城市广场',
    address: '北京市东城区天安门广场',
    icon: '🇨🇳',
    tags: ['国家象征', '城市地标', '政治中心']
  },
  {
    id: 4,
    name: '颐和园',
    city: '北京',
    country: '中国',
    position: [116.275155, 39.999691],
    type: 'culture',
    description: '中国现存最完整的皇家园林，世界文化遗产',
    address: '北京市海淀区新建宫门路19号',
    icon: '🏞️',
    tags: ['皇家园林', '古典园林', '文化遗产']
  },
  {
    id: 5,
    name: '天坛',
    city: '北京',
    country: '中国',
    position: [116.4109, 39.8822],
    type: 'culture',
    description: '明清两代皇帝祭天祈谷的场所，世界文化遗产',
    address: '北京市东城区天坛路甲1号',
    icon: '⛩️',
    tags: ['祭天建筑', '历史遗迹', '世界文化遗产']
  },
  {
    id: 6,
    name: '圆明园',
    city: '北京',
    country: '中国',
    position: [116.2981, 40.0098],
    type: 'culture',
    description: '皇家园林，被誉为"万园之园"，历史遗迹',
    address: '北京市海淀区清华西路28号',
    icon: '🏛️',
    tags: ['皇家园林', '历史遗迹', '爱国主义教育基地']
  },

  // 上海景点（5个）
  {
    id: 7,
    name: '外滩',
    city: '上海',
    country: '中国',
    position: [121.490317, 31.222771],
    type: 'modern',
    description: '上海最具代表性的城市景观，万国建筑博览群',
    address: '上海市黄浦区中山东一路',
    icon: '🏙️',
    tags: ['现代建筑', '城市夜景', '黄浦江景']
  },
  {
    id: 8,
    name: '东方明珠',
    city: '上海',
    country: '中国',
    position: [121.4997, 31.2396],
    type: 'modern',
    description: '上海标志性建筑，塔高468米，观光旅游胜地',
    address: '上海市浦东新区世纪大道1号',
    icon: '🗼',
    tags: ['现代建筑', '城市地标', '观光塔']
  },
  {
    id: 9,
    name: '豫园',
    city: '上海',
    country: '中国',
    position: [121.4879, 31.2275],
    type: 'culture',
    description: '明代私人园林，江南古典园林的代表作',
    address: '上海市黄浦区安仁街132号',
    icon: '🏯',
    tags: ['古典园林', '江南园林', '历史建筑']
  },
  {
    id: 10,
    name: '南京路步行街',
    city: '上海',
    country: '中国',
    position: [121.4750, 31.2389],
    type: 'modern',
    description: '中国第一条商业步行街，百年商业街',
    address: '上海市黄浦区南京东路',
    icon: '🛍️',
    tags: ['商业街', '购物天堂', '城市地标']
  },
  {
    id: 11,
    name: '田子坊',
    city: '上海',
    country: '中国',
    position: [121.4692, 31.2111],
    type: 'modern',
    description: '上海最具特色的石库门建筑改造创意园区',
    address: '上海市黄浦区泰康路210弄',
    icon: '🎨',
    tags: ['创意园区', '石库门', '文艺街区']
  },

  // 西安景点（4个）
  {
    id: 12,
    name: '兵马俑',
    city: '西安',
    country: '中国',
    position: [109.2775, 34.3843],
    type: 'culture',
    description: '秦始皇陵的陪葬坑，世界第八大奇迹',
    address: '陕西省西安市临潼区',
    icon: '🗿',
    tags: ['秦文化', '考古发现', '世界奇迹']
  },
  {
    id: 13,
    name: '大雁塔',
    city: '西安',
    country: '中国',
    position: [108.9601, 34.2194],
    type: 'culture',
    description: '唐代佛教建筑，西安标志性建筑',
    address: '陕西省西安市雁塔区雁塔路',
    icon: '🏯',
    tags: ['佛教建筑', '唐代建筑', '历史遗迹']
  },
  {
    id: 14,
    name: '钟楼',
    city: '西安',
    country: '中国',
    position: [108.9465, 34.2613],
    type: 'culture',
    description: '西安市中心标志性建筑，明代建筑',
    address: '陕西省西安市莲湖区西大街',
    icon: '⏰',
    tags: ['明代建筑', '城市中心', '历史建筑']
  },
  {
    id: 15,
    name: '华清宫',
    city: '西安',
    country: '中国',
    position: [109.2135, 34.3615],
    type: 'culture',
    description: '唐代皇家离宫，以温泉闻名',
    address: '陕西省西安市临潼区华清路38号',
    icon: '🏛️',
    tags: ['皇家离宫', '温泉', '唐代建筑']
  },

  // 广州景点（3个）
  {
    id: 16,
    name: '广州塔',
    city: '广州',
    country: '中国',
    position: [113.3246, 23.1064],
    type: 'modern',
    description: '广州地标建筑，中国第一高塔',
    address: '广东省广州市海珠区阅江西路222号',
    icon: '🗼',
    tags: ['现代建筑', '城市地标', '观光塔']
  },
  {
    id: 17,
    name: '陈家祠',
    city: '广州',
    country: '中国',
    position: [113.2444, 23.1248],
    type: 'culture',
    description: '广东现存规模最大、保存最完整的祠堂建筑',
    address: '广东省广州市荔湾区中山七路恩龙里34号',
    icon: '🏯',
    tags: ['祠堂建筑', '岭南建筑', '文化遗产']
  },
  {
    id: 18,
    name: '沙面岛',
    city: '广州',
    country: '中国',
    position: [113.2406, 23.1075],
    type: 'modern',
    description: '广州最具欧陆风情的岛屿，历史建筑群',
    address: '广东省广州市荔湾区沙面南街',
    icon: '🏝️',
    tags: ['欧式建筑', '历史街区', '文化保护区']
  },

  // 杭州景点（3个）
  {
    id: 19,
    name: '西湖',
    city: '杭州',
    country: '中国',
    position: [120.1551, 30.2741],
    type: 'nature',
    description: '中国首批国家重点风景名胜区，世界文化遗产',
    address: '浙江省杭州市西湖区',
    icon: '🏞️',
    tags: ['自然景观', '湖泊', '世界文化遗产']
  },
  {
    id: 20,
    name: '灵隐寺',
    city: '杭州',
    country: '中国',
    position: [120.0974, 30.2368],
    type: 'religion',
    description: '杭州最早的名刹，江南著名古刹',
    address: '浙江省杭州市西湖区法云弄1号',
    icon: '⛩️',
    tags: ['佛教寺庙', '古刹', '宗教建筑']
  },
  {
    id: 21,
    name: '千岛湖',
    city: '杭州',
    country: '中国',
    position: [118.9696, 29.6044],
    type: 'nature',
    description: '人工湖，因湖内有1078个岛屿而得名',
    address: '浙江省杭州市淳安县',
    icon: '🏞️',
    tags: ['人工湖', '岛屿', '旅游胜地']
  },

  // 成都景点（3个）
  {
    id: 22,
    name: '宽窄巷子',
    city: '成都',
    country: '中国',
    position: [104.0605, 30.6633],
    type: 'culture',
    description: '成都三大历史文化保护区之一，清代古街道',
    address: '四川省成都市青羊区金河路口',
    icon: '🏮',
    tags: ['历史街区', '文化保护区', '清代建筑']
  },
  {
    id: 23,
    name: '锦里',
    city: '成都',
    country: '中国',
    position: [104.0553, 30.6480],
    type: 'culture',
    description: '成都武侯祠博物馆的一部分，三国文化主题街区',
    address: '四川省成都市武侯区武侯祠大街231号',
    icon: '🏮',
    tags: ['三国文化', '民俗街区', '旅游景点']
  },
  {
    id: 24,
    name: '大熊猫繁育研究基地',
    city: '成都',
    country: '中国',
    position: [104.1454, 30.7318],
    type: 'nature',
    description: '世界著名的大熊猫迁地保护基地',
    address: '四川省成都市成华区熊猫大道1375号',
    icon: '🐼',
    tags: ['大熊猫', '保护基地', '自然教育']
  }
];

// 按城市分组景点（仅中国城市）
export const landmarksByCity = {
  '北京': landmarks.filter(item => item.city === '北京'),
  '上海': landmarks.filter(item => item.city === '上海'),
  '西安': landmarks.filter(item => item.city === '西安'),
  '广州': landmarks.filter(item => item.city === '广州'),
  '杭州': landmarks.filter(item => item.city === '杭州'),
  '成都': landmarks.filter(item => item.city === '成都')
};

// 按类型分组景点
export const landmarksByType = {
  'culture': landmarks.filter(item => item.type === 'culture'),
  'modern': landmarks.filter(item => item.type === 'modern'),
  'architecture': landmarks.filter(item => item.type === 'architecture'),
  'nature': landmarks.filter(item => item.type === 'nature'),
  'religion': landmarks.filter(item => item.type === 'religion')
};

// 获取所有城市列表
export const getAllCities = () => {
  return [...new Set(landmarks.map(item => item.city))];
};

// 获取所有国家列表
export const getAllCountries = () => {
  return [...new Set(landmarks.map(item => item.country))];
};

// 根据ID获取景点
export const getLandmarkById = (id) => {
  return landmarks.find(item => item.id === id);
};

// 根据城市获取景点
export const getLandmarksByCity = (city) => {
  return landmarks.filter(item => item.city === city);
};

// 根据国家获取景点
export const getLandmarksByCountry = (country) => {
  return landmarks.filter(item => item.country === country);
};

// 搜索景点
export const searchLandmarks = (keyword) => {
  const lowerKeyword = keyword.toLowerCase();
  return landmarks.filter(item => 
    item.name.toLowerCase().includes(lowerKeyword) ||
    item.city.toLowerCase().includes(lowerKeyword) ||
    item.country.toLowerCase().includes(lowerKeyword) ||
    item.description.toLowerCase().includes(lowerKeyword) ||
    item.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
  );
};