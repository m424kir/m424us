// ==UserScript==
// @name         M424Common
// @version      1.1
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
 * 同Host内のページ遷移を検知する基本クラス
 * @class DetectPageTransitions
 * @extends M424Base
 */
class DetectPageTransitions extends M424Base {

    /**
     * 現在保持しているURL[location.href]
     * @type {string}
     */
    #current_url = '';

    /**
     * 監視対象Node取得用セレクタ
     * @type {string}
     */
    #monitoring_selector = '';

    /**
     * 監視オプション
     * @type {object}
     */
    #monitoring_options = { childList: true, subtree: true };

    /**
     * 監視オブジェクト
     * @typedef {MutationObserver}
     */
    #observer;

    /**
     * @constructor
     * @param {string} monitoring_selector 監視対象Nodeセレクタ
     * @param {boolean} isDebug デバック出力するか
     */
    constructor(scriptId, isDebug = false) {
        super(scriptId, isDebug);
        this.#monitoring_selector = monitoring_selector;
    }

    /**
     * [getアクセサ] 監視対象のNodeセレクタ
     * @return {string} 監視対象のNodeセレクタ
     */
    get monitoringSelector() {
        return this.#monitoring_selector;
    }

    /**
     * [setアクセサ] 監視対象のNodeセレクタ
     * @param {string} 監視対象のNodeセレクタ
     */
    set monitoringSelector(selector) {
        this.#monitoring_selector = selector;
    }

    /**
     * [getアクセサ] 監視対象の設定
     * @return {string} オプションリスト
     */
     get monitoringOptions() {
        return this.#monitoring_options;
    }

    /**
     * [setアクセサ] 監視対象の設定
     * @param {string} オプションリスト
     */
     set monitoringOptions(options) {
        this.#monitoring_options = options;
    }

    /**
     * ページ遷移の検知を開始する
     * @throws MutationObserverが起動済み
     */
    start() {
        if( this.#observer ) {
            throw new Error("Observerはすでに起動済です.");
        }
        this.#current_url = location.href;
        this.#detectPageTransition();
    }

    /**
     * ページ遷移の検知を停止する
     * @throws MutationObserverが未定義
     */
    stop() {
        if( !this.#observer ) {
            throw new Error("Observerが起動していません.");
        }
        this.#observer.disconnect();

    }

    /**
     * ページ遷移を検知し、イベントを発行する
     * @description 対象Nodeの変更を監視し、URLに差異が出たらイベントを発行する
     */
    #detectPageTransition() {

        const target = document.querySelector(this.#monitoring_selector) || document.head;
        const options = this.#monitoring_options || { childList: true, subtree: true };
        this.#observer = new MutationObserver( (mutations, observer) => {
            if (this.#current_url != location.href) {
                console.log(`Detect Page Transition: [${this.#current_url.slice(location.origin.length)}] -> [${location.href.slice(location.origin.length)}]`);
                this.#triggerPageTransition();
                this.#current_url = location.href;
            }
        });
        this.#observer.observe(target, options);
    }

    /**
     * ページ遷移を伝えるイベントを発行する
     * @event pagetransition
     */
    #triggerPageTransition() {
        document.dispatchEvent( new CustomEvent('pagetransition', { detail: location.href }) );
    }
}

/**
 * 独自定義のメソッド群
 * @namespace M424
 */
const M424 = {
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
