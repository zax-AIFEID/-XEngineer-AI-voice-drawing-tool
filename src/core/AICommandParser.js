// AI 指令解析器 - 使用阿里云通义千问 API 增强指令理解

/**
 * AI 指令解析器类
 * 使用阿里云通义千问 API 来理解和解析复杂的语音指令
 * API 文档: https://help.aliyun.com/zh/model-studio/developer-reference/use-qwen-by-calling-api
 */
export class AICommandParser {
  constructor(options = {}) {
    this.options = {
      apiKey: options.apiKey || '',
      // 阿里云百炼 API 端点 (兼容 OpenAI 格式)
      apiEndpoint: options.apiEndpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      // 通义千问模型: qwen-turbo(免费), qwen-plus(更强), qwen-max(旗舰)
      model: options.model || 'qwen-turbo',
      maxTokens: options.maxTokens || 150,
      temperature: options.temperature || 0.3,
      timeout: options.timeout || 10000,
      enableCache: options.enableCache !== false,
      ...options
    };

    // 缓存已解析的指令
    this.cache = new Map();

    // 调试工具
    this.debug = {
      log: (msg, type = 'info') => console.log(`[AICommandParser] ${msg}`),
      error: (msg, err) => console.error(`[AICommandParser] ${msg}`, err)
    };

    // 系统提示词
    this.systemPrompt = `你是一个语音绘图工具的指令解析器。用户会说中文绘图指令，你需要将其转换为JSON格式的指令对象。

支持的操作类型：
- setTool: 设置绘图工具，参数 tool 可选值: brush(画笔), line(直线), rectangle(矩形), circle(圆形), triangle(三角形), eraser(橡皮)
- setColor: 设置颜色，参数 color 为十六进制颜色值如 #ff0000(红), #0000ff(蓝), #00ff00(绿), #000000(黑), #ffffff(白), #ffff00(黄)
- setSize: 设置大小，参数 size 为数字(1-20)
- move: 移动位置，参数 position 可选值: center(中心), top(上), bottom(下), left(左), right(右), topLeft(左上), topRight(右上), bottomLeft(左下), bottomRight(右下)
- draw: 绘制形状，参数 shape 可选值: circle, rectangle, triangle, line，参数 size 为数字
- undo: 撤销上一步操作
- redo: 重做操作
- clear: 清空画布
- save: 保存图片

请只返回JSON对象，格式如：
{"action": "操作类型", "params": {"参数名": "参数值"}}

示例：
用户输入: "画一个红色的圆"
返回: {"action": "draw", "params": {"shape": "circle", "color": "#ff0000", "size": 50}}

用户输入: "把颜色改成蓝色"
返回: {"action": "setColor", "params": {"color": "#0000ff"}}

用户输入: "用橡皮擦"
返回: {"action": "setTool", "params": {"tool": "eraser"}}`;
  }

  /**
   * 解析指令
   * @param {string} input - 用户输入的文本
   * @returns {Promise<Object|null>} - 解析后的指令对象
   */
  async parse(input) {
    if (!input || typeof input !== 'string') {
      return null;
    }

    // 清理输入
    const cleanInput = input.trim();

    // 检查缓存
    if (this.options.enableCache && this.cache.has(cleanInput)) {
      this.debug.log(`缓存命中: ${cleanInput}`);
      return this.cache.get(cleanInput);
    }

    // 调用 API
    try {
      const result = await this.callAPI(cleanInput);

      // 缓存结果
      if (this.options.enableCache && result) {
        this.cache.set(cleanInput, result);
      }

      return result;
    } catch (error) {
      this.debug.error('API 调用失败', error);
      return null;
    }
  }

  /**
   * 调用 GPT API
   * @param {string} input - 用户输入
   * @returns {Promise<Object>} - 解析结果
   */
  async callAPI(input) {
    // 请求体 (Chat Completions API 格式)
    const requestBody = {
      model: this.options.model,
      messages: [
        {
          role: 'system',
          content: this.systemPrompt
        },
        {
          role: 'user',
          content: input
        }
      ],
      max_tokens: this.options.maxTokens,
      temperature: this.options.temperature
    };

    // 执行请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      this.debug.log(`正在调用通义千问 API: "${input}"`);

      const response = await fetch(this.options.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => { });
        throw new Error(`API 请求失败: ${response.status} - ${errorData?.error?.message || '未知错误'}`);
      }

      const data = await response.json();
      this.debug.log('通义千问 API 响应成功');

      // 解析响应
      return this.parseResponse(data, input);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('API 请求超时');
      }
      throw error;
    }
  }

  /**
   * 解析 API 响应
   * @param {Object} data - API 响应数据
   * @param {string} originalInput - 原始输入
   * @returns {Object} - 标准化格式的指令
   */
  parseResponse(data, originalInput) {
    try {
      // 提取回复文本
      const text = data.choices?.[0]?.message?.content?.trim() || '';

      this.debug.log(`通义千问返回: ${text}`);

      // 尝试解析 JSON
      let parsed;
      try {
        // 移除可能的 markdown 代码块标记
        const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();
        parsed = JSON.parse(cleanText);
      } catch (parseError) {
        this.debug.error('JSON 解析失败', parseError);
        // JSON 解析失败，返回空
        return null;
      }

      // 验证格式
      if (!parsed.action) {
        this.debug.error('缺少 action 字段');
        return null;
      }

      // 标准化结果
      return {
        action: parsed.action,
        params: parsed.params || {},
        originalInput: originalInput,
        confidence: 0.9
      };
    } catch (error) {
      this.debug.error('响应解析失败', error);
      return null;
    }
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear();
    this.debug.log('缓存已清空');
  }

  /**
   * 销毁实例
   */
  destroy() {
    this.clearCache();
    this.debug.log('AICommandParser 已销毁');
  }
}

// 导出单例
let aiParserInstance = null;

/**
 * 获取 AI 指令解析器实例
 * @param {Object} options - 配置选项
 * @returns {AICommandParser} - 实例
 */
export function getAICommandParser(options = {}) {
  if (!aiParserInstance) {
    aiParserInstance = new AICommandParser(options);
  }
  return aiParserInstance;
}

/**
 * 初始化 AI 指令解析器
 * @param {string} apiKey - API 密钥
 * @param {Object} options - 其他配置
 * @returns {AICommandParser} - 实例
 */
export function initAICommandParser(apiKey, options = {}) {
  aiParserInstance = new AICommandParser({
    apiKey: apiKey,
    ...options
  });
  return aiParserInstance;
}