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

你有三种响应模式：

## 模式一：简单指令（预设操作）
返回单个指令对象：
{"action": "操作类型", "params": {"参数名": "参数值"}}

支持的预设操作：
- setTool: 设置工具，tool 可选: brush, line, rectangle, circle, triangle, eraser
- setColor: 设置颜色，color 为十六进制如 #ff0000(红), #ffa500(橙), #ffff00(黄), #00ff00(绿), #0000ff(蓝), #800080(紫), #000000(黑), #ffffff(白)
- setSize: 设置大小，size 为数字(1-50)
- setFontSize: 设置字体大小，fontSize 为数字(12-100)
- undo/redo/clear/save: 撤销/重做/清空/保存

## 模式二：直接绘制形状或文字
当用户指定位置和形状时，直接绘制：
{"action": "draw", "params": {"shape": "形状类型", "x": X坐标, "y": Y坐标, "radius/radiusX/radiusY/width/height": 尺寸}}

当用户要写字时：
{"action": "drawText", "params": {"text": "文字内容", "x": X坐标, "y": Y坐标, "fontSize": 字体大小}}

支持的形状：
- circle: 圆形，需要 x, y, radius(半径)
- rectangle: 矩形，需要 x, y, width(宽), height(高)
- line: 直线，需要 x1, y1, x2, y2
- ellipse: 椭圆，需要 x, y, width(宽), height(高)
- triangle: 三角形，需要 x, y, size(大小)
- brush: 画笔曲线，需要 x, y（起点），可选 points（路径点数组）
- star: 星星，需要 x, y, size(大小)
- heart: 心形，需要 x, y, size(大小)
- text: 文字，需要 text(内容), x, y, fontSize(可选，默认24)

示例：
用户: "在坐标200,500画一个圆"
返回: {"action": "draw", "params": {"shape": "circle", "x": 200, "y": 500, "radius": 50}}

用户: "横坐标300纵坐标400画一个矩形"
返回: {"action": "draw", "params": {"shape": "rectangle", "x": 300, "y": 400, "width": 100, "height": 80}}

用户: "在坐标500,300画一个星星"
返回: {"action": "draw", "params": {"shape": "star", "x": 500, "y": 300, "size": 50}}

用户: "在坐标200,200画一个心形"
返回: {"action": "draw", "params": {"shape": "heart", "x": 200, "y": 200, "size": 60}}

用户: "写字你好"
返回: {"action": "drawText", "params": {"text": "你好", "x": 400, "y": 300, "fontSize": 24}}

用户: "在坐标100,100写字Hello"
返回: {"action": "drawText", "params": {"text": "Hello", "x": 100, "y": 100, "fontSize": 24}}

用户: "字体大小36写字测试"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setFontSize", "params": {"fontSize": 36}},
  {"action": "drawText", "params": {"text": "测试", "x": 400, "y": 300}}
]}}

## 模式三：智能绘图（任意物体）
当用户要求画一个具体物体（如芒果、苹果、房子、太阳、花朵等），返回绘图指令序列：
{"action": "smartDraw", "params": {"object": "物体名", "x": X坐标, "y": Y坐标, "steps": [绘图步骤数组]}}

如果用户指定了位置，x 和 y 是该物体的中心坐标；如果没有指定位置，默认使用画布中心 (400, 300)。

每个绘图步骤包含：
- type: "ellipse"(椭圆), "circle"(圆), "rectangle"(矩形), "triangle"(三角形), "line"(直线), "arc"(弧线), "path"(路径)
- x, y: 相对于物体中心的偏移坐标
- color: 十六进制颜色
- size: 尺寸
- width, height: 宽高(椭圆/矩形)
- points: 路径点数组 [[x1,y1],[x2,y2],...]
- filled: 是否填充(true/false)

## 示例

用户: "画一个芒果"
返回:
{"action": "smartDraw", "params": {"object": "芒果", "x": 400, "y": 300, "steps": [
  {"type": "ellipse", "x": 0, "y": 0, "width": 60, "height": 100, "color": "#ffa500", "filled": true},
  {"type": "arc", "x": 0, "y": -20, "radius": 30, "startAngle": 200, "endAngle": 340, "color": "#ff8c00"}
]}}

用户: "在坐标500,500画一个芒果"
返回:
{"action": "smartDraw", "params": {"object": "芒果", "x": 500, "y": 500, "steps": [
  {"type": "ellipse", "x": 0, "y": 0, "width": 60, "height": 100, "color": "#ffa500", "filled": true},
  {"type": "arc", "x": 0, "y": -20, "radius": 30, "startAngle": 200, "endAngle": 340, "color": "#ff8c00"}
]}}

用户: "画一个太阳"
返回:
{"action": "smartDraw", "params": {"object": "太阳", "x": 400, "y": 300, "steps": [
  {"type": "circle", "x": 0, "y": 0, "radius": 50, "color": "#ffcc00", "filled": true},
  {"type": "line", "x": 0, "y": -60, "x2": 0, "y2": -100, "color": "#ffcc00"},
  {"type": "line", "x": 0, "y": 60, "x2": 0, "y2": 100, "color": "#ffcc00"},
  {"type": "line", "x": -60, "y": 0, "x2": -100, "y2": 0, "color": "#ffcc00"},
  {"type": "line", "x": 60, "y": 0, "x2": 100, "y2": 0, "color": "#ffcc00"}
]}}

用户: "在坐标200,100画一个太阳"
返回:
{"action": "smartDraw", "params": {"object": "太阳", "x": 200, "y": 100, "steps": [
  {"type": "circle", "x": 0, "y": 0, "radius": 50, "color": "#ffcc00", "filled": true},
  {"type": "line", "x": 0, "y": -60, "x2": 0, "y2": -100, "color": "#ffcc00"},
  {"type": "line", "x": 0, "y": 60, "x2": 0, "y2": 100, "color": "#ffcc00"},
  {"type": "line", "x": -60, "y": 0, "x2": -100, "y2": 0, "color": "#ffcc00"},
  {"type": "line", "x": 60, "y": 0, "x2": 100, "y2": 0, "color": "#ffcc00"}
]}}

用户: "画一个苹果"
返回:
{"action": "smartDraw", "params": {"object": "苹果", "x": 400, "y": 300, "steps": [
  {"type": "circle", "x": 0, "y": 0, "radius": 60, "color": "#ff0000", "filled": true},
  {"type": "ellipse", "x": 0, "y": -50, "width": 15, "height": 25, "color": "#00aa00", "filled": true},
  {"type": "line", "x": 0, "y": -50, "x2": 0, "y2": -80, "color": "#8b4513"}
]}}

用户: "画一个房子"
返回:
{"action": "smartDraw", "params": {"object": "房子", "x": 400, "y": 300, "steps": [
  {"type": "rectangle", "x": 0, "y": 50, "width": 120, "height": 100, "color": "#8b4513", "filled": true},
  {"type": "triangle", "x": 0, "y": -20, "size": 140, "color": "#a52a2a", "filled": true},
  {"type": "rectangle", "x": 0, "y": 80, "width": 30, "height": 50, "color": "#4a4a4a", "filled": true},
  {"type": "rectangle", "x": -40, "y": 40, "width": 25, "height": 25, "color": "#87ceeb", "filled": true},
  {"type": "rectangle", "x": 40, "y": 40, "width": 25, "height": 25, "color": "#87ceeb", "filled": true}
]}}

用户: "把颜色改成蓝色"
返回: {"action": "setColor", "params": {"color": "#0000ff"}}

## 模式四：多步组合指令
当用户指令包含多个操作（如设置颜色+绘制形状），返回指令数组：
{"action": "multiStep", "params": {"steps": [指令数组]}}

示例：
用户: "画一个黄色的五角星"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setColor", "params": {"color": "#ffff00"}},
  {"action": "draw", "params": {"shape": "star", "x": 400, "y": 300, "size": 50}}
]}}

用户: "画一个红色的大圆"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setColor", "params": {"color": "#ff0000"}},
  {"action": "setSize", "params": {"size": 30}},
  {"action": "draw", "params": {"shape": "circle", "x": 400, "y": 300, "radius": 80}}
]}}

用户: "在坐标500,500画一个蓝色的三角形"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setColor", "params": {"color": "#0000ff"}},
  {"action": "draw", "params": {"shape": "triangle", "x": 500, "y": 500, "size": 60}}
]}}

用户: "画一个绿色的填充矩形"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setColor", "params": {"color": "#00ff00"}},
  {"action": "setFill", "params": {"fill": true}},
  {"action": "draw", "params": {"shape": "rectangle", "x": 400, "y": 300, "width": 100, "height": 80}}
]}}

用户: "粉色实心爱心"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setColor", "params": {"color": "#ff69b4"}},
  {"action": "setFill", "params": {"fill": true}},
  {"action": "draw", "params": {"shape": "heart", "x": 400, "y": 300, "size": 60}}
]}}

用户: "画一个紫色的大星星"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setColor", "params": {"color": "#800080"}},
  {"action": "setSize", "params": {"size": 30}},
  {"action": "draw", "params": {"shape": "star", "x": 400, "y": 300, "size": 80}}
]}}

用户: "在坐标500,500画一个橙色填充圆"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setColor", "params": {"color": "#ffa500"}},
  {"action": "setFill", "params": {"fill": true}},
  {"action": "draw", "params": {"shape": "circle", "x": 500, "y": 500, "radius": 60}}
]}}

用户: "画一个蓝色空心小三角形"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setColor", "params": {"color": "#0000ff"}},
  {"action": "setFill", "params": {"fill": false}},
  {"action": "setSize", "params": {"size": 5}},
  {"action": "draw", "params": {"shape": "triangle", "x": 400, "y": 300, "size": 30}}
]}}

用户: "坐标200,300画一个红色实心大椭圆"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setColor", "params": {"color": "#ff0000"}},
  {"action": "setFill", "params": {"fill": true}},
  {"action": "setSize", "params": {"size": 20}},
  {"action": "draw", "params": {"shape": "ellipse", "x": 200, "y": 300, "width": 120, "height": 80}}
]}}

用户: "画一个黄色填充的五角星，大小为50"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setColor", "params": {"color": "#ffff00"}},
  {"action": "setFill", "params": {"fill": true}},
  {"action": "draw", "params": {"shape": "star", "x": 400, "y": 300, "size": 50}}
]}}

用户: "在画布中心画一个粉色的大爱心"
返回: {"action": "multiStep", "params": {"steps": [
  {"action": "setColor", "params": {"color": "#ff69b4"}},
  {"action": "setSize", "params": {"size": 25}},
  {"action": "draw", "params": {"shape": "heart", "x": 400, "y": 300, "size": 100}}
]}}

用户: "紧贴着正方形上方画一个三角形"
返回: {"action": "smartDraw", "params": {"object": "房子", "x": 400, "y": 300, "steps": [
  {"type": "rectangle", "x": 0, "y": 50, "width": 100, "height": 100, "color": "#8b4513", "filled": true},
  {"type": "triangle", "x": 0, "y": 0, "size": 120, "color": "#a52a2a", "filled": true}
]}}

用户: "在圆的旁边画一个正方形"
返回: {"action": "smartDraw", "params": {"object": "圆和正方形", "x": 400, "y": 300, "steps": [
  {"type": "circle", "x": -60, "y": 0, "radius": 40, "color": "#ff0000", "filled": true},
  {"type": "rectangle", "x": 60, "y": -30, "width": 80, "height": 80, "color": "#0000ff", "filled": true}
]}}

用户: "在三角形下面画一个圆"
返回: {"action": "smartDraw", "params": {"object": "三角形和圆", "x": 400, "y": 300, "steps": [
  {"type": "triangle", "x": 0, "y": -30, "size": 80, "color": "#ffa500", "filled": true},
  {"type": "circle", "x": 0, "y": 50, "radius": 35, "color": "#00ff00", "filled": true}
]}}

用户: "画一个房子形状"
返回: {"action": "smartDraw", "params": {"object": "房子", "x": 400, "y": 300, "steps": [
  {"type": "rectangle", "x": 0, "y": 50, "width": 120, "height": 100, "color": "#8b4513", "filled": true},
  {"type": "triangle", "x": 0, "y": -20, "size": 140, "color": "#a52a2a", "filled": true},
  {"type": "rectangle", "x": 0, "y": 80, "width": 30, "height": 50, "color": "#4a4a4a", "filled": true}
]}}

用户: "画一个笑脸"
返回: {"action": "smartDraw", "params": {"object": "笑脸", "x": 400, "y": 300, "steps": [
  {"type": "circle", "x": 0, "y": 0, "radius": 60, "color": "#ffcc00", "filled": true},
  {"type": "circle", "x": -20, "y": -15, "radius": 8, "color": "#000000", "filled": true},
  {"type": "circle", "x": 20, "y": -15, "radius": 8, "color": "#000000", "filled": true},
  {"type": "arc", "x": 0, "y": 10, "radius": 25, "startAngle": 20, "endAngle": 160, "color": "#000000", "filled": false}
]}}

用户: "画一个月亮"
返回: {"action": "smartDraw", "params": {"object": "月亮", "x": 400, "y": 300, "steps": [
  {"type": "circle", "x": 0, "y": 0, "radius": 50, "color": "#ffffcc", "filled": true},
  {"type": "circle", "x": 15, "y": -5, "radius": 40, "color": "#ffffff", "filled": true}
]}}

用户: "画一个弯月亮"
返回: {"action": "smartDraw", "params": {"object": "弯月亮", "x": 400, "y": 300, "steps": [
  {"type": "circle", "x": 0, "y": 0, "radius": 50, "color": "#ffffcc", "filled": true},
  {"type": "circle", "x": 25, "y": 0, "radius": 42, "color": "#ffffff", "filled": true}
]}}

用户: "画一个星星和月亮"
返回: {"action": "smartDraw", "params": {"object": "星星和月亮", "x": 400, "y": 300, "steps": [
  {"type": "circle", "x": -50, "y": 0, "radius": 40, "color": "#ffffcc", "filled": true},
  {"type": "circle", "x": -35, "y": -5, "radius": 32, "color": "#ffffff", "filled": true},
  {"type": "circle", "x": 60, "y": -20, "radius": 8, "color": "#ffff00", "filled": true}
]}}

相对位置说明：
- "上方"/"上面"/"顶部": 在目标图形的上方，紧贴边缘
- "下方"/"下面"/"底部": 在目标图形的下方，紧贴边缘
- "旁边"/"左侧"/"右边": 在目标图形的左侧或右侧，紧贴边缘
- 当用户说"紧贴着A画B"或"在A旁边画B"时，使用smartDraw模式绘制组合图形

颜色映射：
- 红色: #ff0000
- 橙色: #ffa500
- 黄色: #ffff00
- 绿色: #00ff00
- 蓝色: #0000ff
- 紫色: #800080
- 粉色: #ff69b4
- 黑色: #000000
- 白色: #ffffff
- 灰色: #808080
- 棕色: #8b4513
- 金色: #ffd700
- 青色: #00ffff
- 深蓝: #000080
- 浅蓝: #add8e6
- 深红: #8b0000
- 浅绿: #90ee90

形状映射：
- 圆/圆形: circle
- 矩形/方形/长方形: rectangle
- 三角形: triangle
- 椭圆/扁圆: ellipse
- 星星/五角星: star
- 爱心/心形/心: heart
- 直线/线: line

大小映射：
- 小: size 5-10
- 中: size 15-20
- 大: size 25-30
- 超大: size 40-50

填充映射：
- 实心/填充/填满: fill true
- 空心/描边/不填充: fill false

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