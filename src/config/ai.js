// AI 服务配置
// 阿里云通义千问 API 配置

export const AI_CONFIG = {
  // 阿里云 API 密钥
  apiKey: 'sk-ws-H.REIMMYP.mNFE.MEQCIBYvdE6XVjHSByKX9V0UPzq-lUvBN63wE2JRiJz4pOSuAiAG23vr6suvY8lxQfdgKD-XaF3vuTenfgS07_Apsd_O3Q',

  // 阿里云百炼 API 端点 (兼容 OpenAI 格式)
  apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',

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

  // 是否启用 AI 增强模式
  enabled: true,

  // 置信度阈值
  confidenceThreshold: 0.6
};

// 导出配置
export default AI_CONFIG;