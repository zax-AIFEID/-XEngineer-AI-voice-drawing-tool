// 语音控制绘图工具 - 绘图引擎

import { CANVAS_CONFIG, TOOLS, BRUSH_CONFIG, DRAWING_MODE } from '../utils/constants.js';
import { BoundaryHelper, ValidationHelper, MathHelper } from '../utils/helpers.js';

/**
 * 绘图引擎类
 * 封装 Canvas API，实现各种绘图操作
 */
export class DrawingEngine {
  /**
   * 构造函数
   * @param {HTMLCanvasElement|string} canvas - Canvas元素或ID
   * @param {Object} config - 配置选项
   */
  constructor(canvas, config = {}) {
    // 获取 Canvas 元素
    if (typeof canvas === 'string') {
      this.canvas = document.getElementById(canvas);
    } else {
      this.canvas = canvas;
    }

    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    // 获取 2D 绘图上下文
    this.ctx = this.canvas.getContext('2d');

    // 配置参数
    this.config = {
      width: config.width || CANVAS_CONFIG.WIDTH,
      height: config.height || CANVAS_CONFIG.HEIGHT,
      backgroundColor: config.backgroundColor || CANVAS_CONFIG.BACKGROUND_COLOR,
      maxHistorySteps: config.maxHistorySteps || 50,
      ...config
    };

    // 当前绘图状态
    this.currentState = {
      tool: TOOLS.BRUSH,
      color: '#000000',
      size: BRUSH_CONFIG.DEFAULT_SIZE,
      position: { x: this.config.width / 2, y: this.config.height / 2 },
      isDrawing: false,
      isFill: false,
      lastPosition: null
    };

    // 历史记录（用于撤销/重做）
    this.history = [];
    this.historyIndex = -1;

    // 调试工具
    this.debug = {
      log: (msg) => console.log(`[DrawingEngine] ${msg}`),
      error: (msg, err) => console.error(`[DrawingEngine] ${msg}`, err)
    };

    // 初始化
    this.initCanvas();
    this.setupEventListeners();
  }

  /**
   * 初始化画布
   */
  initCanvas() {
    // 设置画布尺寸
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;

    // 设置默认样式
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.currentState.color;
    this.ctx.lineWidth = this.currentState.size;

    // 填充背景
    this.fillBackground();

    // 保存初始状态
    this.saveToHistory();
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 鼠标事件
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));

    // 触摸事件
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
  }

  /**
   * 获取鼠标在画布上的位置
   * @param {MouseEvent} event - 鼠标事件
   * @returns {Object} 坐标对象 {x, y}
   */
  getMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  /**
   * 获取触摸在画布上的位置
   * @param {TouchEvent} event - 触摸事件
   * @returns {Object} 坐标对象 {x, y}
   */
  getTouchPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const touch = event.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  /**
   * 填充背景
   * @param {string} color - 背景颜色
   */
  fillBackground(color = null) {
    this.ctx.fillStyle = color || this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 处理鼠标按下事件
   * @param {MouseEvent} event - 鼠标事件
   */
  handleMouseDown(event) {
    const pos = this.getMousePosition(event);
    this.startDrawing(pos);
  }

  /**
   * 处理鼠标移动事件
   * @param {MouseEvent} event - 鼠标事件
   */
  handleMouseMove(event) {
    if (!this.currentState.isDrawing) return;

    const pos = this.getMousePosition(event);
    this.draw(pos);
  }

  /**
   * 处理鼠标释放事件
   * @param {MouseEvent} event - 鼠标事件
   */
  handleMouseUp(event) {
    this.stopDrawing();
  }

  /**
   * 处理鼠标离开事件
   * @param {MouseEvent} event - 鼠标事件
   */
  handleMouseLeave(event) {
    this.stopDrawing();
  }

  /**
   * 处理触摸开始事件
   * @param {TouchEvent} event - 触摸事件
   */
  handleTouchStart(event) {
    event.preventDefault();
    const pos = this.getTouchPosition(event);
    this.startDrawing(pos);
  }

  /**
   * 处理触摸移动事件
   * @param {TouchEvent} event - 触摸事件
   */
  handleTouchMove(event) {
    event.preventDefault();
    if (!this.currentState.isDrawing) return;

    const pos = this.getTouchPosition(event);
    this.draw(pos);
  }

  /**
   * 处理触摸结束事件
   * @param {TouchEvent} event - 触摸事件
   */
  handleTouchEnd(event) {
    event.preventDefault();
    this.stopDrawing();
  }

  /**
   * 开始绘制
   * @param {Object} position - 起始位置 {x, y}
   */
  startDrawing(position) {
    this.currentState.isDrawing = true;
    this.currentState.lastPosition = position;

    // 橡皮擦和画笔需要特殊处理起点
    if (this.currentState.tool === TOOLS.BRUSH ||
      this.currentState.tool === TOOLS.ERASER) {
      this.ctx.beginPath();
      this.ctx.moveTo(position.x, position.y);
    }
  }

  /**
   * 绘制
   * @param {Object} position - 当前位置 {x, y}
   */
  draw(position) {
    if (!this.currentState.isDrawing) return;

    const { tool, color, size, lastPosition } = this.currentState;

    // 设置绘图样式
    this.ctx.strokeStyle = tool === TOOLS.ERASER ? this.config.backgroundColor : color;
    this.ctx.lineWidth = tool === TOOLS.ERASER ? size * 3 : size;

    switch (tool) {
      case TOOLS.BRUSH:
      case TOOLS.ERASER:
        this.drawBrush(lastPosition, position);
        break;
      case TOOLS.LINE:
        this.drawLine(lastPosition, position);
        break;
      case TOOLS.RECTANGLE:
        this.drawRectangle(lastPosition, position);
        break;
      case TOOLS.CIRCLE:
        this.drawCircle(lastPosition, position);
        break;
      case TOOLS.TRIANGLE:
        this.drawTriangle(lastPosition, position);
        break;
    }

    this.currentState.lastPosition = position;
  }

  /**
   * 停止绘制
   */
  stopDrawing() {
    if (this.currentState.isDrawing) {
      this.currentState.isDrawing = false;
      this.currentState.lastPosition = null;
      this.saveToHistory();
    }
  }

  /**
   * 绘制画笔/橡皮擦
   * @param {Object} from - 起点
   * @param {Object} to - 终点
   */
  drawBrush(from, to) {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }

  /**
   * 绘制直线
   * @param {Object} from - 起点
   * @param {Object} to - 终点
   */
  drawLine(from, to) {
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }

  /**
   * 绘制矩形
   * @param {Object} from - 起点
   * @param {Object} to - 终点
   */
  drawRectangle(from, to) {
    const width = to.x - from.x;
    const height = to.y - from.y;

    this.ctx.beginPath();
    if (this.currentState.isFill) {
      this.ctx.fillRect(from.x, from.y, width, height);
    } else {
      this.ctx.strokeRect(from.x, from.y, width, height);
    }
  }

  /**
   * 绘制圆形
   * @param {Object} from - 起点
   * @param {Object} to - 终点
   */
  drawCircle(from, to) {
    const radius = MathHelper.distance(from, to);

    this.ctx.beginPath();
    this.ctx.arc(from.x, from.y, radius, 0, Math.PI * 2);

    if (this.currentState.isFill) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }

  /**
   * 绘制三角形
   * @param {Object} from - 起点
   * @param {Object} to - 终点
   */
  drawTriangle(from, to) {
    const width = Math.abs(to.x - from.x);
    const height = Math.abs(to.y - from.y);

    const x1 = from.x;
    const y1 = from.y - height;
    const x2 = from.x - width;
    const y2 = from.y;
    const x3 = from.x + width;
    const y3 = from.y;

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x3, y3);
    this.ctx.closePath();

    if (this.currentState.isFill) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }

  /**
   * 设置工具
   * @param {string} tool - 工具名称
   */
  setTool(tool) {
    if (TOOLS[tool.toUpperCase()]) {
      this.currentState.tool = TOOLS[tool.toUpperCase()];
    } else if (Object.values(TOOLS).includes(tool)) {
      this.currentState.tool = tool;
    }
  }

  /**
   * 获取当前工具
   * @returns {string} 当前工具
   */
  getTool() {
    return this.currentState.tool;
  }

  /**
   * 设置颜色
   * @param {string} color - 颜色值
   */
  setColor(color) {
    if (ValidationHelper.isValidColor(color)) {
      this.currentState.color = color;
      this.ctx.strokeStyle = color;
      this.ctx.fillStyle = color;
    }
  }

  /**
   * 获取当前颜色
   * @returns {string} 当前颜色
   */
  getColor() {
    return this.currentState.color;
  }

  /**
   * 设置画笔大小
   * @param {number} size - 大小
   */
  setSize(size) {
    const clampedSize = BoundaryHelper.clampSize(size);
    this.currentState.size = clampedSize;
    this.ctx.lineWidth = clampedSize;
  }

  /**
   * 获取当前大小
   * @returns {number} 当前大小
   */
  getSize() {
    return this.currentState.size;
  }

  /**
   * 设置填充模式
   * @param {boolean} isFill - 是否填充
   */
  setFillMode(isFill) {
    this.currentState.isFill = isFill;
  }

  /**
   * 获取填充模式
   * @returns {boolean} 是否填充
   */
  getFillMode() {
    return this.currentState.isFill;
  }

  /**
   * 设置当前位置
   * @param {Object} position - 位置 {x, y}
   */
  setPosition(position) {
    if (position && typeof position.x === 'number' && typeof position.y === 'number') {
      this.currentState.position = BoundaryHelper.clampPoint(position);
    }
  }

  /**
   * 获取当前位置
   * @returns {Object} 当前位置
   */
  getPosition() {
    return { ...this.currentState.position };
  }

  /**
   * 移动位置
   * @param {string} direction - 方向 (up/down/left/right)
   * @param {number} distance - 距离
   */
  movePosition(direction, distance = 50) {
    const pos = { ...this.currentState.position };

    switch (direction) {
      case 'up':
        pos.y -= distance;
        break;
      case 'down':
        pos.y += distance;
        break;
      case 'left':
        pos.x -= distance;
        break;
      case 'right':
        pos.x += distance;
        break;
    }

    this.setPosition(pos);
    return this.currentState.position;
  }

  /**
   * 在当前位置绘制图形
   * @param {string} shapeType - 图形类型 (circle/rectangle/triangle/line)
   * @param {number} size - 大小
   */
  drawShape(shapeType, size = 50) {
    const pos = this.currentState.position;
    const endPos = {
      x: pos.x + size,
      y: pos.y + size
    };

    switch (shapeType) {
      case 'circle':
        this.drawCircle(pos, endPos);
        break;
      case 'rectangle':
        this.drawRectangle(pos, endPos);
        break;
      case 'triangle':
        this.drawTriangle(pos, endPos);
        break;
      case 'line':
        this.drawLine(pos, endPos);
        break;
      default:
        console.warn('Unknown shape type:', shapeType);
    }

    this.saveToHistory();
  }

  /**
   * 绘制圆形（使用中心点和半径）
   * @param {Object} center - 中心点
   * @param {number} radius - 半径
   */
  drawCircleByRadius(center, radius) {
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

    if (this.currentState.isFill) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }

    this.saveToHistory();
  }

  /**
   * 绘制矩形（使用左上角和大小）
   * @param {Object} position - 左上角位置
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  drawRectangleBySize(position, width, height) {
    if (this.currentState.isFill) {
      this.ctx.fillRect(position.x, position.y, width, height);
    } else {
      this.ctx.strokeRect(position.x, position.y, width, height);
    }

    this.saveToHistory();
  }

  /**
   * 绘制直线（使用两个点）
   * @param {Object} from - 起点
   * @param {Object} to - 终点
   */
  drawLineByPoints(from, to) {
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();

    this.saveToHistory();
  }

  /**
   * 保存到历史记录
   */
  saveToHistory() {
    // 删除当前位置之后的历史（用于重做）
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // 获取当前画布状态
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // 添加到历史记录
    this.history.push(imageData);

    // 限制历史记录数量
    if (this.history.length > this.config.maxHistorySteps) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  /**
   * 撤销
   * @returns {boolean} 是否成功撤销
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const imageData = this.history[this.historyIndex];
      this.ctx.putImageData(imageData, 0, 0);
      return true;
    }
    return false;
  }

  /**
   * 重做
   * @returns {boolean} 是否成功重做
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const imageData = this.history[this.historyIndex];
      this.ctx.putImageData(imageData, 0, 0);
      return true;
    }
    return false;
  }

  /**
   * 清空画布
   * @param {string} color - 背景颜色（可选）
   */
  clear(color = null) {
    this.fillBackground(color);
    this.saveToHistory();
  }

  /**
   * 智能绘图 - 执行 AI 生成的绘图步骤序列
   * @param {Array} steps - 绘图步骤数组
   */
  smartDraw(steps) {
    if (!steps || !Array.isArray(steps)) {
      console.warn('smartDraw: 无效的步骤数组');
      return;
    }

    // 保存当前状态
    const savedState = {
      color: this.currentState.color,
      size: this.currentState.size,
      isFill: this.currentState.isFill
    };

    // 执行每个绘图步骤
    steps.forEach((step, index) => {
      this.debug.log(`执行绘图步骤 ${index + 1}: ${step.type}`);

      // 设置颜色
      if (step.color) {
        this.ctx.fillStyle = step.color;
        this.ctx.strokeStyle = step.color;
      }

      // 设置线宽
      if (step.lineWidth || step.size) {
        this.ctx.lineWidth = step.lineWidth || step.size || 2;
      }

      // 根据类型绘制
      switch (step.type) {
        case 'circle':
          this.drawSmartCircle(step);
          break;
        case 'ellipse':
          this.drawSmartEllipse(step);
          break;
        case 'rectangle':
          this.drawSmartRectangle(step);
          break;
        case 'triangle':
          this.drawSmartTriangle(step);
          break;
        case 'line':
          this.drawSmartLine(step);
          break;
        case 'arc':
          this.drawSmartArc(step);
          break;
        case 'path':
          this.drawSmartPath(step);
          break;
        default:
          console.warn('未知的绘图类型:', step.type);
      }
    });

    // 恢复状态
    this.currentState.color = savedState.color;
    this.currentState.size = savedState.size;
    this.currentState.isFill = savedState.isFill;
    this.ctx.fillStyle = savedState.color;
    this.ctx.strokeStyle = savedState.color;
    this.ctx.lineWidth = savedState.size;

    // 保存到历史
    this.saveToHistory();
    this.debug.log('智能绘图完成');
  }

  /**
   * 绘制智能圆形
   */
  drawSmartCircle(step) {
    const { x, y, radius, filled } = step;
    const r = radius || step.size || 50;

    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);

    if (filled) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }

  /**
   * 绘制智能椭圆
   */
  drawSmartEllipse(step) {
    const { x, y, width, height, filled } = step;
    const w = width || 50;
    const h = height || 80;

    this.ctx.beginPath();
    this.ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);

    if (filled) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }

  /**
   * 绘制智能矩形
   */
  drawSmartRectangle(step) {
    const { x, y, width, height, filled } = step;
    const w = width || 100;
    const h = height || 80;

    this.ctx.beginPath();
    this.ctx.rect(x - w / 2, y - h / 2, w, h);

    if (filled) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }

  /**
   * 绘制智能三角形
   */
  drawSmartTriangle(step) {
    const { x, y, size, filled } = step;
    const s = size || 100;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y - s / 2);
    this.ctx.lineTo(x - s / 2, y + s / 2);
    this.ctx.lineTo(x + s / 2, y + s / 2);
    this.ctx.closePath();

    if (filled) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }

  /**
   * 绘制智能直线
   */
  drawSmartLine(step) {
    const { x1, y1, x2, y2 } = step;

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  /**
   * 绘制智能弧线
   */
  drawSmartArc(step) {
    const { x, y, radius, startAngle, endAngle } = step;
    const r = radius || 30;
    const start = (startAngle || 0) * Math.PI / 180;
    const end = (endAngle || 180) * Math.PI / 180;

    this.ctx.beginPath();
    this.ctx.arc(x, y, r, start, end);
    this.ctx.stroke();
  }

  /**
   * 绘制智能路径
   */
  drawSmartPath(step) {
    const { points, filled } = step;

    if (!points || points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i][0], points[i][1]);
    }

    if (filled) {
      this.ctx.closePath();
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }
  }

  /**
   * 保存为图片
   * @param {string} format - 图片格式 (image/png/image/jpeg)
   * @param {number} quality - 图片质量 (0-1，仅对jpeg有效)
   * @returns {string} Base64编码的图片数据
   */
  saveAsImage(format = 'image/png', quality = 0.92) {
    return this.canvas.toDataURL(format, quality);
  }

  /**
   * 下载图片
   * @param {string} filename - 文件名
   * @param {string} format - 图片格式
   */
  downloadImage(filename = 'drawing', format = 'png') {
    const dataUrl = this.saveAsImage(`image/${format}`);
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = dataUrl;
    link.click();
  }

  /**
   * 获取画布尺寸
   * @returns {Object} 尺寸 {width, height}
   */
  getSize() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * 获取当前状态
   * @returns {Object} 当前状态
   */
  getState() {
    return { ...this.currentState };
  }

  /**
   * 获取历史记录信息
   * @returns {Object} 历史记录信息
   */
  getHistoryInfo() {
    return {
      canUndo: this.historyIndex > 0,
      canRedo: this.historyIndex < this.history.length - 1,
      currentIndex: this.historyIndex,
      totalSteps: this.history.length
    };
  }

  /**
   * 销毁绘图引擎
   */
  destroy() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);

    this.history = [];
    this.historyIndex = -1;
  }
}

/**
 * 创建绘图引擎实例
 * @param {HTMLCanvasElement|string} canvas - Canvas元素或ID
 * @param {Object} config - 配置选项
 * @returns {DrawingEngine} 绘图引擎实例
 */
export function createDrawingEngine(canvas, config = {}) {
  return new DrawingEngine(canvas, config);
}

/**
 * 默认绘图引擎实例
 */
export const defaultDrawingEngine = null;

/**
 * 导出默认实例和类
 */
export default {
  DrawingEngine,
  createDrawingEngine
};