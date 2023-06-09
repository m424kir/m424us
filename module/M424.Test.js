// ==UserScript==
// @name         M424.Test
// @namespace    M424.Test
// @version      1.0.0
// @description  テストに関する機能を提供する名前空間
// @author       M424
// ==/UserScript==
'use strict';

/**
 * テストに関する機能を提供する名前空間
 * @namespace
 */
M424.Test = {

    /**
     * 呼び出し元のコード行情報を取得する関数
     * @returns {string} 呼び出し元のコード行情報。取得できない場合は空文字列を返す。
     */
    getCallerInfo: () => {
        const error = new Error();
        const stackTrace = error.stack.split(/[\r\n]+/);
        // 呼び出し元はスタックトレースの3番目の行に存在する
        const callerLine = stackTrace[3];

        // 呼び出し元の情報を解析する
        const condition = /^\s*at\s*(?:new\s+)?(?<method>[$_a-z][$\w]*)?\s+\(?(?<url>(?<path>[\s\S]+):(?<line>\d+):(?<pos>\d+))\)?/;
        const match = callerLine.match(condition);
        if (match?.groups) {
            return match.groups;
        }
        return '';
    },

    /**
     * テストケースを実行する関数。テスト結果はコンソールに表示されます。
     * @param {string} description - テストケースの説明
     * @param {function} func - 実行するテストケースの関数
     * @param {boolean} [isEnabled=true] - テストケースを実行の有無
     * @throws {Error} 引数`func`が関数ではない場合に例外が発生します
     */
    runTestCase: (description, func, isEnabled=true) => {
        if( !isEnabled ) { return; }
        if (typeof func !== 'function') {
            throw new Error(`渡された引数[func]は関数ではありません`);
        }
        try {
            func();
            console.log(`${description} - PASSED.`);
        } catch(error) {
            error.message = `${description} - ${error.message}`;
            console.error(error);
        }
    },

    /**
     * 条件を検証し、条件が偽の場合にエラーを発生させる関数
     * @param {boolean} condition - 検証する条件
     * @param {string} [message] - エラーメッセージ (省略可能)
     * @throws {Error} 条件が偽の場合にエラーをスローします
     */
    assert: (condition, message) => {
        if( !condition ) {
            const callerInfo = M424.Test.getCallerInfo();
            const fileName = callerInfo.url.split('/').pop();
            const errorMsg = `Assertion failed: ${message || ''} (${fileName})`;
            const error = new Error(errorMsg);
            error.fileName = callerInfo.path;
            error.lineNumber = callerInfo.line;
            error.columnNumber = callerInfo.pos;
            throw error;
        }
    },

    /**
     * テスト結果が期待するエラーでない場合にエラーを発生させる関数
     * @param {Function} func - テスト対象の関数
     * @param {Function} [errorType=Error] - 期待するエラータイプ
     * @param {string} [message] - エラーメッセージ (省略可能)
     * @throws {Error} エラータイプが期待と異なる場合にエラーをスローします
     */
    assertError: (func, errorType = Error, message) => {
        let occurredError;
        try { func(); } catch(e) {
            if( e instanceof errorType ) return;
            occurredError = e;
        }
        const callerInfo = M424.Test.getCallerInfo();
        const fileName = callerInfo.url.split('/').pop();
        const expectedErrorType = errorType.name || 'Error';
        const receivedErrorType = occurredError ? occurredError.constructor.name : 'no error';
        const errorMsg = `Expected ${expectedErrorType}, but received ${receivedErrorType}: ${message || ''} (${fileName})`;
        const error = new Error(errorMsg);
        error.fileName = callerInfo.path;
        error.lineNumber = callerInfo.line;
        error.columnNumber = callerInfo.pos;
        throw error;
    },
};
