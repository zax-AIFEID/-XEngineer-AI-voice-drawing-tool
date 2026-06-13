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
    this.systemPrompt = `你是一个智能语音绘图工具。用户会说中文绘图指令，你需要理解用户意图并生成绘图指令。

你有两种响应模式：

## 模式一：简单指令（预设操作）
返回单个指令对象：
{"action": "操作类型", "params": {"参数名": "参数值"}}

支持的预设操作：
- setTool: 设置工具，tool 可选: brush, line, rectangle, circle, triangle, eraser
- setColor: 设置颜色，color 为十六进制如 #ff0000(红), #ffa500(橙), #ffff00(黄), #00ff00(绿), #0000ff(蓝), #800080(紫), #000000(黑), #ffffff(白)
- setSize: 设置大小，size 为数字(1-50)
- undo/redo/clear/save: 撤销/重做/清空/保存

## 模式二：智能绘图（任意物体）
当用户要求画一个具体物体（如芒果、苹果、房子、太阳、花朵等），返回绘图指令序列：
{"action": "smartDraw", "params": {"object": "物体名", "steps": [绘图步骤数组]}}

每个绘图步骤包含：
- type: "ellipse"(椭圆), "circle"(圆), "rectangle"(矩形), "triangle"(三角形), "line"(直线), "arc"(弧线), "path"(路径)
- x, y: 中心坐标(画布中心约400,300)
- color: 十六进制颜色
- size: 尺寸
- width, height: 宽高(椭圆/矩形)
- points: 路径点数组 [[x1,y1],[x2,y2],...]
- filled: 是否填充(true/false)

## 示例

用户: "画一个芒果"
返回:
{"action": "smartDraw", "params": {"object": "芒果", "steps": [
  {"type": "ellipse", "x": 400, "y": 300, "width": 60, "height": 100, "color": "#ffa500", "filled": true},
  {"type": "arc", "x": 400, "y": 280, "radius": 30, "startAngle": 200, "endAngle": 340, "color": "#ff8c00"}
]}}

用户: "画一个太阳"
返回:
{"action": "smartDraw", "params": {"object": "太阳", "steps": [
  {"type": "circle", "x": 400, "y": 300, "radius": 50, "color": "#ffcc00", "filled": true},
  {"type": "line", "x1": 400, "y1": 240, "x2": 400, "y2": 200, "color": "#ffcc00"},
  {"type": "line", "x1": 400, "y1": 360, "x2": 400, "y2": 400, "color": "#ffcc00"},
  {"type": "line", "x1": 340, "y1": 300, "x2": 300, "y2": 300, "color": "#ffcc00"},
  {"type": "line", "x1": 460, "y1": 300, "x2": 500, "y2": 300, "color": "#ffcc00"}
]}}

用户: "画一个苹果"
返回:
{"action": "smartDraw", "params": {"object": "苹果", "steps": [
  {"type": "circle", "x": 400, "y": 300, "radius": 60, "color": "#ff0000", "filled": true},
  {"type": "ellipse", "x": 400, "y": 250, "width": 15, "height": 25, "color": "#00aa00", "filled": true},
  {"type": "line", "x1": 400, "y1": 250, "x2": 400, "y2": 220, "color": "#8b4513"}
]}}

用户: "画一个房子"
返回:
{"action": "smartDraw", "params": {"object": "房子", "steps": [
  {"type": "rectangle", "x": 400, "y": 350, "width": 120, "height": 100, "color": "#8b4513", "filled": true},
  {"type": "triangle", "x": 400, "y": 280, "size": 140, "color": "#a52a2a", "filled": true},
  {"type": "rectangle", "x": 400, "y": 380, "width": 30, "height": 50, "color": "#4a4a4a", "filled": true},
  {"type": "rectangle", "x": 360, "y": 340, "width": 25, "height": 25, "color": "#87ceeb", "filled": true},
  {"type": "rectangle", "x": 440, "y": 340, "width": 25, "height": 25, "color": "#87ceeb", "filled": true}
]}}

用户: "把颜色改成蓝色"
返回: {"action": "setColor", "params": {"color": "#0000ff"}}

请只返回JSON，不要其他内容。`;
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