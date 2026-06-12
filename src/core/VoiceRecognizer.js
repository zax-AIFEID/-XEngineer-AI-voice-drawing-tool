// 语音控制绘图工具 - 语音识别模块

import { SPEECH_CONFIG } from '../utils/constants.js';
import { DebugHelper } from '../utils/helpers.js';

/**
 * 语音识别类
 * 封装 Web Speech API，处理语音到文本的转换
 */
export class VoiceRecognizer {
  /**
   * 构造函数
   * @param {Object} config - 配置选项
   */
  constructor(config = {}) {
    // 获取 SpeechRecognition 接口（兼容不同浏览器）
    this.SpeechRecognition = window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      null;

    // 配置参数
    this.config = {
      lang: config.lang || SPEECH_CONFIG.LANG,
      continuous: config.continuous !== undefined ? config.continuous : SPEECH_CONFIG.CONTINUOUS,
      interimResults: config.interimResults !== undefined ? config.interimResults : SPEECH_CONFIG.INTERIM_RESULTS,
      maxAlternatives: config.maxAlternatives || 1,
      enabled: true,
      ...config
    };

    // 识别器实例
    this.recognizer = null;

    // 状态
    this.isListening = false;
    this.isPaused = false;
    this.currentTranscript = '';

    // 事件监听器
    this.listeners = {};

    // 调试工具
    this.debug = DebugHelper;
  }

  /**
   * 检查浏览器是否支持语音识别
   * @returns {boolean} 是否支持
   */
  isSupported() {
    return !!this.SpeechRecognition;
  }

  /**
   * 初始化识别器
   */
  initRecognizer() {
    if (!this.isSupported()) {
      this.debug.error('浏览器不支持语音识别功能');
      return;
    }

    if (this.recognizer) {
      this.recognizer.abort();
    }

    this.recognizer = new this.SpeechRecognition();

    // 配置识别器
    this.recognizer.lang = this.config.lang;
    this.recognizer.continuous = this.config.continuous;
    this.recognizer.interimResults = this.config.interimResults;
    this.recognizer.maxAlternatives = this.config.maxAlternatives;

    // 设置事件监听器
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    if (!this.recognizer) return;

    // 语音识别结果事件
    this.recognizer.onresult = (event) => {
      this.handleResult(event);
    };

    // 语音识别开始事件
    this.recognizer.onstart = () => {
      this.handleStart();
    };

    // 语音识别结束事件
    this.recognizer.onend = () => {
      this.handleEnd();
    };

    // 语音识别错误事件
    this.recognizer.onerror = (event) => {
      this.handleError(event);
    };

    // 语音识别声音开始事件
    this.recognizer.onsoundstart = () => {
      this.handleSoundStart();
    };

    // 语音识别声音结束事件
    this.recognizer.onsoundend = () => {
      this.handleSoundEnd();
    };

    // 语音识别语音开始事件
    this.recognizer.onspeechstart = () => {
      this.handleSpeechStart();
    };

    // 语音识别语音结束事件
    this.recognizer.onspeechend = () => {
      this.handleSpeechEnd();
    };
  }

  /**
   * 处理识别结果
   * @param {SpeechRecognitionEvent} event - 识别事件
   */
  handleResult(event) {
    let transcript = '';
    let isFinal = false;

    // 收集所有识别结果
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }

    this.currentTranscript = transcript;

    // 触发事件
    this.emit('result', {
      transcript,
      isFinal,
      event
    });

    if (isFinal) {
      this.emit('finalResult', {
        transcript,
        event
      });
    } else {
      this.emit('interimResult', {
        transcript,
        event
      });
    }
  }

  /**
   * 处理识别开始
   */
  handleStart() {
    this.isListening = true;
    this.isPaused = false;

    this.debug.log('语音识别已开始');
    this.emit('start', {});
  }

  /**
   * 处理识别结束
   */
  handleEnd() {
    this.isListening = false;

    // 如果是连续模式且未暂停，自动重新开始
    if (this.config.continuous && !this.isPaused && this.config.enabled) {
      this.start();
      return;
    }

    this.debug.log('语音识别已结束');
    this.emit('end', {});
  }

  /**
   * 处理识别错误
   * @param {SpeechRecognitionError} event - 错误事件
   */
  handleError(event) {
    this.isListening = false;

    const errorMessages = {
      'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问',
      'no-speech': '未检测到语音输入',
      'aborted': '语音识别已中止',
      'audio-capture': '无法访问麦克风设备',
      'network': '网络连接错误',
      'not-supported': '浏览器不支持语音识别',
      'service-not-allowed': '语音识别服务不可用',
      'bad-grammar': '语法错误',
      'language-not-supported': '不支持的语言'
    };

    const message = errorMessages[event.error] || `语音识别错误: ${event.error}`;

    this.debug.error(message);
    this.emit('error', {
      error: event.error,
      message,
      event
    });
  }

  /**
   * 处理声音开始
   */
  handleSoundStart() {
    this.emit('soundStart', {});
  }

  /**
   * 处理声音结束
   */
  handleSoundEnd() {
    this.emit('soundEnd', {});
  }

  /**
   * 处理语音开始
   */
  handleSpeechStart() {
    this.emit('speechStart', {});
  }

  /**
   * 处理语音结束
   */
  handleSpeechEnd() {
    this.emit('speechEnd', {});
  }

  /**
   * 开始语音识别
   * @returns {boolean} 是否成功开始
   */
  start() {
    if (!this.config.enabled) {
      this.debug.warning('语音识别已被禁用');
      return false;
    }

    if (!this.isSupported()) {
      this.debug.error('浏览器不支持语音识别');
      return false;
    }

    if (this.isListening) {
      this.debug.warning('语音识别已在运行中');
      return false;
    }

    // 初始化识别器
    if (!this.recognizer) {
      this.initRecognizer();
    }

    try {
      this.recognizer.start();
      this.isPaused = false;
      return true;
    } catch (error) {
      this.debug.error('启动语音识别失败:', error);
      this.emit('error', {
        error: 'start-failed',
        message: '启动语音识别失败',
        event: error
      });
      return false;
    }
  }

  /**
   * 停止语音识别
   */
  stop() {
    if (!this.recognizer || !this.isListening) {
      return;
    }

    this.isPaused = false;
    this.config.continuous = false;

    try {
      this.recognizer.abort();
    } catch (error) {
      this.debug.error('停止语音识别失败:', error);
    }
  }

  /**
   * 暂停语音识别
   */
  pause() {
    if (!this.recognizer || !this.isListening) {
      return;
    }

    this.isPaused = true;

    try {
      this.recognizer.abort();
      this.debug.log('语音识别已暂停');
      this.emit('pause', {});
    } catch (error) {
      this.debug.error('暂停语音识别失败:', error);
    }
  }

  /**
   * 恢复语音识别
   */
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      return this.start();
    }
    return false;
  }

  /**
   * 获取当前识别文本
   * @returns {string} 当前识别文本
   */
  getTranscript() {
    return this.currentTranscript;
  }

  /**
   * 清空当前识别文本
   */
  clearTranscript() {
    this.currentTranscript = '';
  }

  /**
   * 设置语言
   * @param {string} lang - 语言代码
   */
  setLanguage(lang) {
    this.config.lang = lang;
    if (this.recognizer) {
      this.recognizer.lang = lang;
    }
  }

  /**
   * 设置是否连续识别
   * @param {boolean} continuous - 是否连续识别
   */
  setContinuous(continuous) {
    this.config.continuous = continuous;
    if (this.recognizer) {
      this.recognizer.continuous = continuous;
    }
  }

  /**
   * 设置是否返回中间结果
   * @param {boolean} interimResults - 是否返回中间结果
   */
  setInterimResults(interimResults) {
    this.config.interimResults = interimResults;
    if (this.recognizer) {
      this.recognizer.interimResults = interimResults;
    }
  }

  /**
   * 启用/禁用语音识别
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    if (!enabled && this.isListening) {
      this.stop();
    }
  }

  /**
   * 注册事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  /**
   * 移除事件监听器
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(
        listener => listener !== callback
      );
    }
  }

  /**
   * 触发事件
   * @param {string} eventName - 事件名称
   * @param {Object} data - 事件数据
   */
  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.debug.error('事件处理错误:', error);
        }
      });
    }
  }

  /**
   * 获取当前状态
   * @returns {Object} 当前状态
   */
  getStatus() {
    return {
      isListening: this.isListening,
      isPaused: this.isPaused,
      isSupported: this.isSupported(),
      isEnabled: this.config.enabled,
      lang: this.config.lang,
      continuous: this.config.continuous,
      interimResults: this.config.interimResults,
      currentTranscript: this.currentTranscript
    };
  }

  /**
   * 销毁语音识别器
   */
  destroy() {
    this.stop();

    if (this.recognizer) {
      this.recognizer = null;
    }

    this.listeners = {};
    this.currentTranscript = '';
  }
}

/**
 * 创建语音识别器实例
 * @param {Object} config - 配置选项
 * @returns {VoiceRecognizer} 语音识别器实例
 */
export function createVoiceRecognizer(config = {}) {
  return new VoiceRecognizer(config);
}

/**
 * 默认语音识别器实例
 */
export const defaultVoiceRecognizer = new VoiceRecognizer();

/**
 * 导出默认实例和类
 */
export default {
  VoiceRecognizer,
  createVoiceRecognizer,
  defaultVoiceRecognizer
};