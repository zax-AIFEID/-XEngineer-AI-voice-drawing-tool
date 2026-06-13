// 语音控制绘图工具 - 指令帮助面板组件

import { getCommandHelp, ALL_COMMANDS } from '../config/commands.js';
import { DebugHelper } from '../utils/helpers.js';

/**
 * 指令帮助面板组件类
 * 展示所有可用的语音指令
 */
export class CommandHelp {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'app',
      title: options.title || '指令帮助',
      expanded: options.expanded !== false,
      showCategories: options.showCategories !== false,
      showSearch: options.showSearch !== false,
      ...options
    };

    // 调试工具
    this.debug = DebugHelper;

    // 面板元素
    this.panel = null;

    // 当前选中的类别
    this.selectedCategory = null;

    // 搜索关键词
    this.searchKeyword = '';

    // 初始化
    this.init();
  }

  /**
   * 初始化帮助面板
   */
  init() {
    // 创建面板容器
    this.createPanel();

    // 创建搜索框
    if (this.options.showSearch) {
      this.createSearchBox();
    }

    // 创建分类标签
    if (this.options.showCategories) {
      this.createCategoryTabs();
    }

    // 创建指令列表
    this.createCommandList();

    this.debug.log('指令帮助面板已初始化');
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
    this.panel.className = 'command-help-panel';
    this.panel.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-top: 15px;
      overflow: hidden;
    `;

    // 标题
    const header = document.createElement('div');
    header.className = 'help-header';
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
    toggleBtn.className = 'toggle-btn';
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
    this.contentArea.className = 'help-content';
    this.contentArea.style.cssText = `
      max-height: ${this.options.expanded ? '400px' : '0'};
      overflow: hidden;
      transition: max-height 0.3s ease;
    `;
    this.panel.appendChild(this.contentArea);

    container.appendChild(this.panel);
  }

  /**
   * 创建搜索框
   */
  createSearchBox() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.cssText = `
      padding: 10px 15px;
      border-bottom: 1px solid #e9ecef;
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索指令...';
    searchInput.className = 'search-input';
    searchInput.id = 'commandSearch';
    searchInput.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    `;

    searchInput.addEventListener('input', (e) => {
      this.searchKeyword = e.target.value.toLowerCase();
      this.updateCommandList();
    });

    searchContainer.appendChild(searchInput);
    this.contentArea.appendChild(searchContainer);
  }

  /**
   * 创建分类标签
   */
  createCategoryTabs() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'category-tabs';
    tabsContainer.style.cssText = `
      display: flex;
      gap: 5px;
      padding: 10px 15px;
      border-bottom: 1px solid #e9ecef;
      flex-wrap: wrap;
    `;

    // 所有类别标签
    const categories = [
      { key: 'all', label: '全部' },
      { key: 'CONTROL', label: '控制' },
      { key: 'TOOL', label: '工具' },
      { key: 'COLOR', label: '颜色' },
      { key: 'SIZE', label: '大小' },
      { key: 'POSITION', label: '位置' },
      { key: 'DRAWING', label: '绘图' }
    ];

    categories.forEach(cat => {
      const tab = document.createElement('button');
      tab.className = `category-tab ${cat.key === 'all' ? 'active' : ''}`;
      tab.textContent = cat.label;
      tab.dataset.category = cat.key;
      tab.style.cssText = `
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        background: ${cat.key === 'all' ? '#007bff' : '#f0f0f0'};
        color: ${cat.key === 'all' ? 'white' : '#333'};
        transition: all 0.2s;
      `;

      tab.addEventListener('click', () => {
        this.selectCategory(cat.key, tab);
      });

      tabsContainer.appendChild(tab);
    });

    this.contentArea.appendChild(tabsContainer);
    this.tabsContainer = tabsContainer;
  }

  /**
   * 创建指令列表
   */
  createCommandList() {
    this.listContainer = document.createElement('div');
    this.listContainer.className = 'command-list';
    this.listContainer.style.cssText = `
      max-height: 300px;
      overflow-y: auto;
      padding: 10px 15px;
    `;

    this.updateCommandList();

    this.contentArea.appendChild(this.listContainer);
  }

  /**
   * 更新指令列表
   */
  updateCommandList() {
    if (!this.listContainer) return;

    // 清空列表
    this.listContainer.innerHTML = '';

    // 获取指令
    let commands = ALL_COMMANDS;

    // 按类别筛选
    if (this.selectedCategory && this.selectedCategory !== 'all') {
      commands = commands.filter(cmd => cmd.category === this.selectedCategory);
    }

    // 按关键词搜索
    if (this.searchKeyword) {
      commands = commands.filter(cmd => {
        const keywordMatch = cmd.keywords.some(k =>
          k.toLowerCase().includes(this.searchKeyword)
        );
        const descMatch = cmd.description.toLowerCase().includes(this.searchKeyword);
        return keywordMatch || descMatch;
      });
    }

    // 按类别分组显示
    const groupedCommands = this.groupCommandsByCategory(commands);

    for (const category in groupedCommands) {
      const categoryGroup = groupedCommands[category];

      // 类别标题
      const categoryTitle = document.createElement('div');
      categoryTitle.className = 'category-title';
      categoryTitle.textContent = this.getCategoryDisplayName(category);
      categoryTitle.style.cssText = `
        font-size: 13px;
        font-weight: bold;
        color: #666;
        margin: 10px 0 5px 0;
        padding-bottom: 5px;
        border-bottom: 1px solid #eee;
      `;
      this.listContainer.appendChild(categoryTitle);

      // 指令项
      categoryGroup.forEach(command => {
        const commandItem = this.createCommandItem(command);
        this.listContainer.appendChild(commandItem);
      });
    }

    // 空状态提示
    if (commands.length === 0) {
      const emptyTip = document.createElement('div');
      emptyTip.className = 'empty-tip';
      emptyTip.textContent = '没有找到匹配的指令';
      emptyTip.style.cssText = `
        text-align: center;
        padding: 30px;
        color: #999;
        font-size: 14px;
      `;
      this.listContainer.appendChild(emptyTip);
    }
  }

  /**
   * 创建指令项
   * @param {Object} command - 指令配置
   * @returns {HTMLElement} 指令项元素
   */
  createCommandItem(command) {
    const item = document.createElement('div');
    item.className = 'command-item';
    item.style.cssText = `
      padding: 8px 10px;
      margin-bottom: 5px;
      background: #f8f9fa;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    // 左侧：关键词
    const keywordsContainer = document.createElement('div');
    keywordsContainer.className = 'command-keywords';
    keywordsContainer.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      flex: 1;
    `;

    command.keywords.slice(0, 3).forEach(keyword => {
      const keywordTag = document.createElement('span');
      keywordTag.className = 'keyword-tag';
      keywordTag.textContent = keyword;
      keywordTag.style.cssText = `
        padding: 3px 8px;
        background: #e3f2fd;
        color: #1976d2;
        border-radius: 3px;
        font-size: 12px;
      `;
      keywordsContainer.appendChild(keywordTag);
    });

    // 右侧：描述
    const desc = document.createElement('span');
    desc.className = 'command-desc';
    desc.textContent = command.description;
    desc.style.cssText = `
      font-size: 12px;
      color: #666;
      margin-left: 10px;
      white-space: nowrap;
    `;

    item.appendChild(keywordsContainer);
    item.appendChild(desc);

    return item;
  }

  /**
   * 按类别分组命令
   * @param {Array} commands - 命令列表
   * @returns {Object} 分组后的命令
   */
  groupCommandsByCategory(commands) {
    const grouped = {};

    commands.forEach(cmd => {
      if (!grouped[cmd.category]) {
        grouped[cmd.category] = [];
      }
      grouped[cmd.category].push(cmd);
    });

    return grouped;
  }

  /**
   * 获取类别显示名称
   * @param {string} category - 类别键
   * @returns {string} 显示名称
   */
  getCategoryDisplayName(category) {
    const names = {
      'CONTROL': '🎛️ 控制指令',
      'TOOL': '🛠️ 工具指令',
      'COLOR': '🎨 颜色指令',
      'SIZE': '📏 大小指令',
      'POSITION': '📍 位置指令',
      'DRAWING': '✏️ 绘图指令'
    };
    return names[category] || category;
  }

  /**
   * 选择类别
   * @param {string} category - 类别键
   * @param {HTMLElement} tabElement - 标签元素
   */
  selectCategory(category, tabElement) {
    // 更新选中状态
    if (this.tabsContainer) {
      this.tabsContainer.querySelectorAll('.category-tab').forEach(tab => {
        tab.style.background = '#f0f0f0';
        tab.style.color = '#333';
      });
    }

    if (tabElement) {
      tabElement.style.background = '#007bff';
      tabElement.style.color = 'white';
    }

    this.selectedCategory = category;
    this.updateCommandList();
  }

  /**
   * 切换面板展开/折叠
   */
  togglePanel() {
    const contentArea = this.contentArea;
    const toggleBtn = this.panel.querySelector('.toggle-btn');

    if (contentArea.style.maxHeight === '0px' || !contentArea.style.maxHeight) {
      contentArea.style.maxHeight = '400px';
      toggleBtn.textContent = '▼';
    } else {
      contentArea.style.maxHeight = '0px';
      toggleBtn.textContent = '▶';
    }
  }

  /**
   * 获取面板元素
   * @returns {HTMLElement} 面板元素
   */
  getPanel() {
    return this.panel;
  }

  /**
   * 销毁帮助面板
   */
  destroy() {
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }

    this.panel = null;
    this.listContainer = null;
    this.tabsContainer = null;
    this.contentArea = null;

    this.debug.log('指令帮助面板已销毁');
  }
}

/**
 * 创建指令帮助面板实例
 * @param {Object} options - 配置选项
 * @returns {CommandHelp} 帮助面板实例
 */
export function createCommandHelp(options = {}) {
  return new CommandHelp(options);
}

/**
 * 默认指令帮助面板实例
 */
export const defaultCommandHelp = null;

/**
 * 导出默认实例和类
 */
export default {
  CommandHelp,
  createCommandHelp
};