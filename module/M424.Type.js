// ==UserScript==
// @name         M424.Type
// @namespace    M424.Type
// @version      1.0.0
// @description  データの型に関する機能を提供する名前空間
// @author       M424
// ==/UserScript==
'use strict';

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
     * オブジェクトのクラス名を取得する
     *  - プリミティブ値やリテラルも可(オートボクシングされる)
     * @param {Object} obj - クラス名を取得したいオブジェクト
     * @returns {string} オブジェクトのクラス名
     */
    getClassName: (obj) => {
        const cls = Object.prototype.toString.call(obj).slice(8, -1);
        return cls === "Object" ? obj.constructor.name : cls;
    },

    /**
     * 引数が関数かどうかを判定する
     * @param {any} variable
     * @returns {boolean} true:引数が関数
     */
    isFunction: (variable) => {
        return typeof variable === 'function' && M424.Type.getClassName(variable) === 'Function';
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
     * @param {Boolean} [strict=false] - 厳格モード. 継承を考慮するか (省略可能)
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
     * 引数が数値かどうかを判定する
     *  - 判定する数値は有限である必要があります。(NaN,±Infinityはfalse)
     *  - Numberオブジェクトは数値として判定しません。
     * @param {number} value - 判定したい値
     * @returns {boolean} 引数が数値の場合は true、それ以外の場合は false
     */
    isNumber: (value) => typeof value === 'number' && Number.isFinite(value),

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