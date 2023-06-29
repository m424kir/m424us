// ==UserScript==
// @name         HideMasthead
// @namespace    M424
// @version      0.0.1
// @description  動画ページでマストヘッドを隠す
// @author       M424
// ==/UserScript==

// このスクリプトを使用する場合は、TamperMonkeyScriptに以下の定義を追加してください。
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/module/M424.js
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/module/M424.Mouse.js
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/module/M424.DOM.js
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/module/LazyFunctionExecutor.js

HideMasthead = class HideMasthead extends M424.Base {

    /**
     * マストヘッドの表示/非表示に関する設定
     * @constant {Object}
     */
    static Settings = {
        TOGGLE_DELAY_MS:   250, // マストヘッドの切り替えるための遅延時間(msec)
        SHOW_THRESHOLD_Y:   25, // マストヘッド(56px)を表示させるy座標の閾値
    };

    /**
     * イベント名を表す定数
     * @constant {Object}
     */
    static Events = {
        // イベントリスナー
        YT_PAGE_DATA_UPDATED: 'yt-page-data-updated',

        // [LazyFunction] マストヘッドの表示を切り替えるイベント名
        SHOW_MASTHEAD:    'showMasthead',
        HIDE_MASTHEAD:    'hideMasthead',
    };

    /**
     * CSSセレクター: 'ytd-app'
     * @constant {string}
     */
    static SELECTOR_YTD_APP = 'ytd-app';

    /**
     * CSSプロパティ: '--ytd-masthead-height'
     * @constant {string}
     */
    static CSS_YTD_MASTHEAD_HEIGHT = '--ytd-masthead-height';

    /**
     * マストヘッドが非表示になっていることを示す属性名です。
     * @constant {string}
     */
    static ATTRIBUTE_MASTHEAD_HIDDEN = 'masthead-hidden';

    /**
     * マストヘッドの高さ(px)
     * @constant {Number}
     */
    static MASTHEAD_HEIGHT = 56;

    /**
     * Youtubeのアプリケーション要素を表すDOM要素
     * @type {HTMLElement|null}
     * @private
     */
    #ytdAppElement = null;

    /**
     * マストヘッドの表示可否を管理するイベント管理者
     * @type {M424.LazyFunctionExecutor}
     * @private
     */
    #events;

    /**
     * マウス
     * @type {M424.Mouse}
     * @private
     */
    #mouse;

    /**
     * マストヘッドが隠されているか
     * @type {boolean}
     * @private
     */
    #isHidden;

    /**
     * コンストラクタ
     * @constructor
     */
    constructor() {
        this.#events = new M424.LazyFunctionExecutor('LazyFunctionExecutor', true);
        this.#mouse = new M424.Mouse(document.documentElement);

        // ページ更新時、マストヘッドを隠す
        document.addEventListener(HideMasthead.Events.YT_PAGE_DATA_UPDATED, async () => {

            this.#ytdAppElement = await M424.DOM.waitForSelector(HideMasthead.SELECTOR_YTD_APP, 10 * 1000);
            this.#registEvent(); // Hide Masthead
        });
    }

    /**
     * マストヘッドの表示を切り替える
     * @param {boolean} isShow - マストヘッドを表示するか
     * @private
     */
    #switchMasthead(isShow) {
        const mastheadHeight = `${isShow ? HideMasthead.MASTHEAD_HEIGHT : 0}px`;
        this.#ytdAppElement.toggleAttribute(HideMasthead.ATTRIBUTE_MASTHEAD_HIDDEN);
        this.#ytdAppElement.style.setProperty(HideMasthead.CSS_YTD_MASTHEAD_HEIGHT, mastheadHeight);
        this.#isHidden = !isShow;
    }

    /**
     * マストヘッドの表示/非表示イベントを登録します。
     * @param {string} eventType - 実行されているイベントのタイプ
     * @private
     */
    #registEvent(eventType) {
        const { SHOW_MASTHEAD, HIDE_MASTHEAD } = HideMasthead.Events;
        const isShow = this.#canShowMasthead(eventType);
        const addEventName = isShow ? SHOW_MASTHEAD : HIDE_MASTHEAD;
        const removeEventName = isShow ? HIDE_MASTHEAD : SHOW_MASTHEAD;

        // 削除イベントが実行中なら中断する
        if( this.#events.isReady(removeEventName) ) {
            this.#events.remove(removeEventName);
        }
        // 登録イベントが実行中なら何もしない
        if( this.#events.isReady(addEventName) ) {
            return;
        }
        // イベントを登録する
        this.#events.add(this.#switchMasthead.bind(this), HideMasthead.Settings.TOGGLE_DELAY_MS, { name: addEventName });
    }

    /**
     * マストヘッド上にマウスポインターがホバーしているかを判定します。
     * @returns {boolean} true: ホバーしている
     * @private
     */
    #isHoverMasthead() {
        const { MASTHEAD_HEIGHT, Settings: { SHOW_THRESHOLD_Y } } = HideMasthead;
        const thresholdY = this.#isHidden ? SHOW_THRESHOLD_Y : MASTHEAD_HEIGHT;
        const isInRangeY = this.#mouse.isInRangeY(0, thresholdY, true);
        return this.#mouse.isMouseWithin && isInRangeY;
    }

    /**
     * 検索欄にフォーカスが当たっているか
     * @returns {boolean} true: 検索欄にフォーカスが当たっている
     * @private
     */
     #isFocusSearchBox() {
        const activeElem = document.activeElement;
        return (activeElem.tagName === 'INPUT' && activeElem.id === 'search' );
    }

    /**
     * マストヘッドが表示可能かどうかを判定する
     * @param {string} eventType - 実行されているEventタイプ
     * @returns {boolean} true: マストヘッドが表示可能
     * @private
     */
    #canShowMasthead(eventType) {
        const isMouseEvent = this.#isMouseEvent(eventType);
        const isShowMasthead = this.#isHoverMasthead() || this.#isFocusSearchBox();
        return isMouseEvent && isShowMasthead;
    }

    /**
     * イベントがマウスイベントかどうかを判定します。
     * @param {string} evt - 判定するイベント名
     * @returns {boolean} true: マウスイベント
     * @private
     */
    #isMouseEvent(evt) {
        const mouseEvents = ['mousemove', 'mouseenter', 'mouseleave', 'focus', 'blur'];
        return mouseEvents.includes(evt);
    }
};