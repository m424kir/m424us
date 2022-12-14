// ==UserScript==
// @name         M424Common
// @version      1.4.2
// @description  commonクラス
// @author       M424
// ==/UserScript==

'use strict';

/**
 * 基底クラス
 * @class M424Base
 */
class M424Base {

    /**
     * デバッグ出力を行うかのフラグ
     * @type {Boolean}
     */
    #isDebug;

    /**
     * スクリプトID
     * @type {string}
     */
    #scriptId;

    /**
     * @constructor
     * @param {string} scriptId
     * @param {Boolean} [isDebugMode=false] デバック出力するか
     */
    constructor(scriptId, isDebugMode = false) {
        this.#scriptId = scriptId;
        this.#isDebug = isDebugMode;
    }

    get scriptId() { return this.#scriptId; }

    /**
     * infoログ出力
     * @param  {...any} msg 出力メッセージ
     */
    log(...msg) {
        console.log(`[${this.#scriptId}]`, ...msg);
    }

    /**
     * デバッグログ出力
     * @param  {...any} msg 出力メッセージ
     */
    debug(...msg) {
        if( this.#isDebug ) { this.log(...msg); }
    }
}

/**
 * 定数クラス
 * @class M424Consts
 */
class M424Consts {
    /**
     * データ型
     */
    static get DATA_TYPE() {
        return {
            PRIMITIVE:  'primitive',
            OBJECT:     'object',
        };
    };

    /**
     * プリミティブ型
     */
    static get PRIMITIVE_TYPE() {
        return {
            NULL:       'null',
            UNDEFINED:  'undefined',
            NUMBER:     'number',
            BIGINT:     'bigint',
            BOOLEAN:    'boolean',
            SYMBOL:     'symbol',
            STRING:     'string',
        };
    };

    /**
     * オブジェクト型
     */
    static get OBJECT_TYPE() {
        return {
            OBJECT:     'object',
            FUNCTION:   'function',
        };
    };
};

/**
 * 独自定義のメソッド群
 * @namespace M424
 */
const M424 = {

    /**
     * M424.DOM.querySelectorAsyncのエイリアスメソッド
     */
    $: (selectors, element = document, timeout_ms) => M424.DOM.querySelectorAsync(selectors, element, timeout_ms),

    /**
     * @namespace System
     */
    System: {
        /**
         * [async] 指定ミリ秒間 処理をスリープする
         * @param {Number} msec - ミリ秒
         * @returns {Promise}
         */
        sleep: (msec) => new Promise((resolve) => setTimeout(resolve, msec)),

        /**
         * 通常Throwできない3項演算子等の中でErrorをThrowするためのラッパーメソッド
         * @param {String} message - エラーメッセージ
         * @param {Error} type - エラーオブジェクトタイプ
         * @throws
         */
        error: (message, type = Error) => {
            throw Function(`"use strict"; return new ${type.name}("${message}");`)();
        },

        /**
         * 引数が指定されない or undefined が渡された際にエラーを発生させるためのメソッド
         *  - メソッドのデフォルト引数に設定して使用する ex) function xxx(args = M424.System.mandary()) {...}
         */
        mandatory: () => {
            throw new TypeError(arg + ": Invalid argument parameter.");
        }
    },

    /**
     * 内部処理用メソッド
     * @namespace _internal
     */
    _internal: {
        /**
         * [async] 指定時間が経過するまでデータ取得を試みる
         * @param {Number} interval_ms - 1処理の待機時間(ミリ秒)
         * @param {Number} timeout_ms - 最大待機時間(ミリ秒)
         * @param {Function} func - 値を取得したいgetterメソッド
         * @param {*} args - メソッド引数
         * @returns
         */
        _async: (interval_ms = 10, timeout_ms = 1000) => async (func, ...args) => {
            const timeout  = Math.min(timeout_ms, 100000);
            const interval = Math.min(Math.max(0, interval_ms), timeout);
            const st = Date.now();
            const elapsed = () => (Date.now() - st);
            try {
                let ret;
                while( true ) {
                    while( elapsed() > timeout ) throw new Error(`Running query timed out(${timeout}ms)`);
                    if( ret = func(args) ) return new Promise(resolve => resolve(ret));
                    await M424.System.sleep(interval);
                }
            } catch (e) {
                throw e;
            }
        },
    },

    /**
     * @namespace DOM
     */
    DOM: {
        /**
         * 指定セレクタが取得できるまで待機する(最大待機時間有)
         * @param {String} selector - 取得したい要素を特定するセレクタ(省略不可)
         * @param {Element} baseElement - 親要素(default:document)
         * @param {Number} timeout_ms - 最大待機時間(ミリ秒)
         * @returns {Promise} 取得セレクタ(見つからなかった場合はNull)
         */
         async querySelectorAsync(selectors = M424.System.mandatory(), baseElement = document, timeout_ms = 5000) {
            if (M424.Object.isNullOrUndefined(baseElement)) {
                baseElement = document;
            }
            const getter = M424._internal._async(10, timeout_ms);

            try{
                return await getter(() => baseElement?.querySelector(selectors) ?? null);
            } catch (e) {
                return null;    // query timeout
            }
        },

        /**
         * ElementからCSS情報を取得する
         * @param {Element} o - Element
         * @returns {CSSStyleDeclaration} 取得スタイル(not found is undefined)
         */
        getCSS(o) {
            try {
                if (M424.Object.isElement(o)) M424.System.error('Element型のみ許容します', TypeError);
                if (!('getComputedStyle' in window)) M424.System.error('getComputedStyleが存在しません', Error);
                return window.getComputedStyle(o);
            } catch (e) {
                throw e;
            }
        },

        /**
         * 指定プロパティが取得できるまで待機する(最大待機時間有)
         * @param {Element|CSSStyleDeclaration} elemOrCss - Element or CSS
         * @param {String} property - 取得したいスタイルのプロパティ
         * @param {Number} timeout_ms - 最大待機時間(ミリ秒)
         * @returns {Promise} 取得プロパティ(見つからなかった場合はNull)
         */
        async getPropertyValueAsync(elemOrCss, property, timeout_ms = 1000) {
            try {
                const css = M424.Object.is(CSSStyleDeclaration, elemOrCss) ? elemOrCss : this.getCSS(elemOrCss);
                const getter = M424._internal._async(10, timeout_ms);
                return await getter(() => css?.getPropertyValue(property) ?? null);
            } catch (e) {
                return null;
            }
        },
    },

    /**
     * @namespace Object
     */
    Object: {

        /**
         * 型判定用のクラス
         * @class DataType
         */
        DataType: class {
            type;
            name;
            isObject;
            isPrimitive;
            constructor(variable) {
                this.name = M424.Object.getClassName(variable);
                this.isPrimitive = M424.Object.isPrimitive(variable);
                this.isObject = !this.isPrimitive;
                this.type = this.isObject ? M424Consts.DATA_TYPE.OBJECT : M424Consts.DATA_TYPE.PRIMITIVE;
            };
            static of(type, name) {
                let ret = new M424.Object.DataType();
                ret.type = type;
                ret.name = name;
                ret.isPrimitive = undefined !== M424Consts.PRIMITIVE_TYPE[type.toUpperCase()];
                ret.isObject = !ret.isPrimitive;
                return ret;
            };
        },

        /**
         * 引数がNull型か判定する
         * @param {*} variable - 型判定したい変数
         * @returns true:引数がNull型
         */
        isNull(variable) {
            return variable === null;
        },

        /**
         * 引数がNull型でないか判定する
         * @param {*} variable - 型判定したい変数
         * @returns true:引数がNull型でない
         */
        isNotNull(variable) {
            return !this.isNull(variable);
        },

        /**
         * 引数がUndefined型か判定する
         * @param {*} variable - 型判定したい変数
         * @returns true:引数がUndefined型
         */
        isUndefined(variable) {
            return typeof variable === M424Consts.PRIMITIVE_TYPE.UNDEFINED;
        },

        /**
         * 引数がUndefined型でないか判定する
         * @param {*} variable - 型判定したい変数
         * @returns true:引数がUndefined型でない
         */
        isNotUndefined(variable) {
            return !this.isUndefined(variable);
        },

        /**
         * 引数がUndefined型orNull型であるか判定する
         * @param {*} variable - 型判定したい変数
         * @returns true:引数がUndefined型orNull型
         */
        isNullOrUndefined(variable) {
            return this.isNull(variable) || this.isUndefined(variable);
        },

        /**
         * 引数がUndefined型およびNull型でないか判定する
         * @param {*} variable - 型判定したい変数
         * @returns true:引数がUndefined型およびNull型でない
         */
        isNotNullAndNotUndefined(variable) {
            return this.isNotNull(variable) && this.isNotUndefined(variable);
        },

        /**
         * 引数がプリミティブ型か判定する
         *  - プリミティブ型
         *      - 文字列: string
         *      - 数値: number, bigint
         *      - 真偽値: boolean
         *      - undefined: undefined
         *      - null: null
         * @param {*} variable - 型判定したい変数
         * @returns true:引数がプリミティブ型
         */
        isPrimitive(variable) {
            const type = (typeof variable).toUpperCase();
            return undefined !== M424Consts.PRIMITIVE_TYPE[type] || this.isNull(variable);
        },

        /**
         * 引数がオブジェクト型か判定する(Not Primitive)
         * @param {*} variable - 型判定したい変数
         * @returns true:引数がオブジェクト型
         */
        isObject(variable) {
            return !this.isPrimitive(variable);
        },

        /**
         * 引数の型文字列を返す
         * @param {*} variable
         * @returns 引数の型文字列
         */
        getDataType(variable) {
            return new this.DataType(variable);
        },


        /**
         * 引数オブジェクトのクラス名を返す.
         *  - プリミティブ値やリテラルも可(オートボクシングされる)
         * @param {Object} obj - 取得したいクラスオブジェクト
         * @returns 引数のクラス名
         */
        getClassName(obj) {
            const cls = Object.prototype.toString.call(obj).slice(8, -1);
            return cls === "Object" ? obj.constructor.name : cls;
        },


        /**
         * 対象データが指定の型であるかを判定する
         *  - typeにはデータ型オブジェクト(Function)または型文字列(String)のみ許容する
         *  - typeにNullまたはUndefinedを指定できない(Error occur)
         *  - ex)
         *      - M424.Object.is(Date, new Date()); // true
         *      - M424.Object.is("Date", new Date()); // true
         *      - M424.Object.is(String, "str"); // true
         *      - M424.Object.is(true, true); // false
         *      - M424.Object.is("true", true); // false
         * @param {Function|String} type - 型(Function) or 型文字列
         * @param {*} variable - 検証したいデータ
         * @param {Boolean} strict - 厳格モード. 継承を考慮するか
         * @returns true: 対象データが指定の型である
         */
        is(type, variable, strict = false) {
            try {
                const targetType = this.getDataType(variable);
                const checkType = (() => {
                    const dataType = this.getDataType(type);
                    // console.log(dataType);
                    if (dataType.name === 'Function') {
                        return M424.Object.DataType.of(dataType.type, type.name);
                    }
                    else if (dataType.name === 'String') {
                        if (["NULL", "UNDEFINED"].includes(type.valueOf().toUpperCase())) {
                            throw TypeError(`引数:typeにnullまたはundefinedが指定されています. 型または型文字列を指定して下さい.: ${type}`);
                        }
                        return M424.Object.DataType.of(M424Consts.DATA_TYPE.OBJECT, type.valueOf());
                    }
                    throw TypeError(`引数:typeには、型または型文字列を指定して下さい.: ${type}`);
                })();
                const isExtend = !strict && checkType.type === 'object' && variable instanceof eval(checkType.name);
                return (targetType.name === checkType.name) || (isExtend);
            } catch (e) {
                console.log(e);
                return false;
            }
        },

        /**
         * 引数がNode型であるか判定する
         * @param {Object} o
         * @returns true: Node型
         */
        isNode(o) {
            return (typeof Node === 'object' ? o instanceof Node
                : o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string'
            );
        },

        /**
         * 引数がElement型であるか判定する
         * @param {Object} o
         * @returns true: Element型
         */
        isElement(o) {
            return ("HTMLElement" in window)
                ? (o && o instanceof HTMLElement)
                : !!(o && typeof o === 'object' && o.nodeType === 1 && o.nodeName);
        },
    },

    /**
     * @namespace Array
     */
    Array: {
        /**
         * 配列から特定の要素を削除した配列を返す
         * @param {Array} array - 削除したい要素を含む配列
         * @param {callback} condition - 削除条件
         * @param {Boolean} isFirstOnly - 最初の要素のみを削除するか(default:false)
         * @returns
         */
        remove: (array, condition, isFirstOnly = false) => {
            let removeObjs = [];
            let bFirstOnly = isFirstOnly ? 0b01 : 0b00;
            let ret = array.reduce((arr, obj) => {
                if (bFirstOnly ^ 0b11 && condition(obj)) {
                    removeObjs.push(obj);
                    bFirstOnly |= 0b10;
                } else {
                    arr.push(obj);
                }
                return arr;
            }, []);
            return { array: ret, removeObjects: removeObjs };
        },
    },

    /**
     * @namespace Date
     */
    Date: {
        /**
         * moment wrapper
         * @param {*} obj
         * @returns
         */
        of: (obj) => moment(obj),
        /**
         * moment.duration wrapper
         * @param {*} obj
         * @returns
         */
        duration: (obj) => moment.duration(obj),

        /**
         * 日付からYYYY/MM/DD形式の文字列に変換する
         * @param {Date} dateObj
         * @returns YYYY/MM/DD形式の文字列
         */
        toYMD: (dateObj) => {
            const month = ('0' + dateObj.getMonth() + 1).slice(-2);
            const day = ('0' + dateObj.getDate()).slice(-2);
            return `${dateObj.getFullYear()}/${month}/${day}`;
        },

        /**
         * 日付から曜日情報を取得する
         * @param {Date} dateObj
         * @returns {String} 曜日文字列
         */
        toDayOfWeekInJapanese: (dateObj) => {
            const label = ['日', '月', '火', '水', '木', '金', '土'];
            return label[dateObj.getDay()];
        },
    },

    /**
     * @namespace Time
     */
    Time: {
        /**
         * 指定秒数を時間[h]に変換する
         * @param {Number} sec - 指定秒数
         * @returns {Number} 時間[h]
         */
        toHours: (sec) => { return Math.floor(sec / 3600); },

        /**
         * 指定秒数を分[min]に変換する
         * @param {Number} sec - 指定秒数
         * @returns {Number} 分[min]
         */
        toMinutes: (sec) => { return Math.floor(sec / 60); },

        /**
         * 指定秒数をhh:mm:ss形式の文字列に変換する
         * @param {Number} sec - 指定秒数(整数)
         * @returns {String} hh:mm:ss形式の文字列
         */
        toHMS: (sec) => {
            const hours = M424.Time.toHours(sec);
            const minutes = M424.Time.toMinutes(sec - 3600 * hours);

            const hh = ('0' + hours).slice(-2);
            const mm = ('0' + minutes).slice(-2);
            const ss = ('0' + sec % 60).slice(-2);

            return (`${hh}:${mm}:${ss}`);
        },
    },

    /**
     * @namespace Math
     */
    Math: {

        /**
         * [1-9a-z]のランダムな文字列を生成する(10文字)
         * @returns ランダム生成した文字列(10文字)
         */
        randomString: () => Math.random().toString(36).substring(2, 12),

        /**
         * 引数が正の整数かを判定する
         * @param {Object} obj
         * @returns true: 引数は正の整数
         */
        isPositiveInteger: (obj) => Number.isInteger(obj) && Math.sign(obj) === 1,

        /**
         * 引数が負の整数かを判定する
         * @param {Object} obj
         * @returns true: 引数は負の整数
         */
        isNegativeInteger: (obj) => Number.isInteger(obj) && Math.sign(obj) === -1,

        /**
         * Array対応版 Math.max
         * @param  {...Number} args - Number配列
         * @return {Number} 引数内で一番大きなNumber.
         *                  引数が空の場合null. Number以外の場合NaN.
         */
        max: (...args) => {
            let arr = [];
            args.forEach( e => {
                if( Array.isArray(e) ) {
                    arr.push(...e);
                } else {
                    arr.push(e);
                }
            });
            const ret = Math.max.apply(null, arr);
            if( ret === -Infinity ) return null;
            return ret;
        },

        /**
         * Array対応版 Math.min
         * @param  {...Number} args - Number配列
         * @return {Number} 引数内で一番小さなNumber.
         *                  引数が空の場合null. Number以外の場合NaN.
         */
        min: (...args) => {
            let arr = [];
            args.forEach( e => {
                if( Array.isArray(e) ) {
                    arr.push(...e);
                } else {
                    arr.push(e);
                }
            });
            const ret = Math.min.apply(null, arr);
            if( ret === Infinity ) return null;
            return ret;
        },
    },
};

/**
 * Elementの属性を一括登録する
 * @param {Ojbect} obj - {key:value}型の連想配列
 */
Element.prototype.setAttributes = function(obj) {
    for( let i of Object.entries(obj) ) {
        this.setAttribute(i[0], i[1]);
    }
};

/**
 * Elementの属性を一括登録する(NS)
 * @param {String} namespace - 属性の名前空間を指定する文字列
 * @param {Object} obj - {key:value}型の連想配列
 */
Element.prototype.setAttributesNS = function(namespace, obj) {
    for( let i of Object.entries(obj) ) {
        this.setAttributeNS(namespace, i[0], i[1]);
    }
}

/**
 * 自身が指定引数範囲内に含まれるか判定する
 * @param {Number} a - 判定したい数値1
 * @param {Number} b - 判定したい数値2
 * @param {Boolean} inclusive 引数自体を範囲に含むか
 * @returns {Boolean} true if this is between a to b
 */
Number.prototype.between = function(a, b, inclusive) {
    let min = M424.Math.min(a, b);
    let max = M424.Math.max(a, b);
    return inclusive ? min <= this && this <= max : min < this && this < max;
};
