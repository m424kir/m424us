'use strict';

/**
 * 独自定義の関数群を定義する名前空間
 * @namespace
 */
const M424 = {};

/**
 * 定数を提供する名前空間
 * @namespace
 */
M424.Consts = {

    /**
     * データ型
     */
    DATA_TYPE: {
        PRIMITIVE:  'primitive',  // プリミティブ型
        OBJECT:     'object',     // オブジェクト型
    },

    /**
     * プリミティブ型
     */
    PRIMITIVE_TYPE: {
        NULL:       'null',
        UNDEFINED:  'undefined',
        NUMBER:     'number',
        BIGINT:     'bigint',
        BOOLEAN:    'boolean',
        SYMBOL:     'symbol',
        STRING:     'string',
    },

    /**
     * オブジェクト型
     */
    OBJECT_TYPE: {
        OBJECT:     'object',
        FUNCTION:   'function',
    },
};


/**
 * システムに関する機能を提供する名前空間
 * @namespace
 */
M424.System = {

    /**
     * [async] 指定時間（ミリ秒）だけ処理を一時停止する関数（精度はsetTimeoutに依存）
     * @param {number} ms - 一時停止する時間（ミリ秒）
     * @returns {Promise<void>} - 一時停止が終了した後に解決されるPromise
     */
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    /**
     * [async] 指定時間（ミリ秒）だけ処理を一時停止する関数（高精度）
     * @param {number} ms - 一時停止する時間（ミリ秒）
     * @returns {Promise<void>} - 一時停止が終了した後に解決されるPromise
     */
    accurateSleep: (ms) => {
        return new Promise(resolve => {
            const start = performance.now();
            const delay = () => {
                ( performance.now() - start >= ms ) ? resolve() : requestAnimationFrame(delay);
            };
            requestAnimationFrame(delay);
        });
    },
    
    /**
     * 通常Throwできない箇所でエラーを発生させるラッパー関数(3項演算子等)
     * @param {string} message - エラーメッセージ
     * @param {Error} type - エラーオブジェクトタイプ (extends Error)
     * @throws {TypeError} 引数 "type" が有効なエラーオブジェクトでない場合にスローされます
     * @example
     *  // 3項演算子の条件を満たさない場合にエラーを発生させる
     *  is(xxx) ? yyy : throwError('エラー');               // Error: エラー
     *  is(xxx) ? yyy : throwError('エラー', SyntaxError);  // SyntaxError: エラー
     *  is(xxx) ? yyy : throwError('エラー', Number);       // TypeError: 無効なエラーオブジェクトの型です。Errorクラスまたはそのサブクラスを指定してください。
     *  
     */
    throwError: (message, type = Error) => {
        if( !(type === Error || type.prototype instanceof Error) ) {
            throw new TypeError("無効なエラーオブジェクトの型です。Errorクラスまたはそのサブクラスを指定してください。");
        }
        throw new type(message);
    },

    /**
     * 引数の指定を強制するための関数
     * @throws {TypeError} - 引数が指定されていない、または無効な値が渡された場合にエラーをスロー
     * @example
     *  // サンプルで実行する関数
     *  function greet(name = M424.System.mandatory()) {
     *      console.log(`こんにちは、${name}さん！！！！`);
     *  }
     *  greet();            // TypeError: 引数が指定されていない、または無効な値が渡されました。
     *  greet(undefined);   // TypeError: 引数が指定されていない、または無効な値が渡されました。
     *  greet("太郎");      // 処理が正常に実行される(こんにちは、太郎さん)
     *  greet(null);        // 処理が正常に実行される(こんにちは、nullさん)
     */ 
    mandatory: () => {
        throw new TypeError("引数が指定されていない、または無効な値が渡されました。");
    },
};


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
     * @throws {Error} 引数`func`が関数ではない場合に例外が発生します
     */
    runTestCase: (description, func) => {
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
};


/**
 * データの型に関する機能を提供する名前空間
 * @namespace
 */
M424.Type = {

    /**
     * データ型を表すためのクラス
     * @class DataType
     */
    DataType: class DataType {

        /**
         * DataType クラスのコンストラクタ
         */
        constructor() {};

        /**
         * [private] 初期処理
         * @param {*} variable - 型を判定したい変数
         */
        #initialize(variable) {
            // 型タイプ(object or primitive)
            this.#setType( M424.Type.isObject(variable) );
            // 型の名称
            this.name = M424.Type.getClassName(variable);
        };

        /**
         * [private] データ型のタイプ(オブジェクト型orプリミティブ型)を設定する
         * @param {Boolean} isObject - オブジェクト型か
         */
        #setType(isObject) {
            this.type = isObject ? M424.Consts.DATA_TYPE.OBJECT : M424.Consts.DATA_TYPE.PRIMITIVE;
        };
        
        /**
         * DataType インスタンスを生成します。
         * @param {*} variable - 任意の型の変数
         * @returns {DataType} DataType インスタンス
         * @throws {Error} 引数の数や型が不正な場合にスローされます
         */
        static of(variable) {
            const instance = new M424.Type.DataType();
            instance.#initialize(variable);
            return instance;
        };

        /**
         * 引数の情報に従い、DataType インスタンスを生成する
         * @param {String} sTypeName - データ型の名称("Date", "String")
         * @param {Boolean} isObject - オブジェクト型かどうかを示す真偽値
         * @returns {DataType} DataType インスタンス
         * @throws {TypeError} 引数の型が不正な場合にスローされます
         */
        static withArgs(sTypeName, isObject) {
            if( M424.Type.getClassName(sTypeName) !== 'String' ) {
                throw new TypeError(`引数:sTypeNameは文字列である必要があります。`);
            }
            else if( M424.Type.getClassName(isObject) !== 'Boolean' ) {
                throw new TypeError(`引数:isObjectは真偽値である必要があります。`);
            }
            const instance = new M424.Type.DataType();
            instance.#setType(isObject);
            instance.name = sTypeName;
            return instance;
        };
    },

    /**
     * 引数がNull型か判定する
     * @param {*} variable - 型判定したい変数
     * @returns true:引数がNull型
     */
    isNull: (variable) => {
        return variable === null;
    },

    /**
     * 引数がNull型でないか判定する
     * @param {*} variable - 型判定したい変数
     * @returns true:引数がNull型でない
     */
    isNotNull: (variable) => {
        return !M424.Type.isNull(variable);
    },

    /**
     * 引数がUndefined型か判定する
     * @param {*} variable - 型判定したい変数
     * @returns true:引数がUndefined型
     */
    isUndefined: (variable) => {
        return typeof variable === M424.Consts.PRIMITIVE_TYPE.UNDEFINED;
    },

    /**
     * 引数がUndefined型でないか判定する
     * @param {*} variable - 型判定したい変数
     * @returns true:引数がUndefined型でない
     */
    isNotUndefined: (variable) => {
        return !M424.Type.isUndefined(variable);
    },

    /**
     * 引数がUndefined型orNull型であるか判定する
     * @param {*} variable - 型判定したい変数
     * @returns true:引数がUndefined型orNull型
     */
    isNullOrUndefined: (variable) => {
        return M424.Type.isNull(variable) || M424.Type.isUndefined(variable);
    },

    /**
     * 引数がUndefined型およびNull型でないか判定する
     * @param {*} variable - 型判定したい変数
     * @returns true:引数がUndefined型およびNull型でない
     */
    isNotNullAndNotUndefined: (variable) => {
        return M424.Type.isNotNull(variable) && M424.Type.isNotUndefined(variable);
    },

    /**
     * 引数がプリミティブ型か判定する
     *  - プリミティブ型
     *      - 文字列: string
     *      - 数値: number, bigint
     *      - 真偽値: boolean
     *      - シンボル型: symbol
     *      - undefined: undefined
     *      - null: null
     *         nullは厳密にはプリミティブ型であることを留意ください。
     *         typeof nullの結果にobjectが返されるのは、JavaScript初期の仕様であり、
     *         仕様上のバグとも言えます。
     * @param {*} variable - 型判定したい変数
     * @returns true:引数がプリミティブ型
     */
    isPrimitive: (variable) => {
        const type = (typeof variable).toUpperCase();
        return M424.Consts.PRIMITIVE_TYPE.hasOwnProperty(type) || M424.Type.isNull(variable);
    },

    /**
     * 引数がオブジェクト型か判定する(Not Primitive)
     * @param {*} variable - 型判定したい変数
     * @returns true:引数がオブジェクト型
     */
    isObject: (variable) => {
        return !M424.Type.isPrimitive(variable);
    },

    /**
     * 引数オブジェクトのクラス名を返す.
     *  - プリミティブ値やリテラルも可(オートボクシングされる)
     * @param {Object} obj - 取得したいクラスオブジェクト
     * @returns 引数のクラス名
     */
    getClassName: (obj) => {
        const cls = Object.prototype.toString.call(obj).slice(8, -1);
        return cls === "Object" ? obj.constructor.name : cls;
    },


    /**
     * 指定の型かどうかを判定する
     *  - typeにはデータ型オブジェクト(Function)または型文字列(String)のみ許容する
     *  - typeにNullまたはUndefinedを指定できない(エラーが発生)
     *  - ex)
     *      - M424.Type.is(Date, new Date()); // true
     *      - M424.Type.is("Date", new Date()); // true
     *      - M424.Type.is(String, "str"); // true
     *      - M424.Type.is(true, true); // false
     *      - M424.Type.is("true", true); // false
     * @param {Function|String} type - 型(Function) or 型文字列
     * @param {*} variable - 検証したいデータ
     * @param {Boolean} strict - 厳格モード. 継承を考慮するか
     * @returns true: 対象データが指定の型である
     */
    is: (type, variable, strict = false) => {
        try {
            // 型検証を行うデータ
            const targetType = M424.Type.DataType.of(variable);
            // 期待される型
            const expectedType = (() => {
                // typeが型文字列の場合
                if( M424.Type.getClassName(type) === 'String' ) {
                    if( ['null', 'undefined'].includes(type.toLowerCase()) ) {
                        throw TypeError(`引数:typeにnullまたはundefinedが指定されています. 型または型文字列を指定して下さい.: ${type}`);
                    }
                    return M424.Type.DataType.withArgs(type.toString(), true);
                }
                // typeがデータ型の場合
                else if( M424.Type.getClassName(type) === 'Function' ) {
                    return M424.Type.DataType.withArgs(type.name, true);
                }
                throw TypeError(`引数:typeには、型または型文字列を指定して下さい.: ${type}`);
            })();

            // 型継承を考慮するかの判定
            const isExtend = !strict 
                && expectedType.type === M424.Consts.DATA_TYPE.OBJECT
                && variable instanceof eval(expectedType.name)
            ;
            // 期待される型と同じ名前 or 継承しているか(not 厳格モード)
            return targetType.name === expectedType.name || isExtend;
        } catch (e) {
            console.error(e);
            return false;
        }
    },

    /**
     * 引数がNode型であるか判定する
     * @param {Object} o - 判定したいオブジェクト
     * @returns true: Node型
     */
    isNode: (o) => {
        if( M424.Type.isPrimitive(o) ) {
            return false;
        }
        else if( M424.Type.isUndefined(window.Node) ) {
            return !!(o && typeof o.nodeType === 'number' && typeof o.nodeName === 'string');
        }
        return !!(o && o instanceof window.Node);
    },

    /**
     * 引数がElement型であるか判定する
     * @param {Object} o - 判定したいオブジェクト
     * @returns true: Element型
     */
    isElement: (o) => {
        if( M424.Type.isPrimitive(o) ) {
            return false;
        }
        else if( M424.Type.isUndefined(window.Element) ) {
            return M424.Type.isNotUndefined(window.Node)
                && !!(o && o.nodeType === Node.ELEMENT_NODE && o.nodeName)
            ;
        }
        return !!(o && o instanceof Element);
    },
};

/**
 * DOMに関する機能を提供する名前空間
 * @namespace
 */
M424.DOM = {

    /**
     * [async] 引数で渡されたデータ取得関数からデータが取得されるまで待機する関数
     * @param {Function} getterFunc - データ取得関数
     * @param {number} [timeout=2000] - タイムアウトまでの待機時間（ミリ秒）
     * @returns {Promise} データが取得された場合に解決されるPromise
     * @throws {TypeError} getterFuncが関数でない場合に例外をスローします
     * @throws {TypeError} timeoutが数値でない場合に例外をスローします
     */
    waitForData: (getterFunc, timeout = 2000) => {
        if( typeof getterFunc !== 'function' ) {
            throw new TypeError('引数[getterFunc]は関数[function]である必要があります。');
        }
        if( typeof timeout !== 'number' ) {
            throw new TypeError('引数[timeout]は数値[number]である必要があります。');
        }
    
        return new Promise( (resolve, reject) => {
    
            let overallTimeoutTimer;
            let observer;
    
            /**
             * 実行結果を処理する内部メソッド
             * @param {any} result - 実行結果となる要素
             * @param {string} [error] - エラーメッセージ（オプション）
             */
            const onDone = (result, error) => {
                clearTimeout(overallTimeoutTimer);
                observer?.disconnect();
                error ? reject(error) : resolve(result);
            };
    
            /**
             * データの取得を実行する内部メソッド
             */
            const onExecute = () => {
                const result = getterFunc();
                if( M424.Type.isNotNullAndNotUndefined(result) ) {
                    onDone(result);
                }
            };
    
            // 既に存在する場合は結果を返して終了
            onExecute();
    
            // タイムアウトの設定
            overallTimeoutTimer = setTimeout( () => {
                onDone(null, `Timeout Error: データの取得に失敗しました.`);
            }, timeout);
    
            // 対象データが取得できるまで、DOMの変更を監視する
            observer = new MutationObserver( () => {
                onExecute();
            });
            observer.observe(document.documentElement, {childList: true, subtree: true});
        });
    },

    /**
     * [async] 指定されたセレクタが取得できるまで待機する関数
     * @param {string} selector - 取得するセレクタ
     * @param {number} [timeout=2000] - タイムアウトまでの待機時間（ミリ秒）
     * @returns {Promise} セレクタが取得された場合に解決されるPromise
     * @throws {TypeError} selectorが文字列でない場合に例外をスローします
     * @throws {TypeError} timeoutが数値でない場合に例外をスローします
     */
    waitForSelector: (selector, timeout = 2000) => {
        return M424.DOM.waitForData( () => document.querySelector(selector), timeout);
    },

    /**
     * 指定されたElementからCSS情報を取得する関数
     * @param {Element} element - CSS情報を取得するElement
     * @returns {CSSStyleDeclaration} CSS情報のオブジェクト (CSSStyleDeclaration)
     * @throws {TypeError} 引数がElement型でない場合に例外をスローします
     * @throws {Error} windowオブジェクトがgetComputedStyle関数を持っていない場合に例外をスローします
     */
    getCSS: (element) => {
        if( !M424.Type.isElement(element) ) {
            throw new TypeError('引数はElement型である必要があります。');
        }
        else if (typeof window.getComputedStyle !== 'function') {
            throw new Error('windowオブジェクトにgetComputedStyle関数が存在しません。');
        }
        return window.getComputedStyle(element);
    },

    /**
     * [async] 指定されたセレクタの要素が取得できるまで待機し、取得後にCSS情報を返す関数
     * @param {string} selector - CSSセレクタ
     * @param {number} [timeout=2000] - タイムアウト時間（ミリ秒）（省略可能）
     * @returns {Promise<CSSStyleDeclaration>} CSS情報のオブジェクト (CSSStyleDeclaration)
     * @throws {TypeError} 引数が正しい型でない場合に例外をスローします
     * @throws {Error} 要素の取得に失敗した場合に例外をスローします
     */
    waitForCSS: async (selector, timeout = 2000) => {
        const elem = await M424.DOM.waitForSelector(selector, timeout);
        return M424.DOM.getCSS(elem);
    },
};

