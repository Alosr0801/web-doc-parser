# Web 文档解析器

一个 VS Code 扩展，用于解析网页内容并将其提供给 AI 助手进行分析。

## 功能

- 解析网页内容并转换为 Markdown 格式
- 从 Markdown 源文件网页直接提取内容
- 将网页内容发送到多种 AI 助手进行分析：
  - GitHub Copilot（默认，无需额外配置）
  - OpenAI (GPT-4, GPT-3.5)
  - Azure OpenAI
  - Anthropic Claude
  - 自定义 API

## 使用方法

1. 解析网页内容：
   - 按下 `Ctrl+Shift+P`，输入 "解析网页内容"，输入网址
   - 或使用 "获取网页Markdown源码" 命令从 Markdown 源码网站提取内容
   
2. 发送到 AI 助手：
   - 使用 "获取网页内容并发送到AI助手" 命令一次性完成抓取和分析
   - 或使用 "将内容发送到AI助手" 命令处理已抓取的内容
   - 如果您希望直接使用 GitHub Copilot，可以使用 "获取网页内容并直接发送到GitHub Copilot" 命令

3. AI 配置（可选）：
   - 默认使用 GitHub Copilot，无需额外配置
   - 如需使用其他 AI 服务，使用 "配置AI助手API" 命令进行设置

## 要求

- VS Code 1.60.0 或更高版本
- 互联网连接
- 如使用 GitHub Copilot，需安装 GitHub Copilot 扩展并授权
- 如使用其他 AI 服务，需要相应的 API 密钥

## 隐私说明

此扩展会将网页内容发送到所选的 AI 服务。默认情况下使用 GitHub Copilot，遵循 GitHub Copilot 的隐私政策。如使用其他 AI 服务，请确认您了解相关服务的数据处理政策。

## 许可证

MIT