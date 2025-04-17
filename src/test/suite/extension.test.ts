import * as assert from 'assert';
import * as vscode from 'vscode';
import { activate } from '../../extension';
import * as sinon from 'sinon';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    setup(async () => {
        // 创建模拟的 ExtensionContext
        const mockContext = {
            subscriptions: [],
            workspaceState: {
                get: () => {},
                update: () => Promise.resolve(),
                keys: () => []
            },
            globalState: {
                get: (key: string) => ({}),
                update: () => Promise.resolve(),
                keys: () => []
            },
            extensionUri: vscode.Uri.parse('file:///'),
            extensionPath: '',
            asAbsolutePath: (relativePath: string) => relativePath,
            storagePath: '',
            logPath: '',
            globalStoragePath: ''
        } as unknown as vscode.ExtensionContext;
        
        await activate(mockContext);
    });

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });
});