// ==UserScript==
// @name         LazyFunctionExecutor
// @namespace    M424
// @version      1.0
// @description  関数の遅延実行を管理するクラス
// @author       M424
// @grant        none
// ==/UserScript==

/**
 * 読込元のスクリプトに以下の定義を追加してください。
 */
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/module/M424.js

/**
 * 遅延実行する関数を保持するクラス
 * @class
 */
M424.LazyFunction = class LazyFunction extends M424.Base {

    /**
     * 登録名 - 名称重複不可
     * @type {string}
     * @private
     */
    #name;

    /**
     * 実行する関数
     * @type {Function}
     * @private
     */
    #func;

    /**
     * タイムアウトの識別子（タイマーID）
     *  - 正の整数値で、setTimeoutやsetIntervalの返り値でユニーク値。
     * @type {number}
     * @private
     */
    #timerId;

    /**
     * 関数の実行を遅延させる時間(msec)
     * @type {number}
     * @private
     */
    #delay_ms;

    /**
     * 繰返し実行するか
     * @type {boolean}
     * @private
     */
    #isRepeat;

    /**
     * 登録された関数が実行された回数
     * @type {number}
     * @private
     */
    #runCount;

    /**
     * 関数の最大実行回数
     * @type {number}
     * @private
     */
    #maxRunCount;

    /**
     * @constructor
     * @param {Function} func - 実行関数
     * @param {String} name - 登録名
     * @param {Object} options - 実行に関する設定
     *   @param {boolean} [isRepeat=false] - 繰り返し実行するか
     *   @param {number} [delay_ms=1000] - 実行を遅らせる時間(msec)
     *   @param {number} [maxRunCount=1] - 関数の最大実行回数
     * @param {Boolean} [isDebugMode=false] - デバックログを出力するか
     * @param {...any} [funcArgs] - 関数の引数
     */
    constructor(func, name, options, isDebugMode=false, ...funcArgs) {
        super("LazyFunction", isDebugMode);
        this.#timerId = 0;
        this.#runCount = 0;
        this.#name = name;
        this.#isRepeat = options.isRepeat || false;
        this.#maxRunCount = this.#isRepeat ? (options.maxRunCount || M424.LazyFunctionExecutor.MAX_RUN_COUNT) : 1;
        this.#delay_ms = options.delay_ms || 1000;
        this.#func = this.#createFunction(func, options, ...funcArgs);
        this.#timerId = this.#createTimer();
    }

    /**
     * 登録名を取得します
     * @returns {string} 登録名
     */
    get name() { return this.#name; }

    /**
     * タイムアウトの識別子（タイマーID）を取得します
     * @returns {Number} タイマーID
     */
    get id() { return this.#timerId; }

    /**
     * 関数の実行を遅延させる時間(msec)を取得します
     * @returns {Number} 関数の実行を遅延させる時間(msec)
     */
    get delay_ms() { return this.#delay_ms; }

    /**
     * 関数が実行された回数を取得します
     * @returns {number} 関数が実行された回数
     */
    get runCount() { return this.#runCount; }

    /**
     * 関数の最大実行回数を取得します
     * @returns {number} 関数の最大実行回数
     */
    get maxRunCount() { return this.#maxRunCount; }

    /**
     * 遅延実行する関数を作成する
     * @param {Function} func - 実行する関数
     * @param {Object} options - 関数に関する設定
     *   @param {boolean} isDelete - 実行後に削除するか
     *   @param {M424.LazyFunctionExecutor} executor - 遅延実行する関数の管理者
     * @param  {...any} [args] - 関数の引数
     * @returns {Function} 渡された関数をラップしたもの
     */
    #createFunction(func, options, ...args) {
        return () => {
            func(...args);
            this.#runCount++;
            if( !this.#isRepeat ) {
                this.#timerId = undefined;
            }
            // 不要物は管理者側からも削除する
            if( options.isDelete || this.#runCount >= this.#maxRunCount ) {
                executor.remove(this.#name);
                this.debug(`${options.isDelete ? '削除フラグにより' : '規定回数到達により'}関数を削除しました。`, this.#name);
            }
        };
    }

    /**
     * 関数を実行するタイマーを作成する
     * @returns {number} タイムアウトの識別子（タイマーID）
     * @private
     */
    #createTimer() {
        const FUNC = this.#isRepeat ? setInterval : setTimeout;
        return FUNC(this.#func, this.#delay_ms);
    }

    /**
     * 遅延実行する関数を保持するクラスを生成する
     * @param {Func} func - 実行する関数
     * @param {Object} options - 実行に関する設定
     *   @param {string} [name] - 識別用のユニーク名称
     *   @param {boolean} [isDebugMode=false] - デバックログを出力するか
     * @param  {...any} [funcArgs] - 実行関数の引数
     * @returns {LazyFunction} 遅延実行する関数を保持するクラス
     */
    static create(func, options, ...funcArgs) {
        const funcName = options.name || M424.Util.randomString();
        const isDebugMode = options.isDebugMode || false;
        return new M424.LazyFunction(func, funcName, options, isDebugMode, ...funcArgs);
    }

    /**
     * 実行待ち状態の関数をキャンセルする
     * @returns true: キャンセルした
     */
    cancel() {
        if( this.isReady() ) {
            this.#isRepeat ? clearInterval(this.#timerId) : clearTimeout(this.#timerId);
            this.#timerId = undefined;
            this.debug(`[${this.#name}] タイマー処理による関数の実行をキャンセルしました。`);
            return true;
        }
        return false;
    }

    /**
     * 関数が登録され、実行待ち状態かを返す
     * @returns true: 実行待ち状態
     */
    isReady() {
        return M424.Util.isTimeoutId(this.#timerId);
    }
};

/**
 * 関数の遅延実行を管理するクラス
 * @class
 */
M424.LazyFunctionExecutor = class LazyFunctionExecutor extends M424.Base {

    /**
     * 関数実行後の処理に関する設定
     * @static
     */
    static AFTER_EXECUTION = {
        DELETE: 0,      // 実行後に削除
        REPEAT: 1,      // 繰り返し実行
        REUSABLE: 2,    // 実行後、再利用できるように削除しない
    };

    /**
     * 関数を繰り返し実行させる回数の最大値
     * @static
     */
    static MAX_RUN_COUNT = 100 * 100 * 100;

    /**
     * 遅延実行可能な関数クラス群
     * @type {Array<M424.LazyFunction>}
     * @private
     */
    #lazyFunctions;

    /**
     * @constructor
     * @param {String} classIdentifier - クラス識別子
     * @param {Boolean} [isDebugMode=false] - デバックログを出力するか
     */
    constructor(classIdentifier, isDebugMode = false) {
        super(classIdentifier, isDebugMode);
        this.#lazyFunctions = new Array();
    }

    /**
     * 引数がM424.LazyFunctionのインスタンスかどうかを判別する
     * @param {*} arg - 判別する引数
     * @returns {boolean} true: 引数がM424.LazyFunctionのインスタンス
     */
    #isLazyFunction(arg) {
        return arg instanceof M424.LazyFunction;
    }

    /**
     * 遅延実行する関数を登録する
     * @param {M424.LazyFunction} lazyFunc - 遅延実行する関数クラス
     * @returns {string} 遅延実行する関数の登録名
     * @throws {TypeError} 引数がM424.LazyFunctionでない場合に例外が発生します
     */
    register(lazyFunc) {
        if( !this.#isLazyFunction(lazyFunc) ) {
            throw new TypeError(`引数[lazyFunc]はM424.LazyFunction型である必要があります。`);
        }
        const funcName = lazyFunc.name;
        if( this.#lazyFunctions.find( f => f.name === funcName ) ) {
            this.remove(funcName);
            this.warn(`${funcName}は既に登録済みの名称です。既存の定義を削除し、新たに登録し直します。`);
        }
        this.#lazyFunctions.push(lazyFunc);
        return funcName;
    }

    /**
     * 遅延実行する関数を登録する
     * @param {Function} func - 実行関数
     * @param {Number} [delay_ms] - 遅延時間
     * @param {Object} options - 関数に関する設定
     *   @param {string} [name] - 関数の登録名(ユニーク)
     *   @param {number} [afterExecution=DELETE] - 関数実行後の処理に関する設定
     *   @param {number} [maxRunCount] - 関数の最大実行回数
     * @param  {...any} [funcArgs] - 関数の引数
     * @returns {string} 関数の登録名
     */
    add(func, delay_ms, options = {}, ...funcArgs) {

        const funcOption = (() => {
            const FUNC_OPS = M424.LazyFunctionExecutor.AFTER_EXECUTION;
            let ret = {};
            ret.name = options.name || M424.Util.randomString();
            ret.delay_ms = delay_ms || 1000;
            ret.isDebugMode = this.isDebugMode || false;
            ret.isDelete = [undefined, FUNC_OPS.DELETE].includes(options.afterExecution);
            ret.isRepeat = options.afterExecution === FUNC_OPS.REPEAT;
            ret.maxRunCount = ret.isRepeat ? (options.maxRunCount || M424.LazyFunctionExecutor.MAX_RUN_COUNT) : 1;
            ret.executor = this;
            return ret;
        })();
        // this.log('funcOption', funcOption);

        const lazyFunc = M424.LazyFunction.create(func, funcOption, ...funcArgs);
        return this.register(lazyFunc);
    }

    /**
     * 登録済み関数の削除
     *  - 実行待ち状態の関数は処理をキャンセルする
     * @param {String} name - 関数の登録名
     * @returns {boolean} true: 関数を削除できた
     */
    remove(name) {
        const isRemoveFirstOnly = true;
        const result = M424.Array.remove(this.#lazyFunctions, f => f.name === name, isRemoveFirstOnly);
        if( result.removedElements.length > 0 ) {
            const target = result.removedElements[0];
            if( target.isReady() ) {
                if( target.cancel() ) {
                    this.debug(`削除した関数は実行待ち状態だったので、処理をキャンセルしました。`, name);
                } else {
                    this.error(`削除した関数は実行待ち状態でしたが、キャンセルできませんでした。`, name);
                }
            }
            this.#lazyFunctions = result.array;
            this.debug('関数の削除完了!!!', target.name);
            return true;
        }
        return false;
    }

    /**
     * 関数が登録され、実行待ち状態かを返す
     * @param {String} name - 登録名
     * @returns true: 登録済み関数 かつ 実行待ち状態
     */
    isReady(name) {
        const target = this.#lazyFunctions.find( f => f.name === name );
        return target ? target.isReady() : false;
    }

    /**
     * 登録された関数の実行回数を返す
     * @param {String} name - 登録名
     * @returns {number} 関数の実行回数, 関数未登録時は-1を返す
     */
    runCount(name) {
        const target = this.#lazyFunctions.find( f => f.name === name );
        return target ? target.runCount : -1;
    }

    /**
     * 登録された関数の最大実行回数を返す
     * @param {String} name - 登録名
     * @returns {number} 関数の最大実行回数, 関数未登録時は-1を返す
     */
    maxRunCount(name) {
        const target = this.#lazyFunctions.find( f => f.name === name );
        return target ? target.maxRunCount : -1;
    }

    /**
     * 登録された関数のタイマーIDを返す
     * @param {String} name - 登録名
     * @returns {number} 関数のタイマーID, 関数未登録時は-1を返す
     */
    id(name) {
        const target = this.#lazyFunctions.find( f => f.name === name );
        return target ? target.id : -1;
    }

    /**
     * 登録された関数の実行を遅延させる時間(msec)を返す
     * @param {String} name - 登録名
     * @returns {number} 関数の実行を遅延させる時間(msec), 関数未登録時は-1を返す
     */
    delay_ms(name) {
        const target = this.#lazyFunctions.find( f => f.name === name );
        return target ? target.delay_ms : -1;
    }

    /**
     * 登録された全ての関数の名称を返す
     * @returns {Array<String>} 登録された全ての関数の名称
     */
    get names() {
        return this.#lazyFunctions.map(f => f.name);
    }

    /**
     * 登録された全ての関数のタイマーIDを返す
     * @returns {Array<Number>} 登録された全ての関数のタイマーID
     */
    get ids() {
        return this.#lazyFunctions.map(f => f.id);
    }
};

