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

    // 绘制的图形对象列表（用于修改和选择）
    this.drawnObjects = [];

    // 当前选中的图形索引
    this.selectedObjectIndex = -1;

    // 历史记录（用于撤销/重做）
    this.history = [];
    this.historyIndex = -1;

    // 调试工具
    this.debug = {
      log: (msg) => console.log(`[DrawingEngine] ${msg}`),
      error: (msg, err) => console.error(`[DrawingEngine] ${msg}`, err)
    };

    // 网格配置（仅边框坐标标签）
    this.gridConfig = {
      enabled: true,
      majorSpacing: 100,
      showLabels: true,
      labelColor: '#888888',
      labelFont: '10px Arial'
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

    // 绘制坐标网格
    this.drawGrid();

    // 保存初始状态（不含网格）
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
   * 绘制坐标标签（不保存到历史记录）
   */
  drawGrid() {
    if (!this.gridConfig.enabled) return;

    const { width, height } = this.config;
    const { majorSpacing, showLabels, labelColor, labelFont } = this.gridConfig;

    // 保存当前绘图状态
    this.ctx.save();

    // 只在边框显示坐标标签（无网格线）
    if (showLabels) {
      this.ctx.fillStyle = labelColor;
      this.ctx.font = labelFont;

      // 顶部边框坐标（X轴）
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      for (let x = 0; x <= width; x += majorSpacing) {
        this.ctx.fillText(x.toString(), x, 2);
      }

      // 左侧边框坐标（Y轴）
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      for (let y = 0; y <= height; y += majorSpacing) {
        this.ctx.fillText(y.toString(), 2, y);
      }

      // 右侧边框坐标（Y轴）
      this.ctx.textAlign = 'right';
      for (let y = 0; y <= height; y += majorSpacing) {
        this.ctx.fillText(y.toString(), width - 2, y);
      }

      // 底部边框坐标（X轴）
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      for (let x = 0; x <= width; x += majorSpacing) {
        this.ctx.fillText(x.toString(), x, height - 2);
      }
    }

    // 恢复绘图状态
    this.ctx.restore();
  }

  /**
   * 显示/隐藏网格
   * @param {boolean} enabled - 是否显示
   */
  setGridEnabled(enabled) {
    this.gridConfig.enabled = enabled;

    // 先恢复历史状态（清除网格）
    if (this.historyIndex >= 0 && this.history[this.historyIndex]) {
      this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
    }

    // 如果启用网格，则绘制网格
    if (enabled) {
      this.drawGrid();
    }
  }

  /**
   * 重绘画布（包含网格）
   */
  redrawWithGrid() {
    // 先恢复历史状态
    if (this.historyIndex >= 0 && this.history[this.historyIndex]) {
      this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
    }

    // 然后绘制网格（叠加在上面）
    this.drawGrid();
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
    console.log('[DEBUG] setPosition 调用:', JSON.stringify(position));

    if (!position) {
      console.error('[DEBUG] setPosition 失败: position 是 undefined');
      return;
    }

    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
      console.error('[DEBUG] setPosition 失败: position.x 或 position.y 不是数字:', position);
      return;
    }

    try {
      this.currentState.position = BoundaryHelper.clampPoint(position);
      console.log('[DEBUG] setPosition 成功:', this.currentState.position);
    } catch (error) {
      console.error('[DEBUG] setPosition clampPoint 失败:', error.message);
      throw error;
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

    // 创建图形对象
    const shapeObj = {
      type: shapeType,
      x: pos.x,
      y: pos.y,
      size: size,
      color: this.currentState.color,
      filled: this.currentState.isFill
    };

    switch (shapeType) {
      case 'circle':
        shapeObj.radius = size / 2;
        this.drawCircle(pos, endPos);
        break;
      case 'rectangle':
        shapeObj.width = size;
        shapeObj.height = size;
        this.drawRectangle(pos, endPos);
        break;
      case 'triangle':
        this.drawTriangle(pos, endPos);
        break;
      case 'line':
        shapeObj.x2 = endPos.x;
        shapeObj.y2 = endPos.y;
        this.drawLine(pos, endPos);
        break;
      default:
        console.warn('Unknown shape type:', shapeType);
    }

    // 添加到图形列表
    this.addDrawnObject(shapeObj);

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
   * 绘制三角形（使用位置和大小）
   * @param {Object} position - 位置 {x, y}
   * @param {number} size - 大小
   */
  drawTriangleBySize(position, size) {
    const x = position.x;
    const y = position.y;
    const height = size;

    // 三角形顶点：顶点在上方，底边在下方
    const x1 = x;
    const y1 = y - height / 2;
    const x2 = x - size / 2;
    const y2 = y + height / 2;
    const x3 = x + size / 2;
    const y3 = y + height / 2;

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

    this.saveToHistory();
  }

  /**
   * 绘制椭圆（使用位置和宽高）
   * @param {Object} position - 位置 {x, y}
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  drawEllipseBySize(position, width, height) {
    const x = position.x;
    const y = position.y;

    this.ctx.beginPath();
    this.ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);

    if (this.currentState.isFill) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }

    this.saveToHistory();
  }

  /**
   * 绘制星星（使用位置和大小）
   * @param {Object} position - 位置 {x, y}
   * @param {number} size - 大小
   */
  drawStarBySize(position, size) {
    const x = position.x;
    const y = position.y;
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.4;
    const spikes = 5;

    this.ctx.beginPath();

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }

    this.ctx.closePath();

    if (this.currentState.isFill) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }

    this.saveToHistory();
  }

  /**
   * 绘制心形（使用位置和大小）
   * @param {Object} position - 位置 {x, y}
   * @param {number} size - 大小
   */
  drawHeartBySize(position, size) {
    const x = position.x;
    const y = position.y;
    const scale = size / 30;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y + scale * 10);

    // 左半边曲线
    this.ctx.bezierCurveTo(
      x - scale * 15, y - scale * 10,
      x - scale * 30, y + scale * 15,
      x, y + scale * 30
    );

    // 右半边曲线
    this.ctx.bezierCurveTo(
      x + scale * 30, y + scale * 15,
      x + scale * 15, y - scale * 10,
      x, y + scale * 10
    );

    this.ctx.closePath();

    if (this.currentState.isFill) {
      this.ctx.fill();
    } else {
      this.ctx.stroke();
    }

    this.saveToHistory();
  }

  /**
   * 绘制文字
   * @param {Object} position - 位置 {x, y}
   * @param {string} text - 文字内容
   * @param {number} fontSize - 字体大小（可选，默认 24）
   * @param {string} fontFamily - 字体名称（可选，默认 Arial）
   */
  drawText(position, text, fontSize = 24, fontFamily = 'Arial') {
    const x = position.x;
    const y = position.y;

    // 保存当前绘图状态
    this.ctx.save();

    // 设置字体
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = this.currentState.color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // 绘制文字
    this.ctx.fillText(text, x, y);

    // 恢复绘图状态
    this.ctx.restore();

    this.saveToHistory();
    this.debug.log(`已绘制文字: "${text}" 在位置 (${x}, ${y})`);
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
      // 撤销后重新绘制网格（叠加显示）
      this.drawGrid();
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
      // 重做后重新绘制网格（叠加显示）
      this.drawGrid();
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
    this.drawGrid();
    this.saveToHistory();
  }

  /**
   * 智能绘图 - 执行 AI 生成的绘图步骤序列
   * @param {Array} steps - 绘图步骤数组
   */
  smartDraw(steps, centerX = 400, centerY = 300) {
    if (!steps || !Array.isArray(steps)) {
      console.warn('smartDraw: 无效的步骤数组');
      return;
    }

    console.log(`[DEBUG] smartDraw 开始，中心坐标: (${centerX}, ${centerY})`);
    console.log(`[DEBUG] 绘图步骤数量: ${steps.length}`);
    console.log(`[DEBUG] 步骤详情:`, JSON.stringify(steps, null, 2));

    // 保存当前状态
    const savedState = {
      color: this.currentState.color,
      size: this.currentState.size,
      isFill: this.currentState.isFill
    };

    // 执行每个绘图步骤
    steps.forEach((step, index) => {
      console.log(`[DEBUG] ========== 步骤 ${index + 1} ==========`);
      console.log(`[DEBUG] 原始步骤:`, JSON.stringify(step));

      // 将相对坐标转换为绝对坐标
      const absoluteStep = { ...step };
      if (step.x !== undefined) {
        absoluteStep.x = centerX + step.x;
      }
      if (step.y !== undefined) {
        absoluteStep.y = centerY + step.y;
      }
      if (step.x1 !== undefined) {
        absoluteStep.x1 = centerX + step.x1;
      }
      if (step.y1 !== undefined) {
        absoluteStep.y1 = centerY + step.y1;
      }
      if (step.x2 !== undefined) {
        absoluteStep.x2 = centerX + step.x2;
      }
      if (step.y2 !== undefined) {
        absoluteStep.y2 = centerY + step.y2;
      }

      console.log(`[DEBUG] 类型: ${absoluteStep.type}, 绝对坐标: (${absoluteStep.x}, ${absoluteStep.y})`);
      console.log(`[DEBUG] 完整参数:`, JSON.stringify(absoluteStep));

      // 设置颜色
      if (absoluteStep.color) {
        this.ctx.fillStyle = absoluteStep.color;
        this.ctx.strokeStyle = absoluteStep.color;
        console.log(`[DEBUG] 设置颜色: ${absoluteStep.color}`);
      }

      // 设置线宽
      if (absoluteStep.lineWidth || absoluteStep.size) {
        this.ctx.lineWidth = absoluteStep.lineWidth || absoluteStep.size || 2;
      }

      // 根据类型绘制
      switch (absoluteStep.type) {
        case 'circle':
          console.log(`[DEBUG] 绘制圆形: radius=${absoluteStep.radius}`);
          this.drawSmartCircle(absoluteStep);
          this.addDrawnObject({
            type: 'circle',
            x: absoluteStep.x,
            y: absoluteStep.y,
            radius: absoluteStep.radius,
            color: absoluteStep.color || '#000000',
            filled: absoluteStep.filled !== false
          });
          break;
        case 'ellipse':
          console.log(`[DEBUG] 绘制椭圆: width=${absoluteStep.width}, height=${absoluteStep.height}`);
          this.drawSmartEllipse(absoluteStep);
          this.addDrawnObject({
            type: 'ellipse',
            x: absoluteStep.x,
            y: absoluteStep.y,
            width: absoluteStep.width,
            height: absoluteStep.height,
            color: absoluteStep.color || '#000000',
            filled: absoluteStep.filled !== false
          });
          break;
        case 'rectangle':
          console.log(`[DEBUG] 绘制矩形: width=${absoluteStep.width}, height=${absoluteStep.height}`);
          this.drawSmartRectangle(absoluteStep);
          this.addDrawnObject({
            type: 'rectangle',
            x: absoluteStep.x,
            y: absoluteStep.y,
            width: absoluteStep.width,
            height: absoluteStep.height,
            color: absoluteStep.color || '#000000',
            filled: absoluteStep.filled !== false
          });
          break;
        case 'triangle':
          console.log(`[DEBUG] 绘制三角形: size=${absoluteStep.size}`);
          this.drawSmartTriangle(absoluteStep);
          this.addDrawnObject({
            type: 'triangle',
            x: absoluteStep.x,
            y: absoluteStep.y,
            size: absoluteStep.size,
            color: absoluteStep.color || '#000000',
            filled: absoluteStep.filled !== false
          });
          break;
        case 'line':
          console.log(`[DEBUG] 绘制直线: (${absoluteStep.x1},${absoluteStep.y1}) -> (${absoluteStep.x2},${absoluteStep.y2})`);
          this.drawSmartLine(absoluteStep);
          this.addDrawnObject({
            type: 'line',
            x: absoluteStep.x1,
            y: absoluteStep.y1,
            x2: absoluteStep.x2,
            y2: absoluteStep.y2,
            color: absoluteStep.color || '#000000'
          });
          break;
        case 'arc':
          console.log(`[DEBUG] 绘制弧线`);
          this.drawSmartArc(absoluteStep);
          break;
        case 'path':
          console.log(`[DEBUG] 绘制路径`);
          this.drawSmartPath(absoluteStep, centerX, centerY);
          break;
        case 'star':
          console.log(`[DEBUG] 绘制星星: size=${absoluteStep.size}`);
          this.drawStarBySize({ x: absoluteStep.x, y: absoluteStep.y, size: absoluteStep.size || 50, filled: absoluteStep.filled !== false });
          this.addDrawnObject({
            type: 'star',
            x: absoluteStep.x,
            y: absoluteStep.y,
            size: absoluteStep.size || 50,
            color: absoluteStep.color || '#000000',
            filled: absoluteStep.filled !== false
          });
          break;
        case 'heart':
          console.log(`[DEBUG] 绘制心形: size=${absoluteStep.size}`);
          this.drawHeartBySize({ x: absoluteStep.x, y: absoluteStep.y, size: absoluteStep.size || 50, filled: absoluteStep.filled !== false });
          this.addDrawnObject({
            type: 'heart',
            x: absoluteStep.x,
            y: absoluteStep.y,
            size: absoluteStep.size || 50,
            color: absoluteStep.color || '#000000',
            filled: absoluteStep.filled !== false
          });
          break;
        default:
          console.warn(`[DEBUG] 未知的绘图类型: "${absoluteStep.type}"，跳过此步骤`);
      }
    });

    // 恢复状态
    this.currentState.color = savedState.color;
    this.currentState.size = savedState.size;
    this.currentState.isFill = savedState.isFill;
    this.ctx.fillStyle = savedState.color;
    this.ctx.strokeStyle = savedState.color;
    this.ctx.lineWidth = savedState.size;

    // 绘制网格（叠加显示）
    this.drawGrid();

    // 保存到历史
    this.saveToHistory();
    console.log(`[DEBUG] smartDraw 完成`);
  }

  /**
   * 添加图形对象到列表（用于后续修改）
   * @param {Object} obj - 图形对象
   */
  addDrawnObject(obj) {
    this.drawnObjects.push(obj);
    this.debug.log(`添加图形对象: ${obj.type}, 位置: (${obj.x}, ${obj.y})`);
  }

  /**
   * 选择图形（通过索引）
   * @param {number} index - 图形索引
   * @returns {boolean} 是否选择成功
   */
  selectObject(index) {
    if (index >= 0 && index < this.drawnObjects.length) {
      this.selectedObjectIndex = index;
      this.debug.log(`选中图形 #${index}: ${this.drawnObjects[index].type}`);
      this.redrawWithSelection();
      return true;
    }
    return false;
  }

  /**
   * 选择最后一个图形
   * @returns {boolean} 是否选择成功
   */
  selectLastObject() {
    if (this.drawnObjects.length > 0) {
      return this.selectObject(this.drawnObjects.length - 1);
    }
    return false;
  }

  /**
   * 选择第一个图形
   * @returns {boolean} 是否选择成功
   */
  selectFirstObject() {
    if (this.drawnObjects.length > 0) {
      return this.selectObject(0);
    }
    return false;
  }

  /**
   * 修改选中图形的属性
   * @param {Object} updates - 要修改的属性
   * @returns {boolean} 是否修改成功
   */
  modifySelectedObject(updates) {
    if (this.selectedObjectIndex >= 0 && this.selectedObjectIndex < this.drawnObjects.length) {
      const obj = this.drawnObjects[this.selectedObjectIndex];
      Object.assign(obj, updates);
      this.debug.log(`修改图形 #${this.selectedObjectIndex}:`, updates);

      // 如果修改了颜色，直接重新绘制这个图形
      if (updates.color) {
        this.redrawObjectWithNewColor(this.selectedObjectIndex, updates.color);
      } else {
        // 其他属性修改需要重绘全部
        this.redrawAll();
      }
      return true;
    }
    return false;
  }

  /**
   * 用新颜色重新绘制单个图形（保留其他内容）
   * @param {number} index - 图形索引
   * @param {string} newColor - 新颜色
   */
  redrawObjectWithNewColor(index, newColor) {
    if (index < 0 || index >= this.drawnObjects.length) return;

    const obj = this.drawnObjects[index];

    // 保存当前画布
    const currentImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // 清空画布
    this.fillBackground();

    // 恢复画布
    this.ctx.putImageData(currentImage, 0, 0);

    // 用新颜色重新绘制该图形
    this.ctx.save();
    this.ctx.fillStyle = newColor;
    this.ctx.strokeStyle = newColor;

    switch (obj.type) {
      case 'circle':
        const r = obj.radius || obj.size || 50;
        this.ctx.beginPath();
        this.ctx.arc(obj.x, obj.y, r, 0, Math.PI * 2);
        obj.filled ? this.ctx.fill() : this.ctx.stroke();
        break;
      case 'ellipse':
        const ew = obj.width || 50;
        const eh = obj.height || 80;
        this.ctx.beginPath();
        this.ctx.ellipse(obj.x, obj.y, ew / 2, eh / 2, 0, 0, Math.PI * 2);
        obj.filled ? this.ctx.fill() : this.ctx.stroke();
        break;
      case 'rectangle':
        const rw = obj.width || 100;
        const rh = obj.height || 80;
        if (obj.filled) {
          this.ctx.fillRect(obj.x - rw / 2, obj.y - rh / 2, rw, rh);
        } else {
          this.ctx.strokeRect(obj.x - rw / 2, obj.y - rh / 2, rw, rh);
        }
        break;
      case 'triangle':
        const ts = obj.size || 100;
        this.ctx.beginPath();
        this.ctx.moveTo(obj.x, obj.y - ts / 2);
        this.ctx.lineTo(obj.x - ts / 2, obj.y + ts / 2);
        this.ctx.lineTo(obj.x + ts / 2, obj.y + ts / 2);
        this.ctx.closePath();
        obj.filled ? this.ctx.fill() : this.ctx.stroke();
        break;
      case 'star':
        this.drawStarBySize({ x: obj.x, y: obj.y, size: obj.size || 50, filled: obj.filled !== false });
        break;
      case 'heart':
        this.drawHeartBySize({ x: obj.x, y: obj.y, size: obj.size || 50, filled: obj.filled !== false });
        break;
      case 'line':
        this.ctx.beginPath();
        this.ctx.moveTo(obj.x, obj.y);
        this.ctx.lineTo(obj.x2, obj.y2);
        this.ctx.stroke();
        break;
      default:
        console.warn(`未知的图形类型: ${obj.type}`);
    }

    this.ctx.restore();

    // 如果选中，重新绘制高亮
    if (this.selectedObjectIndex === index) {
      this.drawObjectHighlight(obj);
    }

    // 绘制网格
    this.drawGrid();

    // 保存到历史
    this.saveToHistory();
  }

  /**
   * 修改指定图形的属性
   * @param {number} index - 图形索引
   * @param {Object} updates - 要修改的属性
   * @returns {boolean} 是否修改成功
   */
  modifyObject(index, updates) {
    if (index >= 0 && index < this.drawnObjects.length) {
      const obj = this.drawnObjects[index];
      Object.assign(obj, updates);
      this.debug.log(`修改图形 #${index}:`, updates);
      this.redrawAll();
      return true;
    }
    return false;
  }

  /**
   * 删除选中的图形
   * @returns {boolean} 是否删除成功
   */
  deleteSelectedObject() {
    if (this.selectedObjectIndex >= 0 && this.selectedObjectIndex < this.drawnObjects.length) {
      const deleted = this.drawnObjects.splice(this.selectedObjectIndex, 1)[0];
      this.debug.log(`删除图形: ${deleted.type}`);
      this.selectedObjectIndex = -1;
      this.redrawAll();
      return true;
    }
    return false;
  }

  /**
   * 删除指定图形
   * @param {number} index - 图形索引
   * @returns {boolean} 是否删除成功
   */
  deleteObject(index) {
    if (index >= 0 && index < this.drawnObjects.length) {
      const deleted = this.drawnObjects.splice(index, 1)[0];
      this.debug.log(`删除图形 #${index}: ${deleted.type}`);
      if (this.selectedObjectIndex === index) {
        this.selectedObjectIndex = -1;
      } else if (this.selectedObjectIndex > index) {
        this.selectedObjectIndex--;
      }
      this.redrawAll();
      return true;
    }
    return false;
  }

  /**
   * 移动选中的图形
   * @param {number} dx - x方向偏移
   * @param {number} dy - y方向偏移
   * @returns {boolean} 是否移动成功
   */
  moveSelectedObject(dx, dy) {
    if (this.selectedObjectIndex >= 0 && this.selectedObjectIndex < this.drawnObjects.length) {
      const obj = this.drawnObjects[this.selectedObjectIndex];
      obj.x = (obj.x || 0) + dx;
      obj.y = (obj.y || 0) + dy;
      this.debug.log(`移动图形 #${this.selectedObjectIndex}: (${dx}, ${dy})`);
      this.redrawAll();
      return true;
    }
    return false;
  }

  /**
   * 获取图形数量
   * @returns {number} 图形数量
   */
  getObjectCount() {
    return this.drawnObjects.length;
  }

  /**
   * 获取选中的图形
   * @returns {Object|null} 选中的图形
   */
  getSelectedObject() {
    if (this.selectedObjectIndex >= 0 && this.selectedObjectIndex < this.drawnObjects.length) {
      return this.drawnObjects[this.selectedObjectIndex];
    }
    return null;
  }

  /**
   * 获取所有图形列表
   * @returns {Array} 图形列表
   */
  getDrawnObjects() {
    return [...this.drawnObjects];
  }

  /**
   * 重绘所有图形
   */
  redrawAll() {
    // 清空画布
    this.fillBackground();

    // 重新绘制所有图形
    this.drawnObjects.forEach((obj) => {
      this.drawObject(obj);
    });

    // 绘制网格
    this.drawGrid();

    // 保存到历史
    this.saveToHistory();
  }

  /**
   * 重绘所有图形并高亮选中的图形
   */
  redrawWithSelection() {
    // 保存当前画布内容
    const currentImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // 清空画布
    this.fillBackground();

    // 恢复原始画布内容
    this.ctx.putImageData(currentImage, 0, 0);

    // 如果有选中的图形，绘制高亮效果
    if (this.selectedObjectIndex >= 0 && this.selectedObjectIndex < this.drawnObjects.length) {
      const obj = this.drawnObjects[this.selectedObjectIndex];
      this.drawObjectHighlight(obj);
    }

    // 绘制网格
    this.drawGrid();
  }

  /**
   * 绘制图形的高亮效果
   * @param {Object} obj - 图形对象
   */
  drawObjectHighlight(obj) {
    if (!obj || !obj.type) return;

    // 保存状态
    this.ctx.save();

    // 设置高亮样式
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#00ff00';
    this.ctx.shadowBlur = 15;

    // 根据类型绘制高亮边框
    switch (obj.type) {
      case 'circle':
        const r = obj.radius || obj.size || 50;
        this.ctx.beginPath();
        this.ctx.arc(obj.x, obj.y, r + 5, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
      case 'ellipse':
        const ew = obj.width || 50;
        const eh = obj.height || 80;
        this.ctx.beginPath();
        this.ctx.ellipse(obj.x, obj.y, ew / 2 + 5, eh / 2 + 5, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
      case 'rectangle':
        const rw = obj.width || 100;
        const rh = obj.height || 80;
        this.ctx.strokeRect(obj.x - rw / 2 - 5, obj.y - rh / 2 - 5, rw + 10, rh + 10);
        break;
      case 'triangle':
        const ts = obj.size || 100;
        this.ctx.beginPath();
        this.ctx.moveTo(obj.x, obj.y - ts / 2 - 5);
        this.ctx.lineTo(obj.x - ts / 2 - 5, obj.y + ts / 2 + 5);
        this.ctx.lineTo(obj.x + ts / 2 + 5, obj.y + ts / 2 + 5);
        this.ctx.closePath();
        this.ctx.stroke();
        break;
      case 'star':
      case 'heart':
        const ss = obj.size || 50;
        this.ctx.beginPath();
        this.ctx.arc(obj.x, obj.y, ss / 2 + 5, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
      case 'line':
        this.ctx.beginPath();
        this.ctx.moveTo(obj.x, obj.y);
        this.ctx.lineTo(obj.x2, obj.y2);
        this.ctx.stroke();
        break;
      default:
        console.warn(`未知的图形类型: ${obj.type}`);
    }

    // 恢复状态
    this.ctx.restore();
  }

  /**
   * 绘制单个图形对象
   * @param {Object} obj - 图形对象
   * @param {boolean} isSelected - 是否选中（高亮显示）
   */
  drawObject(obj, isSelected = false) {
    if (!obj || !obj.type) return;

    // 保存状态
    this.ctx.save();

    // 设置颜色
    this.ctx.fillStyle = obj.color || '#000000';
    this.ctx.strokeStyle = obj.color || '#000000';

    // 如果选中，添加高亮边框
    if (isSelected) {
      this.ctx.shadowColor = '#00ff00';
      this.ctx.shadowBlur = 10;
    }

    // 根据类型绘制
    switch (obj.type) {
      case 'circle':
        this.drawSmartCircle(obj);
        break;
      case 'ellipse':
        this.drawSmartEllipse(obj);
        break;
      case 'rectangle':
        this.drawSmartRectangle(obj);
        break;
      case 'triangle':
        this.drawSmartTriangle(obj);
        break;
      case 'star':
        this.drawStarBySize(obj);
        break;
      case 'heart':
        this.drawHeartBySize(obj);
        break;
      case 'line':
        this.drawSmartLine(obj);
        break;
      case 'arc':
        this.drawSmartArc(obj);
        break;
      default:
        console.warn(`未知的图形类型: ${obj.type}`);
    }

    // 恢复状态
    this.ctx.restore();
  }

  /**
   * 清空图形列表
   */
  clearObjects() {
    this.drawnObjects = [];
    this.selectedObjectIndex = -1;
    this.debug.log('清空图形列表');
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
  drawSmartPath(step, centerX = 400, centerY = 300) {
    const { points, filled } = step;

    if (!points || points.length < 2) return;

    // 将相对坐标转换为绝对坐标
    const absolutePoints = points.map(p => [centerX + p[0], centerY + p[1]]);

    this.ctx.beginPath();
    this.ctx.moveTo(absolutePoints[0][0], absolutePoints[0][1]);

    for (let i = 1; i < absolutePoints.length; i++) {
      this.ctx.lineTo(absolutePoints[i][0], absolutePoints[i][1]);
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