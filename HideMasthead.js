// ==UserScript==
// @name         HideMasthead
// @namespace    M424
// @version      0.1.1
// @description  Youtube動画ページでマストヘッドを隠す
// @author       M424
// @require      M424.js
// @require      M424.Type.js
// @require      M424.Mouse.js
// @require      M424.DOM.js
// @require      LazyFunctionExecutor.js
// ==/UserScript==

class HideMasthead extends M424.Base {

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
        MOUSE_MOVE: 'mousemove',
        MOUSE_ENTER: 'mouseenter',
        MOUSE_LEAVE: 'mouseleave',
        FOCUS: 'focus',
        BLUR: 'blur',

        // [LazyFunction] マストヘッドの表示を切り替えるイベント名
        SHOW_MASTHEAD:    'showMasthead',
        HIDE_MASTHEAD:    'hideMasthead',
    };

    /**
     * セレクタ
     * @constant {Object}
     */
    static Selectors = {
        YTD_APP: 'ytd-app',
        SEARCH_BOX: 'input#search',
    };

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
     * @param {Boolean} [isDebugMode=false] - デバックログを出力するか
     */
    constructor(isDebugMode=false) {
        super('HideMasthead', isDebugMode);
        this.#initialize();
    }

    /**
     * 初期化処理
     * @private
     */
    #initialize() {
        const { MOUSE_MOVE, MOUSE_ENTER, MOUSE_LEAVE, FOCUS, BLUR } = HideMasthead.Events;
        // 本クラスで使用するマウスイベント
        Object.defineProperty(this, 'MouseEvents', {
            value: [MOUSE_MOVE, MOUSE_ENTER, MOUSE_LEAVE, FOCUS, BLUR],
            writable: false,
        });

        this.#events = new M424.LazyFunctionExecutor('LazyFunctionExecutor');
        this.#mouse = new M424.Mouse(document.documentElement);
        this.#isHidden = false; // 初期状態は表示状態

        // 動画ページ更新完了時の処理を定義
        document.addEventListener(HideMasthead.Events.YT_PAGE_DATA_UPDATED, async () => {
            try {
                this.#ytdAppElement = await M424.DOM.waitForSelector(HideMasthead.Selectors.YTD_APP);
                const searchBoxElem = await M424.DOM.waitForSelector(HideMasthead.Selectors.SEARCH_BOX);

                // マウス位置、検索ボックスのフォーカスでマストヘッドの表示を切替える
                this.MouseEvents.forEach( evt => {
                    switch(evt) {
                        case MOUSE_ENTER: case MOUSE_LEAVE:
                            break;
                        case MOUSE_MOVE:
                            this.#mouse.setCallback( evt, () => this.#registEvent(evt) );
                            break;
                        case FOCUS: case BLUR:
                            searchBoxElem.addEventListener( evt, () => this.#registEvent(evt) );
                            break;
                    }
                });
                // マストヘッドの初期状態を｢非表示｣にする
                this.#registEvent();
            } catch(e) {
                this.error(e);
            }
        });

    }

    /**
     * マストヘッドの表示を切り替える
     * @param {boolean} isShow - マストヘッドを表示するか
     * @private
     */
    #switchMasthead(isShow) {
        if( isShow !== this.#isHidden ) {
            this.error("マストヘッドの表示切り替えに不備が生じました.");
            return;
        }
        this.#ytdAppElement.toggleAttribute(HideMasthead.ATTRIBUTE_MASTHEAD_HIDDEN);
        this.#ytdAppElement.style.setProperty(HideMasthead.CSS_YTD_MASTHEAD_HEIGHT, '0px');
        this.#isHidden = !isShow;
    }

    /**
     * マストヘッドの表示/非表示イベントを登録します。
     * @param {string} eventType - 実行されているイベントのタイプ
     * @private
     */
    #registEvent(eventType) {
        // yt-page-data-updated完了後より登録を許可する
        if( !this.#ytdAppElement ) { return; }

        const { SHOW_MASTHEAD, HIDE_MASTHEAD } = HideMasthead.Events;
        const isShow = this.#canShowMasthead(eventType);
        // 表示中に表示、非表示中に非表示処理は行わない
        if( isShow !== this.#isHidden ) return;

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
        this.#events.add(this.#switchMasthead.bind(this, isShow), HideMasthead.Settings.TOGGLE_DELAY_MS, { name: addEventName });
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
        return this.MouseEvents.includes(evt);
    }
};