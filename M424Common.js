// ==UserScript==
// @name         M424Common
// @version      1.1
// @description  commonクラス
// @author       M424
// ==/UserScript==

'use strict';

/**
 * @class 基底クラス
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
     * @param {Boolean} isDebugMode デバック出力するか
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
 */
const M424 = {
    Math: {
        /**
         * Array対応版 Math.max
         * @param  {...Number} args Number配列
         * @returns {Number} 引数内で一番大きなNumber. 
         *                   引数が空の場合null. Number以外の場合NaN.
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
         * @param  {...Number} args Number配列
         * @returns {Number} 引数内で一番小さなNumber. 
         *                   引数が空の場合null. Number以外の場合NaN.
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
        }
    }
}

// 即時関数で囲まないと動かなかったので...
(function() {
    /**
     * Elementの属性を一括登録する
     * @param {Ojbect} obj 
     */
    Element.prototype.setAttributes = function(obj) {
        for( let i of Object.entries(obj) ) {
            this.setAttribute(i[0], i[1]);
        }    
    }

    /**
     * 自身が指定引数範囲内に含まれるか判定する
     * @param {Number} a 
     * @param {Number} b 
     * @param {Boolean} inclusive 引数自体を範囲に含むか
     * @returns {Boolean} 自身が範囲内ならばtrue
     */
    Number.prototype.between = function(a, b, inclusive) {
        let min = M424.Math.min(a, b);
        let max = M424.Math.max(a, b);
        return inclusive ? min <= this && this <= max : min < this && this < max;
    }

})();
