// ==UserScript==
// @name         M424Common
// @version      1.2
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
 * 独自定義のメソッド群
 * @namespace M424
 */
const M424 = {

    /**
     * @namespace Date
     */
    Date: {
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
        toHours: (sec) => { return Math.floor( sec / 3600 ); },

        /**
         * 指定秒数を分[min]に変換する
         * @param {Number} sec - 指定秒数
         * @returns {Number} 分[min]
         */
        toMinutes: (sec) => { return Math.floor( sec / 60 ); },

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
         * Array対応版 Math.max
         * @param  {...Number} args - Number配列
         * @return {Number} 引数内で一番大きなNumber.
         *                  引数が空の場合null. Number以外の場合NaN.
         */
        max: (...args) => {
            let arr = [];
            args.forEach( e => {
                if( Array.isArray(e) ) {
                    arr.push( ...e );
                } else {
                    arr.push( e );
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
                    arr.push( ...e );
                } else {
                    arr.push( e );
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
