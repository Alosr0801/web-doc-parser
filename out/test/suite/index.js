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
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function run() {
    // 使用require来导入Mocha，解决构造函数问题
    const Mocha = require('mocha');
    // 创建一个新的Mocha实例来运行测试
    const mocha = new Mocha({
        ui: 'tdd',
        timeout: 60000
    });
    const testRoot = path.resolve(__dirname, '.');
    // 读取测试套件中的所有测试文件
    fs.readdirSync(testRoot).filter(file => {
        // 只包含.test.ts文件
        return file.endsWith('.test.ts');
    }).forEach(file => {
        mocha.addFile(path.join(testRoot, file));
    });
    // 运行测试
    mocha.run((failures) => {
        process.exitCode = failures ? 1 : 0; // 如果有失败的测试，则以失败代码退出
    });
}
exports.run = run;
