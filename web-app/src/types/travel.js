// 旅行相关类型定义

/**
 * 旅行计划基础信息
 * @typedef {Object} TravelPlan
 * @property {string} id - 计划ID
 * @property {string} title - 标题
 * @property {string} description - 描述
 * @property {number} days - 天数
 * @property {number} budget - 预算
 * @property {number} travelers - 出行人数
 * @property {string} destination - 目的地
 * @property {string} status - 状态
 * @property {boolean} is_ai_generated - 是否AI生成
 * @property {string} created_at - 创建时间
 * @property {string} updated_at - 更新时间
 */

/**
 * 活动信息
 * @typedef {Object} Activity
 * @property {string} id - 活动ID
 * @property {number} day_number - 第几天
 * @property {number} order_index - 排序索引
 * @property {string} activity_title - 活动标题
 * @property {string} activity_description - 活动描述
 * @property {string} location - 地点
 * @property {string} time_slot - 时间段
 * @property {string} start_time - 开始时间
 * @property {string} end_time - 结束时间
 * @property {number} duration_minutes - 持续时间（分钟）
 * @property {number} estimated_cost - 预估费用
 * @property {string} transportation - 交通方式
 * @property {string} travel_time - 交通时间
 */

/**
 * 每日行程安排
 * @typedef {Object} DailyItinerary
 * @property {number} day - 第几天
 * @property {string} date - 日期
 * @property {Activity[]} activities - 活动列表
 * @property {number} total_cost - 当日总费用
 */

/**
 * AI生成计划结果
 * @typedef {Object} AIPlanResult
 * @property {string} title - 标题
 * @property {string} description - 描述
 * @property {number} days - 天数
 * @property {number} budget - 预算
 * @property {number} travelers - 出行人数
 * @property {DailyItinerary[]} itinerary - 行程安排
 * @property {string[]} tips - 实用贴士
 * @property {Object} budget_breakdown - 预算分配
 * @property {number} total_estimated_cost - 总预估费用
 */

/**
 * 用户偏好设置
 * @typedef {Object} UserPreferences
 * @property {string} destination - 目的地
 * @property {number} days - 天数
 * @property {number} budget - 预算
 * @property {number} travelers - 出行人数
 * @property {string[]} interests - 兴趣偏好
 * @property {string} travelStyle - 旅行风格
 * @property {string} specialRequirements - 特殊要求
 */

export {}