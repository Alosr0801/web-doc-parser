"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const url_1 = require("url");
const api_client_1 = require("./api-client");
// 存储解析的网页内容
let webpageContents = new Map();
// AI会话面板类
class AISessionPanel {
    static createOrShow() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // 如果面板已经存在，则显示它
        if (AISessionPanel.currentPanel) {
            AISessionPanel.currentPanel._panel.reveal(column);
            return AISessionPanel.currentPanel;
        }
        // 否则，创建一个新面板
        const panel = vscode.window.createWebviewPanel('aiSession', 'AI助手会话', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        return new AISessionPanel(panel);
    }
    constructor(panel) {
        this._disposables = [];
        this._messages = [];
        this._panel = panel;
        this._messages = [];
        // 设置初始HTML内容
        this._update();
        // 监听面板关闭事件
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // 处理webview中的消息
        this._panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            switch (message.command) {
                case 'sendMessage':
                    yield this.sendUserMessage(message.text);
                    return;
            }
        }), null, this._disposables);
        AISessionPanel.currentPanel = this;
    }
    // 添加来自网页的内容
    addWebContent(url, content) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._panel.reveal();
                // 显示用户查询的URL
                this._messages.push({ role: 'user', content: `请帮我理解这个网页的内容: ${url}` });
                // 显示处理中状态
                this._addSystemMessage('正在向AI助手发送网页内容，请稍候...');
                this._update();
                // 发送到AI并获取响应
                const response = yield api_client_1.aiClient.sendToAI(content);
                // 移除处理中消息
                this._messages.pop();
                // 添加AI的回复
                this._messages.push({ role: 'assistant', content: response });
                this._update();
            }
            catch (error) {
                this._messages.pop(); // 移除处理中消息
                this._addSystemMessage(`错误: ${error instanceof Error ? error.message : String(error)}`);
                this._update();
            }
        });
    }
    // 发送用户消息
    sendUserMessage(text) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 添加用户消息
                this._messages.push({ role: 'user', content: text });
                // 显示处理中状态
                this._addSystemMessage('AI助手正在思考中...');
                this._update();
                // 准备上下文消息
                const contextMessages = this._messages
                    .filter(msg => msg.role !== 'system')
                    .map(msg => msg.content);
                // 移除最后一条系统消息（正在思考中...）
                contextMessages.pop();
                // 发送到AI并获取响应
                const response = yield api_client_1.aiClient.sendToAI('', contextMessages);
                // 移除处理中消息
                this._messages.pop();
                // 添加AI的回复
                this._messages.push({ role: 'assistant', content: response });
                this._update();
            }
            catch (error) {
                this._messages.pop(); // 移除处理中消息
                this._addSystemMessage(`错误: ${error instanceof Error ? error.message : String(error)}`);
                this._update();
            }
        });
    }
    // 添加系统消息
    _addSystemMessage(text) {
        this._messages.push({ role: 'system', content: text });
    }
    _update() {
        this._panel.webview.html = this._getHtmlForWebview();
    }
    _getHtmlForWebview() {
        const messagesHtml = this._messages.map(message => {
            let className = '';
            let label = '';
            switch (message.role) {
                case 'user':
                    className = 'user-message';
                    label = '你';
                    break;
                case 'assistant':
                    className = 'assistant-message';
                    label = 'AI助手';
                    break;
                case 'system':
                    className = 'system-message';
                    label = '系统';
                    break;
            }
            // 转换markdown为HTML（简单实现，实际可能需要更强大的markdown渲染库）
            let content = message.content
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
            return `
                <div class="message ${className}">
                    <div class="message-header">${label}</div>
                    <div class="message-content">${content}</div>
                </div>
            `;
        }).join('');
        return `
            <!DOCTYPE html>
            <html lang="zh">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', system-ui, 'Ubuntu', 'Droid Sans', sans-serif;
                        padding: 0;
                        margin: 0;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .messages-container {
                        padding: 20px;
                        overflow-y: auto;
                        max-height: calc(100vh - 80px);
                    }
                    .message {
                        margin-bottom: 20px;
                        padding: 10px 15px;
                        border-radius: 5px;
                    }
                    .user-message {
                        background-color: var(--vscode-activityBarBadge-background);
                        color: var(--vscode-activityBarBadge-foreground);
                        margin-left: 50px;
                    }
                    .assistant-message {
                        background-color: var(--vscode-editor-selectionBackground);
                        color: var(--vscode-editor-selectionForeground, var(--vscode-editor-foreground));
                        margin-right: 50px;
                    }
                    .system-message {
                        background-color: var(--vscode-statusBarItem-warningBackground);
                        color: var(--vscode-statusBarItem-warningForeground);
                        text-align: center;
                    }
                    .message-header {
                        font-weight: bold;
                        margin-bottom: 5px;
                        font-size: 0.9em;
                    }
                    .message-content {
                        line-height: 1.5;
                    }
                    .message-content code {
                        background-color: rgba(0, 0, 0, 0.1);
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-family: monospace;
                    }
                    .message-content pre {
                        background-color: rgba(0, 0, 0, 0.1);
                        padding: 10px;
                        border-radius: 5px;
                        overflow-x: auto;
                    }
                    .input-container {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        padding: 10px;
                        background-color: var(--vscode-editor-background);
                        border-top: 1px solid var(--vscode-editorGroup-border);
                        display: flex;
                    }
                    #message-input {
                        flex: 1;
                        padding: 8px;
                        border: 1px solid var(--vscode-input-border);
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border-radius: 5px;
                    }
                    #send-button {
                        margin-left: 10px;
                        padding: 8px 15px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    }
                    #send-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="messages-container">
                    ${messagesHtml}
                </div>
                <div class="input-container">
                    <textarea id="message-input" placeholder="输入消息..." rows="2"></textarea>
                    <button id="send-button">发送</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const messageInput = document.getElementById('message-input');
                    const sendButton = document.getElementById('send-button');
                    const messagesContainer = document.querySelector('.messages-container');
                    
                    // 滚动到底部
                    function scrollToBottom() {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                    
                    // 发送消息
                    function sendMessage() {
                        const text = messageInput.value.trim();
                        if (text) {
                            vscode.postMessage({
                                command: 'sendMessage',
                                text: text
                            });
                            messageInput.value = '';
                        }
                    }
                    
                    // 绑定事件
                    sendButton.addEventListener('click', sendMessage);
                    
                    messageInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    });
                    
                    // 初始滚动到底部
                    scrollToBottom();
                </script>
            </body>
            </html>
        `;
    }
    dispose() {
        AISessionPanel.currentPanel = undefined;
        // 清理资源
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
// 保存网页内容到全局状态
function saveContentsToState(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const contentsObj = {};
        webpageContents.forEach((value, key) => {
            contentsObj[key] = value;
        });
        yield context.globalState.update('webpageContents', contentsObj);
    });
}
// 获取网页内容的函数
function fetchWebpageContent(url, isHtml = true) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            try {
                const parsedUrl = new url_1.URL(url);
                const options = {
                    hostname: parsedUrl.hostname,
                    path: parsedUrl.pathname + parsedUrl.search,
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36'
                    }
                };
                const protocol = parsedUrl.protocol === 'https:' ? https : http;
                const req = protocol.request(options, (res) => {
                    let data = '';
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                            reject(new Error(`HTTP状态码: ${res.statusCode}`));
                            return;
                        }
                        if (isHtml) {
                            // 简单处理HTML，提取主要内容
                            const cleanedContent = cleanHtmlContent(data);
                            resolve(cleanedContent);
                        }
                        else {
                            resolve(data);
                        }
                    });
                });
                req.on('error', (e) => {
                    reject(e);
                });
                req.end();
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
// 清理HTML内容，移除样式、脚本等无用内容
function cleanHtmlContent(html) {
    // 移除HTML注释
    let content = html.replace(/<!--[\s\S]*?-->/g, '');
    // 移除脚本标签及其内容
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // 移除样式标签及其内容
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    // 移除head标签及其内容
    content = content.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '');
    // 提取body内容或整个HTML
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
        content = bodyMatch[1];
    }
    // 移除所有HTML标签的属性（保留标签本身）
    content = content.replace(/<([a-z][a-z0-9]*)[^>]*>/gi, '<$1>');
    // 去除多余空白
    content = content.replace(/\s+/g, ' ').trim();
    return content;
}
// HTML转Markdown
function htmlToMarkdown(html) {
    try {
        const td = new TurndownService();
        return td.turndown(html);
    }
    catch (error) {
        console.error('HTML转Markdown失败:', error);
        // 简单的fallback实现
        let markdown = html;
        // 移除HTML标签，但保留内容
        markdown = markdown.replace(/<[^>]+>/g, '');
        // 替换一些常见的HTML实体
        markdown = markdown.replace(/&nbsp;/g, ' ');
        markdown = markdown.replace(/&gt;/g, '>');
        markdown = markdown.replace(/&lt;/g, '<');
        markdown = markdown.replace(/&amp;/g, '&');
        return markdown;
    }
}
// 临时的Turndown服务实现
class TurndownService {
    turndown(html) {
        let markdown = html;
        // 移除所有HTML标签，但保留内容
        markdown = markdown.replace(/<[^>]+>/g, '');
        // 替换一些常见的HTML实体
        markdown = markdown.replace(/&nbsp;/g, ' ');
        markdown = markdown.replace(/&gt;/g, '>');
        markdown = markdown.replace(/&lt;/g, '<');
        markdown = markdown.replace(/&amp;/g, '&');
        return markdown;
    }
}
// 尝试获取Markdown源代码
function tryGetMarkdownSource(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isGithub = url.includes('github.com');
            const isGitlab = url.includes('gitlab.com');
            const isRawMarkdown = url.endsWith('.md') || url.includes('.md?') || url.includes('/raw/');
            if (!isGithub && !isGitlab && !isRawMarkdown) {
                return null;
            }
            if (isGithub && url.includes('/blob/')) {
                url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            }
            if (isGitlab && url.includes('/blob/')) {
                url = url.replace('/-/blob/', '/-/raw/');
            }
            const content = yield fetchWebpageContent(url, false);
            const mdIndicators = ['#', '##', '```', '---', '- ', '* ', '> '];
            const hasMarkdownIndicators = mdIndicators.some(indicator => content.includes(indicator));
            const hasHtmlTags = /<[a-z][a-z0-9]*>/i.test(content);
            if (hasMarkdownIndicators && !hasHtmlTags) {
                return content;
            }
            else if (isRawMarkdown) {
                return content;
            }
            return null;
        }
        catch (error) {
            console.error('获取Markdown源文件失败:', error);
            return null;
        }
    });
}
// 显示内容预览
function showContentPreview(url, content) {
    const doc = vscode.workspace.openTextDocument({
        content: content,
        language: 'html'
    }).then(doc => {
        vscode.window.showTextDocument(doc);
    });
}
// 显示Markdown预览
function showMarkdownPreview(url, markdown) {
    const doc = vscode.workspace.openTextDocument({
        content: markdown,
        language: 'markdown'
    }).then(doc => {
        vscode.window.showTextDocument(doc).then(() => {
            vscode.commands.executeCommand('markdown.showPreview');
        });
    });
}
function activate(context) {
    console.log('网页内容解析器已激活');
    const storedData = context.globalState.get('webpageContents');
    if (storedData) {
        webpageContents = new Map(Object.entries(storedData));
    }
    let fetchCommand = vscode.commands.registerCommand('extension.fetchWebpage', () => __awaiter(this, void 0, void 0, function* () {
        const url = yield vscode.window.showInputBox({
            prompt: '输入要解析的网页URL',
            placeHolder: 'https://example.com/docs'
        });
        if (!url)
            return;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `正在获取网页内容: ${url}`,
            cancellable: true
        }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
            try {
                const content = yield fetchWebpageContent(url);
                if (content) {
                    webpageContents.set(url, content);
                    yield saveContentsToState(context);
                    showContentPreview(url, content);
                    vscode.window.showInformationMessage(`已成功解析网页: ${url}`);
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(`获取网页内容失败: ${error instanceof Error ? error.message : String(error)}`);
            }
        }));
    }));
    let fetchMarkdownCommand = vscode.commands.registerCommand('extension.fetchMarkdown', () => __awaiter(this, void 0, void 0, function* () {
        const url = yield vscode.window.showInputBox({
            prompt: '输入要解析Markdown的网页URL',
            placeHolder: 'https://example.com/docs'
        });
        if (!url)
            return;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `正在尝试获取Markdown源码: ${url}`,
            cancellable: true
        }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
            try {
                const markdown = yield tryGetMarkdownSource(url);
                if (markdown) {
                    webpageContents.set(`${url} (Markdown)`, markdown);
                    yield saveContentsToState(context);
                    showMarkdownPreview(url, markdown);
                    vscode.window.showInformationMessage(`已成功获取Markdown源码: ${url}`);
                }
                else {
                    const htmlContent = yield fetchWebpageContent(url, false);
                    const convertedMarkdown = htmlToMarkdown(htmlContent);
                    webpageContents.set(`${url} (转换为Markdown)`, convertedMarkdown);
                    yield saveContentsToState(context);
                    showMarkdownPreview(url, convertedMarkdown);
                    vscode.window.showInformationMessage(`已将HTML内容转换为Markdown格式: ${url}`);
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(`获取Markdown内容失败: ${error instanceof Error ? error.message : String(error)}`);
            }
        }));
    }));
    let listCommand = vscode.commands.registerCommand('extension.listWebpages', () => __awaiter(this, void 0, void 0, function* () {
        if (webpageContents.size === 0) {
            vscode.window.showInformationMessage('尚未解析任何网页');
            return;
        }
        const urls = Array.from(webpageContents.keys());
        const selectedUrl = yield vscode.window.showQuickPick(urls, {
            placeHolder: '选择已解析的网页'
        });
        if (selectedUrl) {
            const content = webpageContents.get(selectedUrl) || '';
            if (selectedUrl.includes('Markdown')) {
                showMarkdownPreview(selectedUrl, content);
            }
            else {
                showContentPreview(selectedUrl, content);
            }
        }
    }));
    let copyCommand = vscode.commands.registerCommand('extension.copyWebpageContent', () => __awaiter(this, void 0, void 0, function* () {
        if (webpageContents.size === 0) {
            vscode.window.showInformationMessage('尚未解析任何网页');
            return;
        }
        const urls = Array.from(webpageContents.keys());
        const selectedUrl = yield vscode.window.showQuickPick(urls, {
            placeHolder: '选择要复制内容的网页'
        });
        if (selectedUrl && webpageContents.has(selectedUrl)) {
            const content = webpageContents.get(selectedUrl);
            yield vscode.env.clipboard.writeText(content || '');
            vscode.window.showInformationMessage('内容已复制到剪贴板，现在您可以粘贴给AI助手');
        }
    }));
    let clearCommand = vscode.commands.registerCommand('extension.clearWebpages', () => __awaiter(this, void 0, void 0, function* () {
        webpageContents.clear();
        yield saveContentsToState(context);
        vscode.window.showInformationMessage('已清除所有存储的网页内容');
    }));
    let configureAICommand = vscode.commands.registerCommand('extension.configureAIService', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const configured = yield api_client_1.aiClient.configure();
            if (configured) {
                vscode.window.showInformationMessage('AI服务配置成功');
            }
            else {
                vscode.window.showInformationMessage('AI服务配置已取消');
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`配置AI服务时出错: ${error instanceof Error ? error.message : String(error)}`);
        }
    }));
    let sendToAICommand = vscode.commands.registerCommand('extension.sendToAI', () => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!api_client_1.aiClient.isConfigured()) {
                const configure = yield vscode.window.showInformationMessage('AI服务尚未配置，是否现在配置？', '配置', '取消');
                if (configure === '配置') {
                    vscode.commands.executeCommand('extension.configureAIService');
                }
                return;
            }
            if (webpageContents.size === 0) {
                vscode.window.showInformationMessage('尚未解析任何网页');
                return;
            }
            const urls = Array.from(webpageContents.keys());
            const selectedUrl = yield vscode.window.showQuickPick(urls, {
                placeHolder: '选择要发送到AI助手的网页内容'
            });
            if (selectedUrl && webpageContents.has(selectedUrl)) {
                const content = webpageContents.get(selectedUrl) || '';
                const panel = AISessionPanel.createOrShow();
                yield panel.addWebContent(selectedUrl, content);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`发送到AI助手时出错: ${error instanceof Error ? error.message : String(error)}`);
        }
    }));
    let fetchAndSendToAICommand = vscode.commands.registerCommand('extension.fetchAndSendToAI', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const url = yield vscode.window.showInputBox({
                prompt: '输入要获取并发送到GitHub Copilot的网页URL',
                placeHolder: 'https://example.com/docs'
            });
            if (!url)
                return;
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `正在获取网页内容: ${url}`,
                cancellable: true
            }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
                try {
                    let content = yield tryGetMarkdownSource(url);
                    let contentType = 'Markdown';
                    if (!content) {
                        content = yield fetchWebpageContent(url);
                        contentType = 'HTML';
                    }
                    if (content) {
                        const contentKey = contentType === 'Markdown' ? `${url} (Markdown)` : url;
                        webpageContents.set(contentKey, content);
                        yield saveContentsToState(context);
                        // 使用Copilot面板或创建新文档
                        try {
                            const panel = AISessionPanel.createOrShow();
                            yield panel.addWebContent(url, content);
                            vscode.window.showInformationMessage(`已成功将${contentType}内容发送到AI助手`);
                        }
                        catch (error) {
                            // 备用选项：如果无法显示面板，创建新文档
                            const document = yield vscode.workspace.openTextDocument({
                                content: content,
                                language: contentType.toLowerCase()
                            });
                            yield vscode.window.showTextDocument(document);
                            vscode.window.showInformationMessage('请使用 Ctrl+I 触发Copilot内联建议');
                        }
                    }
                }
                catch (error) {
                    vscode.window.showErrorMessage(`获取并发送网页内容时出错: ${error instanceof Error ? error.message : String(error)}`);
                }
            }));
        }
        catch (error) {
            vscode.window.showErrorMessage(`命令执行出错: ${error instanceof Error ? error.message : String(error)}`);
        }
    }));
    // 新增命令
    let sendToCopilotCommand = vscode.commands.registerCommand('extension.sendToCopilot', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const url = yield vscode.window.showInputBox({
                prompt: '输入要获取并发送到GitHub Copilot的网页URL',
                placeHolder: 'https://example.com/docs'
            });
            if (!url)
                return;
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `正在获取网页内容: ${url}`,
                cancellable: true
            }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
                try {
                    let content = yield tryGetMarkdownSource(url);
                    let contentType = 'Markdown';
                    if (!content) {
                        content = yield fetchWebpageContent(url);
                        contentType = 'HTML';
                    }
                    if (content) {
                        // 创建新文档，准备与Copilot交互
                        const document = yield vscode.workspace.openTextDocument({
                            content: `# ${url} 的内容分析\n\n以下是从网页中提取的内容，请GitHub Copilot分析其中的关键信息:\n\n${content}`,
                            language: 'markdown'
                        });
                        yield vscode.window.showTextDocument(document);
                        // 尝试自动触发Copilot
                        setTimeout(() => {
                            vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
                            vscode.window.showInformationMessage('已触发GitHub Copilot建议。如未显示，请使用 Ctrl+I 手动触发。');
                        }, 1000);
                    }
                }
                catch (error) {
                    vscode.window.showErrorMessage(`获取并发送网页内容时出错: ${error instanceof Error ? error.message : String(error)}`);
                }
            }));
        }
        catch (error) {
            vscode.window.showErrorMessage(`命令执行出错: ${error instanceof Error ? error.message : String(error)}`);
        }
    }));
    context.subscriptions.push(fetchCommand, fetchMarkdownCommand, listCommand, copyCommand, clearCommand, configureAICommand, sendToAICommand, fetchAndSendToAICommand, sendToCopilotCommand // 添加新命令
    );
}
exports.activate = activate;
function deactivate() {
    // 清理资源
}
exports.deactivate = deactivate;
