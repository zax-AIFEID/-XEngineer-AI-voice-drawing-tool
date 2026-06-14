// 环境变量读取工具
// 从 .env 文件或全局变量中读取配置

/**
 * 获取环境变量值
 * @param {string} key - 环境变量名
 * @param {string} defaultValue - 默认值
 * @returns {string} 环境变量值
 */
export function getEnv(key, defaultValue = '') {
  // 首先尝试从 process.env 读取（Node.js 环境）
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // 尝试从全局变量读取（浏览器环境）
  if (typeof window !== 'undefined' && window.env && window.env[key]) {
    return window.env[key];
  }
  
  // 尝试从 meta 标签读取
  if (typeof document !== 'undefined') {
    const metaTag = document.querySelector(`meta[name="env-${key}"]`);
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
  }
  
  return defaultValue;
}

/**
 * 获取阿里云 API 密钥
 * @returns {string} API 密钥
 */
export function getAlibabaCloudApiKey() {
  return getEnv('ALIBABA_CLOUD_API_KEY', '');
}

/**
 * 获取 OpenAI API 密钥
 * @returns {string} API 密钥
 */
export function getOpenAIApiKey() {
  return getEnv('OPENAI_API_KEY', '');
}

/**
 * 获取 API 基础 URL
 * @returns {string} API URL
 */
export function getApiBaseUrl() {
  return getEnv('API_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions');
}

/**
 * 检查是否配置了 API 密钥
 * @returns {boolean} 是否有有效的 API 密钥
 */
export function hasValidApiKey() {
  const key = getAlibabaCloudApiKey();
  return key && key.length > 0 && !key.includes('your_');
}

/**
 * 验证 API 密钥格式
 * @param {string} key - 密钥
 * @returns {boolean} 是否有效
 */
export function validateApiKey(key) {
  if (!key || key.length < 10) {
    return false;
  }
  // 阿里云密钥格式检查
  if (key.startsWith('sk-')) {
    return true;
  }
  return false;
}