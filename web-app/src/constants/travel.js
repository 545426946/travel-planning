// 旅行相关常量配置
export const TRAVEL_STYLES = {
  BUDGET: 'budget',
  COMFORT: 'comfort',
  LUXURY: 'luxury'
}

export const INTEREST_TYPES = {
  CULTURE: 'culture',
  NATURE: 'nature',
  FOOD: 'food',
  SHOPPING: 'shopping',
  ADVENTURE: 'adventure',
  RELAXATION: 'relaxation'
}

export const TIME_SLOTS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night'
}

export const PLAN_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

// 默认预算分配比例
export const BUDGET_DISTRIBUTION = {
  ACCOMMODATION: 0.3,
  FOOD: 0.25,
  TRANSPORTATION: 0.2,
  TICKETS: 0.15,
  SHOPPING: 0.05,
  OTHER: 0.05
}

// 默认活动持续时间（分钟）
export const ACTIVITY_DURATIONS = {
  [TIME_SLOTS.MORNING]: 180,
  [TIME_SLOTS.AFTERNOON]: 240,
  [TIME_SLOTS.EVENING]: 120,
  [TIME_SLOTS.NIGHT]: 180
}