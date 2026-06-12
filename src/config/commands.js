// 语音控制绘图工具 - 指令配置文件

import { COMMAND_CATEGORIES, TOOLS, COLORS, POSITIONS } from '../utils/constants.js';

/**
 * 指令配置结构
 * {
 *   keywords: string[],        // 指令关键词（多种表达方式）
 *   category: string,          // 指令类别
 *   action: string,            // 执行动作
 *   params?: {                 // 参数配置
 *     pattern?: RegExp,        // 参数提取正则表达式
 *     validator?: Function,    // 参数验证函数
 *     transformer?: Function,  // 参数转换函数
 *   },
 *   feedback?: string,         // 语音反馈消息
 *   description?: string       // 指令描述
 * }
 */

/**
 * 基础控制指令
 */
export const CONTROL_COMMANDS = [
  {
    keywords: ['启动语音', '开始语音', '打开语音', '开启语音'],
    category: COMMAND_CATEGORIES.CONTROL,
    action: 'startVoice',
    feedback: '语音识别已启动',
    description: '启动语音识别功能'
  },
  {
    keywords: ['停止语音', '关闭语音', '结束语音', '停止识别'],
    category: COMMAND_CATEGORIES.CONTROL,
    action: 'stopVoice',
    feedback: '语音识别已停止',
    description: '停止语音识别功能'
  },
  {
    keywords: ['清空画布', '清除所有', '清除画布', '清屏', '清除'],
    category: COMMAND_CATEGORIES.CONTROL,
    action: 'clearCanvas',
    feedback: '画布已清空',
    description: '清空画布所有内容'
  },
  {
    keywords: ['撤销', '上一步', '回退', '取消'],
    category: COMMAND_CATEGORIES.CONTROL,
    action: 'undo',
    feedback: '已撤销',
    description: '撤销上一步操作'
  },
  {
    keywords: ['重做', '下一步', '恢复', '重做操作'],
    category: COMMAND_CATEGORIES.CONTROL,
    action: 'redo',
    feedback: '已重做',
    description: '重做上一步撤销的操作'
  },
  {
    keywords: ['保存', '保存图片', '下载', '导出'],
    category: COMMAND_CATEGORIES.CONTROL,
    action: 'saveImage',
    feedback: '图片已保存',
    description: '保存当前画布为图片'
  }
];

/**
 * 工具选择指令
 */
export const TOOL_COMMANDS = [
  {
    keywords: ['画笔', '铅笔', '笔'],
    category: COMMAND_CATEGORIES.TOOL,
    action: 'setTool',
    params: { value: TOOLS.BRUSH },
    feedback: '已切换到画笔工具',
    description: '切换到画笔工具'
  },
  {
    keywords: ['直线', '线段', '线'],
    category: COMMAND_CATEGORIES.TOOL,
    action: 'setTool',
    params: { value: TOOLS.LINE },
    feedback: '已切换到直线工具',
    description: '切换到直线工具'
  },
  {
    keywords: ['矩形', '方形', '方'],
    category: COMMAND_CATEGORIES.TOOL,
    action: 'setTool',
    params: { value: TOOLS.RECTANGLE },
    feedback: '已切换到矩形工具',
    description: '切换到矩形工具'
  },
  {
    keywords: ['圆形', '圆'],
    category: COMMAND_CATEGORIES.TOOL,
    action: 'setTool',
    params: { value: TOOLS.CIRCLE },
    feedback: '已切换到圆形工具',
    description: '切换到圆形工具'
  },
  {
    keywords: ['三角形', '三角'],
    category: COMMAND_CATEGORIES.TOOL,
    action: 'setTool',
    params: { value: TOOLS.TRIANGLE },
    feedback: '已切换到三角形工具',
    description: '切换到三角形工具'
  },
  {
    keywords: ['橡皮擦', '橡皮'],
    category: COMMAND_CATEGORIES.TOOL,
    action: 'setTool',
    params: { value: TOOLS.ERASER },
    feedback: '已切换到橡皮擦工具',
    description: '切换到橡皮擦工具'
  }
];

/**
 * 颜色设置指令
 */
export const COLOR_COMMANDS = Object.keys(COLORS).map(colorName => ({
  keywords: [colorName],
  category: COMMAND_CATEGORIES.COLOR,
  action: 'setColor',
  params: { value: COLORS[colorName] },
  feedback: `颜色已设置为${colorName}`,
  description: `设置颜色为${colorName}`
}));

/**
 * 大小设置指令
 */
export const SIZE_COMMANDS = [
  {
    keywords: ['大小', '粗细', '尺寸', '笔刷大小'],
    category: COMMAND_CATEGORIES.SIZE,
    action: 'setSize',
    params: {
      pattern: /(?:大小|粗细|尺寸|笔刷大小)\s*(\d+)/,
      transformer: (value) => parseInt(value)
    },
    feedback: (size) => `大小已设置为${size}`,
    description: '设置画笔大小'
  },
  {
    keywords: ['加粗', '变大', '变粗', '增大'],
    category: COMMAND_CATEGORIES.SIZE,
    action: 'increaseSize',
    params: { step: 5 },
    feedback: '画笔已加粗',
    description: '增加画笔大小'
  },
  {
    keywords: ['变细', '变小', '减细', '减小'],
    category: COMMAND_CATEGORIES.SIZE,
    action: 'decreaseSize',
    params: { step: 5 },
    feedback: '画笔已变细',
    description: '减小画笔大小'
  }
];

/**
 * 位置移动指令
 */
export const POSITION_COMMANDS = Object.keys(POSITIONS).map(positionName => ({
  keywords: ['移到' + positionName, '移动到' + positionName, '去' + positionName, '到' + positionName],
  category: COMMAND_CATEGORIES.POSITION,
  action: 'moveTo',
  params: { value: POSITIONS[positionName] },
  feedback: `已移动到${positionName}`,
  description: `移动到${positionName}位置`
})).concat([
  {
    keywords: ['上移', '向上', '向上移动'],
    category: COMMAND_CATEGORIES.POSITION,
    action: 'moveUp',
    params: {
      pattern: /(?:上移|向上|向上移动)\s*(\d+)/,
      transformer: (value) => parseInt(value),
      defaultValue: 50
    },
    feedback: (distance) => `向上移动${distance}像素`,
    description: '向上移动指定距离'
  },
  {
    keywords: ['下移', '向下', '向下移动'],
    category: COMMAND_CATEGORIES.POSITION,
    action: 'moveDown',
    params: {
      pattern: /(?:下移|向下|向下移动)\s*(\d+)/,
      transformer: (value) => parseInt(value),
      defaultValue: 50
    },
    feedback: (distance) => `向下移动${distance}像素`,
    description: '向下移动指定距离'
  },
  {
    keywords: ['左移', '向左', '向左移动'],
    category: COMMAND_CATEGORIES.POSITION,
    action: 'moveLeft',
    params: {
      pattern: /(?:左移|向左|向左移动)\s*(\d+)/,
      transformer: (value) => parseInt(value),
      defaultValue: 50
    },
    feedback: (distance) => `向左移动${distance}像素`,
    description: '向左移动指定距离'
  },
  {
    keywords: ['右移', '向右', '向右移动'],
    category: COMMAND_CATEGORIES.POSITION,
    action: 'moveRight',
    params: {
      pattern: /(?:右移|向右|向右移动)\s*(\d+)/,
      transformer: (value) => parseInt(value),
      defaultValue: 50
    },
    feedback: (distance) => `向右移动${distance}像素`,
    description: '向右移动指定距离'
  }
]);

/**
 * 绘图操作指令
 */
export const DRAWING_COMMANDS = [
  {
    keywords: ['开始画', '开始绘图', '下笔', '开始绘制'],
    category: COMMAND_CATEGORIES.DRAWING,
    action: 'startDrawing',
    feedback: '开始绘图',
    description: '开始连续绘图'
  },
  {
    keywords: ['停止画', '停止绘图', '抬笔', '结束画', '停止绘制'],
    category: COMMAND_CATEGORIES.DRAWING,
    action: 'stopDrawing',
    feedback: '停止绘图',
    description: '停止连续绘图'
  },
  {
    keywords: ['画圆', '绘制圆形', '画个圆'],
    category: COMMAND_CATEGORIES.DRAWING,
    action: 'drawCircle',
    params: {
      pattern: /(?:画圆|绘制圆形|画个圆)\s*(\d+)?/,
      transformer: (value) => value ? parseInt(value) : 50,
      defaultValue: 50
    },
    feedback: (radius) => `已绘制圆形，半径${radius}`,
    description: '绘制圆形'
  },
  {
    keywords: ['画矩形', '画方形', '绘制矩形', '画个方'],
    category: COMMAND_CATEGORIES.DRAWING,
    action: 'drawRectangle',
    params: {
      pattern: /(?:画矩形|画方形|绘制矩形|画个方)\s*(\d+)?/,
      transformer: (value) => value ? parseInt(value) * 2 : 100,
      defaultValue: 100
    },
    feedback: (size) => `已绘制矩形，大小${size}`,
    description: '绘制矩形'
  },
  {
    keywords: ['画三角形', '绘制三角形', '画个三角'],
    category: COMMAND_CATEGORIES.DRAWING,
    action: 'drawTriangle',
    params: {
      pattern: /(?:画三角形|绘制三角形|画个三角)\s*(\d+)?/,
      transformer: (value) => value ? parseInt(value) * 2 : 100,
      defaultValue: 100
    },
    feedback: (size) => `已绘制三角形，大小${size}`,
    description: '绘制三角形'
  },
  {
    keywords: ['画线', '画直线', '绘制直线'],
    category: COMMAND_CATEGORIES.DRAWING,
    action: 'drawLine',
    params: {
      pattern: /(?:画线|画直线|绘制直线)\s*(\d+)?/,
      transformer: (value) => value ? parseInt(value) * 4 : 200,
      defaultValue: 200
    },
    feedback: (length) => `已绘制直线，长度${length}`,
    description: '绘制直线'
  },
  {
    keywords: ['画线到', '绘制到', '画到'],
    category: COMMAND_CATEGORIES.DRAWING,
    action: 'drawLineTo',
    params: {
      pattern: /(?:画线到|绘制到|画到)\s*(\d+)\s*(\d+)/,
      transformer: (x, y) => ({ x: parseInt(x), y: parseInt(y) })
    },
    feedback: (coords) => `已画线到坐标${coords.x} ${coords.y}`,
    description: '绘制直线到指定坐标'
  },
  {
    keywords: ['填充', '实心'],
    category: COMMAND_CATEGORIES.DRAWING,
    action: 'setFillMode',
    params: { value: true },
    feedback: '已切换到填充模式',
    description: '切换到填充模式'
  },
  {
    keywords: ['描边', '空心', '边框'],
    category: COMMAND_CATEGORIES.DRAWING,
    action: 'setFillMode',
    params: { value: false },
    feedback: '已切换到描边模式',
    description: '切换到描边模式'
  }
];

/**
 * 所有指令配置
 */
export const ALL_COMMANDS = [
  ...CONTROL_COMMANDS,
  ...TOOL_COMMANDS,
  ...COLOR_COMMANDS,
  ...SIZE_COMMANDS,
  ...POSITION_COMMANDS,
  ...DRAWING_COMMANDS
];

/**
 * 指令类别映射
 */
export const COMMANDS_BY_CATEGORY = {
  [COMMAND_CATEGORIES.CONTROL]: CONTROL_COMMANDS,
  [COMMAND_CATEGORIES.TOOL]: TOOL_COMMANDS,
  [COMMAND_CATEGORIES.COLOR]: COLOR_COMMANDS,
  [COMMAND_CATEGORIES.SIZE]: SIZE_COMMANDS,
  [COMMAND_CATEGORIES.POSITION]: POSITION_COMMANDS,
  [COMMAND_CATEGORIES.DRAWING]: DRAWING_COMMANDS
};

/**
 * 指令动作映射
 * 用于快速查找指令配置
 */
export const COMMANDS_BY_ACTION = {};
ALL_COMMANDS.forEach(command => {
  if (!COMMANDS_BY_ACTION[command.action]) {
    COMMANDS_BY_ACTION[command.action] = [];
  }
  COMMANDS_BY_ACTION[command.action].push(command);
});

/**
 * 获取指令帮助信息
 * @param {string} category - 指令类别
 * @returns {Array} 指令帮助信息
 */
export function getCommandHelp(category = null) {
  if (category) {
    return COMMANDS_BY_CATEGORY[category] || [];
  }
  return ALL_COMMANDS;
}

/**
 * 根据关键词查找指令
 * @param {string} keyword - 关键词
 * @returns {Object|null} 指令配置
 */
export function findCommandByKeyword(keyword) {
  return ALL_COMMANDS.find(command =>
    command.keywords.some(k => keyword.includes(k))
  ) || null;
}

/**
 * 根据动作查找指令
 * @param {string} action - 动作名称
 * @returns {Array} 指令配置列表
 */
export function findCommandsByAction(action) {
  return COMMANDS_BY_ACTION[action] || [];
}

/**
 * 导出所有配置
 */
export default {
  CONTROL_COMMANDS,
  TOOL_COMMANDS,
  COLOR_COMMANDS,
  SIZE_COMMANDS,
  POSITION_COMMANDS,
  DRAWING_COMMANDS,
  ALL_COMMANDS,
  COMMANDS_BY_CATEGORY,
  COMMANDS_BY_ACTION,
  getCommandHelp,
  findCommandByKeyword,
  findCommandsByAction
};