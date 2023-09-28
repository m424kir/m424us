// ==UserScript==
// @name         ExceedTube
// @namespace    M424
// @version      0.5.0
// @description  Youtubeの機能を拡張するカスタムクラス
// @author       M424
// @require      M424.js
// @require      M424.Type.js
// @require      M424.DOM.js
// @require      M424.Mouse.js
// @require      M424.YT.js
// @require      M424.YT.Player.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/locale/ja.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/plugin/duration.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/plugin/customParseFormat.js
// ==/UserScript==

/**
 * Youtube カスタムクラス
 * @description
 * - 機能1: コントロールバーに各種ボタンを追加(シーク、コメント再読込)
 * - 機能2: シーク機能の拡張
 *   - デフォルトのシーク時間を15秒に変更(元々は5秒)
 *     - ←→キー、ボタンによるシークは15秒
 *     - [Shift] + ←→キーで5秒、[Ctrl] + ←→キーで30秒
 * - 機能3: 動画ページ(/watch)でマストヘッドを隠す(ホバーで表示)
 * @class
 */
 class ExceedTube extends M424.YT.Player {

    /**
     * ユーザ設定
     * @static
     */
    static USER_SETTINGS = {
        MASTHEAD: {
            SHOW_DELAY_MS:    400, // マストヘッドを表示状態にするまでの時間(msec)
            HIDE_DELAY_MS:    250, // マストヘッドを非表示状態にするまでの時間(msec)
            SHOW_THRESHOLD_Y: 30,  // マストヘッド(56px)を表示させるy座標の閾値(px)
        },
    };

    /**
     * イベント名
     * @static
     */
    static EVENT_NAMES = {

        MOUSE_MOVE:     'mousemove',
        MOUSE_ENTER:    'mouseenter',
        MOUSE_LEAVE:    'mouseleave',
        FOCUS:          'focus',
        BLUR:           'blur',
        KEY_DOWN:       'keydown',

        // マストヘッド表示切替用
        SHOW_MASTHEAD:  'showMasthead',
        HIDE_MASTHEAD:  'hideMasthead',

        // ページ更新イベント(外部処理用)
        PAGE_UPDATED:   'exceedtube-page-updated',
    };

    /**
     * イベント管理者
     * @type {M424.LazyFunctionExecutor}
     * @private
     */
    #events;

    /**
     * マウス情報
     * @type {M424.Mouse}
     * @private
     */
    #mouse;

    /**
     * マストヘッドが非表示であるかを示す
     * @type {boolean}
     * @private
     */
    #isMastheadHidden = false;

    /**
     * コンストラクタ
     * @constructor
     * @param {string} scriptId - スクリプトID
     * @param {boolean} isDebug - デバックログを出力するか
     */
    constructor(scriptId, isDebug = false) {
        super(scriptId, isDebug);
        this.#initialize();
    }

    /**
     * 初期処理
     * @private
     */
    #initialize() {
        // マストヘッド切替を実行可能なイベント
        const { MOUSE_MOVE, MOUSE_ENTER, MOUSE_LEAVE, FOCUS, BLUR } = ExceedTube.EVENT_NAMES;
        Object.defineProperty(this, 'mastheadSwitchableEvents', {
            value:    [MOUSE_MOVE, MOUSE_ENTER, MOUSE_LEAVE, FOCUS, BLUR],
            writable: false,
        });

        // イベント管理者 - 初期化
        this.#events = new M424.LazyFunctionExecutor(this.scriptId);

        // マウスに関する初期処理
        this.#mouse = new M424.Mouse(document.documentElement);
        this.#defineMouseEvent();

        // キーボードに関する初期処理
        this.#defineKeyboardEvent();
    }

    /**
     * マウスイベントを定義する
     * @private
     */
    #defineMouseEvent() {
        // マウス移動時に、マストヘッドの表示切替処理を行う
        const { MOUSE_MOVE, MOUSE_ENTER, MOUSE_LEAVE } = ExceedTube.EVENT_NAMES;
        this.#mouse.setCallback(MOUSE_MOVE, this.#registMastheadEvent.bind(this, MOUSE_MOVE));
        this.#mouse.setCallback(MOUSE_ENTER, this.#registMastheadEvent.bind(this, MOUSE_ENTER));
        this.#mouse.setCallback(MOUSE_LEAVE, this.#registMastheadEvent.bind(this, MOUSE_LEAVE));
    }

    /**
     * キーボードイベントを定義する
     * @private
     */
    #defineKeyboardEvent() {
        const { FOCUS, BLUR, KEY_DOWN } = ExceedTube.EVENT_NAMES;

        // 検索欄のフォーカス状態により、マストヘッドの表示を切替える
        this.elements.searchBox?.addEventListener(FOCUS, this.#registMastheadEvent.bind(this, FOCUS));
        this.elements.searchBox?.addEventListener(BLUR,  this.#registMastheadEvent.bind(this, BLUR));

        // キー入力イベント
        document.addEventListener(KEY_DOWN, evt => {
            if( !this.isVideoPage() ) return;

            const keyLeft = 'ArrowLeft', keyRight = 'ArrowRight';

            // ⇦⇨キー
            //  - 既存の5秒シークを15秒シークに再定義する
            //  - [Shift]押下時は5秒、[Ctrl]押下時は30秒シークする
            //  - [Alt]押下時はブラウザの挙動を優先する(ブラウザバック/フォワードが処理される)
            if( [keyLeft, keyRight].includes(evt.code) ) {
                this.debug(`[ExceedTube::defineKeyboardEvent][KeyDownEvent] 入力キー: ${evt.shiftKey ? "[Shift] + " : evt.ctrlKey ? "[Ctrl] + " : evt.altKey ? "[Alt] + " : ""}${evt.code === keyLeft ? "←" : "→"}`);

                // 特定のフォーカス時は処理しない
                if( M424.DOM.isFocusTextInputField(evt) || M424.YT.isFocusVolume() ) {
                    this.debug( `[ExceedTube::defineKeyboardEvent][KeyDownEvent] ${M424.YT.isFocusVolume() ? "ボリューム" : "テキスト欄"}にフォーカスされているため、処理を中断しました.` );
                    return;
                }

                if( evt.altKey ) {
                    this.debug( `[ExceedTube::defineKeyboardEvent][KeyDownEvent] ブラウザ側の処理を優先するため処理を中断します. {入力キー: [Alt] + ${evt.code === keyLeft ? "←" : "→"}}` );
                    evt.stopPropagation();
                    return;
                }

                // キー入力をなかったことにする
                evt.preventDefault();

                // シークする
                const callcSeekTime = (evt) => {
                    const { SEEK_TIME } = M424.YT.Player;
                    const dir = evt.code === keyLeft ? -1 : 1;
                    const sec = evt.shiftKey ? SEEK_TIME.short : evt.ctrlKey ? SEEK_TIME.long : SEEK_TIME.default;
                    return dir * sec;
                }
                this.seekVideo( callcSeekTime(evt) );
            }
        }, true);
    }

    /**
     * マストヘッドの表示を切替えるイベント登録を行う
     * @param {string} evt - イベント名
     * @private
     */
    #registMastheadEvent(evt) {
        const { EVENT_NAMES: { SHOW_MASTHEAD, HIDE_MASTHEAD }, USER_SETTINGS: { MASTHEAD: { SHOW_DELAY_MS, HIDE_DELAY_MS } } } = ExceedTube;
        const isShowable = this.#canShowMasthead(evt);  // 表示可能か？

        const addEvent    = isShowable ? SHOW_MASTHEAD : HIDE_MASTHEAD;
        const removeEvent = isShowable ? HIDE_MASTHEAD : SHOW_MASTHEAD;
        const delayMs = isShowable ? SHOW_DELAY_MS : HIDE_DELAY_MS;

        // 実行中のイベントと同じイベントは登録しない
        //  - 表示処理実行中(SHOW_MASTHEAD) かつ 表示処理実行可能状態(isShowable === true)
        //  - 非表示処理実行中(HIDE_MASTHEAD) かつ 非表示処理実行可能状態(isShowable === false)
        if( this.#events.isReady(addEvent) ) {
            this.debug(`[ExceedTube::registMastheadEvent] 実行中のイベントと同じイベントのため、登録処理をスキップします.`, addEvent);
            return;
        }
        // 実行中と逆のイベントの場合は、実行中のイベントを削除する
        //  - 表示処理実行中(SHOW_MASTHEAD) かつ 非表示処理実行可能状態(isShowable === false)
        //  - 非表示処理実行中(HIDE_MASTHEAD) かつ 表示処理実行可能状態(isShowable === true)
        if( this.#events.isReady(removeEvent) ) {
            this.debug(`[ExceedTube::registMastheadEvent] 実行中のイベントと逆のイベントのため、実行中のイベントを削除しました.`, removeEvent);
            this.#events.remove(removeEvent);
            return;
        }
        // 表示中に表示する、またその逆の場合は何もしない
        if( isShowable !== this.#isMastheadHidden ) return;

        // イベント登録
        this.#events.add(
            this.#switchMasthead.bind(this, isShowable),
            delayMs,
            { name: addEvent }
        );
        this.debug(`[ExceedTube::registMastheadEvent] イベントを追加しました. {イベント名: ${addEvent}, 遅延時間: ${delayMs}msec}`);
    }

    /**
     * マストヘッドの表示を切替える
     * @param {boolean} isShowable - マストヘッドが表示可能な状態か
     * @private
     */
    #switchMasthead(isShowable) {
        if( !this.elements.ytdApp ) {
            this.debug(`[ExceedTube::switchMasthead] DOM情報が更新中のため、処理をスキップします.`);
            return;
        }
        if( isShowable !== this.#isMastheadHidden ) {
            console.error(`[ExceedTube::switchMasthead] マストヘッドの表示切り替えに不備が生じました. { 現在の状態: ${this.#isMastheadHidden ? "非表示" : "表示"}, 切替フラグ: ${isShowable ? "表示" : "非表示"}}`);
            return;
        }
        if( isShowable ) {
            this.elements.ytdApp?.removeAttribute(M424.YT.ATTRIBUTE.MASTHEAD_HIDDEN);
            this.elements.ytdApp?.style.setProperty(M424.YT.CSS.YTD_MASTHEAD_HEIGHT, `${M424.YT.SIZE.MASTHEAD_HEIGHT}px`);
        } else {
            this.elements.ytdApp?.setAttribute(M424.YT.ATTRIBUTE.MASTHEAD_HIDDEN);
            this.elements.ytdApp?.style.setProperty(M424.YT.CSS.YTD_MASTHEAD_HEIGHT, `0px`);
        }
        // this.elements.ytdApp?.toggleAttribute(M424.YT.ATTRIBUTE.MASTHEAD_HIDDEN);
        // this.elements.ytdApp?.style.setProperty(M424.YT.CSS.YTD_MASTHEAD_HEIGHT, '0px');
        this.#isMastheadHidden = !isShowable;
    }

    /**
     * マストヘッドが表示可能かを判定する
     * @param {string} evt - イベント名
     * @returns {boolean} true: 表示可能
     * @private
     */
    #canShowMasthead(evt) {
        const isMastheadSwitchable = this.mastheadSwitchableEvents.includes(evt);
        const isShowable = this.#isHoverMasthead() || M424.YT.isFocusSearchBox();
        return isMastheadSwitchable && isShowable;
    }

    /**
     * マストヘッド上にマウスが乗っているか判定する
     * @returns {boolean} true: ホバー判定
     */
    #isHoverMasthead() {
        const { SHOW_THRESHOLD_Y } = ExceedTube.USER_SETTINGS.MASTHEAD;
        const { MASTHEAD_HEIGHT } = M424.YT.SIZE;

        // 状態によって、ホバー判定を変える
        //   - 表示状態:   マストヘッドの高さ
        //   - 非表示状態: ユーザ指定の高さまで
        const thresholdY = this.#isMastheadHidden ? SHOW_THRESHOLD_Y : MASTHEAD_HEIGHT;
        const isInRangeY = this.#mouse.isInRangeY(0, thresholdY, true);
        return this.#mouse.isMouseWithin && isInRangeY;
    }

    /**
     * yt-page-data-updated イベントが発生した際に呼び出されるコールバック関数です。
     * @description Youtube内でのページ遷移時に実行されるイベントです。
     * @override
     * @async
     */
    async onPageDataUpdated() {
        await super.onPageDataUpdated();

        // カスタムイベントの発行
        document.dispatchEvent( new CustomEvent(ExceedTube.EVENT_NAMES.PAGE_UPDATED) );
    }

    /**
     * ページ全体の表示に関する更新処理
     * @override
     */
    updateEntirePageDisplay() {
        // マストヘッドを非表示化
        this.#registMastheadEvent();
    }

    /**
     * 動画ページに関する更新処理
     * @override
     */
    updateVideoPageDisplay() {
        if( !this.isVideoPage() ) return;

        // プレイヤーコントロールにボタン追加
        this.#addButtonToVideoPlayerControls();
    }

    /**
     * プレイヤーコントロールにカスタムボタンを追加する
     * @private
     */
    #addButtonToVideoPlayerControls() {
        this.addSeekButton();                       // シーク
        this.addReloadCommentButton();              // コメント再読込
        this.defineVideoPlayerButtonTooltipCSS();   // ボタンツールチップ
    }
}