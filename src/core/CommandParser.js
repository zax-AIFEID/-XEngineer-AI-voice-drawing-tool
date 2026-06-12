// 语音控制绘图工具 - 指令解析引擎

import { ALL_COMMANDS } from '../config/commands.js';
import { DebugHelper, StringHelper } from '../utils/helpers.js';

/**
 * 指令解析类
 * 负责解析语音文本，提取关键词和参数，分发到相应的处理函数
 */
export class CommandParser {
  /**
   * 构造函数
   * @param {Object} config - 配置选项
   */
  constructor(config = {}) {
    this.config = {
      caseSensitive: false,
      fuzzyMatch: true,
      minMatchScore: 0.6,
      maxResults: 5,
      ...config
    };

    // 命令处理函数映射
    this.handlers = {};

    // 调试工具
    this.debug = DebugHelper;

    // 解析统计
    this.stats = {
      totalParsed: 0,
      matched: 0,
      unmatched: 0,
      avgParseTime: 0
    };
  }

  /**
   * 注册命令处理函数
   * @param {string} action - 动作名称
   * @param {Function} handler - 处理函数
   */
  registerHandler(action, handler) {
    if (typeof handler === 'function') {
      this.handlers[action] = handler;
      this.debug.log(`已注册处理函数: ${action}`);
    }
  }

  /**
   * 批量注册处理函数
   * @param {Object} handlers - 处理函数对象
   */
  registerHandlers(handlers) {
    for (const action in handlers) {
      if (typeof handlers[action] === 'function') {
        this.handlers[action] = handlers[action];
      }
    }
    this.debug.log(`已批量注册 ${Object.keys(handlers).length} 个处理函数`);
  }

  /**
   * 移除处理函数
   * @param {string} action - 动作名称
   */
  removeHandler(action) {
    if (this.handlers[action]) {
      delete this.handlers[action];
      this.debug.log(`已移除处理函数: ${action}`);
    }
  }

  /**
   * 获取处理函数
   * @param {string} action - 动作名称
   * @returns {Function|null} 处理函数
   */
  getHandler(action) {
    return this.handlers[action] || null;
  }

  /**
   * 解析文本，查找匹配的命令
   * @param {string} text - 输入文本
   * @returns {Array} 匹配的命令列表（按匹配度排序）
   */
  parse(text) {
    const startTime = performance.now();

    if (!text || typeof text !== 'string') {
      return [];
    }

    // 预处理文本
    const processedText = this.preprocessText(text);
    this.stats.totalParsed++;

    // 查找匹配的命令
    const matches = this.findMatches(processedText);

    const endTime = performance.now();
    this.stats.avgParseTime = (this.stats.avgParseTime * (this.stats.totalParsed - 1) + (endTime - startTime)) / this.stats.totalParsed;

    if (matches.length > 0) {
      this.stats.matched++;
    } else {
      this.stats.unmatched++;
    }

    return matches;
  }

  /**
   * 预处理文本
   * @param {string} text - 原始文本
   * @returns {string} 处理后的文本
   */
  preprocessText(text) {
    let processed = text.trim();

    // 转换为小写（如果不区分大小写）
    if (!this.config.caseSensitive) {
      processed = processed.toLowerCase();
    }

    // 移除多余空格
    processed = processed.replace(/\s+/g, ' ').trim();

    return processed;
  }

  /**
   * 查找匹配的命令
   * @param {string} text - 处理后的文本
   * @returns {Array} 匹配结果
   */
  findMatches(text) {
    const results = [];

    for (const command of ALL_COMMANDS) {
      // 检查命令的每个关键词
      for (const keyword of command.keywords) {
        let keywordProcessed = keyword;
        if (!this.config.caseSensitive) {
          keywordProcessed = keyword.toLowerCase();
        }

        // 检查是否匹配
        if (this.config.fuzzyMatch) {
          // 模糊匹配：文本包含关键词
          if (text.includes(keywordProcessed)) {
            const match = this.createMatch(command, keyword, text);
            if (match) {
              results.push(match);
            }
          }
        } else {
          // 精确匹配
          if (text === keywordProcessed || text.startsWith(keywordProcessed + ' ')) {
            const match = this.createMatch(command, keyword, text);
            if (match) {
              results.push(match);
            }
          }
        }
      }
    }

    // 按匹配度排序
    results.sort((a, b) => b.score - a.score);

    // 限制返回数量
    return results.slice(0, this.config.maxResults);
  }

  /**
   * 创建匹配结果对象
   * @param {Object} command - 命令配置
   * @param {string} keyword - 匹配的关键词
   * @param {string} text - 原始文本
   * @returns {Object|null} 匹配结果
   */
  createMatch(command, keyword, text) {
    try {
      const params = this.extractParams(command, text);
      const score = this.calculateMatchScore(command, keyword, text);

      if (score >= this.config.minMatchScore) {
        return {
          command,
          keyword,
          params,
          score,
          originalText: text,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      this.debug.error('创建匹配结果失败:', error);
    }

    return null;
  }

  /**
   * 提取参数
   * @param {Object} command - 命令配置
   * @param {string} text - 输入文本
   * @returns {Object} 提取的参数
   */
  extractParams(command, text) {
    const params = {};

    // 如果命令配置中已有参数，直接使用
    if (command.params && typeof command.params === 'object' && !command.params.pattern) {
      Object.assign(params, command.params);
      return params;
    }

    // 如果配置了参数提取模式
    if (command.params && command.params.pattern) {
      const pattern = command.params.pattern;
      const match = text.match(pattern);

      if (match && match.length > 1) {
        // 提取捕获组
        const groups = match.slice(1);

        // 如果有转换函数，应用转换
        if (command.params.transformer) {
          try {
            const transformed = command.params.transformer(...groups);
            if (typeof transformed === 'object') {
              Object.assign(params, transformed);
            } else {
              params.value = transformed;
            }
          } catch (error) {
            this.debug.error('参数转换失败:', error);
          }
        } else {
          // 默认转换为数字（如果是数字）
          groups.forEach((group, index) => {
            const numValue = parseFloat(group);
            if (!isNaN(numValue)) {
              params[`param${index + 1}`] = numValue;
            } else {
              params[`param${index + 1}`] = group;
            }
          });
        }

        // 如果有默认值且没有提取到参数，使用默认值
        if (command.params.defaultValue !== undefined && Object.keys(params).length === 0) {
          params.value = command.params.defaultValue;
        }
      } else if (command.params.defaultValue !== undefined) {
        // 如果没有匹配到但有默认值，使用默认值
        params.value = command.params.defaultValue;
      }
    }

    return params;
  }

  /**
   * 计算匹配分数
   * @param {Object} command - 命令配置
   * @param {string} keyword - 匹配的关键词
   * @param {string} text - 输入文本
   * @returns {number} 匹配分数 (0-1)
   */
  calculateMatchScore(command, keyword, text) {
    let score = 0;

    // 关键词匹配度（越长的关键词匹配越精确）
    const keywordLength = keyword.length;
    const textLength = text.length;
    const matchRatio = keywordLength / textLength;
    score += matchRatio * 0.5;

    // 精确匹配加分
    if (text === keyword) {
      score += 0.3;
    } else if (text.startsWith(keyword)) {
      score += 0.2;
    }

    // 参数完整性加分
    if (command.params && Object.keys(command.params).length > 0) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  /**
   * 解析并执行命令
   * @param {string} text - 输入文本
   * @returns {Object} 执行结果
   */
  parseAndExecute(text) {
    const matches = this.parse(text);

    if (matches.length === 0) {
      return {
        success: false,
        message: '未识别到命令',
        text
      };
    }

    // 选择匹配度最高的命令
    const bestMatch = matches[0];
    const { command, params } = bestMatch;

    // 获取处理函数
    const handler = this.getHandler(command.action);

    if (!handler) {
      return {
        success: false,
        message: `未找到处理函数: ${command.action}`,
        text,
        command,
        params
      };
    }

    // 执行处理函数
    try {
      const result = handler(params, command);

      // 生成反馈消息
      let feedback = command.feedback;
      if (typeof feedback === 'function') {
        feedback = feedback(params.value !== undefined ? params.value : params);
      }

      this.debug.log(`已执行命令: ${command.action}`, 'success');

      return {
        success: true,
        message: feedback,
        text,
        command,
        params,
        result,
        score: bestMatch.score
      };
    } catch (error) {
      this.debug.error(`执行命令失败: ${command.action}`, error);
      return {
        success: false,
        message: `执行命令失败: ${error.message}`,
        text,
        command,
        params,
        error
      };
    }
  }

  /**
   * 解析并获取最佳匹配
   * @param {string} text - 输入文本
   * @returns {Object|null} 最佳匹配
   */
  parseBest(text) {
    const matches = this.parse(text);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * 获取解析统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      totalParsed: 0,
      matched: 0,
      unmatched: 0,
      avgParseTime: 0
    };
  }

  /**
   * 获取所有已注册的处理函数
   * @returns {Object} 处理函数映射
   */
  getHandlers() {
    return { ...this.handlers };
  }

  /**
   * 获取支持的命令列表
   * @returns {Array} 命令列表
   */
  getSupportedCommands() {
    return ALL_COMMANDS;
  }

  /**
   * 获取支持的动作列表
   * @returns {Array} 动作列表
   */
  getSupportedActions() {
    return [...new Set(ALL_COMMANDS.map(cmd => cmd.action))];
  }
}

/**
 * 创建指令解析器实例
 * @param {Object} config - 配置选项
 * @returns {CommandParser} 指令解析器实例
 */
export function createCommandParser(config = {}) {
  return new CommandParser(config);
}

/**
 * 默认指令解析器实例
 */
export const defaultCommandParser = new CommandParser();

/**
 * 导出默认实例和类
 */
export default {
  CommandParser,
  createCommandParser,
  defaultCommandParser
};