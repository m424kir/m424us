// ==UserScript==
// @name         DetectPageTransitions
// @namespace    M424
// @version      0.1
// @description  同Host内のページ遷移を検知する基本クラス
// @author       M424
// @grant        none
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/M424Common.js
// ==/UserScript==

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