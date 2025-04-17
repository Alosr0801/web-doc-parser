import * as vscode from 'vscode';
import * as https from 'https';
import axios from 'axios';

export interface AIServiceConfig {
    provider: 'openai' | 'azure' | 'anthropic' | 'custom' | 'copilot';
    apiKey?: string;
    endpoint?: string;
    model?: string;
}

export class AIServiceClient {
    private config: AIServiceConfig | null = null;
    
    constructor() {
        // 从配置中加载API设置，默认使用copilot
        this.loadConfig();
        if (!this.config) {
            this.config = { provider: 'copilot' };
        }
    }
    
    // 加载配置
    private loadConfig() {
        const config = vscode.workspace.getConfiguration('webDocParser');
        const provider = config.get<string>('aiProvider') as 'openai' | 'azure' | 'anthropic' | 'custom' | 'copilot';
        const apiKey = config.get<string>('apiKey');
        const endpoint = config.get<string>('endpoint');
        const model = config.get<string>('model');
        
        if (provider) {
            this.config = { provider, apiKey, endpoint, model };
        } else {
            this.config = { provider: 'copilot' };
        }
    }
    
    // 检查API设置是否已配置
    public isConfigured(): boolean {
        return true; // 始终返回true，因为默认使用Copilot
    }

    // 配置AI服务
    public async configure(): Promise<boolean> {
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
            
            const provider = await vscode.window.showQuickPick(
                providers.map(p => p.label),
                { placeHolder: '选择AI服务提供商' }
            );
            
            if (!provider) {
                return false; // 用户取消了选择
            }
            
            const providerValue = providers.find(p => p.label === provider)?.value || 'copilot';
            await config.update('aiProvider', providerValue, true);
            
            // 如果选择了Copilot，不需要进一步配置
            if (providerValue === 'copilot') {
                this.config = { provider: 'copilot' };
                return true;
            }
            
            // 步骤2：输入API密钥
            const apiKey = await vscode.window.showInputBox({
                prompt: '输入API密钥',
                password: true,
                placeHolder: '您的API密钥将被安全存储'
            });
            
            if (!apiKey) {
                return false; // 用户取消了输入
            }
            
            await config.update('apiKey', apiKey, true);
            
            // 步骤3：如果是Azure或自定义API，需要输入端点
            if (providerValue === 'azure' || providerValue === 'custom') {
                const endpoint = await vscode.window.showInputBox({
                    prompt: '输入API端点URL',
                    placeHolder: providerValue === 'azure' ? 
                        'https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-05-15' : 
                        'https://api.example.com/v1/chat'
                });
                
                if (!endpoint) {
                    return false; // 用户取消了输入
                }
                
                await config.update('endpoint', endpoint, true);
            }
            
            // 步骤4：输入模型名称
            let defaultModel = '';
            switch(providerValue) {
                case 'openai': defaultModel = 'gpt-4o'; break;
                case 'azure': defaultModel = 'gpt-4'; break;
                case 'anthropic': defaultModel = 'claude-3-sonnet'; break;
                case 'custom': defaultModel = 'gpt-4'; break;
            }
            
            const models = {
                'openai': ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
                'azure': ['gpt-4', 'gpt-3.5-turbo'],
                'anthropic': ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
                'custom': []
            };
            
            let modelOptions = models[providerValue as keyof typeof models] || [];
            let model;
            
            if (modelOptions.length > 0) {
                model = await vscode.window.showQuickPick(
                    modelOptions,
                    { placeHolder: '选择AI模型' }
                );
            } else {
                model = await vscode.window.showInputBox({
                    prompt: '输入模型名称',
                    value: defaultModel,
                    placeHolder: '模型名称（如gpt-4, claude-3-sonnet等）'
                });
            }
            
            if (!model) {
                model = defaultModel; // 使用默认模型
            }
            
            await config.update('model', model, true);
            
            // 重新加载配置
            this.loadConfig();
            
            return true;
        } catch (error) {
            console.error('配置AI服务时出错:', error);
            throw new Error(`配置AI服务时出错: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 发送网页内容到AI助手
    public async sendToAI(content: string, contextMessages: string[] = []): Promise<string> {
        try {
            if (!this.config || this.config.provider === 'copilot') {
                return await this.sendToCopilot(content, contextMessages);
            }
            
            switch (this.config.provider) {
                case 'openai':
                    return await this.sendToOpenAI(content, contextMessages);
                case 'azure':
                    return await this.sendToAzureOpenAI(content, contextMessages);
                case 'anthropic':
                    return await this.sendToAnthropic(content, contextMessages);
                case 'custom':
                    return await this.sendToCustomAPI(content, contextMessages);
                default:
                    return await this.sendToCopilot(content, contextMessages);
            }
        } catch (error) {
            console.error('发送到AI助手时出错:', error);
            throw new Error(`发送到AI助手时出错: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    // 发送到GitHub Copilot
    private async sendToCopilot(content: string, contextMessages: string[]): Promise<string> {
        try {
            // 准备发送给Copilot的消息
            const userMessages = contextMessages.join('\n\n');
            const prompt = userMessages ? 
                `${userMessages}\n\n以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}` :
                `以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}`;
            
            // 使用VS Code内置命令调用Copilot
            const result = await vscode.commands.executeCommand('github.copilot.generate', {
                prompt: prompt,
                temperature: 0.7
            });
            
            if (typeof result === 'string') {
                return result;
            } else {
                // 备用方案：打开新的编辑器并让用户与Copilot交互
                const document = await vscode.workspace.openTextDocument({
                    content: prompt,
                    language: 'markdown'
                });
                
                await vscode.window.showTextDocument(document);
                await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
                
                return "已在新文档中打开内容并触发Copilot建议。请查看Copilot提供的内联建议。";
            }
        } catch (error) {
            console.error('调用GitHub Copilot时出错:', error);
            
            // 如果直接API调用失败，尝试备用方案
            try {
                const document = await vscode.workspace.openTextDocument({
                    content: `以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}`,
                    language: 'markdown'
                });
                
                await vscode.window.showTextDocument(document);
                vscode.window.showInformationMessage('请使用 Ctrl+I 触发Copilot内联建议，或右键菜单中选择"Copilot"');
                
                return "已在新文档中打开内容。请使用 Ctrl+I 触发Copilot建议，或右键菜单中选择 'Copilot' 。";
            } catch (fallbackError) {
                throw new Error(`无法调用GitHub Copilot: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    
    //  sendToOpenAI 方法
    private async sendToOpenAI(content: string, contextMessages: string[]): Promise<string> {
        if (!this.config?.apiKey) {
            throw new Error('缺少OpenAI API密钥');
        }
        
        const model = this.config?.model || 'gpt-4';
        const endpoint = this.config?.endpoint || 'https://api.openai.com/v1/chat/completions';
        
        const messages = [
            { role: 'system', content: '你是一个有用的AI助手。你将收到一个网页内容，请根据内容回答用户的问题。' },
            ...contextMessages.map(msg => ({ role: 'user', content: msg })),
            { role: 'user', content: `以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}` }
        ];
        
        const response = await axios.post(endpoint, {
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
        } else {
            throw new Error('API返回了无效的响应格式');
        }
    }
    
    // 发送到Azure OpenAI API
    private async sendToAzureOpenAI(content: string, contextMessages: string[]): Promise<string> {
        if (!this.config?.endpoint) {
            throw new Error('缺少Azure OpenAI终端节点设置');
        }
        
        if (!this.config.apiKey) {
            throw new Error('缺少Azure OpenAI API密钥');
        }
        
        const model = this.config?.model || 'gpt-4';
        const apiVersion = '2023-05-15';
        const endpoint = this.config.endpoint;
        
        const messages = [
            { role: 'system', content: '你是一个有用的AI助手。你将收到一个网页内容，请根据内容回答用户的问题。' },
            ...contextMessages.map(msg => ({ role: 'user', content: msg })),
            { role: 'user', content: `以下是从网页中提取的内容，请帮我理解其中的关键信息:\n\n${content}` }
        ];
        
        const response = await axios.post(endpoint, {
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
        } else {
            throw new Error('API返回了无效的响应格式');
        }
    }
    
    // sendToAnthropic 方法
    private async sendToAnthropic(content: string, contextMessages: string[]): Promise<string> {
        if (!this.config?.apiKey) {
            throw new Error('缺少Anthropic API密钥');
        }
        
        const model = this.config?.model || 'claude-3-sonnet';
        const endpoint = this.config?.endpoint || 'https://api.anthropic.com/v1/messages';
        
        // 将多条消息合并成一个对话历史
        const userMessages = contextMessages.join('\n\n');
        
        const response = await axios.post(endpoint, {
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
        } else {
            throw new Error('API返回了无效的响应格式');
        }
    }
    
    // sendToCustomAPI 方法
    private async sendToCustomAPI(content: string, contextMessages: string[]): Promise<string> {
        if (!this.config?.endpoint) {
            throw new Error('缺少自定义API终端节点设置');
        }
        
        if (!this.config?.apiKey) {
            throw new Error('缺少自定义API密钥');
        }
        
        const endpoint = this.config.endpoint;
        
        // 这里的请求格式需要根据具体API调整
        const response = await axios.post(endpoint, {
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
        } else {
            throw new Error('API返回了无效的响应格式');
        }
    }
}

// 导出一个单例实例
export const aiClient = new AIServiceClient();