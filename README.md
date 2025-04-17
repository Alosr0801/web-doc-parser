# Web 文档解析器

一个 VS Code 扩展，用于解析网页内容并将其提供给 AI 助手进行分析。

## 功能

- 解析网页内容
- 将网页内容转换为 Markdown 格式
- 从 Markdown 源文件网页直接提取内容
- 将网页内容发送到多种 AI 助手进行分析：
  - GitHub Copilot（默认，无需额外配置）
  - OpenAI (GPT-4, GPT-3.5)
  - Azure OpenAI
  - Anthropic Claude
  - 自定义 API

## 安装

### 方法一：通过 VSIX 包安装（离线安装）

1. 下载 [web-doc-parser-0.0.1.vsix](https://github.com/Alosr0801/web-doc-parser/releases/download/v0.0.1/web-doc-parser-0.0.1.vsix) 文件
2. 在 VS Code 中，打开命令面板（按 `Ctrl+Shift+P`）
3. 输入并选择 `扩展：从 VSIX 安装...` 或英文 `Extensions: Install from VSIX...`
4. 选择下载的 VSIX 文件
5. 安装完成后，重启 VS Code

### 方法二：从源码构建与安装

1. 克隆仓库：`git clone https://github.com/Alosr0801/web-doc-parser.git`
2. 进入目录：`cd web-doc-parser`
3. 安装依赖：`npm install`
4. 编译扩展：`npm run compile`
5. 打包扩展：`npx vsce package`
6. 按照方法一安装生成的 VSIX 包

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

## 示例操作流程

1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "获取网页内容并发送到AI助手" 并选择
3. 输入您想要解析的网页 URL，例如 `https://code.visualstudio.com/docs/editor/extension-marketplace`
4. 扩展会自动获取内容并将其发送给 AI 助手进行分析
5. 查看 AI 助手提供的内容摘要和解释

## 要求

- VS Code 1.60.0 或更高版本
- 互联网连接
- 如使用 GitHub Copilot，需安装 GitHub Copilot 扩展并授权
- 如使用其他 AI 服务，需要相应的 API 密钥

## 常见问题

**问题**: 无法触发 GitHub Copilot 内联建议？  
**解决方案**: 确保您已安装并正确配置 GitHub Copilot 扩展，如果仍无法触发，请尝试手动按 Ctrl+I 或在编辑器中右键选择 "Copilot" 菜单项。

**问题**: 遇到 SSL 证书错误？  
**解决方案**: 这通常是由于系统证书问题或网络代理导致，请确保您的系统时间正确，并检查网络设置。

## 隐私说明

此扩展会将网页内容发送到所选的 AI 服务。默认情况下使用 GitHub Copilot，遵循 GitHub Copilot 的隐私政策。如使用其他 AI 服务，请确认您了解相关服务的数据处理政策。

## 许可证

MIT