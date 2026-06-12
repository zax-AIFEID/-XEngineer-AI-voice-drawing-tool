// 语音控制绘图工具 - 画布组件

import { DrawingEngine } from '../core/DrawingEngine.js';
import { CANVAS_CONFIG } from '../utils/constants.js';
import { DebugHelper } from '../utils/helpers.js';

/**
 * 画布组件类
 * 管理 Canvas 元素和绘图引擎
 */
export class CanvasComponent {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'app',
      canvasId: options.canvasId || 'drawingCanvas',
      width: options.width || CANVAS_CONFIG.WIDTH,
      height: options.height || CANVAS_CONFIG.HEIGHT,
      backgroundColor: options.backgroundColor || CANVAS_CONFIG.BACKGROUND_COLOR,
      ...options
    };

    // 调试工具
    this.debug = DebugHelper;

    // Canvas 元素
    this.canvas = null;

    // 绘图引擎
    this.drawingEngine = null;

    // 状态显示元素
    this.statusElements = {};

    // 初始化
    this.init();
  }

  /**
   * 初始化画布组件
   */
  init() {
    // 创建 Canvas 元素
    this.createCanvas();

    // 创建状态显示区域
    this.createStatusDisplay();

    // 初始化绘图引擎
    this.initDrawingEngine();

    this.debug.log('画布组件已初始化');
  }

  /**
   * 创建 Canvas 元素
   */
  createCanvas() {
    // 获取容器
    const container = document.getElementById(this.options.containerId);
    if (!container) {
      this.debug.error('找不到容器元素:', this.options.containerId);
      return;
    }

    // 创建 Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = this.options.canvasId;
    this.canvas.className = 'drawing-canvas';

    // 设置样式
    this.canvas.style.border = '2px solid #333';
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.backgroundColor = this.options.backgroundColor;
    this.canvas.style.cursor = 'crosshair';
    this.canvas.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

    // 添加到容器
    container.appendChild(this.canvas);

    this.debug.log('Canvas 元素已创建');
  }

  /**
   * 创建状态显示区域
   */
  createStatusDisplay() {
    const container = document.getElementById(this.options.containerId);
    if (!container) return;

    // 创建状态显示容器
    const statusContainer = document.createElement('div');
    statusContainer.className = 'canvas-status';
    statusContainer.style.cssText = `
      display: flex;
      gap: 15px;
      padding: 10px 15px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 10px;
      font-size: 14px;
      color: #333;
    `;

    // 创建各个状态显示元素
    const statusItems = [
      { key: 'tool', label: '工具', value: '画笔' },
      { key: 'color', label: '颜色', value: '黑色', type: 'color' },
      { key: 'size', label: '大小', value: '5px' },
      { key: 'position', label: '位置', value: '中心' },
      { key: 'mode', label: '模式', value: '描边' }
    ];

    statusItems.forEach(item => {
      const statusItem = document.createElement('div');
      statusItem.className = `status-item status-${item.key}`;
      statusItem.style.cssText = `
        display: flex;
        align-items: center;
        gap: 5px;
      `;

      const label = document.createElement('span');
      label.className = 'status-label';
      label.textContent = `${item.label}:`;
      label.style.cssText = `
        font-weight: bold;
        color: #666;
      `;

      const value = document.createElement('span');
      value.className = 'status-value';
      value.id = `status-${item.key}-value`;
      value.textContent = item.value;

      if (item.type === 'color') {
        const colorPreview = document.createElement('span');
        colorPreview.className = 'color-preview';
        colorPreview.id = `status-color-preview`;
        colorPreview.style.cssText = `
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #000000;
          border: 1px solid #ccc;
          display: inline-block;
          margin-right: 5px;
        `;
        statusItem.appendChild(colorPreview);
      }

      statusItem.appendChild(label);
      statusItem.appendChild(value);
      statusContainer.appendChild(statusItem);

      this.statusElements[item.key] = value;
    });

    container.appendChild(statusContainer);

    this.debug.log('状态显示区域已创建');
  }

  /**
   * 初始化绘图引擎
   */
  initDrawingEngine() {
    if (!this.canvas) {
      this.debug.error('Canvas 元素不存在，无法初始化绘图引擎');
      return;
    }

    this.drawingEngine = new DrawingEngine(this.canvas, {
      width: this.options.width,
      height: this.options.height,
      backgroundColor: this.options.backgroundColor
    });

    this.debug.log('绘图引擎已初始化');
  }

  /**
   * 更新状态显示
   * @param {string} key - 状态键
   * @param {string} value - 状态值
   */
  updateStatus(key, value) {
    if (this.statusElements[key]) {
      this.statusElements[key].textContent = value;

      // 特殊处理颜色显示
      if (key === 'color') {
        const colorPreview = document.getElementById('status-color-preview');
        if (colorPreview) {
          colorPreview.style.background = value;
        }
      }
    }
  }

  /**
   * 更新所有状态显示
   * @param {Object} state - 状态对象
   */
  updateAllStatus(state) {
    if (state.tool) {
      this.updateStatus('tool', this.getToolDisplayName(state.tool));
    }
    if (state.color) {
      this.updateStatus('color', state.color);
    }
    if (state.size) {
      this.updateStatus('size', `${state.size}px`);
    }
    if (state.position) {
      this.updateStatus('position', `(${state.position.x}, ${state.position.y})`);
    }
    if (state.isFill !== undefined) {
      this.updateStatus('mode', state.isFill ? '填充' : '描边');
    }
  }

  /**
   * 获取工具显示名称
   * @param {string} tool - 工具名称
   * @returns {string} 显示名称
   */
  getToolDisplayName(tool) {
    const toolNames = {
      'brush': '画笔',
      'line': '直线',
      'rectangle': '矩形',
      'circle': '圆形',
      'triangle': '三角形',
      'eraser': '橡皮擦'
    };
    return toolNames[tool] || tool;
  }

  /**
   * 获取绘图引擎
   * @returns {DrawingEngine} 绘图引擎实例
   */
  getDrawingEngine() {
    return this.drawingEngine;
  }

  /**
   * 获取 Canvas 元素
   * @returns {HTMLCanvasElement} Canvas 元素
   */
  getCanvas() {
    return this.canvas;
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
   * 清空画布
   */
  clear() {
    if (this.drawingEngine) {
      this.drawingEngine.clear();
      this.debug.log('画布已清空');
    }
  }

  /**
   * 撤销
   * @returns {boolean} 是否成功
   */
  undo() {
    if (this.drawingEngine) {
      const success = this.drawingEngine.undo();
      if (success) {
        this.debug.log('已撤销');
      }
      return success;
    }
    return false;
  }

  /**
   * 重做
   * @returns {boolean} 是否成功
   */
  redo() {
    if (this.drawingEngine) {
      const success = this.drawingEngine.redo();
      if (success) {
        this.debug.log('已重做');
      }
      return success;
    }
    return false;
  }

  /**
   * 保存图片
   * @param {string} filename - 文件名
   */
  saveImage(filename = 'drawing') {
    if (this.drawingEngine) {
      this.drawingEngine.downloadImage(filename);
      this.debug.log('图片已保存');
    }
  }

  /**
   * 设置工具
   * @param {string} tool - 工具名称
   */
  setTool(tool) {
    if (this.drawingEngine) {
      this.drawingEngine.setTool(tool);
      this.updateStatus('tool', this.getToolDisplayName(tool));
    }
  }

  /**
   * 设置颜色
   * @param {string} color - 颜色值
   */
  setColor(color) {
    if (this.drawingEngine) {
      this.drawingEngine.setColor(color);
      this.updateStatus('color', color);
    }
  }

  /**
   * 设置大小
   * @param {number} size - 大小
   */
  setSize(size) {
    if (this.drawingEngine) {
      this.drawingEngine.setSize(size);
      this.updateStatus('size', `${size}px`);
    }
  }

  /**
   * 设置位置
   * @param {Object} position - 位置 {x, y}
   */
  setPosition(position) {
    if (this.drawingEngine) {
      this.drawingEngine.setPosition(position);
      this.updateStatus('position', `(${position.x}, ${position.y})`);
    }
  }

  /**
   * 设置填充模式
   * @param {boolean} isFill - 是否填充
   */
  setFillMode(isFill) {
    if (this.drawingEngine) {
      this.drawingEngine.setFillMode(isFill);
      this.updateStatus('mode', isFill ? '填充' : '描边');
    }
  }

  /**
   * 绘制图形
   * @param {string} shapeType - 图形类型
   * @param {number} size - 图形大小
   */
  drawShape(shapeType, size) {
    if (this.drawingEngine) {
      this.drawingEngine.drawShape(shapeType, size);
      this.debug.log(`已绘制 ${shapeType}`);
    }
  }

  /**
   * 移动位置
   * @param {string} direction - 方向
   * @param {number} distance - 距离
   */
  movePosition(direction, distance) {
    if (this.drawingEngine) {
      const newPosition = this.drawingEngine.movePosition(direction, distance);
      this.updateStatus('position', `(${newPosition.x}, ${newPosition.y})`);
      return newPosition;
    }
    return null;
  }

  /**
   * 销毁画布组件
   */
  destroy() {
    if (this.drawingEngine) {
      this.drawingEngine.destroy();
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.canvas = null;
    this.drawingEngine = null;
    this.statusElements = {};

    this.debug.log('画布组件已销毁');
  }
}

/**
 * 创建画布组件实例
 * @param {Object} options - 配置选项
 * @returns {CanvasComponent} 画布组件实例
 */
export function createCanvasComponent(options = {}) {
  return new CanvasComponent(options);
}

/**
 * 默认画布组件实例
 */
export const defaultCanvasComponent = null;

/**
 * 导出默认实例和类
 */
export default {
  CanvasComponent,
  createCanvasComponent
};