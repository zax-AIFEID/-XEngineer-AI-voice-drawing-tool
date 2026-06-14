// 语音控制绘图工具 - 应用入口

import { VoiceRecognizer } from './core/VoiceRecognizer.js';
import { CommandParser } from './core/CommandParser.js';
import { AICommandParser, initAICommandParser } from './core/AICommandParser.js';
import { DrawingEngine } from './core/DrawingEngine.js';
import { CanvasComponent } from './components/Canvas.js';
import { CommandHelp } from './components/CommandHelp.js';
import { LogPanel } from './components/LogPanel.js';
import { AppState } from './state/AppState.js';
import { SpeechFeedback } from './utils/speechFeedback.js';
import { DebugHelper } from './utils/helpers.js';
import { AI_CONFIG } from './config/ai.js';

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
    this.commandHelp = null;
    this.logPanel = null;

    // 语音反馈
    this.speechFeedback = null;

    // AI 指令解析器
    this.aiCommandParser = null;

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

    // 初始化指令帮助面板
    this.commandHelp = new CommandHelp({
      containerId: this.options.containerId
    });

    this.debug.log('UI组件已初始化');
  }

  /**
   * 绑定静态按钮事件
   */
  bindStaticButtonEvents() {
    // 语音控制按钮
    const startVoiceBtn = document.getElementById('startVoiceBtn');
    const stopVoiceBtn = document.getElementById('stopVoiceBtn');

    if (startVoiceBtn) {
      startVoiceBtn.addEventListener('click', () => {
        this.startVoice();
        startVoiceBtn.disabled = true;
        stopVoiceBtn.disabled = false;
      });
    }

    if (stopVoiceBtn) {
      stopVoiceBtn.addEventListener('click', () => {
        this.stopVoice();
        stopVoiceBtn.disabled = true;
        startVoiceBtn.disabled = false;
      });
    }

    // 工具按钮
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool) {
          this.setTool(tool);
          // 更新选中状态
          document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });

    // 调色盘（自定义颜色）
    const colorPicker = document.getElementById('colorPicker');
    const colorPickerValue = document.getElementById('colorPickerValue');
    if (colorPicker) {
      colorPicker.addEventListener('input', () => {
        const color = colorPicker.value;
        this.setColor(color);
        // 更新显示值
        if (colorPickerValue) {
          colorPickerValue.textContent = color;
        }
        // 取消预设颜色的选中状态
        document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('selected'));
      });
    }

    // 颜色按钮（预设颜色）
    document.querySelectorAll('.color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        if (color) {
          this.setColor(color);
          // 更新选中状态
          document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          // 同步更新调色盘
          if (colorPicker) {
            colorPicker.value = color;
          }
          if (colorPickerValue) {
            colorPickerValue.textContent = color;
          }
        }
      });
    });

    // 大小滑块
    const sizeSlider = document.getElementById('sizeSlider');
    const sizeValue = document.getElementById('sizeValue');
    if (sizeSlider) {
      sizeSlider.addEventListener('input', () => {
        const size = parseInt(sizeSlider.value);
        this.setSize(size);
        if (sizeValue) {
          sizeValue.textContent = `${size}px`;
        }
      });
    }

    // 变细/加粗按钮
    const decreaseSizeBtn = document.getElementById('decreaseSizeBtn');
    const increaseSizeBtn = document.getElementById('increaseSizeBtn');

    if (decreaseSizeBtn) {
      decreaseSizeBtn.addEventListener('click', () => {
        this.decreaseSize();
        if (sizeSlider && sizeValue) {
          sizeValue.textContent = `${sizeSlider.value}px`;
        }
      });
    }

    if (increaseSizeBtn) {
      increaseSizeBtn.addEventListener('click', () => {
        this.increaseSize();
        if (sizeSlider && sizeValue) {
          sizeValue.textContent = `${sizeSlider.value}px`;
        }
      });
    }

    // 操作按钮
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');

    if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
    if (redoBtn) redoBtn.addEventListener('click', () => this.redo());
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearCanvas());
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveImage());

    // 面板折叠按钮
    document.querySelectorAll('.panel-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const panel = toggle.closest('.panel');
        const content = panel.querySelector('.panel-content');
        if (content) {
          content.classList.toggle('collapsed');
          toggle.textContent = content.classList.contains('collapsed') ? '▼' : '▲';
        }
      });
    });

    // 指令帮助分类标签
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const category = tab.dataset.category;
        if (category && this.commandHelp) {
          this.commandHelp.filterByCategory(category);
          // 更新选中状态
          document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        }
      });
    });

    // 指令搜索
    const commandSearch = document.getElementById('commandSearch');
    if (commandSearch && this.commandHelp) {
      commandSearch.addEventListener('input', (e) => {
        this.commandHelp.searchCommands(e.target.value);
      });
    }

    // 网格切换按钮
    const toggleGridBtn = document.getElementById('toggleGridBtn');
    if (toggleGridBtn) {
      toggleGridBtn.addEventListener('click', () => {
        const isEnabled = toggleGridBtn.dataset.grid === 'true';
        const newState = !isEnabled;
        toggleGridBtn.dataset.grid = newState.toString();
        toggleGridBtn.classList.toggle('active', newState);
        toggleGridBtn.querySelector('span:last-child').textContent = newState ? '显示网格' : '隐藏网格';
        this.toggleGrid(newState);
      });
    }

    this.debug.log('静态按钮事件绑定完成');
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

    // 初始化 AI 指令解析器（如果已配置 API Key）
    if (AI_CONFIG.enabled && AI_CONFIG.apiKey && AI_CONFIG.apiKey !== 'YOUR_API_KEY_HERE') {
      this.aiCommandParser = initAICommandParser(AI_CONFIG.apiKey, {
        apiEndpoint: AI_CONFIG.apiEndpoint,
        model: AI_CONFIG.model,
        maxTokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
        timeout: AI_CONFIG.timeout,
        enableCache: AI_CONFIG.enableCache
      });
      this.debug.log('AI 指令解析器已初始化（已启用）');
      this.debug.log(`AI 配置: endpoint=${AI_CONFIG.apiEndpoint}, model=${AI_CONFIG.model}`);
    } else {
      this.debug.log('AI 指令解析器未启用（请在 src/config/ai.js 中配置 API Key）');
      this.debug.log(`AI_CONFIG.enabled=${AI_CONFIG.enabled}, apiKey_set=${!!AI_CONFIG.apiKey}`);
    }
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

    // 绑定静态按钮事件
    this.bindStaticButtonEvents();

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
  async handleVoiceResult(data) {
    const transcript = data.transcript;

    // 添加到日志
    if (this.logPanel) {
      this.logPanel.addVoiceLog(transcript);
    }

    // 第一步：尝试本地指令解析器
    let result = this.commandParser.parseAndExecute(transcript);
    this.debug.log(`本地解析结果: success=${result.success}, message=${result.message}`);

    // 如果本地解析失败或置信度低，尝试 AI 解析器
    if (!result.success && this.aiCommandParser) {
      try {
        // 添加 AI 解析提示
        if (this.logPanel) {
          this.logPanel.addInfoLog('正在使用 AI 解析...');
        }

        // 调用 AI 解析器
        const aiResult = await this.aiCommandParser.parse(transcript);
        this.debug.log(`AI 解析结果: ${JSON.stringify(aiResult)}`);

        if (aiResult && aiResult.action && aiResult.action !== 'unknown') {
          // AI 解析成功，执行命令
          result = this.executeAIParsedCommand(aiResult);
          this.debug.log(`AI 命令执行结果: ${JSON.stringify(result)}`);
        } else {
          this.debug.log('AI 解析未返回有效指令: ' + JSON.stringify(aiResult));
          if (this.logPanel) {
            this.logPanel.addWarningLog('AI 未能理解指令');
          }
        }
      } catch (error) {
        this.debug.error('AI 解析失败', error);
        if (this.logPanel) {
          this.logPanel.addErrorLog(`AI 解析失败: ${error.message}`);
        }
      }
    } else if (!this.aiCommandParser) {
      this.debug.log('AI 解析器未初始化');
      if (this.logPanel) {
        this.logPanel.addInfoLog('AI 解析器未启用');
      }
    }

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
   * 执行 AI 解析后的命令
   * @param {Object} aiResult - AI 解析结果
   * @returns {Object} - 执行结果
   */
  executeAIParsedCommand(aiResult) {
    const { action, params } = aiResult;

    try {
      switch (action) {
        case 'multiStep':
          // 执行多步指令
          if (params.steps && Array.isArray(params.steps)) {
            this.debug.log(`执行多步指令，共 ${params.steps.length} 步`);
            const results = [];
            for (const step of params.steps) {
              const result = this.executeAIParsedCommand(step);
              results.push(result);
              this.debug.log(`步骤执行结果: ${JSON.stringify(result)}`);
            }
            return { success: true, message: `已完成 ${params.steps.length} 个操作` };
          }
          break;
        case 'setTool':
          if (params.tool) {
            this.setTool(params.tool);
            return { success: true, message: `已切换到${params.tool}工具` };
          }
          break;
        case 'setColor':
          if (params.color) {
            this.setColor(params.color);
            return { success: true, message: `已设置颜色` };
          }
          break;
        case 'setSize':
          if (params.size) {
            this.setSize(params.size);
            return { success: true, message: `已设置大小为${params.size}` };
          }
          break;
        case 'setFill':
          if (params.fill !== undefined) {
            this.appState.setFillMode(params.fill);
            return { success: true, message: params.fill ? '已开启填充' : '已关闭填充' };
          }
          break;
        case 'undo':
          this.undo();
          return { success: true, message: '已撤销' };
        case 'redo':
          this.redo();
          return { success: true, message: '已重做' };
        case 'clear':
          this.clearCanvas();
          return { success: true, message: '已清空画布' };
        case 'save':
          this.saveImage();
          return { success: true, message: '已保存图片' };
        case 'move':
          if (params.position) {
            this.moveTo(params.position);
            return { success: true, message: `已移动到${params.position}` };
          }
          break;
        case 'draw':
          if (params.shape) {
            this.drawShape(params.shape, params);
            return { success: true, message: `已在指定位置绘制${params.shape}` };
          }
          break;
        case 'smartDraw':
          if (params.steps && Array.isArray(params.steps)) {
            // 获取中心坐标（默认画布中心）
            const centerX = params.x || 400;
            const centerY = params.y || 300;
            this.smartDraw(params.steps, centerX, centerY);
            const objectName = params.object || '图形';
            return { success: true, message: `已绘制${objectName}` };
          }
          break;
      }

      return { success: false, message: '未知操作' };
    } catch (error) {
      this.debug.error(`执行 AI 命令失败 - action: ${action}, params: ${JSON.stringify(params)}`, error);
      return { success: false, message: `执行失败: ${error.message}` };
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

      // 更新语音状态显示
      const voiceStatus = document.getElementById('voiceStatus');
      const statusDot = voiceStatus?.querySelector('.status-dot');
      const statusText = voiceStatus?.querySelector('.status-text');
      if (statusDot) statusDot.style.background = '#28a745';
      if (statusText) statusText.textContent = '语音识别中';

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

      // 更新语音状态显示
      const voiceStatus = document.getElementById('voiceStatus');
      const statusDot = voiceStatus?.querySelector('.status-dot');
      const statusText = voiceStatus?.querySelector('.status-text');
      if (statusDot) statusDot.style.background = '#ccc';
      if (statusText) statusText.textContent = '语音未启动';

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
   * 绘制指定形状
   * @param {string} shapeType - 形状类型 (circle, rectangle, triangle, line)
   * @param {number|Object} params - 尺寸或完整参数对象
   */
  drawShape(shapeType, params = {}) {
    try {
      this.debug.log(`drawShape 调用 - shapeType: ${shapeType}, params: ${JSON.stringify(params)}`);

      if (!this.drawingEngine) {
        throw new Error('drawingEngine 未初始化');
      }

      // 如果 params 是数字，转换为对象格式
      if (typeof params === 'number') {
        params = { size: params };
      }

      this.debug.log(`params 类型: ${typeof params}, 值: ${JSON.stringify(params)}`);

      // 设置位置（默认中心）
      const x = params.x !== undefined ? params.x : 400;
      const y = params.y !== undefined ? params.y : 300;
      this.debug.log(`设置位置: (${x}, ${y})`);
      this.drawingEngine.setPosition({ x, y });

      // 获取尺寸参数
      const size = params.size || params.radius || 50;
      const width = params.width || size;
      const height = params.height || size;

      // 根据形状类型绘制
      switch (shapeType) {
        case 'circle':
          this.drawingEngine.drawCircleByRadius({ x, y }, size);
          break;
        case 'rectangle':
          this.drawingEngine.drawRectangleBySize({ x, y }, width, height);
          break;
        case 'triangle':
          this.drawingEngine.drawTriangleBySize({ x, y }, size);
          break;
        case 'ellipse':
          this.drawingEngine.drawEllipseBySize({ x, y }, width, height);
          break;
        case 'line':
          if (params.x2 !== undefined && params.y2 !== undefined) {
            this.drawingEngine.drawLineByPoints({ x, y }, { x: params.x2, y: params.y2 });
          }
          break;
        case 'star':
          this.drawingEngine.drawStarBySize({ x, y }, size);
          break;
        case 'heart':
          this.drawingEngine.drawHeartBySize({ x, y }, size);
          break;
        default:
          this.drawingEngine.drawShape(shapeType, size);
      }

      this.debug.log(`已绘制形状: ${shapeType} at (${x}, ${y})`);
    } catch (error) {
      this.debug.error(`drawShape 失败: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 智能绘图 - 执行 AI 生成的绘图步骤
   * @param {Array} steps - 绘图步骤数组
   * @param {number} centerX - 中心 X 坐标（默认 400）
   * @param {number} centerY - 中心 Y 坐标（默认 300）
   */
  smartDraw(steps, centerX = 400, centerY = 300) {
    try {
      if (!this.drawingEngine) {
        throw new Error('drawingEngine 未初始化');
      }
      if (!steps || !Array.isArray(steps)) {
        throw new Error('无效的步骤数组: ' + JSON.stringify(steps));
      }

      this.debug.log(`开始智能绘图，步骤数: ${steps.length}, 中心: (${centerX}, ${centerY})`);
      this.drawingEngine.smartDraw(steps, centerX, centerY);
      this.debug.log(`智能绘图完成，共 ${steps.length} 步`);
    } catch (error) {
      this.debug.error(`smartDraw 失败: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 切换网格显示
   * @param {boolean} enabled - 是否显示网格
   */
  toggleGrid(enabled) {
    if (this.drawingEngine) {
      this.drawingEngine.setGridEnabled(enabled);
      this.debug.log(`网格显示: ${enabled ? '开启' : '关闭'}`);
    }
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