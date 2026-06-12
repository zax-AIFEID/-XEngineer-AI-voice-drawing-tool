// 语音控制绘图工具 - 通用辅助函数

import { CANVAS_CONFIG, BRUSH_CONFIG, COLORS, TOOLS } from './constants.js';

/**
 * 边界检查工具
 */
export const BoundaryHelper = {
  /**
   * 检查并修正X坐标在画布范围内
   * @param {number} x - X坐标
   * @param {number} [min=0] - 最小值
   * @param {number} [max=CANVAS_CONFIG.WIDTH] - 最大值
   * @returns {number} 修正后的X坐标
   */
  clampX(x, min = 0, max = CANVAS_CONFIG.WIDTH) {
    return Math.max(min, Math.min(max, x));
  },

  /**
   * 检查并修正Y坐标在画布范围内
   * @param {number} y - Y坐标
   * @param {number} [min=0] - 最小值
   * @param {number} [max=CANVAS_CONFIG.HEIGHT] - 最大值
   * @returns {number} 修正后的Y坐标
   */
  clampY(y, min = 0, max = CANVAS_CONFIG.HEIGHT) {
    return Math.max(min, Math.min(max, y));
  },

  /**
   * 检查并修正坐标点在画布范围内
   * @param {{x: number, y: number}} point - 坐标点
   * @returns {{x: number, y: number}} 修正后的坐标点
   */
  clampPoint(point) {
    return {
      x: this.clampX(point.x),
      y: this.clampY(point.y)
    };
  },

  /**
   * 检查坐标是否在画布范围内
   * @param {{x: number, y: number}} point - 坐标点
   * @returns {boolean} 是否在范围内
   */
  isInsideCanvas(point) {
    return point.x >= 0 && point.x <= CANVAS_CONFIG.WIDTH &&
      point.y >= 0 && point.y <= CANVAS_CONFIG.HEIGHT;
  },

  /**
   * 检查并修正画笔大小在有效范围内
   * @param {number} size - 画笔大小
   * @param {number} [min=BRUSH_CONFIG.MIN_SIZE] - 最小值
   * @param {number} [max=BRUSH_CONFIG.MAX_SIZE] - 最大值
   * @returns {number} 修正后的画笔大小
   */
  clampSize(size, min = BRUSH_CONFIG.MIN_SIZE, max = BRUSH_CONFIG.MAX_SIZE) {
    return Math.max(min, Math.min(max, size));
  }
};

/**
 * 参数验证工具
 */
export const ValidationHelper = {
  /**
   * 验证是否为有效数字
   * @param {any} value - 要验证的值
   * @returns {boolean} 是否为有效数字
   */
  isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  },

  /**
   * 验证是否为正整数
   * @param {any} value - 要验证的值
   * @returns {boolean} 是否为正整数
   */
  isPositiveInteger(value) {
    return this.isValidNumber(value) && Number.isInteger(value) && value > 0;
  },

  /**
   * 验证是否为有效颜色
   * @param {string} color - 颜色值
   * @returns {boolean} 是否为有效颜色
   */
  isValidColor(color) {
    if (typeof color !== 'string') return false;

    // 检查是否为十六进制颜色
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexPattern.test(color)) return true;

    // 检查是否为预定义颜色名称
    if (COLORS[color]) return true;

    // 检查是否为CSS颜色名称
    const cssColors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'gray', 'brown', 'cyan', 'magenta'];
    return cssColors.includes(color.toLowerCase());
  },

  /**
   * 验证是否为有效工具类型
   * @param {string} tool - 工具类型
   * @returns {boolean} 是否为有效工具
   */
  isValidTool(tool) {
    return typeof tool === 'string' && Object.values(TOOLS).includes(tool);
  },

  /**
   * 验证是否为有效位置对象
   * @param {any} position - 位置对象
   * @returns {boolean} 是否为有效位置
   */
  isValidPosition(position) {
    return typeof position === 'object' &&
      position !== null &&
      this.isValidNumber(position.x) &&
      this.isValidNumber(position.y);
  },

  /**
   * 验证是否为有效指令字符串
   * @param {any} command - 指令字符串
   * @returns {boolean} 是否为有效指令
   */
  isValidCommand(command) {
    return typeof command === 'string' && command.trim().length > 0;
  },

  /**
   * 提取字符串中的数字
   * @param {string} str - 输入字符串
   * @param {number} [defaultValue=0] - 默认值
   * @returns {number} 提取的数字
   */
  extractNumber(str, defaultValue = 0) {
    if (typeof str !== 'string') return defaultValue;

    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : defaultValue;
  },

  /**
   * 提取字符串中的多个数字
   * @param {string} str - 输入字符串
   * @returns {number[]} 提取的数字数组
   */
  extractNumbers(str) {
    if (typeof str !== 'string') return [];

    const matches = str.match(/(\d+)/g);
    return matches ? matches.map(m => parseInt(m, 10)) : [];
  }
};

/**
 * 字符串处理工具
 */
export const StringHelper = {
  /**
   * 移除字符串中的空白字符
   * @param {string} str - 输入字符串
   * @returns {string} 处理后的字符串
   */
  removeWhitespace(str) {
    return typeof str === 'string' ? str.replace(/\s/g, '') : str;
  },

  /**
   * 移除字符串两端的空白字符
   * @param {string} str - 输入字符串
   * @returns {string} 处理后的字符串
   */
  trim(str) {
    return typeof str === 'string' ? str.trim() : str;
  },

  /**
   * 转换为小写
   * @param {string} str - 输入字符串
   * @returns {string} 小写字符串
   */
  toLowerCase(str) {
    return typeof str === 'string' ? str.toLowerCase() : str;
  },

  /**
   * 转换为大写
   * @param {string} str - 输入字符串
   * @returns {string} 大写字符串
   */
  toUpperCase(str) {
    return typeof str === 'string' ? str.toUpperCase() : str;
  },

  /**
   * 判断字符串是否包含指定关键词
   * @param {string} str - 源字符串
   * @param {string|string[]} keywords - 关键词或关键词数组
   * @returns {boolean} 是否包含关键词
   */
  contains(str, keywords) {
    if (typeof str !== 'string') return false;

    const lowerStr = str.toLowerCase();

    if (Array.isArray(keywords)) {
      return keywords.some(keyword =>
        typeof keyword === 'string' && lowerStr.includes(keyword.toLowerCase())
      );
    }

    return typeof keywords === 'string' && lowerStr.includes(keywords.toLowerCase());
  },

  /**
   * 生成唯一ID
   * @param {number} [length=8] - ID长度
   * @returns {string} 唯一ID
   */
  generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  },

  /**
   * 格式化时间戳为可读时间
   * @param {number} [timestamp=Date.now()] - 时间戳
   * @returns {string} 格式化的时间字符串
   */
  formatTime(timestamp = Date.now()) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
};

/**
 * 数组处理工具
 */
export const ArrayHelper = {
  /**
   * 检查数组是否为空
   * @param {any[]} arr - 数组
   * @returns {boolean} 是否为空
   */
  isEmpty(arr) {
    return !Array.isArray(arr) || arr.length === 0;
  },

  /**
   * 检查数组是否包含指定元素
   * @param {any[]} arr - 数组
   * @param {any} element - 元素
   * @returns {boolean} 是否包含
   */
  contains(arr, element) {
    return Array.isArray(arr) && arr.includes(element);
  },

  /**
   * 数组去重
   * @param {any[]} arr - 数组
   * @returns {any[]} 去重后的数组
   */
  unique(arr) {
    return Array.isArray(arr) ? [...new Set(arr)] : arr;
  },

  /**
   * 安全获取数组元素
   * @param {any[]} arr - 数组
   * @param {number} index - 索引
   * @param {any} [defaultValue=null] - 默认值
   * @returns {any} 数组元素或默认值
   */
  getSafe(arr, index, defaultValue = null) {
    return Array.isArray(arr) && index >= 0 && index < arr.length
      ? arr[index]
      : defaultValue;
  },

  /**
   * 随机获取数组元素
   * @param {any[]} arr - 数组
   * @returns {any} 随机元素
   */
  random(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /**
   * 数组分组
   * @param {any[]} arr - 数组
   * @param {Function} keyFn - 分组键函数
   * @returns {Object} 分组对象
   */
  groupBy(arr, keyFn) {
    if (!Array.isArray(arr) || typeof keyFn !== 'function') return {};

    return arr.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }
};

/**
 * 数学计算工具
 */
export const MathHelper = {
  /**
   * 计算两点之间的距离
   * @param {{x: number, y: number}} p1 - 点1
   * @param {{x: number, y: number}} p2 - 点2
   * @returns {number} 距离
   */
  distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * 计算两点之间的角度（弧度）
   * @param {{x: number, y: number}} p1 - 点1
   * @param {{x: number, y: number}} p2 - 点2
   * @returns {number} 角度（弧度）
   */
  angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  },

  /**
   * 弧度转角度
   * @param {number} radians - 弧度
   * @returns {number} 角度
   */
  radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
  },

  /**
   * 角度转弧度
   * @param {number} degrees - 角度
   * @returns {number} 弧度
   */
  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  },

  /**
   * 线性插值
   * @param {number} start - 起始值
   * @param {number} end - 结束值
   * @param {number} t - 插值因子（0-1）
   * @returns {number} 插值结果
   */
  lerp(start, end, t) {
    return start + (end - start) * t;
  },

  /**
   * 向量线性插值
   * @param {{x: number, y: number}} start - 起始向量
   * @param {{x: number, y: number}} end - 结束向量
   * @param {number} t - 插值因子（0-1）
   * @returns {{x: number, y: number}} 插值结果
   */
  lerpPoint(start, end, t) {
    return {
      x: this.lerp(start.x, end.x, t),
      y: this.lerp(start.y, end.y, t)
    };
  },

  /**
   * 限制数值范围
   * @param {number} value - 输入值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 限制后的值
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  /**
   * 计算平均值
   * @param {number[]} numbers - 数字数组
   * @returns {number} 平均值
   */
  average(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  },

  /**
   * 计算数组总和
   * @param {number[]} numbers - 数字数组
   * @returns {number} 总和
   */
  sum(numbers) {
    if (!Array.isArray(numbers)) return 0;
    return numbers.reduce((sum, num) => sum + num, 0);
  }
};

/**
 * 事件处理工具
 */
export const EventHelper = {
  /**
   * 防抖函数
   * @param {Function} fn - 要防抖的函数
   * @param {number} delay - 延迟时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * 节流函数
   * @param {Function} fn - 要节流的函数
   * @param {number} limit - 限制时间（毫秒）
   * @returns {Function} 节流后的函数
   */
  throttle(fn, limit) {
    let inThrottle = false;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * 创建自定义事件
   * @param {string} name - 事件名称
   * @param {Object} [detail={}] - 事件数据
   * @returns {CustomEvent} 自定义事件对象
   */
  createCustomEvent(name, detail = {}) {
    return new CustomEvent(name, {
      detail,
      bubbles: true,
      cancelable: true
    });
  },

  /**
   * 安全触发事件
   * @param {EventTarget} target - 事件目标
   * @param {string} eventName - 事件名称
   * @param {Object} [detail={}] - 事件数据
   */
  safeDispatchEvent(target, eventName, detail = {}) {
    if (target && typeof target.dispatchEvent === 'function') {
      target.dispatchEvent(this.createCustomEvent(eventName, detail));
    }
  }
};

/**
 * 调试工具
 */
export const DebugHelper = {
  /**
   * 控制台日志
   * @param {any} message - 消息
   * @param {string} [level='info'] - 日志级别
   */
  log(message, level = 'info') {
    const colors = {
      info: '#667eea',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545'
    };

    console.log(`%c[${level.toUpperCase()}]`, `color: ${colors[level]}; font-weight: bold`, message);
  },

  /**
   * 成功日志
   * @param {any} message - 消息
   */
  success(message) {
    this.log(message, 'success');
  },

  /**
   * 警告日志
   * @param {any} message - 消息
   */
  warning(message) {
    this.log(message, 'warning');
  },

  /**
   * 错误日志
   * @param {any} message - 消息
   */
  error(message) {
    this.log(message, 'error');
  },

  /**
   * 分组日志
   * @param {string} name - 分组名称
   * @param {Function} callback - 回调函数
   */
  group(name, callback) {
    console.group(name);
    callback();
    console.groupEnd();
  },

  /**
   * 时间戳日志
   * @param {string} label - 标签
   */
  time(label) {
    console.time(label);
  },

  /**
   * 时间戳结束日志
   * @param {string} label - 标签
   */
  timeEnd(label) {
    console.timeEnd(label);
  }
};

/**
 * 导出所有辅助工具
 */
export default {
  BoundaryHelper,
  ValidationHelper,
  StringHelper,
  ArrayHelper,
  MathHelper,
  EventHelper,
  DebugHelper
};