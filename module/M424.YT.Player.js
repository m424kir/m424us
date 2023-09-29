// ==UserScript==
// @name         M424.YT.Player
// @namespace    M424.YT.Player
// @version      0.1.5
// @description  Youtubeの動画プレイヤーに関する機能を提供する
// @author       M424
// @require      M424.js
// @require      M424.Type.js
// @require      M424.DOM.js
// @require      M424.Mouse.js
// @require      M424.YT.js
// ==/UserScript==
'use strict';

/**
 * Youtubeの動画プレイヤーに関する機能を提供する
 * @class
 */
M424.YT.Player = class Player extends M424.Base {

    /**
     * シーク時間定義
     * @static
     */
    static SEEK_TIME = { default: 15, short: 5, long: 30 };

    /**
     * カスタムボタン定義
     * @description プレイヤー下部のコントロール欄に追加するボタンの定義
     * @static
     */
    static CUSTOM_BUTTON = {
        // 動画を15秒戻す
        SEEK_BACKWARD: {
            ATTRIBUTES: {
                id:     'm424-seek-backward-button',
                title:  '15秒戻る',
                opacity: 1,
            },
            SVG_OPTIONS: {
                version:    '1.1',
                height:     '100%',
                width:      '100%',
                viewBox:    '0 0 16 16',
            },
            PATH_OPTIONS: {
                fill:   '#eee',
                d:      'm8 8 7 4V4zM1 8l7 4V4z',
            },
        },
        // 動画を15秒進める
        SEEK_FORWARD: {
            ATTRIBUTES: {
                id:     'm424-seek-forward-button',
                title:  '15秒進む',
                opacity: 1,
            },
            SVG_OPTIONS: {
                version:    '1.1',
                height:     '100%',
                width:      '100%',
                viewBox:    '0 0 16 16',
            },
            PATH_OPTIONS: {
                fill:   '#eee',
                d:      'M7.875 8 .938 12V4C.875 4 7.875 8 7.875 8zm7 0-7 4V4z',
            },
        },
        // コメントの再読込
        RELOAD_COMMENT: {
            ATTRIBUTES: {
                id:     'm424-reload-comment-button',
                title:  'コメント再読込',
                opacity: 1,
            },
            SVG_OPTIONS: {
                version:    '1.1',
                height:     '100%',
                width:      '100%',
                viewBox:    '-2 0 20 14',
            },
            PATH_OPTIONS: {
                fill:   '#eee',
                d:      'M1.5 1h13l.5.5v10l-.5.5H7.71l-2.86 2.85L4 14.5V12H1.5l-.5-.5v-10l.5-.5Zm6 10H14V2H2v9h2.5l.5.5v1.79l2.15-2.14.35-.15ZM13 4H3v1h10V4ZM3 6h10v1H3V6Zm7 2H3v1h7V8Z',
            },
        },
    };

    /**
     * スタイルの定義
     * @static
     */
    static CSS_RULES = {
        /**
         * 動画プレイヤー内に追加したボタンのツールチップ
         */
        VIDEO_PLAYER_BUTTON_TOOLTIP: `.${M424.YT.CLASS.M424_YTP_BUTTON_TOOLTIP} {
            font-size: 13px !important;
            font-weight: 500 !important;
            line-height: 15px !important;
            position: fixed !important;
            transform: translate(-50%, -150%) !important;
            pointer-events: none !important;
            color: rgb(238, 238, 238) !important;
            background-color: rgba(28, 28, 28, 0.9) !important;
            text-shadow: rgba(0, 0, 0, 0.5) 0px 0px 2px !important;
            padding: 5px 9px;
            border-radius: 2px !important;
        }`,
    };

    /**
     * ページ情報
     * @type {Object}
     * @private
     */
    #pageInfo = {};

    /**
     * 動画情報
     * @type {Object}
     * @private
     */
    #videoInfo = {};

    /**
     * Element情報
     * @type {Object}
     * @private
     */
    elements = {};

    /**
     * コンストラクタ
     * @constructor
     * @param {string} [scriptId='YT.Player'] - スクリプトID
     * @param {Boolean} [isDebugMode=false] - デバックログを出力するか
     */
    constructor(scriptId='YT.Player', isDebugMode=false) {
        super(scriptId, isDebugMode);
        this.#initialize();
    }

    /**
     * 初期化処理
     * @private
     */
    #initialize() {
        // ページ遷移時に現在のページ情報を更新する
        document.addEventListener(M424.YT.EVENT.YT_PAGE_DATA_UPDATED, async () => {
            await this.onPageDataUpdated();
        });
    }

    /**
     * yt-page-data-updated イベントが発生した際に呼び出されるコールバック関数です。
     * @description Youtube内でのページ遷移時に実行されるイベントです。
     * @async
     */
    async onPageDataUpdated() {
        // 現在のページ情報を更新
        await this.#updatePageInfo();
        // ページの表示を更新
        this.#updatePageDisplay();
    }

    /**
     * 現在のページの表示を更新します。
     * @private
     */
    #updatePageDisplay() {
        this.updateEntirePageDisplay();    // 全体
        this.updateVideoPageDisplay();     // 動画
    }

    /**
     * ページ全体の表示に関する更新処理
     */
    updateEntirePageDisplay() {
        // 継承先に処理を委譲します
    }

    /**
     * 動画ページに関する更新処理
     */
    updateVideoPageDisplay() {
        // 継承先に処理を委譲します
    }

    /**
     * 現在のページ情報を更新します。
     * @async
     * @private
     */
    async #updatePageInfo() {
        this.#pageInfo.pageType = M424.YT.getCurrentPageType(); // 現ページタイプの取得
        this.#pageInfo.urlParams = M424.Util.getURLParams();    // URLパラメータの取得
        await this.#updateVideoInfo();                          // 動画情報の更新
        this.elements = await this.#getPageElements();         // DOM情報の取得
    }

    /**
     * 動画情報を取得/更新する
     * @private
     * @async
     */
    async #updateVideoInfo() {
        try {
            // 動画ページでなければ、情報を初期化して終了
            if( !this.isVideoPage() ) {
                this.debug(`[YT.Player::updateVideoInfo] 動画ページではない`);
                this.#videoInfo = {};
                return;
            }

            const videoInfo = await M424.YT.getVideoInfo();
            this.#videoInfo.id          = this.#pageInfo.urlParams.v;
            this.#videoInfo.title       = videoInfo.name;
            this.#videoInfo.description = videoInfo.description;
            this.#videoInfo.author      = videoInfo.author;
            this.#videoInfo.genre       = videoInfo.genre;
            this.#videoInfo.embedUrl    = videoInfo.embedUrl;
            this.#videoInfo.duration    = videoInfo.duration;
            this.#videoInfo.status      = videoInfo.status;
            this.#videoInfo.uploadDate  = videoInfo.uploadDate;
            this.debug(`[YT.Player::updateVideoInfo] 動画情報:`, this.#videoInfo);
        } catch(e) {
            console.error(e);
        }
    }

    /**
     * 現在のページのElement情報を取得する
     * @returns {Promise<Object>} Element情報オブジェクト
     * @async
     * @private
     */
    async #getPageElements() {
        const { SELECTOR } = M424.YT;
        const elems = {};

        try {
            elems.ytdApp    = await M424.DOM.waitForSelector(SELECTOR.YTD_APP);
            elems.searchBox = await M424.DOM.waitForSelector(SELECTOR.SEARCH_BOX);

            if( this.isVideoPage() ) {
                elems.player            = await M424.DOM.waitForSelector(SELECTOR.YTD_APP);
                elems.video             = await M424.DOM.waitForSelector(SELECTOR.VIDEO_STREAM);
                elems.ytpLControls      = await M424.DOM.waitForSelector(SELECTOR.PLAYER_LEFT_CTRLS);
                elems.ytpRControls      = await M424.DOM.waitForSelector(SELECTOR.PLAYER_RIGHT_CTRLS);
                elems.ytpSettingsButton = await M424.DOM.waitForSelector(SELECTOR.PLAYER_SETTINGS_BUTTON);

                if( this.isStreaming() ) {
                    const chatContainer = await M424.DOM.waitForSelector(SELECTOR.CHAT_CONTAINER);
                    try {
                        elems.chatFrame = await M424.DOM.waitForSelector(SELECTOR.CHAT_FRAME, chatContainer, 500);
                    } catch(e) {
                        this.debug(`[YT.Player::getPageElements] チャットリプレイができていないため、チャット欄が取得できませんでした.(処理自体に問題はありません)`);
                    }
                }
            }
        } catch(e) {
            this.error(e);
        }
        return elems;
    }

    /**
     * 現在、動画ページであるかを判定する
     * @returns {boolean} true:動画ページである
     */
    isVideoPage() {
        return this.#pageInfo.pageType === M424.YT.STATUS.PAGE.VIDEO;
    }

    /**
     * 動画が配信(アーカイブ含む)であるか判定する
     * @returns {boolean} true: 生配信中 or 配信アーカイブ
     */
    isStreaming() {
        return this.isVideoPage() && this.#videoInfo.status !== M424.YT.STATUS.STREAMING.VIDEO;
    }

    /**
     * 動画を指定秒シークする
     * @param {number} sec - シークする秒数
     */
    seekVideo(sec) {
        if( !this.isVideoPage() ) return;

        const current_sec = this.elements.video.currentTime;
        const duration_sec = this.elements.video.duration;
        if( !current_sec || !duration_sec ) {
            this.error('[YT.Player::seekVideo] 動画情報が取得できませんでした.');
        }
        // 動画が終点(シーク可能範囲が0.1秒未満)で+シーク or 始点で-シークなら処理しない
        if( (sec > 0 && duration_sec - current_sec < 0.1) || (sec < 0 && current_sec < 0.1) ) {
            return;
        }
        const postSeekTime_sec = Math.min( duration_sec, Math.max(0, current_sec + sec) );
        this.elements.video.currentTime = postSeekTime_sec;
        this.debug(`[YT.Player::seekVideo] ${Math.ceil(postSeekTime_sec - current_sec)}秒シークしました. [${M424.DateTime.secondsToHMS(~~postSeekTime_sec)} / ${M424.DateTime.secondsToHMS(~~duration_sec)}]`);
    }

    /**
     * コメントを再読込します。
     * @description
     *   - コメント欄上部の現在選択されているメニューを押して再読込する[上位チャット/チャット(のリプレイ)]
     *   - コメント欄が非表示状態なら、表示を試みる
     * @async
     */
    async reloadComment() {
        if( !this.isVideoPage() || !this.isStreaming() ) return;

        const selector = '#live-chat-view-selector-sub-menu #menu a.iron-selected';
        const chatDocument = this.elements.chatFrame.contentDocument;
        let selectedChatMenu = chatDocument.querySelector(selector);
        // 配信/アーカイヴなのにコメント欄が取得できない場合は非表示状態なので、表示を試みる
        if( !selectedChatMenu ) {
            this.showComment();
            // 切替えてから表示されるまでに時間がかかるので、読み込まれるまで待つ
            selectedChatMenu = await M424.DOM.waitForSelector(selector, chatDocument);
            if( !selectedChatMenu ) {
                console.error(`[YT.Player::reloadComment] コメント欄が非表示のため、表示を試みましたが失敗しました.`);
                return;
            }
        }
        selectedChatMenu?.click();
    }

    /**
     * 非表示状態のコメント欄を表示する
     * @description [チャット(のリプレイ)を表示]を押しているだけ
     */
    showComment() {
        if( !this.isVideoPage() || !this.isStreaming() ) return;

        const selector = '#show-hide-button button:not([aria-label*="非"])';
        const chatShowutton = document.querySelector(selector);
        chatShowutton?.click();
    }

    /**
     * シークボタンを動画プレイヤーに追加します
     */
    addSeekButton() {
        if( !this.isVideoPage() ) return;

        // 挿入位置: 右コントロールの設定(⚙)ボタンの左
        const insertPlace = {
            parentElement:    this.elements.ytpRControls,
            referenceElement: this.elements.ytpSettingsButton,
        };

        // シークボタン追加
        const { SEEK_BACKWARD, SEEK_FORWARD } = M424.YT.Player.CUSTOM_BUTTON;
        this.#addButton(
            SEEK_BACKWARD.ATTRIBUTES,
            SEEK_BACKWARD.SVG_OPTIONS,
            SEEK_BACKWARD.PATH_OPTIONS,
            insertPlace,
            () => this.seekVideo(-M424.YT.Player.SEEK_TIME.default)
        );
        this.#addButton(
            SEEK_FORWARD.ATTRIBUTES,
            SEEK_FORWARD.SVG_OPTIONS,
            SEEK_FORWARD.PATH_OPTIONS,
            insertPlace,
            () => this.seekVideo(M424.YT.Player.SEEK_TIME.default)
        );
    }

    /**
     * コメント再読込ボタンを動画プレイヤーに追加します
     */
    addReloadCommentButton() {
        if( !this.isVideoPage() || !this.isStreaming() ) return;

        // 挿入位置: 右コントロールの設定(⚙)ボタンの左
        const insertPlace = {
            parentElement:    this.elements.ytpRControls,
            referenceElement: this.elements.ytpSettingsButton,
        };

        // コメント再読込ボタン追加
        const { ATTRIBUTES, SVG_OPTIONS, PATH_OPTIONS } = M424.YT.Player.CUSTOM_BUTTON.RELOAD_COMMENT;
        const onClick = async () => await this.reloadComment();
        this.#addButton(ATTRIBUTES, SVG_OPTIONS, PATH_OPTIONS, insertPlace, onClick);
    }

    /**
     * 動画プレイヤーにカスタムボタンを追加します。
     * @param {Object} buttonOptions - ボタンオプション
     * @param {string} [buttonOptions.title='MyButton'] - ボタンのツールチップ表示名
     * @param {string} [buttonOptions.id=''] - ボタンのID
     * @param {Object} svgOptions - svgタグに設定する属性値(連想配列)
     * @param {Object} pathOptions - pathタグに設定する属性値(連想配列)
     * @param {Object} insertPlace - ボタンの挿入場所
     * @param {Element} [insertPlace.parentElement=ytpRControls] - ボタンの親要素(初期値:右コントロール)
     * @param {Element} [insertPlace.referenceElement=null] - ボタンの挿入位置(初期値:末尾)
     * @param {Function} onClick - ボタンがクリックされた際の処理
     * @private
     */
    #addButton(buttonOptions, svgOptions, pathOptions, insertPlace, onClick) {
        if( !this.isVideoPage() ) return;

        // 既にボタンが追加済なら処理を終了する
        const buttonSelector = buttonOptions?.id ? `#${buttonOptions.id}` : `[data-title='${buttonOptions?.title}']`;
        if( this.elements.player.querySelector(buttonSelector) ) {
            this.debug(`[YT.Player::addButton] ボタン追加済みのため、処理を終了する: ${buttonSelector}`);
            return;
        }

        // カスタムボタンを生成
        const button = this.#generateVideoPlayerButton({
            title:      buttonOptions?.title || 'MyButton',
            id:         buttonOptions?.id || '',
            child:      M424.DOM.createSvg(svgOptions, pathOptions),
            onclick:    onClick || null,
        });

        // ボタンを配置
        const parentElem = insertPlace?.parentElement || this.elements.ytpRControls;
        const referenceElem = insertPlace?.referenceElement || null;
        parentElem.insertBefore(button, referenceElem);
    }

    /**
     * 動画プレイヤー内にカスタムボタンを生成します。
     * @param {Object} options - オプション
     * @param {string} [options.title='MyButton'] - ツールチップ表示名
     * @param {string} [options.id=''] - ボタンのID
     * @param {Element} [options.child] - ボタンの子要素
     * @param {Function} [options.onclick] - ボタンのクリックイベント
     * @returns {HTMLButtonElement} カスタムボタン
     * @private
     */
    #generateVideoPlayerButton(options) {
        if( !this.isVideoPage() ) return;

        const { YTP_BUTTON, M424_YTP_BUTTON, M424_YTP_BUTTON_TOOLTIP } = M424.YT.CLASS;
        const { CLICK, MOUSE_OVER, MOUSE_LEAVE } = M424.Mouse.EVENT_NAMES;
        const title = options?.title || 'MyButton';

        const button = document.createElement('button');
        button.classList.add(YTP_BUTTON, M424_YTP_BUTTON);
        button.dataset.title = title;
        button.id = options?.id || '';
        if( options?.child ) button.appendChild(options.child);
        if( options?.onclick ) button.addEventListener(CLICK, options.onclick);

        // マウスオーバー時、ツールチップを表示するイベントを追加する
        button.addEventListener(MOUSE_OVER, () => {
            const rect = button.getBoundingClientRect();

            const tooltip = document.createElement('div');
            tooltip.classList.add(M424_YTP_BUTTON_TOOLTIP);
            tooltip.textContent = title;
            tooltip.style.display = 'inline';
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 1}px`;

            const mouseleaveEvent = () => {
                tooltip.remove();
                button.removeEventListener(MOUSE_LEAVE, mouseleaveEvent);
            };
            button.addEventListener(MOUSE_LEAVE, mouseleaveEvent);
            document.body.appendChild(tooltip);
        });
        return button;
    }

    /**
     * 動画プレイヤー内のカスタムボタンのツールチップに関するCSSを定義する
     *  - 既に定義済の場合は処理をスキップする
     */
    defineVideoPlayerButtonTooltipCSS() {
        const { M424_STYLE_TOOLTIP } = M424.YT.CLASS;
        const styleTag = 'style';
        const target = document.head.querySelector(`${styleTag}.${M424_STYLE_TOOLTIP}`);
        if( target ) return; // 既に定義済

        const cssElem = document.createElement(styleTag);
        cssElem.classList.add(M424_STYLE_TOOLTIP);
        cssElem.setAttribute('type', 'text/css');
        cssElem.textContent = M424.YT.Player.CSS_RULES.VIDEO_PLAYER_BUTTON_TOOLTIP;
        document.head.appendChild(cssElem);
    }
};