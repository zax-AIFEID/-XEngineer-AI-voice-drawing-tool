// 语音控制绘图工具 - 常量配置文件

/**
 * 颜色配置
 * 支持的颜色名称及其对应的十六进制颜色值
 */
export const COLORS = {
  '红色': '#ff0000',
  '红': '#ff0000',
  '蓝色': '#0000ff',
  '蓝': '#0000ff',
  '绿色': '#00ff00',
  '绿': '#00ff00',
  '黑色': '#000000',
  '黑': '#000000',
  '白色': '#ffffff',
  '白': '#ffffff',
  '黄色': '#ffff00',
  '黄': '#ffff00',
  '紫色': '#800080',
  '紫': '#800080',
  '橙色': '#ffa500',
  '橙': '#ffa500',
  '粉色': '#ffc0cb',
  '粉': '#ffc0cb',
  '灰色': '#808080',
  '灰': '#808080',
  '棕色': '#a52a2a',
  '棕': '#a52a2a',
  '青色': '#00ffff',
  '青': '#00ffff',
  '洋红': '#ff00ff',
  '紫红': '#ff00ff',
};

/**
 * 工具类型枚举
 * 定义支持的绘图工具
 */
export const TOOLS = {
  BRUSH: 'brush',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TRIANGLE: 'triangle',
  ERASER: 'eraser',
};

/**
 * 工具名称映射
 * 工具类型到中文名称的映射
 */
export const TOOL_NAMES = {
  [TOOLS.BRUSH]: '画笔',
  [TOOLS.LINE]: '直线',
  [TOOLS.RECTANGLE]: '矩形',
  [TOOLS.CIRCLE]: '圆形',
  [TOOLS.TRIANGLE]: '三角形',
  [TOOLS.ERASER]: '橡皮擦',
};

/**
 * 预设位置配置
 * 常用位置的坐标定义
 */
export const POSITIONS = {
  '中心': { x: 400, y: 300 },
  '中间': { x: 400, y: 300 },
  '左上': { x: 100, y: 100 },
  '右上': { x: 700, y: 100 },
  '左下': { x: 100, y: 500 },
  '右下': { x: 700, y: 500 },
  '顶部': { x: 400, y: 50 },
  '底部': { x: 400, y: 550 },
  '左侧': { x: 50, y: 300 },
  '右侧': { x: 750, y: 300 },
};

/**
 * 画布配置
 */
export const CANVAS_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  BACKGROUND_COLOR: '#ffffff',
};

/**
 * 画笔配置
 */
export const BRUSH_CONFIG = {
  MIN_SIZE: 1,
  MAX_SIZE: 50,
  DEFAULT_SIZE: 5,
  SIZE_STEP: 5,
};

/**
 * 绘图模式
 */
export const DRAWING_MODE = {
  FILL: 'fill',
  STROKE: 'stroke',
};

/**
 * 默认状态配置
 */
export const DEFAULT_STATE = {
  tool: TOOLS.BRUSH,
  color: '#000000',
  size: BRUSH_CONFIG.DEFAULT_SIZE,
  position: POSITIONS['中心'],
  drawingMode: DRAWING_MODE.STROKE,
  isDrawing: false,
  fontSize: 24,  // 默认字体大小
};

/**
 * 历史记录配置
 */
export const HISTORY_CONFIG = {
  MAX_HISTORY: 50,
};

/**
 * 语音识别配置
 */
export const SPEECH_CONFIG = {
  LANG: 'zh-CN',
  CONTINUOUS: true,
  INTERIM_RESULTS: true,
};

/**
 * 语音反馈配置
 */
export const FEEDBACK_CONFIG = {
  RATE: 1.0,
  PITCH: 1.0,
  VOLUME: 1.0,
};

/**
 * 指令类别
 */
export const COMMAND_CATEGORIES = {
  CONTROL: 'control',
  TOOL: 'tool',
  COLOR: 'color',
  SIZE: 'size',
  POSITION: 'position',
  DRAWING: 'drawing',
};

/**
 * 错误消息
 */
export const ERROR_MESSAGES = {
  UNSUPPORTED_BROWSER: '浏览器不支持语音识别功能，请使用Chrome或Edge浏览器',
  MICROPHONE_DENIED: '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问',
  NO_SPEECH: '未检测到语音，请尝试再次说话',
  UNKNOWN_COMMAND: '指令无法识别，请重试',
  INVALID_PARAMETER: '参数无效，请重新输入',
};

/**
 * 成功消息
 */
export const SUCCESS_MESSAGES = {
  VOICE_STARTED: '语音控制已启动',
  VOICE_STOPPED: '语音控制已停止',
  CANVAS_CLEARED: '画布已清空',
  UNDO: '已撤销',
  REDO: '已重做',
  IMAGE_SAVED: '图片已保存',
};

/**
 * 工具提示消息
 */
export const TOOLTIP_MESSAGES = {
  START_VOICE: '点击启动语音识别',
  STOP_VOICE: '点击停止语音识别',
  CLEAR_CANVAS: '清空画布',
  UNDO: '撤销上一步操作',
  REDO: '重做上一步操作',
  SAVE_IMAGE: '保存当前画布',
};

/**
 * 动画配置
 */
export const ANIMATION_CONFIG = {
  TRANSITION_DURATION: 300,
  FADE_DURATION: 200,
};

/**
 * 日志级别
 */
export const LOG_LEVELS = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

/**
 * 键盘快捷键
 */
export const KEYBOARD_SHORTCUTS = {
  ESC: 'Escape',
  UNDO: 'z',
  REDO: 'y',
  CLEAR: 'd',
  SAVE: 's',
};

/**
 * 导出所有常量
 */
export default {
  COLORS,
  TOOLS,
  TOOL_NAMES,
  POSITIONS,
  CANVAS_CONFIG,
  BRUSH_CONFIG,
  DRAWING_MODE,
  DEFAULT_STATE,
  HISTORY_CONFIG,
  SPEECH_CONFIG,
  FEEDBACK_CONFIG,
  COMMAND_CATEGORIES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  TOOLTIP_MESSAGES,
  ANIMATION_CONFIG,
  LOG_LEVELS,
  KEYBOARD_SHORTCUTS,
};