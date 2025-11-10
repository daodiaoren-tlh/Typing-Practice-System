// 全局状态管理
const state = {
    isPracticeActive: false,
    startTime: null,
    currentIndex: 0,
    correctChars: 0,
    errorCount: 0,
    totalChars: 0,
    remainingTime: 0,
    typedChars: [],
    historyRecords: JSON.parse(localStorage.getItem('typingHistory') || '[]'),
    hasFocus: true,
    errorChars: {}, // 新增：记录错误字符
    comboCount: 0,  // 新增：连续正确计数
    maxCombo: 0     // 新增：最大连续正确次数
};

// 监听窗口焦点事件
window.addEventListener('focus', () => {
    state.hasFocus = true;
    // 当窗口重新获得焦点时，如果练习处于活动状态，确保键盘焦点在输入区域
    if (state.isPracticeActive && elements.keyboardFocus) {
        elements.keyboardFocus.focus();
    }
});

window.addEventListener('blur', () => {
    state.hasFocus = false;
});

// DOM元素引用
const elements = {
    startBtn: document.getElementById('start-btn'),
    resetBtn: document.getElementById('reset-btn'),
    wordCountSelect: document.getElementById('word-count-select'),
    modeSelect: document.getElementById('mode-select'),
    difficultySelect: document.getElementById('difficulty-select'),
    timeSelect: document.getElementById('time-select'),
    textDisplay: document.getElementById('text-display'),
    keyboardFocus: document.getElementById('keyboard-focus'),
    customText: document.getElementById('custom-text'),
    wpmDisplay: document.getElementById('wpm'),
    accuracyDisplay: document.getElementById('accuracy'),
    errorsDisplay: document.getElementById('errors'),
    comboDisplay: document.getElementById('combo'), // 新增：连击显示
    progressFill: document.getElementById('progress-fill'),
    timerDisplay: document.getElementById('timer-display'),
    progressContainer: document.getElementById('progress-container'),
    timeSetting: document.getElementById('time-setting'),
    customTextContainer: document.getElementById('custom-text-container'),
    themeToggle: document.getElementById('theme-toggle'),
    increaseFont: document.getElementById('increase-font'),
    decreaseFont: document.getElementById('decrease-font'),
    audioEnabled: document.getElementById('audio-enabled'),
    historyList: document.getElementById('history-list'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    errorStatsPanel: document.getElementById('error-stats-panel'), // 新增：错误统计面板
    errorCharsList: document.getElementById('error-chars-list'),    // 新增：错误字符列表
    chartTypeSelect: document.getElementById('chart-type-select'),  // 新增：图表类型选择器
    progressChart: document.getElementById('progress-chart'),       // 新增：进度图表
    keyboardLayoutPanel: document.getElementById('keyboard-layout-panel'), // 新增：键盘布局面板
    showKeyboard: document.getElementById('show-keyboard'),         // 新增：显示键盘开关
    keyboardLayout: document.getElementById('keyboard-layout')      // 新增：键盘布局容器
};

// 全局图表实例
let chartInstance = null;

// 初始化函数
function init() {
    console.log('开始初始化应用');
    
    // 确保所有DOM元素都已正确加载
    console.log('检查DOM元素:', {
        startBtn: !!elements.startBtn,
        resetBtn: !!elements.resetBtn,
        keyboardFocus: !!elements.keyboardFocus
    });
    
    // 为keyboardFocus元素添加必要的样式
    if (elements.keyboardFocus) {
        elements.keyboardFocus.style.position = 'absolute';
        elements.keyboardFocus.style.width = '100%';
        elements.keyboardFocus.style.height = '100%';
        elements.keyboardFocus.style.top = '0';
        elements.keyboardFocus.style.left = '0';
        elements.keyboardFocus.style.outline = 'none';
        elements.keyboardFocus.style.zIndex = '10';
        elements.keyboardFocus.tabIndex = 0;
    }
    
    // 重新绑定事件监听器
    if (elements.startBtn) {
        // 先移除可能存在的监听器
        elements.startBtn.removeEventListener('click', startPractice);
        // 再添加监听器
        elements.startBtn.addEventListener('click', startPractice);
        console.log('已绑定开始练习按钮事件');
    }
    
    if (elements.resetBtn) {
        elements.resetBtn.removeEventListener('click', resetPractice);
        elements.resetBtn.addEventListener('click', resetPractice);
    }
    
    // 初始化键盘布局
    if (elements.keyboardLayoutPanel) {
        elements.keyboardLayoutPanel.classList.remove('hidden');
        generateKeyboardLayout();
        
        // 绑定键盘显示切换事件
        if (elements.showKeyboard) {
            elements.showKeyboard.addEventListener('change', toggleKeyboardDisplay);
            // 默认选中显示键盘开关
            elements.showKeyboard.checked = true;
        }
        
        // 确保键盘布局默认显示
        if (elements.keyboardLayout) {
            elements.keyboardLayout.style.display = 'flex';
        }
    }
    
    console.log('已绑定重置按钮事件');
    
    // 绑定其他事件监听器
    elements.modeSelect.addEventListener('change', updateSettingsVisibility);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.increaseFont.addEventListener('click', increaseFontSize);
    elements.decreaseFont.addEventListener('click', decreaseFontSize);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    elements.chartTypeSelect.addEventListener('change', updateChart); // 添加图表类型切换事件
    
    // 获取模态框元素
    elements.timeoutModal = document.getElementById('timeout-modal');
    elements.timeoutClose = document.getElementById('timeout-close');
    
    // 绑定关闭事件
    if (elements.timeoutClose) {
        elements.timeoutClose.addEventListener('click', hideTimeoutModal);
    }
    
    // 点击模态框外部关闭模态框
    if (elements.timeoutModal) {
        elements.timeoutModal.addEventListener('click', (e) => {
            if (e.target === elements.timeoutModal) {
                hideTimeoutModal();
            }
        });
    }
    
    // 为整个文档添加点击事件，确保点击页面任意位置都能继续练习
    document.addEventListener('click', () => {
        state.hasFocus = true;
        // 确保点击后键盘焦点回到输入区域
        if (state.isPracticeActive && elements.keyboardFocus) {
            elements.keyboardFocus.focus();
        }
    });
    
    // 更新设置可见性
    updateSettingsVisibility();
    
    // 加载历史记录
    loadHistoryRecords();
    
    // 应用保存的主题
    applySavedTheme();
    
    // 设置初始字体大小
    elements.textDisplay.style.fontSize = localStorage.getItem('textDisplayFontSize') || '1.5rem';
    
    // 初始化图表
    initChart();
    
    // 初始化时强制重置按钮状态
    if (elements.startBtn) elements.startBtn.disabled = false;
    if (elements.resetBtn) elements.resetBtn.disabled = true;
    console.log('初始化完成，按钮状态已设置');
}

// 生成键盘布局
function generateKeyboardLayout() {
    if (!elements.keyboardLayout) return;
    
    // 键盘布局数据，包含每个按键的字符和对应手指
    const keyboardLayout = [
        [
            { char: '`', finger: 'left-pinkie' },
            { char: '1', finger: 'left-pinkie' },
            { char: '2', finger: 'left-ring' },
            { char: '3', finger: 'left-middle' },
            { char: '4', finger: 'left-index' },
            { char: '5', finger: 'left-index' },
            { char: '6', finger: 'right-index' },
            { char: '7', finger: 'right-index' },
            { char: '8', finger: 'right-middle' },
            { char: '9', finger: 'right-ring' },
            { char: '0', finger: 'right-pinkie' },
            { char: '-', finger: 'right-pinkie' },
            { char: '=', finger: 'right-pinkie' },
            { char: 'Backspace', finger: 'right-pinkie', wide: true }
        ],
        [
            { char: 'Tab', finger: 'left-pinkie', wide: true, special: true },
            { char: 'Q', finger: 'left-pinkie' },
            { char: 'W', finger: 'left-ring' },
            { char: 'E', finger: 'left-middle' },
            { char: 'R', finger: 'left-index' },
            { char: 'T', finger: 'left-index' },
            { char: 'Y', finger: 'right-index' },
            { char: 'U', finger: 'right-index' },
            { char: 'I', finger: 'right-middle' },
            { char: 'O', finger: 'right-ring' },
            { char: 'P', finger: 'right-pinkie' },
            { char: '[', finger: 'right-pinkie' },
            { char: ']', finger: 'right-pinkie' },
            { char: '\\', finger: 'right-pinkie' }
        ],
        [
            { char: 'Caps', finger: 'left-pinkie', wide: true, special: true },
            { char: 'A', finger: 'left-pinkie' },
            { char: 'S', finger: 'left-ring' },
            { char: 'D', finger: 'left-middle' },
            { char: 'F', finger: 'left-index' },
            { char: 'G', finger: 'left-index' },
            { char: 'H', finger: 'right-index' },
            { char: 'J', finger: 'right-index' },
            { char: 'K', finger: 'right-middle' },
            { char: 'L', finger: 'right-ring' },
            { char: ';', finger: 'right-pinkie' },
            { char: "'", finger: 'right-pinkie' },
            { char: 'Enter', finger: 'right-pinkie', enter: true }
        ],
        [
            { char: 'Shift', finger: 'left-pinkie', shift: true },
            { char: 'Z', finger: 'left-ring' },
            { char: 'X', finger: 'left-middle' },
            { char: 'C', finger: 'left-index' },
            { char: 'V', finger: 'left-index' },
            { char: 'B', finger: 'left-index' },
            { char: 'N', finger: 'right-index' },
            { char: 'M', finger: 'right-index' },
            { char: ',', finger: 'right-middle' },
            { char: '.', finger: 'right-ring' },
            { char: '/', finger: 'right-pinkie' },
            { char: 'Shift', finger: 'right-pinkie', shift: true }
        ],
        [
            { char: 'Space', finger: 'thumb', space: true }
        ]
    ];
    
    // 清空现有布局
    elements.keyboardLayout.innerHTML = '';
    
    // 生成每个键盘行
    keyboardLayout.forEach(row => {
        const rowElement = document.createElement('div');
        rowElement.className = 'keyboard-row';
        
        row.forEach(key => {
            const keyElement = document.createElement('div');
            keyElement.className = 'keyboard-key ' + key.finger;
            
            // 设置按键文本
            if (key.special) {
                keyElement.textContent = key.char;
            } else if (key.space) {
                keyElement.textContent = '空格键';
                keyElement.classList.add('space');
            } else if (key.shift) {
                keyElement.textContent = 'Shift';
                keyElement.classList.add('shift');
            } else if (key.enter) {
                keyElement.textContent = 'Enter';
                keyElement.classList.add('enter');
            } else {
                keyElement.textContent = key.char;
                // 同时显示大小写
                if (/^[a-zA-Z]$/.test(key.char)) {
                    const lowerChar = document.createElement('span');
                    lowerChar.className = 'lower-char';
                    lowerChar.textContent = key.char.toLowerCase();
                    const upperChar = document.createElement('span');
                    upperChar.className = 'upper-char';
                    upperChar.textContent = key.char.toUpperCase();
                    keyElement.innerHTML = '';
                    keyElement.appendChild(upperChar);
                    keyElement.appendChild(document.createElement('br'));
                    keyElement.appendChild(lowerChar);
                }
            }
            
            // 设置特殊按键宽度
            if (key.wide) {
                keyElement.classList.add('wide');
            }
            
            rowElement.appendChild(keyElement);
        });
        
        elements.keyboardLayout.appendChild(rowElement);
    });
    
    // 添加键盘按下事件监听
    document.addEventListener('keydown', highlightKeyOnPress);
}

// 键盘按下时高亮显示对应按键
function highlightKeyOnPress(e) {
    // 只在练习模式下高亮键盘
    if (!state.isPracticeActive) return;
    
    // 防止事件冒泡导致的页面抖动
    e.preventDefault();
    
    let keyChar = e.key;
    
    // 处理特殊按键
    if (keyChar === ' ') {
        keyChar = 'Space';
    } else if (keyChar === 'Enter') {
        keyChar = 'Enter';
    } else if (keyChar === 'Tab') {
        keyChar = 'Tab';
    } else if (keyChar === 'Shift') {
        keyChar = 'Shift';
    } else if (keyChar === 'Backspace') {
        keyChar = 'Backspace';
    }
    
    // 查找并高亮对应按键，使用更精确的匹配逻辑
    const allKeys = document.querySelectorAll('.keyboard-key');
    allKeys.forEach(key => {
        // 清除之前可能的高亮状态
        if (key._highlightTimeout) {
            clearTimeout(key._highlightTimeout);
            key.classList.remove('pressed');
        }
    });
    
    // 现在只高亮匹配的按键
    allKeys.forEach(key => {
        const keyText = key.textContent.trim();
        
        // 对于特殊键，完全匹配
        if (keyText === keyChar) {
            // 标记为按下
            key.classList.add('pressed');
            
            // 设置超时移除按下效果
            key._highlightTimeout = setTimeout(() => {
                key.classList.remove('pressed');
                key._highlightTimeout = null;
            }, 200);
        }
        // 对于字母键，考虑大小写（只匹配实际的字母键，不匹配包含该字母的其他键）
        else if (keyChar.length === 1 && /^[a-zA-Z]$/.test(keyChar)) {
            // 使用元素的内部结构精确匹配字母键
            // 查找是否直接包含该字母（作为主要文本内容）
            const lowerChar = keyChar.toLowerCase();
            const upperChar = keyChar.toUpperCase();
            
            // 检查元素是否正好是单个字母键（考虑大小写）
            if ((keyText === lowerChar || keyText === upperChar) || 
                // 对于显示大小写的键，检查是否包含该字母
                (key.querySelector('.lower-char') && key.querySelector('.upper-char') && 
                 (key.querySelector('.lower-char').textContent === lowerChar || 
                  key.querySelector('.upper-char').textContent === upperChar))) {
                
                // 标记为按下
                key.classList.add('pressed');
                
                // 设置超时移除按下效果
                key._highlightTimeout = setTimeout(() => {
                    key.classList.remove('pressed');
                    key._highlightTimeout = null;
                }, 200);
            }
        }
    });
}

// 切换键盘显示/隐藏
function toggleKeyboardDisplay() {
    if (!elements.keyboardLayout) return;
    
    const isVisible = elements.showKeyboard.checked;
    
    if (isVisible) {
        elements.keyboardLayout.style.display = 'flex';
    } else {
        elements.keyboardLayout.style.display = 'none';
    }
}

// 更新设置面板可见性
function updateSettingsVisibility() {
    const mode = elements.modeSelect.value;
    
    if (mode === 'timed') {
        elements.timeSetting.classList.remove('hidden');
        elements.customTextContainer.classList.add('hidden');
    } else if (mode === 'custom') {
        elements.timeSetting.classList.add('hidden');
        elements.customTextContainer.classList.remove('hidden');
    } else {
        elements.timeSetting.classList.add('hidden');
        elements.customTextContainer.classList.add('hidden');
    }
}

// 开始练习
function startPractice() {
    console.log('开始练习按钮被点击');
    
    // 检查所有必要的DOM元素是否存在
    console.log('检查必要的DOM元素:', {
        textDisplay: !!elements.textDisplay,
        keyboardFocus: !!elements.keyboardFocus,
        wpmDisplay: !!elements.wpmDisplay,
        accuracyDisplay: !!elements.accuracyDisplay,
        errorsDisplay: !!elements.errorsDisplay,
        progressFill: !!elements.progressFill
    });
    
    if (state.isPracticeActive) {
        console.log('练习已经处于活动状态');
        return;
    }
    
    try {
        // 确保在DOM更新完成后执行滚动
        setTimeout(() => {
            // 首先尝试滚动到练习区域
            const practiceSection = document.getElementById('practice-area');
            if (practiceSection) {
                // 强制页面立即滚动到顶部
                window.scrollTo({ top: 0, behavior: 'auto' });
                console.log('已滚动到页面顶部');
                
                // 然后再微调滚动到练习区域的精确位置
                setTimeout(() => {
                    const practiceTop = practiceSection.getBoundingClientRect().top + window.pageYOffset - 20;
                    window.scrollTo({ top: practiceTop, behavior: 'auto' });
                    console.log('已微调滚动到练习区域');
                }, 50);
            } else {
                console.error('未找到练习区域元素，直接滚动到页面顶部');
                window.scrollTo({ top: 0, behavior: 'auto' });
            }
        }, 0);
        
        state.isPracticeActive = true;
        state.hasFocus = true; // 确保练习开始时焦点状态为true
        state.currentIndex = 0;
        state.correctChars = 0;
        state.errorCount = 0;
        state.typedChars = [];
        state.errorChars = {}; // 重置错误字符统计
        state.comboCount = 0;  // 重置连击数
        state.maxCombo = 0;    // 重置最大连击数
        
        // 生成练习文本
        console.log('正在生成练习文本');
        const text = generatePracticeText();
        state.totalChars = text.length;
        console.log('生成的文本长度:', state.totalChars);
        
        // 渲染文本到显示区域
        renderTextDisplay(text);
        
        // 移除可能存在的事件监听器，避免重复添加
        if (elements.keyboardFocus) {
            elements.keyboardFocus.removeEventListener('keydown', handleKeyDown);
            
            // 设置keyboardFocus为练习激活状态
            elements.keyboardFocus.classList.add('practice-active');
            elements.keyboardFocus.tabIndex = 0;
            
            // 添加键盘事件监听器
            elements.keyboardFocus.addEventListener('keydown', handleKeyDown);
            
            // 聚焦到键盘输入区域（使用setTimeout确保DOM更新完成后再聚焦）
            setTimeout(() => {
                if (elements.keyboardFocus) {
                    const focusSuccess = elements.keyboardFocus.focus();
                    console.log('键盘聚焦结果:', focusSuccess);
                    // 确认焦点状态
                    console.log('当前焦点元素:', document.activeElement === elements.keyboardFocus);
                }
            }, 100);
        } else {
            console.error('keyboardFocus元素不存在');
        }
        
        // 更新UI状态
        console.log('更新UI状态');
        if (elements.startBtn) elements.startBtn.disabled = true;
        if (elements.resetBtn) elements.resetBtn.disabled = false;
        
        // 开始计时
        startTimer();
        console.log('练习开始成功');
    } catch (error) {
        console.error('开始练习时发生错误:', error);
        // 确保在出错时重置状态
        state.isPracticeActive = false;
        if (elements.startBtn) elements.startBtn.disabled = false;
    }
}

// 生成练习文本
function generatePracticeText() {
    try {
        const mode = elements.modeSelect ? elements.modeSelect.value : 'basic';
        console.log('练习模式:', mode);
        
        if (mode === 'custom') {
            const customText = elements.customText ? elements.customText.value.trim() : '';
            
            // 验证自定义文本是否只包含英文和空格
            if (!customText) {
                return '请输入自定义文本进行练习';
            }
            
            // 使用正则表达式检查是否只包含英文和空格
            if (!/^[a-zA-Z\s]+$/.test(customText)) {
                // 显示错误提示（可以根据UI添加一个提示元素，这里简单用alert）
                alert('自定义文本中检测到中文，请去除后重试');
                return '请输入自定义文本进行练习';
            }
            
            return customText;
        }
        
        const difficulty = elements.difficultySelect ? elements.difficultySelect.value : 'easy';
        console.log('难度设置:', difficulty);
        
        // 检查wordLists是否已定义
        if (typeof wordLists === 'undefined') {
            console.error('wordLists未定义！');
            return '数据加载失败，请刷新页面重试';
        }
        
        const wordList = wordLists[difficulty] || [];
        
        // 检查单词列表是否为空
        if (!wordList.length) {
            console.error(`难度级别 ${difficulty} 没有可用的单词列表`);
            return '没有可用的练习数据，请选择其他难度';
        }
        
        // 获取用户选择的词数
        const selectedWordCount = elements.wordCountSelect ? parseInt(elements.wordCountSelect.value) : 10;
        console.log('词数设置:', selectedWordCount);
        
        // 随机选择并组合单词
        let text = '';
        
        for (let i = 0; i < selectedWordCount; i++) {
            const randomIndex = Math.floor(Math.random() * wordList.length);
            const word = wordList[randomIndex];
            
            if (i > 0) {
                text += ' '; // 单词之间添加空格
            }
            
            text += word;
        }
        
        console.log('生成的练习文本:', text);
        return text;
    } catch (error) {
        console.error('生成练习文本时发生错误:', error);
        return '生成练习内容失败，请重试';
    }
}

// 渲染文本到显示区域
function renderTextDisplay(text) {
    elements.textDisplay.innerHTML = '';
    
    for (let i = 0; i < text.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.dataset.char = text[i];
        
        if (text[i] === ' ') {
            charSpan.classList.add('space');
        }
        
        if (i === 0) {
            charSpan.classList.add('current');
        }
        
        charSpan.textContent = text[i];
        elements.textDisplay.appendChild(charSpan);
    }
}

// 处理键盘输入
function handleKeyDown(e) {
    console.log('键盘事件触发:', e.key);
    // 只有当练习激活且页面有焦点时才处理输入
    if (!state.isPracticeActive || !state.hasFocus) {
        console.log('练习未激活或页面无焦点');
        return;
    }
    
    // 阻止默认行为
    if (['Backspace', 'Tab', 'Enter', 'Escape', 'Delete', ' '].includes(e.key)) {
        e.preventDefault();
    }
    
    const chars = Array.from(elements.textDisplay.querySelectorAll('.char'));
    
    // 禁用退格键（撤回操作）
    if (e.key === 'Backspace') {
        return;
    }
    
    // 忽略功能键、方向键和修饰键
    const ignoreKeys = [
        'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
    ];
    
    // 忽略功能键和修饰键的组合，但允许Shift+字符（用于输入大写字母或特殊字符）
    if ((e.ctrlKey || e.altKey || e.metaKey) && !e.shiftKey || ignoreKeys.includes(e.key)) {
        return;
    }
    
    // 自定义文本模式下只允许输入字母
    if (elements.modeSelect.value === 'custom') {
        // 使用正则表达式检查是否为字母（大小写均可）
        if (!/^[a-zA-Z]$/.test(e.key)) {
            return;
        }
    }
    
    // 处理正常字符输入
    if (state.currentIndex < chars.length) {
        const currentChar = chars[state.currentIndex];
        const expectedChar = currentChar.textContent;
        const isCorrect = e.key === expectedChar;
        
        console.log(`输入字符: ${e.key}, 预期字符: ${expectedChar}, 是否正确: ${isCorrect}`);
        
        // 更新状态
        state.typedChars.push(e.key);
        
        if (isCorrect) {
            state.correctChars++;
            currentChar.classList.add('correct');
            playSound('correct');
            
            // 增加连击计数
            state.comboCount++;
            // 更新最大连击数
            if (state.comboCount > state.maxCombo) {
                state.maxCombo = state.comboCount;
            }
            // 连击奖励音效
            if (state.comboCount > 0 && state.comboCount % 10 === 0) {
                playSound('combo');
            }
        } else {
            state.errorCount++;
            currentChar.classList.add('error');
            playSound('error');
            
            // 记录错误字符
            if (state.errorChars[expectedChar]) {
                state.errorChars[expectedChar]++;
            } else {
                state.errorChars[expectedChar] = 1;
            }
            
            // 重置连击计数
            state.comboCount = 0;
        }
        
        // 更新当前字符位置
        currentChar.classList.remove('current');
        state.currentIndex++;
        
        if (state.currentIndex < chars.length) {
            chars[state.currentIndex].classList.add('current');
        }
        
        // 更新统计信息
        updateStats();
        
        // 检查是否完成练习
        checkPracticeCompletion();
    }
}



// 更新统计信息
function updateStats() {
    const elapsedTime = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const minutes = Math.max(0.1, elapsedTime / 60); // 避免除以零
    
    // 计算WPM (每分钟单词数)
    const words = state.correctChars / 5; // 假设平均每个单词5个字符
    const wpm = Math.round(words / minutes);
    
    // 计算准确率
    const accuracy = state.correctChars + state.errorCount > 0 
        ? Math.round((state.correctChars / (state.correctChars + state.errorCount)) * 100) 
        : 0;
    
    elements.wpmDisplay.textContent = wpm;
    elements.accuracyDisplay.textContent = `${accuracy}%`;
    elements.errorsDisplay.textContent = state.errorCount;
    
    // 更新连击显示
    if (elements.comboDisplay) {
        elements.comboDisplay.textContent = state.comboCount;
    }
    
    // 更新进度条
    if (state.totalChars > 0) {
        const progress = (state.currentIndex / state.totalChars) * 100;
        elements.progressFill.style.width = `${progress}%`;
    }
}

// 开始计时
function startTimer() {
    state.startTime = Date.now();
    
    // 对于计时模式，设置倒计时
    if (elements.modeSelect.value === 'timed') {
        state.remainingTime = parseInt(elements.timeSelect.value);
        updateTimerDisplay();
        
        state.timerInterval = setInterval(() => {
            state.remainingTime--;
            updateTimerDisplay();
            
            if (state.remainingTime <= 0) {
                endPractice();
            }
        }, 1000);
        
        elements.progressContainer.classList.remove('hidden');
    }
}

// 更新计时器显示
function updateTimerDisplay() {
    const minutes = Math.floor(state.remainingTime / 60).toString().padStart(2, '0');
    const seconds = (state.remainingTime % 60).toString().padStart(2, '0');
    elements.timerDisplay.textContent = `${minutes}:${seconds}`;
}

// 检查练习是否完成
function checkPracticeCompletion() {
    if (state.currentIndex >= state.totalChars) {
        endPractice();
    }
}

// 结束练习
function endPractice() {
    state.isPracticeActive = false;
    
    // 清除计时器
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    
    // 移除事件监听
    elements.keyboardFocus.removeEventListener('keydown', handleKeyDown);
    
    // 更新UI
    elements.startBtn.disabled = false;
    
    // 保存历史记录
    saveHistoryRecord();
    
    // 显示错误字符统计
    displayErrorStats();
    
    // 检查是否是计时模式下超时结束
    if (elements.modeSelect.value === 'timed') {
        console.log('计时模式结束，显示超时提示框');
        showTimeoutModal();
    } else {
        // 显示完成消息
        showCompletionMessage();
    }
    
    // 播放练习完成音效
    playSound('complete');
}

// 保存历史记录
function saveHistoryRecord() {
    const elapsedTime = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const minutes = Math.max(0.1, elapsedTime / 60);
    const words = state.correctChars / 5;
    const wpm = Math.round(words / minutes);
    const accuracy = state.correctChars + state.errorCount > 0 
        ? Math.round((state.correctChars / (state.correctChars + state.errorCount)) * 100) 
        : 0;
    
    const record = {
        date: new Date().toLocaleString(),
        wpm,
        accuracy,
        errors: state.errorCount,
        mode: elements.modeSelect.value,
        difficulty: elements.difficultySelect.value,
        timestamp: Date.now(),
        maxCombo: state.maxCombo,
        errorChars: state.errorChars
    };
    
    state.historyRecords.unshift(record);
    
    // 最多保存50条记录
    if (state.historyRecords.length > 50) {
        state.historyRecords = state.historyRecords.slice(0, 50);
    }
    
    localStorage.setItem('typingHistory', JSON.stringify(state.historyRecords));
    loadHistoryRecords();
}

// 加载历史记录
function loadHistoryRecords() {
    elements.historyList.innerHTML = '';
    
    if (state.historyRecords.length === 0) {
        const placeholder = document.createElement('p');
        placeholder.className = 'placeholder';
        placeholder.textContent = '暂无历史记录';
        elements.historyList.appendChild(placeholder);
        return;
    }
    
    // 找出WPM最高的记录
    const maxWpm = Math.max(...state.historyRecords.map(record => record.wpm));
    
    state.historyRecords.forEach(record => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        if (record.wpm === maxWpm) {
            item.classList.add('best');
        }
        
        const modeNames = {
            basic: '基础模式',
            timed: '计时模式',
            custom: '自定义模式'
        };
        
        const difficultyNames = {
            easy: '初级',
            medium: '中级',
            hard: '高级'
        };
        
        item.innerHTML = `
            <div class="date">${record.date}</div>
            <div class="wpm">${record.wpm} WPM</div>
            <div class="accuracy">${record.accuracy}%</div>
            <div class="mode">${modeNames[record.mode]} - ${difficultyNames[record.difficulty]}</div>
        `;
        
        elements.historyList.appendChild(item);
    });
    
    // 更新图表
    updateChart();
}

// 显示完成消息
function showCompletionMessage() {
    const elapsedTime = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const minutes = Math.max(0.1, elapsedTime / 60);
    const words = state.correctChars / 5;
    const wpm = Math.round(words / minutes);
    const accuracy = state.correctChars + state.errorCount > 0 
        ? Math.round((state.correctChars / (state.correctChars + state.errorCount)) * 100) 
        : 0;
    
    const message = `练习完成！\nWPM: ${wpm}\n准确率: ${accuracy}%\n错误次数: ${state.errorCount}\n最大连击数: ${state.maxCombo}`;
    console.log(message);
}



// 重置练习
function resetPractice() {
    console.log('重置练习按钮被点击');
    // 结束当前练习
    if (state.isPracticeActive) {
        state.isPracticeActive = false;
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
    }
    
    // 重置状态
    state.currentIndex = 0;
    state.correctChars = 0;
    state.errorCount = 0;
    state.typedChars = [];
    state.errorChars = {}; // 重置错误字符统计
    state.comboCount = 0;  // 重置连击数
    state.maxCombo = 0;    // 重置最大连击数
    
    // 更新UI
    elements.textDisplay.innerHTML = '<p class="placeholder">点击开始按钮开始练习</p>';
    elements.wpmDisplay.textContent = '0';
    elements.accuracyDisplay.textContent = '0%';
    elements.errorsDisplay.textContent = '0';
    if (elements.comboDisplay) {
        elements.comboDisplay.textContent = '0';
    }
    elements.progressFill.style.width = '0%';
    
    // 确保开始按钮始终启用，重置按钮始终禁用
    console.log('设置按钮状态');
    elements.startBtn.disabled = false;
    elements.resetBtn.disabled = true;
    
    elements.progressContainer.classList.add('hidden');
    
    // 隐藏错误统计面板
    if (elements.errorStatsPanel) {
        elements.errorStatsPanel.classList.add('hidden');
    }
    
    // 重置keyboardFocus状态
    elements.keyboardFocus.classList.remove('practice-active');
    elements.keyboardFocus.removeEventListener('keydown', handleKeyDown);
    elements.keyboardFocus.tabIndex = -1;
    elements.keyboardFocus.blur();
    
    console.log('重置练习完成');
}

// 切换主题
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDarkTheme = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    
    // 更新图表以反映主题变化
    if (chartInstance) {
        updateChart();
    }
}

// 应用保存的主题
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// 增加字体大小
function increaseFontSize() {
    const currentSize = parseFloat(elements.textDisplay.style.fontSize) || 1.5;
    const newSize = Math.min(currentSize + 0.1, 3.0);
    elements.textDisplay.style.fontSize = `${newSize}rem`;
    localStorage.setItem('textDisplayFontSize', `${newSize}rem`);
}

// 减少字体大小
function decreaseFontSize() {
    const currentSize = parseFloat(elements.textDisplay.style.fontSize) || 1.5;
    const newSize = Math.max(currentSize - 0.1, 1.0);
    elements.textDisplay.style.fontSize = `${newSize}rem`;
    localStorage.setItem('textDisplayFontSize', `${newSize}rem`);
}

// 显示超时提示框
function showTimeoutModal() {
    if (elements.timeoutModal) {
        elements.timeoutModal.style.display = 'flex';
        // 聚焦到关闭按钮，提升可访问性
        if (elements.timeoutClose) {
            elements.timeoutClose.focus();
        }
    }
}

// 隐藏超时提示框
function hideTimeoutModal() {
    if (elements.timeoutModal) {
        elements.timeoutModal.style.display = 'none';
    }
}

// 创建全局音频上下文实例
let audioContext = null;

// 播放音效
function playSound(type) {
    if (!elements.audioEnabled.checked) return;
    
    // 创建音频上下文和音效
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        
        // 确保只创建一个AudioContext实例并恢复它（如果处于暂停状态）
        if (!audioContext) {
            audioContext = new AudioContext();
        } else if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 根据类型设置不同的音效
        if (type === 'correct') {
            // 正确按键：模拟麻将声音（清脆的敲击声）
            oscillator.type = 'triangle'; // 三角波音色更接近金属敲击声
            oscillator.frequency.value = 800; // 麻将声音通常在中高频率
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // 较大的初始音量
            // 快速衰减，模拟敲击声的特点
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } else if (type === 'error') {
            // 错误按键：低音调、长音效、锯齿波
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 300;
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            // 添加频率下降效果，使错误音效更明显
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } else if (type === 'complete') {
            // 倒计时结束或练习完成时的提示音，清晰明显
            oscillator.type = 'sine'; // 正弦波音色清晰
            oscillator.frequency.value = 1200; // 较高频率确保清晰可辨
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // 较大音量
            // 双音调效果，先高后低
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
            // 缓慢衰减
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } else if (type === 'combo') {
            // 连击奖励音效
            oscillator.type = 'sine';
            oscillator.frequency.value = 1000;
            gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
            // 上升音调效果
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(2000, audioContext.currentTime + 0.3);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    } catch (e) {
        // 如果不支持音频，静默失败
    }
}

// 显示错误字符统计
function displayErrorStats() {
    if (!elements.errorStatsPanel || !elements.errorCharsList) return;
    
    // 清空列表
    elements.errorCharsList.innerHTML = '';
    
    // 检查是否有错误
    if (Object.keys(state.errorChars).length === 0) {
        const noErrorMsg = document.createElement('p');
        noErrorMsg.className = 'placeholder';
        noErrorMsg.textContent = '没有错误字符！做得很好！';
        elements.errorCharsList.appendChild(noErrorMsg);
    } else {
        // 按照错误次数排序（从多到少）
        const sortedErrorChars = Object.entries(state.errorChars)
            .sort((a, b) => b[1] - a[1]);
        
        // 创建错误字符项
        sortedErrorChars.forEach(([char, count]) => {
            const item = document.createElement('div');
            item.className = 'error-char-item';
            
            const charElement = document.createElement('div');
            charElement.className = 'error-char';
            // 为空格显示特殊符号
            charElement.textContent = char === ' ' ? '␣' : char;
            
            const countElement = document.createElement('div');
            countElement.className = 'error-count';
            countElement.textContent = `错误次数: ${count}`;
            
            item.appendChild(charElement);
            item.appendChild(countElement);
            elements.errorCharsList.appendChild(item);
        });
    }
    
    // 显示面板
    elements.errorStatsPanel.classList.remove('hidden');
}

// 初始化图表
function initChart() {
    if (!elements.progressChart || state.historyRecords.length === 0) return;
    
    const chartType = elements.chartTypeSelect.value;
    updateChart();
}

// 更新图表
function updateChart() {
    if (!elements.progressChart || state.historyRecords.length === 0) return;
    
    const chartType = elements.chartTypeSelect.value;
    
    // 准备数据 - 最多显示最近10条记录
    const recentRecords = state.historyRecords.slice(0, 10).reverse();
    const labels = recentRecords.map(record => {
        const date = new Date(record.date);
        return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
    });
    
    let data, label, color;
    
    switch(chartType) {
        case 'wpm':
            data = recentRecords.map(record => record.wpm);
            label = 'WPM (每分钟单词数)';
            color = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
            break;
        case 'accuracy':
            data = recentRecords.map(record => record.accuracy);
            label = '准确率 (%)';
            color = getComputedStyle(document.documentElement).getPropertyValue('--success-color');
            break;
        case 'combo':
            data = recentRecords.map(record => record.maxCombo || 0);
            label = '最大连击数';
            color = getComputedStyle(document.documentElement).getPropertyValue('--warning-color');
            break;
        default:
            return;
    }
    
    // 判断是否为暗黑模式
    const isDarkMode = document.body.classList.contains('dark-theme');
    const textColor = isDarkMode ? '#e0e0e0' : '#666';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // 销毁现有图表实例
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // 创建新图表
    chartInstance = new Chart(elements.progressChart, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color + '20', // 添加透明度
                tension: 0.4,
                fill: true,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: {
                            family: 'Microsoft YaHei, Arial, sans-serif'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? '#333' : 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: color,
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 5,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.raw;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColor,
                        font: {
                            family: 'Microsoft YaHei, Arial, sans-serif'
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        font: {
                            family: 'Microsoft YaHei, Arial, sans-serif'
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

// 清空历史记录
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        state.historyRecords = [];
        localStorage.removeItem('typingHistory');
        loadHistoryRecords();
        // 清空图表
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，初始化应用');
    try {
        init();
        
        // 确保开始时按钮状态正确
        setTimeout(() => {
            console.log('确保开始状态的按钮设置正确');
            if (elements.startBtn) elements.startBtn.disabled = false;
            if (elements.resetBtn) elements.resetBtn.disabled = true;
            
            // 再次检查并重新绑定事件监听器
            if (elements.startBtn) {
                elements.startBtn.removeEventListener('click', startPractice);
                elements.startBtn.addEventListener('click', startPractice);
                console.log('已重新绑定开始练习按钮事件');
            }
            
            // 额外的键盘布局检查和初始化
            console.log('检查键盘布局元素:', {
                keyboardLayout: !!elements.keyboardLayout,
                keyboardLayoutPanel: !!elements.keyboardLayoutPanel,
                showKeyboard: !!elements.showKeyboard
            });
            
            // 重新获取键盘布局相关元素，以防之前的引用丢失
            if (!elements.keyboardLayout) {
                console.log('重新获取键盘布局元素');
                elements.keyboardLayout = document.getElementById('keyboard-layout');
            }
            
            if (!elements.keyboardLayoutPanel) {
                elements.keyboardLayoutPanel = document.getElementById('keyboard-layout-panel');
            }
            
            if (!elements.showKeyboard) {
                elements.showKeyboard = document.getElementById('show-keyboard');
            }
            
            // 确保键盘布局面板可见
            if (elements.keyboardLayoutPanel) {
                elements.keyboardLayoutPanel.classList.remove('hidden');
                console.log('确保键盘布局面板可见');
            }
            
            // 强制重新生成键盘布局
            if (elements.keyboardLayout) {
                console.log('强制重新生成键盘布局');
                generateKeyboardLayout();
                
                // 确保键盘布局默认显示
                elements.keyboardLayout.style.display = 'flex';
                console.log('键盘布局已设置为显示');
            }
            
            // 确保显示键盘开关处于选中状态
            if (elements.showKeyboard) {
                elements.showKeyboard.checked = true;
                console.log('键盘显示开关已设置为选中');
            }
        }, 100);
    } catch (error) {
        console.error('初始化应用时发生错误:', error);
    }
});