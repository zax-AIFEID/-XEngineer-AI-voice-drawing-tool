// 语音控制绘图工具 - 语音合成反馈工具

import { FEEDBACK_CONFIG, SUCCESS_MESSAGES, ERROR_MESSAGES } from './constants.js';

/**
 * 语音反馈工具类
 * 封装 Web Speech API 的语音合成功能
 */
export class SpeechFeedback {
  /**
   * 构造函数
   * @param {Object} config - 配置选项
   */
  constructor(config = {}) {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.queue = [];
    this.isPlayingQueue = false;

    // 配置参数
    this.config = {
      rate: config.rate || FEEDBACK_CONFIG.RATE,
      pitch: config.pitch || FEEDBACK_CONFIG.PITCH,
      volume: config.volume || FEEDBACK_CONFIG.VOLUME,
      lang: config.lang || 'zh-CN',
      voice: null, // 默认语音
      enabled: true, // 是否启用语音反馈
      ...config
    };

    // 初始化
    this.init();
  }

  /**
   * 初始化语音合成
   */
  init() {
    if (!this.synthesis) {
      console.warn('浏览器不支持语音合成功能');
      this.config.enabled = false;
      return;
    }

    // 加载语音列表
    this.loadVoices();

    // 监听语音列表变化
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }

    // 监听语音结束事件
    this.synthesis.onend = () => {
      this.isSpeaking = false;
      this.playNextInQueue();
    };

    // 监听语音错误事件
    this.synthesis.onerror = (event) => {
      console.error('语音合成错误:', event.error);
      this.isSpeaking = false;
      this.playNextInQueue();
    };
  }

  /**
   * 加载可用语音列表
   */
  loadVoices() {
    this.voices = this.synthesis.getVoices();

    // 优先选择中文语音
    if (!this.config.voice && this.voices.length > 0) {
      this.config.voice = this.voices.find(voice =>
        voice.lang.includes('zh') || voice.lang.includes('CN')
      ) || this.voices[0];
    }
  }

  /**
   * 播放语音消息
   * @param {string} text - 要播放的文本
   * @param {Object} options - 播放选项
   * @returns {SpeechSynthesisUtterance} 语音合成对象
   */
  speak(text, options = {}) {
    if (!this.config.enabled || !this.synthesis) {
      return null;
    }

    // 验证文本
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('无效的语音文本:', text);
      return null;
    }

    // 创建语音合成对象
    const utterance = new SpeechSynthesisUtterance(text);

    // 配置语音参数
    utterance.rate = options.rate || this.config.rate;
    utterance.pitch = options.pitch || this.config.pitch;
    utterance.volume = options.volume || this.config.volume;
    utterance.lang = options.lang || this.config.lang;
    utterance.voice = options.voice || this.config.voice;

    // 添加到队列
    if (options.queue !== false) {
      this.queue.push(utterance);
      this.playQueue();
      return utterance;
    }

    // 直接播放
    this.synthesis.speak(utterance);
    this.isSpeaking = true;
    this.currentUtterance = utterance;

    return utterance;
  }

  /**
   * 播放队列中的语音
   */
  playQueue() {
    if (this.isPlayingQueue || this.queue.length === 0 || this.isSpeaking) {
      return;
    }

    this.isPlayingQueue = true;
    this.playNextInQueue();
  }

  /**
   * 播放下一条语音
   */
  playNextInQueue() {
    if (this.queue.length === 0) {
      this.isPlayingQueue = false;
      return;
    }

    const utterance = this.queue.shift();
    this.synthesis.speak(utterance);
    this.isSpeaking = true;
    this.currentUtterance = utterance;
  }

  /**
   * 清空语音队列
   */
  clearQueue() {
    this.queue = [];
    this.isPlayingQueue = false;
  }

  /**
   * 停止当前语音
   */
  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.clearQueue();
    }
  }

  /**
   * 暂停当前语音
   */
  pause() {
    if (this.synthesis && this.isSpeaking && !this.isPaused) {
      this.synthesis.pause();
      this.isPaused = true;
    }
  }

  /**
   * 恢复语音播放
   */
  resume() {
    if (this.synthesis && this.isPaused) {
      this.synthesis.resume();
      this.isPaused = false;
    }
  }

  /**
   * 播放成功消息
   * @param {string} message - 消息内容
   * @param {Object} options - 播放选项
   */
  success(message, options = {}) {
    const text = message || SUCCESS_MESSAGES.DEFAULT || '操作成功';
    this.speak(text, { ...options, rate: this.config.rate * 1.1 });
  }

  /**
   * 播放错误消息
   * @param {string} message - 消息内容
   * @param {Object} options - 播放选项
   */
  error(message, options = {}) {
    const text = message || ERROR_MESSAGES.DEFAULT || '操作失败';
    this.speak(text, { ...options, rate: this.config.rate * 0.9, pitch: this.config.pitch * 0.9 });
  }

  /**
   * 播放警告消息
   * @param {string} message - 消息内容
   * @param {Object} options - 播放选项
   */
  warning(message, options = {}) {
    const text = message || '请注意';
    this.speak(text, { ...options, rate: this.config.rate * 1.0 });
  }

  /**
   * 播放信息消息
   * @param {string} message - 消息内容
   * @param {Object} options - 播放选项
   */
  info(message, options = {}) {
    this.speak(message, options);
  }

  /**
   * 设置语速
   * @param {number} rate - 语速 (0.1-10)
   */
  setRate(rate) {
    this.config.rate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * 设置音调
   * @param {number} pitch - 音调 (0-2)
   */
  setPitch(pitch) {
    this.config.pitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * 设置音量
   * @param {number} volume - 音量 (0-1)
   */
  setVolume(volume) {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 设置语音
   * @param {SpeechSynthesisVoice} voice - 语音对象
   */
  setVoice(voice) {
    this.config.voice = voice;
  }

  /**
   * 设置语言
   * @param {string} lang - 语言代码
   */
  setLanguage(lang) {
    this.config.lang = lang;
  }

  /**
   * 启用/禁用语音反馈
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * 获取可用语音列表
   * @returns {SpeechSynthesisVoice[]} 语音列表
   */
  getVoices() {
    return this.voices;
  }

  /**
   * 获取中文语音列表
   * @returns {SpeechSynthesisVoice[]} 中文语音列表
   */
  getChineseVoices() {
    return this.voices.filter(voice =>
      voice.lang.includes('zh') || voice.lang.includes('CN')
    );
  }

  /**
   * 获取当前配置
   * @returns {Object} 当前配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 检查是否正在播放
   * @returns {boolean} 是否正在播放
   */
  isSpeakingNow() {
    return this.isSpeaking && !this.isPaused;
  }

  /**
   * 检查是否已暂停
   * @returns {boolean} 是否已暂停
   */
  isPausedNow() {
    return this.isPaused;
  }

  /**
   * 检查队列是否为空
   * @returns {boolean} 队列是否为空
   */
  isQueueEmpty() {
    return this.queue.length === 0;
  }

  /**
   * 获取队列长度
   * @returns {number} 队列长度
   */
  getQueueLength() {
    return this.queue.length;
  }

  /**
   * 播放数字（用于播报坐标、大小等）
   * @param {number} number - 数字
   * @param {Object} options - 播放选项
   */
  speakNumber(number, options = {}) {
    const text = String(number);
    this.speak(text, options);
  }

  /**
   * 播放坐标
   * @param {{x: number, y: number}} coords - 坐标对象
   * @param {Object} options - 播放选项
   */
  speakCoordinates(coords, options = {}) {
    const text = `坐标 ${coords.x} ${coords.y}`;
    this.speak(text, options);
  }

  /**
   * 播放颜色
   * @param {string} color - 颜色名称
   * @param {Object} options - 播放选项
   */
  speakColor(color, options = {}) {
    const text = `颜色 ${color}`;
    this.speak(text, options);
  }

  /**
   * 播放工具名称
   * @param {string} toolName - 工具名称
   * @param {Object} options - 播放选项
   */
  speakTool(toolName, options = {}) {
    const text = `已切换到${toolName}工具`;
    this.speak(text, options);
  }

  /**
   * 播放操作结果
   * @param {string} action - 操作名称
   * @param {boolean} success - 是否成功
   * @param {Object} options - 播放选项
   */
  speakActionResult(action, success = true, options = {}) {
    const text = success ? `${action}成功` : `${action}失败`;
    this.speak(text, options);
  }

  /**
   * 销毁语音反馈工具
   */
  destroy() {
    this.stop();
    this.synthesis = null;
    this.voices = [];
    this.currentUtterance = null;
  }
}

/**
 * 创建语音反馈实例
 * @param {Object} config - 配置选项
 * @returns {SpeechFeedback} 语音反馈实例
 */
export function createSpeechFeedback(config = {}) {
  return new SpeechFeedback(config);
}

/**
 * 默认语音反馈实例
 */
export const defaultSpeechFeedback = new SpeechFeedback();

/**
 * 导出默认实例和类
 */
export default {
  SpeechFeedback,
  createSpeechFeedback,
  defaultSpeechFeedback
};