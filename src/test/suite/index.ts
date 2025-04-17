import * as path from 'path';
import * as fs from 'fs';

export function run(): void {
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
    mocha.run((failures: number) => {
        process.exitCode = failures ? 1 : 0; // 如果有失败的测试，则以失败代码退出
    });
}