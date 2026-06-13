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
      ...options
    };

    // 调试工具
    this.debug = DebugHelper;

    // 指令列表元素
    this.commandListElement = null;

    // 当前选中的类别
    this.selectedCategory = 'all';

    // 搜索关键词
    this.searchKeyword = '';

    // 初始化
    this.init();
  }

  /**
   * 初始化帮助面板
   */
  init() {
    // 获取静态的指令列表元素
    this.commandListElement = document.getElementById('commandList');

    if (!this.commandListElement) {
      this.debug.error('找不到指令列表元素: #commandList');
      return;
    }

    // 渲染指令列表
    this.renderCommandList();

    this.debug.log('指令帮助面板已初始化');
  }

  /**
   * 渲染指令列表
   */
  renderCommandList() {
    if (!this.commandListElement) return;

    // 获取所有指令
    const commands = this.getFilteredCommands();

    // 清空列表
    this.commandListElement.innerHTML = '';

    if (commands.length === 0) {
      this.commandListElement.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <span class="empty-title">未找到匹配的指令</span>
        </div>
      `;
      return;
    }

    // 按类别分组
    const groupedCommands = this.groupCommandsByCategory(commands);

    // 渲染每个类别
    for (const [category, categoryCommands] of Object.entries(groupedCommands)) {
      const categorySection = this.createCategorySection(category, categoryCommands);
      this.commandListElement.appendChild(categorySection);
    }
  }

  /**
   * 获取过滤后的指令
   */
  getFilteredCommands() {
    let commands = ALL_COMMANDS || [];

    // 按类别过滤
    if (this.selectedCategory !== 'all') {
      commands = commands.filter(cmd => cmd.category === this.selectedCategory);
    }

    // 按关键词过滤
    if (this.searchKeyword) {
      commands = commands.filter(cmd => {
        const keywords = cmd.keywords || [];
        const description = cmd.description || '';
        const name = cmd.name || '';

        return keywords.some(k => k.toLowerCase().includes(this.searchKeyword)) ||
          description.toLowerCase().includes(this.searchKeyword) ||
          name.toLowerCase().includes(this.searchKeyword);
      });
    }

    return commands;
  }

  /**
   * 按类别分组指令
   */
  groupCommandsByCategory(commands) {
    const grouped = {};

    const categoryNames = {
      'control': '控制指令',
      'tool': '工具指令',
      'color': '颜色指令',
      'size': '大小指令',
      'position': '位置指令',
      'drawing': '绘图指令'
    };

    commands.forEach(cmd => {
      const category = cmd.category || 'other';
      if (!grouped[category]) {
        grouped[category] = {
          name: categoryNames[category] || '其他指令',
          commands: []
        };
      }
      grouped[category].commands.push(cmd);
    });

    return grouped;
  }

  /**
   * 创建类别区块
   */
  createCategorySection(category, data) {
    const section = document.createElement('div');
    section.className = 'command-category';
    section.style.cssText = `
      margin-bottom: 15px;
    `;

    // 类别标题
    const categoryTitle = document.createElement('h4');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = data.name;
    categoryTitle.style.cssText = `
      margin: 0 0 10px 0;
      padding: 8px 12px;
      background: #f0f0f0;
      border-radius: 4px;
      font-size: 14px;
      color: #333;
    `;
    section.appendChild(categoryTitle);

    // 指令列表
    const commandItems = document.createElement('div');
    commandItems.className = 'command-items';
    commandItems.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    data.commands.forEach(cmd => {
      const item = this.createCommandItem(cmd);
      commandItems.appendChild(item);
    });

    section.appendChild(commandItems);
    return section;
  }

  /**
   * 创建指令项
   */
  createCommandItem(cmd) {
    const item = document.createElement('div');
    item.className = 'command-item';
    item.style.cssText = `
      padding: 10px 12px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    `;

    // 悬停效果
    item.addEventListener('mouseenter', () => {
      item.style.background = '#f5f5f5';
      item.style.borderColor = '#007bff';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = '#fff';
      item.style.borderColor = '#e0e0e0';
    });

    // 指令名称
    const name = document.createElement('div');
    name.className = 'command-name';
    name.textContent = cmd.name || cmd.keywords?.[0] || '未知指令';
    name.style.cssText = `
      font-weight: bold;
      font-size: 14px;
      color: #333;
      margin-bottom: 4px;
    `;
    item.appendChild(name);

    // 关键词
    if (cmd.keywords && cmd.keywords.length > 0) {
      const keywords = document.createElement('div');
      keywords.className = 'command-keywords';
      keywords.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 4px;
      `;

      cmd.keywords.slice(0, 5).forEach(kw => {
        const keywordTag = document.createElement('span');
        keywordTag.className = 'keyword-tag';
        keywordTag.textContent = kw;
        keywordTag.style.cssText = `
          padding: 2px 6px;
          background: #e8f4fd;
          color: #007bff;
          border-radius: 3px;
          font-size: 12px;
        `;
        keywords.appendChild(keywordTag);
      });

      item.appendChild(keywords);
    }

    // 描述
    if (cmd.description) {
      const description = document.createElement('div');
      description.className = 'command-description';
      description.textContent = cmd.description;
      description.style.cssText = `
        font-size: 12px;
        color: #666;
      `;
      item.appendChild(description);
    }

    return item;
  }

  /**
   * 按类别过滤
   * @param {string} category - 类别
   */
  filterByCategory(category) {
    this.selectedCategory = category;
    this.renderCommandList();
  }

  /**
   * 搜索指令
   * @param {string} keyword - 搜索关键词
   */
  searchCommands(keyword) {
    this.searchKeyword = keyword.toLowerCase();
    this.renderCommandList();
  }

  /**
   * 销毁组件
   */
  destroy() {
    if (this.commandListElement) {
      this.commandListElement.innerHTML = '';
    }
    this.debug.log('指令帮助面板已销毁');
  }
}