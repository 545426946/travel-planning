// 中国主要城市及其著名景点数据
// 每个城市标记一个代表性景点

export const cityAttractions = [
  {
    city: "北京",
    position: [39.916527, 116.397128],
    attraction: {
      name: "故宫",
      type: "历史文化",
      description: "世界最大的宫殿建筑群，明清两代的皇家宫殿",
      icon: "🏯",
      color: "#e74c3c",
      image: "https://images.unsplash.com/photo-1544918879-9c7e24f7d2c8?w=200"
    }
  },
  {
    city: "上海",
    position: [31.230416, 121.473701],
    attraction: {
      name: "外滩",
      type: "现代都市",
      description: "万国建筑博览群，黄浦江畔的都市地标",
      icon: "🏙️",
      color: "#3498db",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=200"
    }
  },
  {
    city: "西安",
    position: [34.341568, 108.940174],
    attraction: {
      name: "兵马俑",
      type: "历史文化",
      description: "秦始皇陵的陪葬坑，世界第八大奇迹",
      icon: "🗿",
      color: "#9b59b6",
      image: "https://images.unsplash.com/photo-1597239450996-5143c073c605?w=200"
    }
  },
  {
    city: "杭州",
    position: [30.274084, 120.155069],
    attraction: {
      name: "西湖",
      type: "自然风光",
      description: "世界文化遗产，人间天堂的美景",
      icon: "🌊",
      color: "#2ecc71",
      image: "https://images.unsplash.com/photo-1559818434-9a0368695c5b?w=200"
    }
  },
  {
    city: "成都",
    position: [30.572815, 104.066803],
    attraction: {
      name: "大熊猫基地",
      type: "自然生态",
      description: "世界著名的大熊猫繁育研究基地",
      icon: "🐼",
      color: "#f39c12",
      image: "https://images.unsplash.com/photo-1523486230352-65a5a834c35c?w=200"
    }
  },
  {
    city: "桂林",
    position: [25.234456, 110.179954],
    attraction: {
      name: "漓江",
      type: "自然风光",
      description: "山水甲天下，喀斯特地貌的精华",
      icon: "⛰️",
      color: "#1abc9c",
      image: "https://images.unsplash.com/photo-1526285847663-69d0c9b3f5f7?w=200"
    }
  },
  {
    city: "厦门",
    position: [24.479796, 118.089425],
    attraction: {
      name: "鼓浪屿",
      type: "海滨风光",
      description: "海上花园，万国建筑博览",
      icon: "🏖️",
      color: "#e67e22",
      image: "https://images.unsplash.com/photo-1560843561-0a43d4ceb0a3?w=200"
    }
  },
  {
    city: "南京",
    position: [32.060255, 118.796877],
    attraction: {
      name: "中山陵",
      type: "历史文化",
      description: "孙中山先生的陵寝，民国建筑代表",
      icon: "🏛️",
      color: "#95a5a6",
      image: "https://images.unsplash.com/photo-1545048702-794625e234a3?w=200"
    }
  },
  {
    city: "丽江",
    position: [26.855047, 100.22775],
    attraction: {
      name: "丽江古城",
      type: "古城文化",
      description: "世界文化遗产，纳西文化发源地",
      icon: "🏔️",
      color: "#d35400",
      image: "https://images.unsplash.com/photo-1552485949-5e8968b92c2a?w=200"
    }
  },
  {
    city: "青岛",
    position: [36.067117, 120.382612],
    attraction: {
      name: "栈桥",
      type: "海滨城市",
      description: "青岛的象征，百年历史的风景线",
      icon: "🍺",
      color: "#2980b9",
      image: "https://images.unsplash.com/photo-1533038590840-1cde6e1a370d?w=200"
    }
  },
  {
    city: "张家界",
    position: [29.117096, 110.479191],
    attraction: {
      name: "张家界国家森林公园",
      type: "自然风光",
      description: "世界自然遗产，奇峰异石仙境",
      icon: "🌄",
      color: "#27ae60",
      image: "https://images.unsplash.com/photo-1547981609-4b6afe5a5a84?w=200"
    }
  },
  {
    city: "哈尔滨",
    position: [45.803775, 126.534967],
    attraction: {
      name: "冰雪大世界",
      type: "冰雪文化",
      description: "冬季冰雪艺术的殿堂",
      icon: "❄️",
      color: "#8e44ad",
      image: "https://images.unsplash.com/photo-1549476464-37392f717541?w=200"
    }
  },
  {
    city: "广州",
    position: [23.129163, 113.264435],
    attraction: {
      name: "广州塔",
      type: "现代都市",
      description: "小蛮腰，广州的新地标",
      icon: "🗼",
      color: "#c0392b",
      image: "https://images.unsplash.com/photo-1590649880764-3a2cf17d1f1f?w=200"
    }
  },
  {
    city: "深圳",
    position: [22.543096, 114.057865],
    attraction: {
      name: "世界之窗",
      type: "主题公园",
      description: "世界著名景观的微缩版",
      icon: "🌍",
      color: "#16a085",
      image: "https://images.unsplash.com/photo-1577460554318-4dd78d746154?w=200"
    }
  },
  {
    city: "苏州",
    position: [31.298974, 120.585289],
    attraction: {
      name: "拙政园",
      type: "园林文化",
      description: "中国四大名园之一，江南园林代表",
      icon: "🎍",
      color: "#7f8c8d",
      image: "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=200"
    }
  }
]

// 获取地图显示的默认景点数据
export const getDefaultAttractions = () => {
  return cityAttractions.map(item => ({
    name: item.attraction.name,
    position: item.position,
    city: item.city,
    type: item.attraction.type,
    description: item.attraction.description,
    icon: item.attraction.icon,
    color: item.attraction.color,
    image: item.attraction.image
  }))
}

// 根据城市名称获取景点数据
export const getAttractionByCity = (cityName) => {
  return cityAttractions.find(item => item.city === cityName)?.attraction || null
}

// 获取所有城市的坐标
export const getAllCityPositions = () => {
  return cityAttractions.map(item => ({
    city: item.city,
    position: item.position
  }))
}

// 获取按地区的景点分组
export const getAttractionsByRegion = () => {
  const regions = {
    '华北': ['北京'],
    '华东': ['上海', '杭州', '南京', '青岛', '苏州'],
    '华南': ['广州', '深圳'],
    '西南': ['成都', '丽江'],
    '西北': ['西安'],
    '华中': ['张家界'],
    '东北': ['哈尔滨']
  }
  
  const result = {}
  
  for (const [region, cities] of Object.entries(regions)) {
    result[region] = cityAttractions.filter(item => cities.includes(item.city))
  }
  
  return result
}