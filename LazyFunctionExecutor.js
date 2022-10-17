// ==UserScript==
// @name         LazyFunctionExecutor
// @namespace    M424
// @version      0.1
// @description  関数の遅延実行を管理するクラス
// @author       M424
// @grant        none
// ==/UserScript==

/**
 * 読込元のスクリプトに以下の定義を追加してください。
 */
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/M424Common.js

/**
 * 遅延実行可能な関数クラス
 */
class LazyFunction {

    /**
     * 登録名
     */
    #name;

    /**
     * 実行する関数
     */
    #func;

    /**
     * 遅延実行を関するためのID(TimeoutID)
     */
    #id;

    /**
     * 遅延する秒数(msec)
     */
    #delay;

    /**
     * 繰返し実行するか
     */
    #isRepeat;

    /**
     * @constructor
     * @param {String} name
     */
    constructor(name) {
        this.#name = name;
    }

    get id() { return this.#id; }
    get delay() { return this.#delay; }
    get name() { return this.#name; }

    /**
     * 指定時間後に実行する関数を登録する
     * @param {Function} func - 実行する関数
     * @param {Number} delay_msec - 待ち時間(ミリ秒)
     * @param {Boolean} isRepeat - 繰り返し実行するか
     * @param  {...any} funcArgs - 関数の引数(省略可)
     */
    regist(func, delay_msec, isRepeat = false, ...funcArgs) {

        this.#isRepeat = isRepeat;
        this.#delay    = delay_msec;
        this.#func     = () => {
            if( !this.#isRepeat ) {
                this.#id = undefined;
            }
            func(...funcArgs);
        };
       this.#id = this.#isRepeat ? setInterval(this.#func, this.#delay) : setTimeout(this.#func, this.#delay);
    }

    /**
     * 実行待ち状態の関数をキャンセルする
     * @returns true: キャンセルした
     */
    cancel() {
        if( this.isReady() ) {
            this.#isRepeat ? clearInterval(this.#id) : clearTimeout(this.#id);
            this.#id = undefined;
            return true;
        }
        return false;
    }

    /**
     * 関数が登録され、実行待ち状態かを返す
     * @returns true: 実行待ち状態
     */
    isReady() {
        return this.#id !== undefined && typeof this.#id === 'number';
    }
};

/**
 * 関数の遅延実行を管理するクラス
 * @class LazyFunctionExecutor
 */
class LazyFunctionExecutor extends M424Base {

    /**
     * 遅延実行可能な関数クラス群
     */
    #lazyFunctions;

    /**
     * @constructor
     * @param {String} scriptId
     * @param {Boolean} isDebug
     */
    constructor(scriptId, isDebug = false) {
        super(scriptId, isDebug);
        this.#lazyFunctions = new Array();
    }

    /**
     * 関数の登録
     *  - オプションについて
     *      - name: 登録名
     *      - afterExecution: 関数実行後の処理
     *          - delete: 実行後関数の登録を削除(default)
     *          - repeat: delay_msec秒毎に繰り返し実行する
     *          - nothing: 何もしない
     * @param {Function} func - 実行関数
     * @param {Number} delay_msec - 遅延時間
     * @param {Object} options - オプション(連想配列)
     * @param  {...any} funcArgs - 関数の引数
     * @returns 関数の登録名
     */
    regist(func, delay_msec, options = {}, ...funcArgs) {

        const funcName = options.name || M424.Math.randomString();
        const isRepeat = options.afterExecution === 'repeat';
        const isDelete = ['delete', undefined].includes(options.afterExecution);
        // console.log(`${funcName}: repeat:${isRepeat} delete:${isDelete}`);
        const f = () => {
            func( ...funcArgs );
            if( isDelete ) {
                this.delete( funcName );
            }
        };
        if( this.#lazyFunctions.find(f => f.name === funcName) ) {
            this.delete(funcName);
            this.log("この名称の関数はすでに登録済みです。既存の関数を削除して、新たに登録し直します: " + funcName);
        }
        let lazyFunc = new LazyFunction( funcName );
        lazyFunc.regist( f, delay_msec, isRepeat );
        this.#lazyFunctions.push(lazyFunc);
        return funcName;
    }

    /**
     * 登録済み関数の削除
     * @param {String} name - 登録名
     */
    delete(name) {
        let ret = false;
        const array = M424.Array.remove(this.#lazyFunctions, f => f.name === name, true);
        if( array.removeObjects.length > 0 ) {
            const target = array.removeObjects[0];
            ret = target.cancel();
            this.#lazyFunctions = array.array;
        }
        return ret;
    }

    /**
     * 関数が登録され、実行待ち状態かを返す
     * @param {String} name - 登録名
     * @returns true: 実行待ち状態
     */
    isReady(name) {
        const target = this.#lazyFunctions.find( f => f.name === name );
        return target ? target.isReady() : false;
    }

};

