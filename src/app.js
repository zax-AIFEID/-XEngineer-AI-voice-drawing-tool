// 语音控制绘图工具 - 应用入口

import { VoiceRecognizer } from './core/VoiceRecognizer.js';
import { CommandParser } from './core/CommandParser.js';
import { DrawingEngine } from './core/DrawingEngine.js';
import { CanvasComponent } from './components/Canvas.js';
import { ControlPanel } from './components/ControlPanel.js';
import { CommandHelp } from './components/CommandHelp.js';
import { LogPanel } from './components/LogPanel.js';
import { AppState } from './state/AppState.js';
import { SpeechFeedback } from './utils/speechFeedback.js';
import { DebugHelper } from './utils/helpers.js';

/**
 * 应用主类
 * 整合所有模块，协调整个应用的运行
 */
class VoiceDrawingApp {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'app',
      canvasId: options.canvasId || 'drawingCanvas',
      autoInit: options.autoInit !== false,
      enableVoice: options.enableVoice !== false,
      enableSpeechFeedback: options.enableSpeechFeedback !== false,
      ...options
    };

    // 调试工具
    this.debug = DebugHelper;

    // 状态管理器
    this.appState = null;

    // 语音识别器
    this.voiceRecognizer = null;

    // 指令解析器
    this.commandParser = null;

    // 绘图引擎
    this.drawingEngine = null;

    // UI组件
    this.canvasComponent = null;
    this.controlPanel = null;
    this.commandHelp = null;
    this.logPanel = null;

    // 语音反馈
    this.speechFeedback = null;

    // 是否已初始化
    this.initialized = false;

    // 初始化
    if (this.options.autoInit) {
      this.init();
    }
  }

  /**
   * 初始化应用
   */
  init() {
    try {
      this.debug.log('开始初始化应用...');

      // 1. 初始化状态管理器
      this.initStateManager();

      // 2. 初始化语音反馈
      if (this.options.enableSpeechFeedback) {
        this.initSpeechFeedback();
      }

      // 3. 初始化日志面板
      this.initLogPanel();

      // 4. 初始化UI组件
      this.initUIComponents();

      // 5. 初始化绘图引擎
      this.initDrawingEngine();

      // 6. 初始化指令解析器
      this.initCommandParser();

      // 7. 初始化语音识别器
      if (this.options.enableVoice) {
        this.initVoiceRecognizer();
      }

      // 8. 注册命令处理函数
      this.registerCommandHandlers();

      // 9. 绑定事件
      this.bindEvents();

      // 10. 显示初始化信息
      this.showInitInfo();

      this.initialized = true;
      this.debug.log('应用初始化完成', 'success');

      // 初始化成功提示
      if (this.speechFeedback) {
        this.speechFeedback.info('语音绘图工具已就绪');
      }

    } catch (error) {
      this.debug.error('应用初始化失败:', error);
      if (this.speechFeedback) {
        this.speechFeedback.error('应用初始化失败');
      }
    }
  }

  /**
   * 初始化状态管理器
   */
  initStateManager() {
    this.appState = new AppState();
    this.debug.log('状态管理器已初始化');
  }

  /**
   * 初始化语音反馈
   */
  initSpeechFeedback() {
    this.speechFeedback = new SpeechFeedback({
      lang: 'zh-CN',
      rate: 1.0,
      volume: 0.8
    });
    this.debug.log('语音反馈已初始化');
  }

  /**
   * 初始化日志面板
   */
  initLogPanel() {
    this.logPanel = new LogPanel({
      containerId: this.options.containerId,
      title: '操作日志',
      maxLogs: 100,
      autoScroll: true
    });
    this.debug.log('日志面板已初始化');
  }

  /**
   * 初始化绘图引擎
   */
  initDrawingEngine() {
    // 从 CanvasComponent 获取 canvas 元素
    const canvas = this.canvasComponent ? this.canvasComponent.getCanvas() : null;

    if (canvas) {
      // 如果 CanvasComponent 已创建，则复用其 canvas
      this.drawingEngine = new DrawingEngine(canvas);
    } else {
      // 如果 CanvasComponent 还未创建，则通过 ID 查找（降级方案）
      this.drawingEngine = new DrawingEngine(this.options.canvasId);
    }

    this.debug.log('绘图引擎已初始化');
  }

  /**
   * 初始化UI组件
   */
  initUIComponents() {
    // 初始化画布组件
    this.canvasComponent = new CanvasComponent({
      containerId: 'canvasContainer'
    });

    // 初始化控制面板
    this.controlPanel = new ControlPanel({
      containerId: this.options.containerId,
      onVoiceToggle: (isActive) => this.handleVoiceToggle(isActive),
      onToolSelect: (tool) => this.handleToolSelect(tool),
      onAction: (action) => this.handleAction(action)
    });

    // 初始化指令帮助面板
    this.commandHelp = new CommandHelp({
      containerId: this.options.containerId
    });

    this.debug.log('UI组件已初始化');
  }

  /**
   * 初始化指令解析器
   */
  initCommandParser() {
    this.commandParser = new CommandParser({
      caseSensitive: false,
      fuzzyMatch: true,
      minMatchScore: 0.5,
      maxResults: 3
    });
    this.debug.log('指令解析器已初始化');
  }

  /**
   * 初始化语音识别器
   */
  initVoiceRecognizer() {
    this.voiceRecognizer = new VoiceRecognizer({
      lang: 'zh-CN',
      continuous: true,
      interimResults: true
    });

    // 监听识别结果
    this.voiceRecognizer.on('finalResult', (data) => {
      this.handleVoiceResult(data);
    });

    // 监听错误
    this.voiceRecognizer.on('error', (error) => {
      this.handleVoiceError(error);
    });

    this.debug.log('语音识别器已初始化');
  }

  /**
   * 注册命令处理函数
   */
  registerCommandHandlers() {
    // 控制指令
    this.commandParser.registerHandler('startVoice', () => {
      this.startVoice();
    });

    this.commandParser.registerHandler('stopVoice', () => {
      this.stopVoice();
    });

    this.commandParser.registerHandler('clearCanvas', () => {
      this.clearCanvas();
    });

    this.commandParser.registerHandler('undo', () => {
      this.undo();
    });

    this.commandParser.registerHandler('redo', () => {
      this.redo();
    });

    this.commandParser.registerHandler('saveImage', () => {
      this.saveImage();
    });

    // 工具指令
    this.commandParser.registerHandler('setTool', (params) => {
      this.setTool(params.value);
    });

    // 颜色指令
    this.commandParser.registerHandler('setColor', (params) => {
      this.setColor(params.value);
    });

    // 大小指令
    this.commandParser.registerHandler('setSize', (params) => {
      this.setSize(params.value);
    });

    this.commandParser.registerHandler('increaseSize', (params) => {
      this.increaseSize(params.step);
    });

    this.commandParser.registerHandler('decreaseSize', (params) => {
      this.decreaseSize(params.step);
    });

    // 位置指令
    this.commandParser.registerHandler('moveTo', (params) => {
      this.moveTo(params.value);
    });

    this.commandParser.registerHandler('moveUp', (params) => {
      this.moveUp(params.value);
    });

    this.commandParser.registerHandler('moveDown', (params) => {
      this.moveDown(params.value);
    });

    this.commandParser.registerHandler('moveLeft', (params) => {
      this.moveLeft(params.value);
    });

    this.commandParser.registerHandler('moveRight', (params) => {
      this.moveRight(params.value);
    });

    // 绘图指令
    this.commandParser.registerHandler('drawCircle', (params) => {
      this.drawCircle(params.value);
    });

    this.commandParser.registerHandler('drawRectangle', (params) => {
      this.drawRectangle(params.value);
    });

    this.commandParser.registerHandler('drawTriangle', (params) => {
      this.drawTriangle(params.value);
    });

    this.commandParser.registerHandler('drawLine', (params) => {
      this.drawLine(params.value);
    });

    this.commandParser.registerHandler('drawLineTo', (params) => {
      this.drawLineTo(params);
    });

    this.commandParser.registerHandler('setFillMode', (params) => {
      this.setFillMode(params.value);
    });

    this.debug.log('命令处理函数已注册');
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 键盘快捷键
    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    this.debug.log('事件绑定完成');
  }

  /**
   * 处理键盘事件
   * @param {KeyboardEvent} e - 键盘事件
   */
  handleKeydown(e) {
    // ESC - 停止语音
    if (e.key === 'Escape') {
      this.stopVoice();
    }

    // Ctrl+Z - 撤销
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      this.undo();
    }

    // Ctrl+Y - 重做
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      this.redo();
    }
  }

  /**
   * 处理语音识别结果
   * @param {Object} data - 识别结果数据
   */
  handleVoiceResult(data) {
    const transcript = data.transcript;

    // 添加到日志
    if (this.logPanel) {
      this.logPanel.addVoiceLog(transcript);
    }

    // 解析并执行命令
    const result = this.commandParser.parseAndExecute(transcript);

    // 处理结果
    if (result.success) {
      // 添加成功日志
      if (this.logPanel) {
        this.logPanel.addSuccessLog(result.message);
      }

      // 语音反馈
      if (this.speechFeedback) {
        this.speechFeedback.speak(result.message);
      }
    } else {
      // 添加失败日志
      if (this.logPanel) {
        this.logPanel.addWarningLog(`未能识别: "${transcript}"`);
      }
    }
  }

  /**
   * 处理语音错误
   * @param {Object} error - 错误对象
   */
  handleVoiceError(error) {
    this.debug.error('语音识别错误:', error);

    if (this.logPanel) {
      this.logPanel.addErrorLog(error.message);
    }

    if (this.speechFeedback) {
      this.speechFeedback.error(error.message);
    }
  }

  /**
   * 处理语音开关
   * @param {boolean} isActive - 是否激活
   */
  handleVoiceToggle(isActive) {
    if (isActive) {
      this.startVoice();
    } else {
      this.stopVoice();
    }
  }

  /**
   * 处理工具选择
   * @param {string} tool - 工具名称
   */
  handleToolSelect(tool) {
    this.setTool(tool);
  }

  /**
   * 处理操作
   * @param {string} action - 操作名称
   */
  handleAction(action) {
    switch (action) {
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
        break;
      case 'clear':
        this.clearCanvas();
        break;
      case 'save':
        this.saveImage();
        break;
    }
  }

  // ==================== 语音控制方法 ====================

  /**
   * 开始语音识别
   */
  startVoice() {
    if (this.voiceRecognizer) {
      this.voiceRecognizer.start();
      this.controlPanel.setVoiceActive(true);

      if (this.logPanel) {
        this.logPanel.addInfoLog('语音识别已启动');
      }

      if (this.speechFeedback) {
        this.speechFeedback.success('语音识别已启动');
      }
    }
  }

  /**
   * 停止语音识别
   */
  stopVoice() {
    if (this.voiceRecognizer) {
      this.voiceRecognizer.stop();
      this.controlPanel.setVoiceActive(false);

      if (this.logPanel) {
        this.logPanel.addInfoLog('语音识别已停止');
      }

      if (this.speechFeedback) {
        this.speechFeedback.info('语音识别已停止');
      }
    }
  }

  // ==================== 绘图控制方法 ====================

  /**
   * 设置工具
   * @param {string} tool - 工具名称
   */
  setTool(tool) {
    this.drawingEngine.setTool(tool);
    this.canvasComponent.setTool(tool);
    this.appState.setTool(tool);

    this.debug.log(`工具已切换: ${tool}`);
  }

  /**
   * 设置颜色
   * @param {string} color - 颜色值
   */
  setColor(color) {
    this.drawingEngine.setColor(color);
    this.canvasComponent.setColor(color);
    this.appState.setColor(color);

    this.debug.log(`颜色已设置: ${color}`);
  }

  /**
   * 设置大小
   * @param {number} size - 大小
   */
  setSize(size) {
    this.drawingEngine.setSize(size);
    this.canvasComponent.setSize(size);
    this.appState.setSize(size);

    this.debug.log(`大小已设置: ${size}`);
  }

  /**
   * 增加大小
   * @param {number} step - 增量
   */
  increaseSize(step = 5) {
    const currentSize = this.appState.getSize();
    this.setSize(currentSize + step);
  }

  /**
   * 减小大小
   * @param {number} step - 减量
   */
  decreaseSize(step = 5) {
    const currentSize = this.appState.getSize();
    this.setSize(currentSize - step);
  }

  /**
   * 设置填充模式
   * @param {boolean} isFill - 是否填充
   */
  setFillMode(isFill) {
    this.drawingEngine.setFillMode(isFill);
    this.canvasComponent.setFillMode(isFill);
    this.appState.setFillMode(isFill);

    this.debug.log(`填充模式: ${isFill ? '填充' : '描边'}`);
  }

  /**
   * 移动到位置
   * @param {Object} position - 目标位置
   */
  moveTo(position) {
    this.drawingEngine.setPosition(position);
    this.canvasComponent.setPosition(position);
    this.appState.setPosition(position);

    this.debug.log(`位置已移动: (${position.x}, ${position.y})`);
  }

  /**
   * 向上移动
   * @param {number} distance - 距离
   */
  moveUp(distance) {
    const newPosition = this.drawingEngine.movePosition('up', distance);
    this.canvasComponent.setPosition(newPosition);
    this.appState.setPosition(newPosition);
  }

  /**
   * 向下移动
   * @param {number} distance - 距离
   */
  moveDown(distance) {
    const newPosition = this.drawingEngine.movePosition('down', distance);
    this.canvasComponent.setPosition(newPosition);
    this.appState.setPosition(newPosition);
  }

  /**
   * 向左移动
   * @param {number} distance - 距离
   */
  moveLeft(distance) {
    const newPosition = this.drawingEngine.movePosition('left', distance);
    this.canvasComponent.setPosition(newPosition);
    this.appState.setPosition(newPosition);
  }

  /**
   * 向右移动
   * @param {number} distance - 距离
   */
  moveRight(distance) {
    const newPosition = this.drawingEngine.movePosition('right', distance);
    this.canvasComponent.setPosition(newPosition);
    this.appState.setPosition(newPosition);
  }

  /**
   * 绘制圆形
   * @param {number} radius - 半径
   */
  drawCircle(radius) {
    this.drawingEngine.drawCircleByRadius(this.appState.getPosition(), radius);
    this.debug.log(`绘制圆形: 半径 ${radius}`);
  }

  /**
   * 绘制矩形
   * @param {number} size - 边长
   */
  drawRectangle(size) {
    const pos = this.appState.getPosition();
    this.drawingEngine.drawRectangleBySize(pos, size, size);
    this.debug.log(`绘制矩形: 大小 ${size}`);
  }

  /**
   * 绘制三角形
   * @param {number} size - 大小
   */
  drawTriangle(size) {
    this.drawingEngine.drawShape('triangle', size);
    this.debug.log(`绘制三角形: 大小 ${size}`);
  }

  /**
   * 绘制直线
   * @param {number} length - 长度
   */
  drawLine(length) {
    const pos = this.appState.getPosition();
    const endPos = { x: pos.x + length, y: pos.y };
    this.drawingEngine.drawLineByPoints(pos, endPos);
    this.debug.log(`绘制直线: 长度 ${length}`);
  }

  /**
   * 绘制直线到坐标
   * @param {Object} coords - 目标坐标
   */
  drawLineTo(coords) {
    const pos = this.appState.getPosition();
    this.drawingEngine.drawLineByPoints(pos, coords);
    this.debug.log(`绘制直线到: (${coords.x}, ${coords.y})`);
  }

  /**
   * 清空画布
   */
  clearCanvas() {
    this.drawingEngine.clear();
    this.canvasComponent.clear();

    if (this.logPanel) {
      this.logPanel.addSuccessLog('画布已清空');
    }

    if (this.speechFeedback) {
      this.speechFeedback.success('画布已清空');
    }

    this.debug.log('画布已清空');
  }

  /**
   * 撤销
   */
  undo() {
    const success = this.drawingEngine.undo();

    if (success) {
      if (this.logPanel) {
        this.logPanel.addInfoLog('已撤销');
      }
      this.debug.log('撤销成功');
    }
  }

  /**
   * 重做
   */
  redo() {
    const success = this.drawingEngine.redo();

    if (success) {
      if (this.logPanel) {
        this.logPanel.addInfoLog('已重做');
      }
      this.debug.log('重做成功');
    }
  }

  /**
   * 保存图片
   * @param {string} filename - 文件名
   */
  saveImage(filename = 'voice-drawing') {
    this.drawingEngine.downloadImage(filename);

    if (this.logPanel) {
      this.logPanel.addSuccessLog(`图片已保存: ${filename}.png`);
    }

    if (this.speechFeedback) {
      this.speechFeedback.success('图片已保存');
    }

    this.debug.log(`图片已保存: ${filename}`);
  }

  // ==================== 应用控制方法 ====================

  /**
   * 显示初始化信息
   */
  showInitInfo() {
    if (this.logPanel) {
      this.logPanel.addInfoLog('========================================');
      this.logPanel.addInfoLog('欢迎使用语音控制绘图工具');
      this.logPanel.addInfoLog('点击"启动语音"按钮开始语音控制');
      this.logPanel.addInfoLog('========================================');
    }
  }

  /**
   * 获取应用状态
   * @returns {Object} 应用状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      voiceActive: this.voiceRecognizer ? this.voiceRecognizer.isListening() : false,
      drawingState: this.drawingEngine ? this.drawingEngine.getState() : null,
      historyInfo: this.drawingEngine ? this.drawingEngine.getHistoryInfo() : null,
      parserStats: this.commandParser ? this.commandParser.getStats() : null
    };
  }

  /**
   * 销毁应用
   */
  destroy() {
    // 停止语音识别
    if (this.voiceRecognizer) {
      this.voiceRecognizer.stop();
    }

    // 销毁组件
    if (this.canvasComponent) {
      this.canvasComponent.destroy();
    }

    if (this.controlPanel) {
      this.controlPanel.destroy();
    }

    if (this.commandHelp) {
      this.commandHelp.destroy();
    }

    if (this.logPanel) {
      this.logPanel.destroy();
    }

    // 销毁引擎
    if (this.drawingEngine) {
      this.drawingEngine.destroy();
    }

    // 移除事件监听
    document.removeEventListener('keydown', this.handleKeydown);

    this.initialized = false;
    this.debug.log('应用已销毁');
  }
}

// 导出
export { VoiceDrawingApp };