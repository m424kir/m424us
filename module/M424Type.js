// ==UserScript==
// @name         M424Type
// @namespace    M424.Type
// @version      1.0.0
// @description  型チェックに関する機能を提供する名前空間
// ==/UserScript==
'use strict';

/**
 * データの型に関する機能を提供する名前空間
 * @namespace
 */
M424.Type = {
  /**
   * windowが存在するか否か
   * @constant {boolean}
   */
  HAS_WINDOW: typeof window !== 'undefined',

  /**
   * DOMが存在するか否か
   * @constant {Object}
   */
  HAS_DOM: {
    NODE: M424.Type.HAS_WINDOW ? window.Node : null,
    ELEMENT: M424.Type.HAS_WINDOW ? window.Element : null,
  },

  /**
   * 型定義
   * @constant {Object}
   */
  TYPES: {
    /**
     * データ型
     * @constant {Object}
     */
    DATA_TYPE: {
      PRIMITIVE: 'primitive', // プリミティブ型
      OBJECT: 'object', // オブジェクト型
    },

    /**
     * プリミティブ型
     * @constant {Object}
     */
    PRIMITIVE: {
      NULL: 'null',
      UNDEFINED: 'undefined',
      NUMBER: 'number',
      BIGINT: 'bigint',
      BOOLEAN: 'boolean',
      SYMBOL: 'symbol',
      STRING: 'string',
    },

    /**
     * オブジェクト型
     * @constant {Object}
     */
    OBJECT: {
      OBJECT: 'object',
      FUNCTION: 'function',
    },

    /**
     * 関数型
     * @constant {Set}
     */
    FUNCTION: new Set([
      '[object Function]',
      '[object AsyncFunction]',
      '[object GeneratorFunction]',
      '[object AsyncGeneratorFunction]',
    ]),
  },

  /**
   * 値がnullか判定する
   * @param {*} variable - 判定したい値
   * @returns true: null
   */
  isNull: (variable) => {
    return variable === null;
  },

  /**
   * 値がnullでないか判定する
   * @param {*} variable - 判定したい値
   * @returns true: nullでない
   */
  isNotNull: (variable) => {
    return variable !== null;
  },

  /**
   * 値がundefinedか判定する
   * @param {*} variable - 判定したい値
   * @returns true: undefined
   */
  isUndefined: (variable) => {
    return typeof variable === M424.Type.TYPES.PRIMITIVE.UNDEFINED;
  },

  /**
   * 値がundefinedでないか判定する
   * @param {*} variable - 判定したい値
   * @returns true: undefinedでない
   */
  isNotUndefined: (variable) => {
    return typeof variable !== M424.Type.TYPES.PRIMITIVE.UNDEFINED;
  },

  /**
   * 値がnull or undefinedであるか判定する
   * @param {*} variable - 判定したい値
   * @returns {boolean} true: null or undefined
   */
  isNil: (variable) => {
    // == だとundefinedである場合も真となる
    return variable == null;
  },

  /**
   * 値がnull and undefinedでないか判定する
   * @param {*} variable - 判定したい値
   * @returns {boolean} true: null and undefinedでない
   */
  isNotNil: (variable) => {
    // != だとundefinedである場合も偽となる
    return variable != null;
  },

  /**
   * 値がプリミティブ型か判定する
   *  - `string`/`number`/`bigint`/`boolean`/`symbol`/`undefined`/`null`
   *
   * ※ `null`は厳密にはプリミティブ型であることを留意ください。
   *  - `typeof null`の結果に`object`が返されるのは、JavaScript初期の仕様であり、仕様上のバグとも言えます。
   * @param {*} variable - 判定したい値
   * @returns true: primitive type
   */
  isPrimitive: (variable) => {
    const type = typeof variable;
    return variable === null || M424.Type.TYPES.PRIMITIVE.hasOwnProperty(type);
  },

  /**
   * 値がオブジェクト型か判定する(Not Primitive)
   * @param {*} variable - 判定したい値
   * @returns true: object or function
   */
  isObject: (variable) => {
    const type = typeof variable;
    return variable !== null && M424.Type.TYPES.OBJECT.hasOwnProperty(type);
  },

  /**
   * 値が文字列かどうかを判定する
   *  - Stringオブジェクトは文字列として判定しません。
   * @param {*} variable - 判定する変数
   * @returns {boolean} true: 文字列
   */
  isString: (variable) => typeof variable === 'string',

  /**
   * 値が有限な数値かどうかを判定する
   *  - 判定する数値は有限である必要があります。(NaN,±Infinityはfalse)
   *  - Numberオブジェクトは数値として判定しません。
   * @param {*} variable - 判定する引数
   * @returns {boolean} true: 数値
   */
  isNumber: (variable) => typeof variable === 'number' && Number.isFinite(variable),

  /**
   * 値が関数かどうかを判定する
   * @param {*} variable - 判定する引数
   * @returns {boolean} true: 関数
   */
  isFunction: (variable) => {
    if (variable == null) return false;
    if (typeof variable === 'function') return true;
    // 別windowやiframeの場合
    const typeStr = Object.prototype.toString.call(variable);
    return M424.Type.TYPES.FUNCTION.has(typeStr);
  },

  /**
   * 値がNode型であるか判定する
   * @param {Object} o - 判定したいオブジェクト
   * @returns true: Node型
   */
  isNode: (o) => {
    if (M424.Type.isObject(o)) return false;

    // const hasNodeAPI = typeof window !== 'undefined' && window.Node;
    const isInstance = nodeConstructor && o instanceof nodeConstructor;
    const isValid = typeof o.nodeType === 'number' && typeof o.nodeName === 'string';
    return isInstance || isValid;
  },

  /**
   * 値がElement型であるか判定する
   * @param {Object} o - 判定したいオブジェクト
   * @returns true: Element型
   */
  isElement: (o) => {
    if (M424.Type.isObject(o)) return false;

    // const hasElementAPI = typeof window !== 'undefined' && window.Element;
    const isInstance = elementConstructor && o instanceof elementConstructor;
    const isValid = o.nodeType === 1 && typeof o.tagName === 'string';
    return isInstance || isValid;
  },
};
