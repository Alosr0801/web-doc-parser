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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiClient = exports.AIServiceClient = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
class AIServiceClient {
    constructor() {
        this.config = null;
        // 从配置中加载API设置，默认使用copilot
        this.loadConfig();
        if (!this.config) {
            this.config = { provider: 'copilot' };
        }
    }
    // 加载配置
    loadConfig() {
        const config = vscode.workspace.getConfiguration('webDocParser');
        const provider = config.get('aiProvider');
        const apiKey = config.get('apiKey');
        const endpoint = config.get('endpoint');
        const model = config.get('model');
        if (provider) {
            this.config = { provider, apiKey, endpoint, model };
        }
        else {
            this.config = { provider: 'copilot' };
        }
    }
    // 检查API设置是否已配置
    isConfigured() {
        return true; // 始终返回true，因为默认使用Copilot
    }
    // 配置AI服务
    configure() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 获取当前配置
                const config = vscode.workspace.getConfiguration('webDocParser');
                // 步骤1：选择服务提供商
                const providers = [
                    { label: 'GitHub Copilot (默认)', value: 'copilot' },
                    { label: 'OpenAI', value: 'openai' },
                    { label: 'Azure OpenAI', value: 'azure' },
                    { label: 'Anthropic', value: 'anthropic' },
                    { label: '自定义API', value: 'custom' }
                ];
                const provider = yield vscode.window.showQuickPick(providers.map(p => p.label), { placeHolder: '选择AI服务提供商' });
                if (!provider) {
                    return false; // 用户取消了选择
                }
                const providerValue = ((_a = providers.find(p => p.label === provider)) === null || _a === void 0 ? void 0 : _a.value) || 'copilot';
                yield config.update('aiProvider', providerValue, true);
                // 如果选择了Copilot，不需要进一步配置
                if (providerValue === 'copilot') {
                    this.config = { provider: 'copilot' };
                    return true;
                }
                // 步骤2：输入API密钥
                const apiKey = yield vscode.window.showInputBox({
                    prompt: '输入API密钥',
                    password: true,
                    placeHolder: '您的API密钥将被安全存储'
                });
                if (!apiKey) {
                    return false; // 用户取消了输入
                }
                yield config.update('apiKey', apiKey, true);
                // 步骤3：如果是Azure或自定义API，需要输入端点
                if (providerValue === 'azure' || providerValue === 'custom') {
                    const endpoint = yield vscode.window.showInputBox({
                        prompt: '输入API端点URL',
                        placeHolder: providerValue === 'azure' ?
                            'https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-05-15' :
                            'https://api.example.com/v1/chat'
                    });
                    if (!endpoint) {
                        return false; // 用户取消了输入
                    }
                    yield config.update('endpoint', endpoint, true);
                }
                // 步骤4：输入模型名称
                let defaultModel = '';
                switch (providerValue) {
                    case 'openai':
                        defaultModel = 'gpt-4o';
                        break;
                    case 'azure':
                        defaultModel = 'gpt-4';
                        break;
                    case 'anthropic':
                        defaultModel = 'claude-3-sonnet';
                        break;
                    case 'custom':
                        defaultModel = 'gpt-4';
                        break;
                }
                const models = {
                    'openai': ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
                    'azure': ['gpt-4', 'gpt-3.5-turbo'],
                    'anthropic': ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
                    'custom': []
                };
                let modelOptions = models[providerValue] || [];
                let model;
                if (modelOptions.length > 0) {
                    model = yield vscode.window.showQuickPick(modelOptions, { placeHolder: '选择AI模型' });
                }
                else {
                    model = yield vscode.window.showInputBox({
                        prompt: '输入模型名称',
                        value: defaultModel,
                        placeHolder: '模型名称（如gpt-4, claude-3-sonnet等）'
                    });
                }
                if (!model) {
                    model = defaultModel; // 使用默认模型
                }
                yield config.update('model', model, true);
                // 重新加载配置
                this.loadConfig();
                return true;
            }
            catch (error) {
                console.error('配置AI服务时出错:', error);
                throw new Error(`配置AI服务时出错: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    // 发送网页内容到AI助手
    sendToAI(content, contextMessages = []) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.config || this.config.provider === 'copilot') {
                    return yield this.sendToCopilot(content, contextMessages);
                }
                switch (this.config.provider) {
                    case 'openai':
                        return yield this.sendToOpenAI(content, contextMessages);
                    case 'azure':
                        return yield this.sendToAzureOpenAI(content, contextMessages);
                    case 'anthropic':
                        return yield this.sendToAnthropic(content, contextMessages);
                    case 'custom':
                        return yield this.sendToCustomAPI(content, contextMessages);
                    default:
                        return yield this.sendToCopilot(content, contextMessages);
                }
            }
            catch (error) {
                console.error('发送到AI助手时出错:', error);
                throw new Error(`发送到AI助手时出错: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    // 发送到GitHub Copilot
    sendToCopilot(content, contextMessages) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 准备发送给Copilot的消息
                const userMessages = contextMessages.join('\n\n');
                const prompt = userMessages ?
                    `${userMessages}\n\n以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}` :
                    `以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}`;
                // 使用VS Code内置命令调用Copilot
                const result = yield vscode.commands.executeCommand('github.copilot.generate', {
                    prompt: prompt,
                    temperature: 0.7
                });
                if (typeof result === 'string') {
                    return result;
                }
                else {
                    // 备用方案：打开新的编辑器并让用户与Copilot交互
                    const document = yield vscode.workspace.openTextDocument({
                        content: prompt,
                        language: 'markdown'
                    });
                    yield vscode.window.showTextDocument(document);
                    yield vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
                    return "已在新文档中打开内容并触发Copilot建议。请查看Copilot提供的内联建议。";
                }
            }
            catch (error) {
                console.error('调用GitHub Copilot时出错:', error);
                // 如果直接API调用失败，尝试备用方案
                try {
                    const document = yield vscode.workspace.openTextDocument({
                        content: `以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}`,
                        language: 'markdown'
                    });
                    yield vscode.window.showTextDocument(document);
                    vscode.window.showInformationMessage('请使用 Ctrl+I 触发Copilot内联建议，或右键菜单中选择"Copilot"');
                    return "已在新文档中打开内容。请使用 Ctrl+I 触发Copilot建议，或右键菜单中选择 'Copilot' 。";
                }
                catch (fallbackError) {
                    throw new Error(`无法调用GitHub Copilot: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        });
    }
    //  sendToOpenAI 方法
    sendToOpenAI(content, contextMessages) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = this.config) === null || _a === void 0 ? void 0 : _a.apiKey)) {
                throw new Error('缺少OpenAI API密钥');
            }
            const model = ((_b = this.config) === null || _b === void 0 ? void 0 : _b.model) || 'gpt-4';
            const endpoint = ((_c = this.config) === null || _c === void 0 ? void 0 : _c.endpoint) || 'https://api.openai.com/v1/chat/completions';
            const messages = [
                { role: 'system', content: '你是一个有用的AI助手。你将收到一个网页内容，请根据内容回答用户的问题。' },
                ...contextMessages.map(msg => ({ role: 'user', content: msg })),
                { role: 'user', content: `以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}` }
            ];
            const response = yield axios_1.default.post(endpoint, {
                model: model,
                messages: messages,
                temperature: 0.7
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                timeout: 60000 // 60秒超时
            });
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            }
            else {
                throw new Error('API返回了无效的响应格式');
            }
        });
    }
    // 发送到Azure OpenAI API
    sendToAzureOpenAI(content, contextMessages) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = this.config) === null || _a === void 0 ? void 0 : _a.endpoint)) {
                throw new Error('缺少Azure OpenAI终端节点设置');
            }
            if (!this.config.apiKey) {
                throw new Error('缺少Azure OpenAI API密钥');
            }
            const model = ((_b = this.config) === null || _b === void 0 ? void 0 : _b.model) || 'gpt-4';
            const apiVersion = '2023-05-15';
            const endpoint = this.config.endpoint;
            const messages = [
                { role: 'system', content: '你是一个有用的AI助手。你将收到一个网页内容，请根据内容回答用户的问题。' },
                ...contextMessages.map(msg => ({ role: 'user', content: msg })),
                { role: 'user', content: `以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}` }
            ];
            const response = yield axios_1.default.post(endpoint, {
                messages: messages,
                temperature: 0.7
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey
                },
                timeout: 60000 // 60秒超时
            });
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            }
            else {
                throw new Error('API返回了无效的响应格式');
            }
        });
    }
    // sendToAnthropic 方法
    sendToAnthropic(content, contextMessages) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = this.config) === null || _a === void 0 ? void 0 : _a.apiKey)) {
                throw new Error('缺少Anthropic API密钥');
            }
            const model = ((_b = this.config) === null || _b === void 0 ? void 0 : _b.model) || 'claude-3-sonnet';
            const endpoint = ((_c = this.config) === null || _c === void 0 ? void 0 : _c.endpoint) || 'https://api.anthropic.com/v1/messages';
            // 将多条消息合并成一个对话历史
            const userMessages = contextMessages.join('\n\n');
            const response = yield axios_1.default.post(endpoint, {
                model: model,
                system: '你是一个有用的AI助手。你将收到一个网页内容，请根据内容回答用户的问题。',
                messages: [
                    {
                        role: 'user',
                        content: userMessages ?
                            `${userMessages}\n\n以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}` :
                            `以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}`
                    }
                ],
                temperature: 0.7
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 60000 // 60秒超时
            });
            if (response.data && response.data.content && response.data.content.length > 0) {
                return response.data.content[0].text;
            }
            else {
                throw new Error('API返回了无效的响应格式');
            }
        });
    }
    // sendToCustomAPI 方法
    sendToCustomAPI(content, contextMessages) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = this.config) === null || _a === void 0 ? void 0 : _a.endpoint)) {
                throw new Error('缺少自定义API终端节点设置');
            }
            if (!((_b = this.config) === null || _b === void 0 ? void 0 : _b.apiKey)) {
                throw new Error('缺少自定义API密钥');
            }
            const endpoint = this.config.endpoint;
            // 这里的请求格式需要根据具体API调整
            const response = yield axios_1.default.post(endpoint, {
                model: this.config.model,
                messages: [
                    { role: 'system', content: '你是一个有用的AI助手。你将收到一个网页内容，请根据内容回答用户的问题。' },
                    ...contextMessages.map(msg => ({ role: 'user', content: msg })),
                    { role: 'user', content: `以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}` }
                ]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                timeout: 60000 // 60秒超时
            });
            // 返回格式也需要根据API调整
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            }
            else {
                throw new Error('API返回了无效的响应格式');
            }
        });
    }
}
exports.AIServiceClient = AIServiceClient;
// 导出一个单例实例
exports.aiClient = new AIServiceClient();
