// 语音控制绘图工具 - 控制面板组件

import { DebugHelper } from '../utils/helpers.js';

/**
 * 控制面板组件类
 * 包含语音控制按钮和绘图快捷操作
 */
export class ControlPanel {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'app',
      showVoiceControl: options.showVoiceControl !== false,
      showToolButtons: options.showToolButtons !== false,
      showActionButtons: options.showActionButtons !== false,
      onVoiceToggle: options.onVoiceToggle || null,
      onToolSelect: options.onToolSelect || null,
      onAction: options.onAction || null,
      ...options
    };

    // 调试工具
    this.debug = DebugHelper;

    // 面板元素
    this.panel = null;

    // 按钮元素
    this.buttons = {};

    // 状态
    this.isVoiceActive = false;

    // 初始化
    this.init();
  }

  /**
   * 初始化控制面板
   */
  init() {
    // 创建面板容器
    this.createPanel();

    // 创建语音控制区域
    if (this.options.showVoiceControl) {
      this.createVoiceControl();
    }

    // 创建工具按钮区域
    if (this.options.showToolButtons) {
      this.createToolButtons();
    }

    // 创建操作按钮区域
    if (this.options.showActionButtons) {
      this.createActionButtons();
    }

    this.debug.log('控制面板已初始化');
  }

  /**
   * 创建面板容器
   */
  createPanel() {
    const container = document.getElementById(this.options.containerId);
    if (!container) {
      this.debug.error('找不到容器元素:', this.options.containerId);
      return;
    }

    // 创建面板
    this.panel = document.createElement('div');
    this.panel.className = 'control-panel';
    this.panel.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-top: 15px;
    `;

    container.appendChild(this.panel);
  }

  /**
   * 创建语音控制区域
   */
  createVoiceControl() {
    const section = document.createElement('div');
    section.className = 'voice-control-section';
    section.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;

    // 标题
    const title = document.createElement('h3');
    title.textContent = '语音控制';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      color: #333;
    `;
    section.appendChild(title);

    // 语音状态指示器
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'voice-status';
    statusIndicator.id = 'voiceStatus';
    statusIndicator.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-radius: 6px;
      font-size: 14px;
      color: #666;
    `;

    const statusDot = document.createElement('span');
    statusDot.className = 'status-dot';
    statusDot.style.cssText = `
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ccc;
      transition: background 0.3s;
    `;

    const statusText = document.createElement('span');
    statusText.className = 'status-text';
    statusText.textContent = '语音未启动';

    statusIndicator.appendChild(statusDot);
    statusIndicator.appendChild(statusText);
    section.appendChild(statusIndicator);

    // 语音按钮
    const voiceButton = this.createButton({
      id: 'voiceButton',
      text: '启动语音',
      icon: '🎤',
      className: 'voice-btn',
      onClick: () => this.handleVoiceToggle()
    });
    section.appendChild(voiceButton);
    this.buttons.voice = voiceButton;

    // 添加到面板
    this.panel.appendChild(section);
  }

  /**
   * 创建工具按钮区域
   */
  createToolButtons() {
    const section = document.createElement('div');
    section.className = 'tool-buttons-section';
    section.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;

    // 标题
    const title = document.createElement('h3');
    title.textContent = '绘图工具';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      color: #333;
    `;
    section.appendChild(title);

    // 工具按钮网格
    const toolGrid = document.createElement('div');
    toolGrid.className = 'tool-grid';
    toolGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    `;

    // 工具列表
    const tools = [
      { id: 'tool-brush', name: '画笔', icon: '✏️', tool: 'brush' },
      { id: 'tool-line', name: '直线', icon: '📏', tool: 'line' },
      { id: 'tool-rectangle', name: '矩形', icon: '⬜', tool: 'rectangle' },
      { id: 'tool-circle', name: '圆形', icon: '⭕', tool: 'circle' },
      { id: 'tool-triangle', name: '三角', icon: '🔺', tool: 'triangle' },
      { id: 'tool-eraser', name: '橡皮', icon: '🧹', tool: 'eraser' }
    ];

    tools.forEach(tool => {
      const button = this.createToolButton(tool);
      toolGrid.appendChild(button);
      this.buttons[tool.id] = button;
    });

    section.appendChild(toolGrid);

    // 添加到面板
    this.panel.appendChild(section);
  }

  /**
   * 创建操作按钮区域
   */
  createActionButtons() {
    const section = document.createElement('div');
    section.className = 'action-buttons-section';
    section.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;

    // 标题
    const title = document.createElement('h3');
    title.textContent = '快捷操作';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      color: #333;
    `;
    section.appendChild(title);

    // 操作按钮网格
    const actionGrid = document.createElement('div');
    actionGrid.className = 'action-grid';
    actionGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    `;

    // 操作按钮列表
    const actions = [
      { id: 'action-undo', name: '撤销', icon: '↩️', action: 'undo' },
      { id: 'action-redo', name: '重做', icon: '↪️', action: 'redo' },
      { id: 'action-clear', name: '清空', icon: '🗑️', action: 'clear' },
      { id: 'action-save', name: '保存', icon: '💾', action: 'save' }
    ];

    actions.forEach(action => {
      const button = this.createActionButton(action);
      actionGrid.appendChild(button);
      this.buttons[action.id] = button;
    });

    section.appendChild(actionGrid);

    // 添加到面板
    this.panel.appendChild(section);
  }

  /**
   * 创建通用按钮
   * @param {Object} config - 按钮配置
   * @returns {HTMLButtonElement} 按钮元素
   */
  createButton(config) {
    const button = document.createElement('button');
    button.id = config.id;
    button.className = config.className || '';
    button.textContent = `${config.icon || ''} ${config.text || ''}`.trim();
    button.style.cssText = `
      padding: 10px 15px;
      font-size: 14px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    `;

    if (config.onClick) {
      button.addEventListener('click', config.onClick);
    }

    return button;
  }

  /**
   * 创建工具按钮
   * @param {Object} tool - 工具配置
   * @returns {HTMLButtonElement} 按钮元素
   */
  createToolButton(tool) {
    const button = this.createButton({
      id: tool.id,
      text: tool.name,
      icon: tool.icon,
      className: 'tool-btn',
      onClick: () => this.handleToolSelect(tool.tool)
    });

    // 设置工具按钮样式
    button.style.cssText = `
      padding: 8px;
      font-size: 12px;
      background: #f5f5f5;
      color: #333;
      border: 2px solid transparent;
    `;

    // 悬停效果
    button.addEventListener('mouseenter', () => {
      button.style.background = '#e0e0e0';
    });

    button.addEventListener('mouseleave', () => {
      if (button.classList.contains('active')) {
        button.style.background = '#007bff';
        button.style.color = 'white';
      } else {
        button.style.background = '#f5f5f5';
        button.style.color = '#333';
      }
    });

    return button;
  }

  /**
   * 创建操作按钮
   * @param {Object} action - 操作配置
   * @returns {HTMLButtonElement} 按钮元素
   */
  createActionButton(action) {
    const button = this.createButton({
      id: action.id,
      text: action.name,
      icon: action.icon,
      className: 'action-btn',
      onClick: () => this.handleAction(action.action)
    });

    // 设置操作按钮样式
    button.style.cssText = `
      padding: 8px;
      font-size: 12px;
      background: #f5f5f5;
      color: #333;
    `;

    // 悬停效果
    button.addEventListener('mouseenter', () => {
      button.style.background = '#e0e0e0';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#f5f5f5';
    });

    return button;
  }

  /**
   * 处理语音开关
   */
  handleVoiceToggle() {
    this.isVoiceActive = !this.isVoiceActive;

    // 更新按钮样式
    const voiceButton = this.buttons.voice;
    if (voiceButton) {
      if (this.isVoiceActive) {
        voiceButton.textContent = '🔴 停止语音';
        voiceButton.style.background = '#dc3545';
        voiceButton.style.color = 'white';
      } else {
        voiceButton.textContent = '🎤 启动语音';
        voiceButton.style.background = '#28a745';
        voiceButton.style.color = 'white';
      }
    }

    // 更新状态指示器
    this.updateVoiceStatus(this.isVoiceActive);

    // 触发回调
    if (this.options.onVoiceToggle) {
      this.options.onVoiceToggle(this.isVoiceActive);
    }
  }

  /**
   * 处理工具选择
   * @param {string} tool - 工具名称
   */
  handleToolSelect(tool) {
    // 移除所有工具按钮的激活状态
    Object.keys(this.buttons).forEach(key => {
      if (key.startsWith('tool-')) {
        const button = this.buttons[key];
        button.classList.remove('active');
        button.style.background = '#f5f5f5';
        button.style.color = '#333';
        button.style.borderColor = 'transparent';
      }
    });

    // 激活选中的工具按钮
    const selectedButton = this.buttons[`tool-${tool}`];
    if (selectedButton) {
      selectedButton.classList.add('active');
      selectedButton.style.background = '#007bff';
      selectedButton.style.color = 'white';
      selectedButton.style.borderColor = '#0056b3';
    }

    // 触发回调
    if (this.options.onToolSelect) {
      this.options.onToolSelect(tool);
    }
  }

  /**
   * 处理操作
   * @param {string} action - 操作名称
   */
  handleAction(action) {
    if (this.options.onAction) {
      this.options.onAction(action);
    }
  }

  /**
   * 更新语音状态
   * @param {boolean} isActive - 是否激活
   */
  updateVoiceStatus(isActive) {
    const statusDot = document.querySelector('#voiceStatus .status-dot');
    const statusText = document.querySelector('#voiceStatus .status-text');

    if (statusDot) {
      statusDot.style.background = isActive ? '#28a745' : '#ccc';
      if (isActive) {
        statusDot.style.animation = 'pulse 1.5s infinite';
      } else {
        statusDot.style.animation = 'none';
      }
    }

    if (statusText) {
      statusText.textContent = isActive ? '语音识别中...' : '语音未启动';
    }
  }

  /**
   * 设置语音激活状态
   * @param {boolean} isActive - 是否激活
   */
  setVoiceActive(isActive) {
    this.isVoiceActive = isActive;
    this.updateVoiceStatus(isActive);

    const voiceButton = this.buttons.voice;
    if (voiceButton) {
      if (isActive) {
        voiceButton.textContent = '🔴 停止语音';
        voiceButton.style.background = '#dc3545';
        voiceButton.style.color = 'white';
      } else {
        voiceButton.textContent = '🎤 启动语音';
        voiceButton.style.background = '#28a745';
        voiceButton.style.color = 'white';
      }
    }
  }

  /**
   * 设置当前工具
   * @param {string} tool - 工具名称
   */
  setCurrentTool(tool) {
    this.handleToolSelect(tool);
  }

  /**
   * 启用按钮
   * @param {string} buttonId - 按钮ID
   */
  enableButton(buttonId) {
    const button = this.buttons[buttonId];
    if (button) {
      button.disabled = false;
      button.style.opacity = '1';
    }
  }

  /**
   * 禁用按钮
   * @param {string} buttonId - 按钮ID
   */
  disableButton(buttonId) {
    const button = this.buttons[buttonId];
    if (button) {
      button.disabled = true;
      button.style.opacity = '0.5';
    }
  }

  /**
   * 获取按钮元素
   * @param {string} buttonId - 按钮ID
   * @returns {HTMLButtonElement|null} 按钮元素
   */
  getButton(buttonId) {
    return this.buttons[buttonId] || null;
  }

  /**
   * 获取面板元素
   * @returns {HTMLDivElement} 面板元素
   */
  getPanel() {
    return this.panel;
  }

  /**
   * 销毁控制面板
   */
  destroy() {
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }

    this.panel = null;
    this.buttons = {};

    this.debug.log('控制面板已销毁');
  }
}

/**
 * 创建控制面板实例
 * @param {Object} options - 配置选项
 * @returns {ControlPanel} 控制面板实例
 */
export function createControlPanel(options = {}) {
  return new ControlPanel(options);
}

/**
 * 默认控制面板实例
 */
export const defaultControlPanel = null;

/**
 * 导出默认实例和类
 */
export default {
  ControlPanel,
  createControlPanel
};