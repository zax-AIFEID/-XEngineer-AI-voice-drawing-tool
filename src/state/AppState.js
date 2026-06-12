// 语音控制绘图工具 - 应用状态管理器

import { DEFAULT_STATE, HISTORY_CONFIG, TOOLS } from '../utils/constants.js';

/**
 * 应用状态管理器类
 * 负责管理应用的所有状态，包括工具、颜色、大小、位置等
 * 提供历史记录管理和状态变更通知机制
 */
export class AppState {
  /**
   * 构造函数
   */
  constructor() {
    // 当前状态
    this.state = { ...DEFAULT_STATE };

    // 历史记录栈
    this.history = [];
    this.historyIndex = -1;

    // 事件监听器
    this.listeners = {};

    // 初始化历史记录
    this.initHistory();
  }

  /**
   * 初始化历史记录
   */
  initHistory() {
    this.saveToHistory();
  }

  /**
   * 获取当前状态的快照
   * @returns {Object} 状态快照
   */
  getStateSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * 保存当前状态到历史记录
   */
  saveToHistory() {
    // 删除当前位置之后的历史记录
    this.history = this.history.slice(0, this.historyIndex + 1);

    // 保存当前状态
    this.history.push(this.getStateSnapshot());

    // 限制历史记录数量
    if (this.history.length > HISTORY_CONFIG.MAX_HISTORY) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }

    // 触发状态变更事件
    this.emit('historyChange', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historyLength: this.history.length
    });
  }

  /**
   * 撤销操作
   * @returns {boolean} 是否撤销成功
   */
  undo() {
    if (this.canUndo()) {
      this.historyIndex--;
      this.restoreFromHistory();
      return true;
    }
    return false;
  }

  /**
   * 重做操作
   * @returns {boolean} 是否重做成功
   */
  redo() {
    if (this.canRedo()) {
      this.historyIndex++;
      this.restoreFromHistory();
      return true;
    }
    return false;
  }

  /**
   * 从历史记录恢复状态
   */
  restoreFromHistory() {
    const snapshot = this.history[this.historyIndex];
    if (snapshot) {
      this.state = { ...snapshot };
      this.emit('stateChange', { ...this.state });
      this.emit('historyChange', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
        historyLength: this.history.length
      });
    }
  }

  /**
   * 是否可以撤销
   * @returns {boolean} 是否可以撤销
   */
  canUndo() {
    return this.historyIndex > 0;
  }

  /**
   * 是否可以重做
   * @returns {boolean} 是否可以重做
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * 清空历史记录
   */
  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
    this.saveToHistory();
  }

  /**
   * 设置当前工具
   * @param {string} tool - 工具类型
   * @returns {boolean} 是否设置成功
   */
  setTool(tool) {
    if (this.state.tool !== tool) {
      this.state.tool = tool;
      this.saveToHistory();
      this.emit('toolChange', tool);
      return true;
    }
    return false;
  }

  /**
   * 获取当前工具
   * @returns {string} 当前工具类型
   */
  getTool() {
    return this.state.tool;
  }

  /**
   * 设置当前颜色
   * @param {string} color - 颜色值
   * @returns {boolean} 是否设置成功
   */
  setColor(color) {
    if (this.state.color !== color) {
      this.state.color = color;
      this.saveToHistory();
      this.emit('colorChange', color);
      return true;
    }
    return false;
  }

  /**
   * 获取当前颜色
   * @returns {string} 当前颜色值
   */
  getColor() {
    return this.state.color;
  }

  /**
   * 设置当前画笔大小
   * @param {number} size - 画笔大小
   * @returns {boolean} 是否设置成功
   */
  setSize(size) {
    if (this.state.size !== size) {
      this.state.size = size;
      this.saveToHistory();
      this.emit('sizeChange', size);
      return true;
    }
    return false;
  }

  /**
   * 获取当前画笔大小
   * @returns {number} 当前画笔大小
   */
  getSize() {
    return this.state.size;
  }

  /**
   * 设置当前位置
   * @param {{x: number, y: number}} position - 位置坐标
   * @returns {boolean} 是否设置成功
   */
  setPosition(position) {
    const prevPosition = this.state.position;
    if (prevPosition.x !== position.x || prevPosition.y !== position.y) {
      this.state.position = { ...position };
      this.saveToHistory();
      this.emit('positionChange', { ...position });
      return true;
    }
    return false;
  }

  /**
   * 获取当前位置
   * @returns {{x: number, y: number}} 当前位置坐标
   */
  getPosition() {
    return { ...this.state.position };
  }

  /**
   * 设置绘图模式
   * @param {boolean} isFill - 是否为填充模式
   * @returns {boolean} 是否设置成功
   */
  setFillMode(isFill) {
    if (this.state.drawingMode !== (isFill ? 'fill' : 'stroke')) {
      this.state.drawingMode = isFill ? 'fill' : 'stroke';
      this.saveToHistory();
      this.emit('fillModeChange', isFill);
      return true;
    }
    return false;
  }

  /**
   * 获取当前绘图模式
   * @returns {string} 当前绘图模式 ('fill' 或 'stroke')
   */
  getFillMode() {
    return this.state.drawingMode;
  }

  /**
   * 设置是否正在绘图
   * @param {boolean} isDrawing - 是否正在绘图
   */
  setIsDrawing(isDrawing) {
    this.state.isDrawing = isDrawing;
    this.emit('drawingChange', isDrawing);
  }

  /**
   * 获取是否正在绘图
   * @returns {boolean} 是否正在绘图
   */
  getIsDrawing() {
    return this.state.isDrawing;
  }

  /**
   * 重置状态为默认值
   */
  reset() {
    this.state = { ...DEFAULT_STATE };
    this.clearHistory();
    this.emit('stateChange', { ...this.state });
  }

  /**
   * 注册事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  /**
   * 移除事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(
        listener => listener !== callback
      );
    }
  }

  /**
   * 触发事件
   * @param {string} eventName - 事件名称
   * @param {any} data - 事件数据
   */
  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('事件处理错误:', error);
        }
      });
    }
  }

  /**
   * 获取当前完整状态
   * @returns {Object} 当前状态
   */
  getState() {
    return { ...this.state };
  }

  /**
   * 设置完整状态
   * @param {Object} newState - 新状态
   */
  setState(newState) {
    this.state = { ...DEFAULT_STATE, ...newState };
    this.saveToHistory();
    this.emit('stateChange', { ...this.state });
  }

  /**
   * 获取历史记录信息
   * @returns {Object} 历史记录信息
   */
  getHistoryInfo() {
    return {
      currentIndex: this.historyIndex,
      totalLength: this.history.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }

  /**
   * 批量更新状态
   * @param {Object} updates - 状态更新对象
   * @returns {boolean} 是否更新成功
   */
  update(updates) {
    let hasChanges = false;

    if (updates.tool !== undefined && this.state.tool !== updates.tool) {
      this.state.tool = updates.tool;
      hasChanges = true;
    }

    if (updates.color !== undefined && this.state.color !== updates.color) {
      this.state.color = updates.color;
      hasChanges = true;
    }

    if (updates.size !== undefined && this.state.size !== updates.size) {
      this.state.size = updates.size;
      hasChanges = true;
    }

    if (updates.position !== undefined) {
      const prevPos = this.state.position;
      if (prevPos.x !== updates.position.x || prevPos.y !== updates.position.y) {
        this.state.position = { ...updates.position };
        hasChanges = true;
      }
    }

    if (updates.drawingMode !== undefined && this.state.drawingMode !== updates.drawingMode) {
      this.state.drawingMode = updates.drawingMode;
      hasChanges = true;
    }

    if (hasChanges) {
      this.saveToHistory();
      this.emit('stateChange', { ...this.state });
    }

    return hasChanges;
  }

  /**
   * 检查工具是否为画笔类工具
   * @returns {boolean} 是否为画笔类工具
   */
  isBrushTool() {
    return [TOOLS.BRUSH, TOOLS.LINE].includes(this.state.tool);
  }

  /**
   * 检查工具是否为形状工具
   * @returns {boolean} 是否为形状工具
   */
  isShapeTool() {
    return [TOOLS.RECTANGLE, TOOLS.CIRCLE, TOOLS.TRIANGLE].includes(this.state.tool);
  }

  /**
   * 检查工具是否为橡皮擦
   * @returns {boolean} 是否为橡皮擦
   */
  isEraser() {
    return this.state.tool === TOOLS.ERASER;
  }

  /**
   * 销毁状态管理器
   */
  destroy() {
    this.listeners = {};
    this.history = [];
    this.state = null;
  }
}

/**
 * 创建状态管理器实例
 * @returns {AppState} 状态管理器实例
 */
export function createAppState() {
  return new AppState();
}

/**
 * 默认状态管理器实例
 */
export const defaultAppState = new AppState();

/**
 * 导出默认实例和类
 */
export default {
  AppState,
  createAppState,
  defaultAppState
};