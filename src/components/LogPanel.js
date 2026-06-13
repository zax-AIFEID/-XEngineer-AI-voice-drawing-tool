// 语音控制绘图工具 - 日志面板组件

import { DebugHelper } from '../utils/helpers.js';

/**
 * 日志面板组件类
 * 记录指令执行历史和系统日志
 */
export class LogPanel {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'app',
      title: options.title || '操作日志',
      maxLogs: options.maxLogs || 100,
      showTimestamp: options.showTimestamp !== false,
      showType: options.showType !== false,
      autoScroll: options.autoScroll !== false,
      expanded: options.expanded !== false,
      ...options
    };

    // 调试工具
    this.debug = DebugHelper;

    // 日志数据
    this.logs = [];

    // 面板元素
    this.panel = null;
    this.logList = null;

    // 日志类型配置
    this.logTypes = {
      info: {
        icon: 'ℹ️',
        color: '#007bff',
        bgColor: '#e3f2fd'
      },
      success: {
        icon: '✅',
        color: '#28a745',
        bgColor: '#d4edda'
      },
      warning: {
        icon: '⚠️',
        color: '#ffc107',
        bgColor: '#fff3cd'
      },
      error: {
        icon: '❌',
        color: '#dc3545',
        bgColor: '#f8d7da'
      },
      voice: {
        icon: '🎤',
        color: '#6f42c1',
        bgColor: '#e2d9f3'
      },
      command: {
        icon: '💬',
        color: '#17a2b8',
        bgColor: '#d1ecf1'
      }
    };

    // 初始化
    this.init();
  }

  /**
   * 初始化日志面板
   */
  init() {
    // 创建面板容器
    this.createPanel();

    // 创建工具栏
    this.createToolbar();

    // 创建日志列表
    this.createLogList();

    // 创建状态栏
    this.createStatusBar();

    this.debug.log('日志面板已初始化');
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
    this.panel.className = 'log-panel';
    this.panel.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-top: 15px;
      overflow: hidden;
    `;

    // 标题栏
    const header = document.createElement('div');
    header.className = 'log-header';
    header.style.cssText = `
      padding: 12px 15px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement('h3');
    title.textContent = this.options.title;
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      color: #333;
    `;

    // 折叠按钮
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'log-toggle-btn';
    toggleBtn.textContent = this.options.expanded ? '▼' : '▶';
    toggleBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 12px;
      color: #666;
      cursor: pointer;
      padding: 5px;
    `;
    toggleBtn.addEventListener('click', () => this.togglePanel());

    header.appendChild(title);
    header.appendChild(toggleBtn);
    this.panel.appendChild(header);

    // 内容区域
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'log-content';
    this.contentArea.style.cssText = `
      max-height: ${this.options.expanded ? '300px' : '0'};
      overflow: hidden;
      transition: max-height 0.3s ease;
    `;
    this.panel.appendChild(this.contentArea);

    container.appendChild(this.panel);
  }

  /**
   * 创建工具栏
   */
  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'log-toolbar';
    toolbar.style.cssText = `
      display: flex;
      gap: 10px;
      padding: 10px 15px;
      border-bottom: 1px solid #e9ecef;
      background: #fafafa;
      flex-wrap: wrap;
      align-items: center;
    `;

    // 筛选按钮组
    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group';
    filterGroup.style.cssText = `
      display: flex;
      gap: 5px;
    `;

    // 添加筛选按钮
    const filterTypes = ['all', 'voice', 'command', 'success', 'error'];
    filterTypes.forEach(type => {
      const filterBtn = document.createElement('button');
      filterBtn.className = `filter-btn ${type === 'all' ? 'active' : ''}`;
      filterBtn.textContent = this.getFilterLabel(type);
      filterBtn.dataset.filter = type;
      filterBtn.style.cssText = `
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        background: ${type === 'all' ? '#007bff' : 'white'};
        color: ${type === 'all' ? 'white' : '#333'};
        transition: all 0.2s;
      `;

      filterBtn.addEventListener('click', () => {
        this.setFilter(type, filterBtn);
      });

      filterGroup.appendChild(filterBtn);
    });

    toolbar.appendChild(filterGroup);

    // 清空按钮
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '清空日志';
    clearBtn.style.cssText = `
      padding: 4px 12px;
      border: 1px solid #dc3545;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      background: white;
      color: #dc3545;
      margin-left: auto;
      transition: all 0.2s;
    `;
    clearBtn.addEventListener('click', () => this.clearLogs());

    toolbar.appendChild(clearBtn);

    this.contentArea.appendChild(toolbar);
    this.toolbar = toolbar;
  }

  /**
   * 创建日志列表
   */
  createLogList() {
    this.logList = document.createElement('div');
    this.logList.className = 'log-list';
    this.logList.style.cssText = `
      max-height: 200px;
      overflow-y: auto;
      padding: 10px;
    `;

    this.contentArea.appendChild(this.logList);
  }

  /**
   * 创建状态栏
   */
  createStatusBar() {
    this.statusBar = document.createElement('div');
    this.statusBar.className = 'log-status-bar';
    this.statusBar.style.cssText = `
      padding: 8px 15px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      font-size: 12px;
      color: #666;
      display: flex;
      justify-content: space-between;
    `;

    this.statusBar.innerHTML = `
      <span class="log-count">日志数量: 0</span>
      <span class="log-info"></span>
    `;

    this.contentArea.appendChild(this.statusBar);
  }

  /**
   * 添加日志
   * @param {string} message - 日志消息
   * @param {string} type - 日志类型 (info/success/warning/error/voice/command)
   */
  log(message, type = 'info') {
    const logEntry = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date(),
      visible: true
    };

    this.logs.push(logEntry);

    // 限制最大日志数量
    if (this.logs.length > this.options.maxLogs) {
      const removed = this.logs.shift();
      const removedElement = document.querySelector(`[data-log-id="${removed.id}"]`);
      if (removedElement) {
        removedElement.remove();
      }
    }

    // 渲染日志
    this.renderLog(logEntry);

    // 更新状态栏
    this.updateStatusBar();

    // 自动滚动
    if (this.options.autoScroll) {
      this.scrollToBottom();
    }
  }

  /**
   * 添加语音日志
   * @param {string} transcript - 语音识别文本
   */
  addVoiceLog(transcript) {
    this.log(`🎤 识别: "${transcript}"`, 'voice');
  }

  /**
   * 添加命令日志
   * @param {string} command - 命令描述
   * @param {boolean} success - 是否成功
   */
  addCommandLog(command, success = true) {
    this.log(`${success ? '✅' : '❌'} 命令: ${command}`, success ? 'command' : 'error');
  }

  /**
   * 添加成功日志
   * @param {string} message - 消息
   */
  addSuccessLog(message) {
    this.log(`✅ ${message}`, 'success');
  }

  /**
   * 添加错误日志
   * @param {string} message - 错误消息
   */
  addErrorLog(message) {
    this.log(`❌ 错误: ${message}`, 'error');
  }

  /**
   * 添加警告日志
   * @param {string} message - 警告消息
   */
  addWarningLog(message) {
    this.log(`⚠️ ${message}`, 'warning');
  }

  /**
   * 添加信息日志
   * @param {string} message - 信息消息
   */
  addInfoLog(message) {
    this.log(`ℹ️ ${message}`, 'info');
  }

  /**
   * 渲染单个日志
   * @param {Object} logEntry - 日志条目
   */
  renderLog(logEntry) {
    const typeConfig = this.logTypes[logEntry.type] || this.logTypes.info;

    const logElement = document.createElement('div');
    logElement.className = `log-entry log-${logEntry.type}`;
    logElement.dataset.logId = logEntry.id;
    logElement.style.cssText = `
      padding: 8px 12px;
      margin-bottom: 5px;
      border-radius: 4px;
      background: ${typeConfig.bgColor};
      font-size: 13px;
      color: #333;
      display: flex;
      gap: 8px;
      align-items: flex-start;
    `;

    // 类型图标
    const icon = document.createElement('span');
    icon.textContent = typeConfig.icon;
    icon.style.cssText = `
      font-size: 14px;
      flex-shrink: 0;
    `;

    // 内容区域
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    // 消息
    const messageSpan = document.createElement('span');
    messageSpan.textContent = logEntry.message;
    messageSpan.style.cssText = `
      color: ${typeConfig.color};
      font-weight: 500;
    `;

    content.appendChild(messageSpan);

    // 时间戳
    if (this.options.showTimestamp) {
      const timeSpan = document.createElement('span');
      timeSpan.textContent = this.formatTime(logEntry.timestamp);
      timeSpan.style.cssText = `
        font-size: 11px;
        color: #999;
      `;
      content.appendChild(timeSpan);
    }

    logElement.appendChild(icon);
    logElement.appendChild(content);

    this.logList.appendChild(logElement);
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
    if (this.logList) {
      this.logList.innerHTML = '';
    }
    this.updateStatusBar();
    this.debug.log('日志已清空');
  }

  /**
   * 设置筛选
   * @param {string} filter - 筛选类型
   * @param {HTMLElement} button - 按钮元素
   */
  setFilter(filter, button) {
    // 更新按钮样式
    if (this.toolbar) {
      this.toolbar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = '#333';
      });
    }
    if (button) {
      button.style.background = '#007bff';
      button.style.color = 'white';
    }

    // 筛选日志
    this.logs.forEach(log => {
      const element = document.querySelector(`[data-log-id="${log.id}"]`);
      if (element) {
        if (filter === 'all' || log.type === filter) {
          element.style.display = 'flex';
          log.visible = true;
        } else {
          element.style.display = 'none';
          log.visible = false;
        }
      }
    });
  }

  /**
   * 更新状态栏
   */
  updateStatusBar() {
    if (!this.statusBar) return;

    const visibleCount = this.logs.filter(log => log.visible !== false).length;
    const totalCount = this.logs.length;

    this.statusBar.innerHTML = `
      <span class="log-count">日志数量: ${visibleCount}${totalCount !== visibleCount ? ` / ${totalCount}` : ''}</span>
      <span class="log-info">最大: ${this.options.maxLogs}</span>
    `;
  }

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    if (this.logList) {
      this.logList.scrollTop = this.logList.scrollHeight;
    }
  }

  /**
   * 切换面板展开/折叠
   */
  togglePanel() {
    const contentArea = this.contentArea;
    const toggleBtn = this.panel.querySelector('.log-toggle-btn');

    if (contentArea.style.maxHeight === '0px' || !contentArea.style.maxHeight) {
      contentArea.style.maxHeight = '300px';
      toggleBtn.textContent = '▼';
    } else {
      contentArea.style.maxHeight = '0px';
      toggleBtn.textContent = '▶';
    }
  }

  /**
   * 格式化时间
   * @param {Date} date - 日期对象
   * @returns {string} 格式化的时间字符串
   */
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * 获取筛选标签文本
   * @param {string} type - 筛选类型
   * @returns {string} 标签文本
   */
  getFilterLabel(type) {
    const labels = {
      'all': '全部',
      'voice': '语音',
      'command': '命令',
      'success': '成功',
      'error': '错误'
    };
    return labels[type] || type;
  }

  /**
   * 获取日志数量
   * @returns {number} 日志数量
   */
  getLogCount() {
    return this.logs.length;
  }

  /**
   * 获取所有日志
   * @returns {Array} 日志数组
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * 获取面板元素
   * @returns {HTMLElement} 面板元素
   */
  getPanel() {
    return this.panel;
  }

  /**
   * 销毁日志面板
   */
  destroy() {
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }

    this.panel = null;
    this.logList = null;
    this.logs = [];
    this.toolbar = null;
    this.statusBar = null;

    this.debug.log('日志面板已销毁');
  }
}

/**
 * 创建日志面板实例
 * @param {Object} options - 配置选项
 * @returns {LogPanel} 日志面板实例
 */
export function createLogPanel(options = {}) {
  return new LogPanel(options);
}

/**
 * 默认日志面板实例
 */
export const defaultLogPanel = null;

/**
 * 导出默认实例和类
 */
export default {
  LogPanel,
  createLogPanel
};