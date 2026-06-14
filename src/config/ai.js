// AI 服务配置
// 阿里云通义千问 API 配置

// 从环境变量读取配置
function getEnv(key, defaultValue = '') {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof window !== 'undefined' && window.env && window.env[key]) {
    return window.env[key];
  }
  return defaultValue;
}

export const AI_CONFIG = {
  // 阿里云 API 密钥（优先从环境变量读取）
  apiKey: getEnv('ALIBABA_CLOUD_API_KEY', ''),

  // 阿里云百炼 API 端点 (兼容 OpenAI 格式)
  apiEndpoint: getEnv('API_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'),

  // 使用的模型 (qwen-turbo 免费, qwen-plus 更强)
  model: 'qwen-turbo',

  // 最大生成 tokens
  maxTokens: 150,

  // 温度参数（越低越确定，越高越有创意）
  temperature: 0.3,

  // 请求超时时间（毫秒）
  timeout: 10000,

  // 是否启用缓存
  enableCache: true,

  // 是否启用 AI 增强模式（如果没有配置密钥则自动禁用）
  enabled: !!getEnv('ALIBABA_CLOUD_API_KEY', ''),

  // 置信度阈值
  confidenceThreshold: 0.6
};

// 导出配置
export default AI_CONFIG;