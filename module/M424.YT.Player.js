// ==UserScript==
// @name         M424.YT.Player
// @namespace    M424.YT.Player
// @version      0.1.6
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
 * @description
 * - 現ページ及び動画の情報を取得する処理
 * - ユーザ指定のシーク処理
 * - プレイヤーコントロールにカスタムボタンを追加する処理
 * - 生放送/アーカイブのコメント欄を表示及び情報の再取得する処理
 * @class
 */
M424.YT.Player = class Player extends M424.Base {

    /**
     * シーク時間定義
     * @static
     */
    static SEEK_TIME = { DEFAULT: 5, SEC_15: 15, SEC_30: 30, SEC_60: 60 };
    /**
     * カスタムボタン定義
     * @description プレイヤー下部のコントロール欄に追加するボタンの定義
     * @static
     */
    static CUSTOM_BUTTON = {
        // 15秒巻き戻す
        SEEK_REWIND_15: {
            ATTRIBUTES: {
                id:                 'm424-rewind15-btn',
                title:              '15秒戻る',
                opacity:            '1',
            },
            SVG_ATTRIBUTES: {
                viewBox:            '0 0 24 24',
                fill:               'none',
                stroke:             'currentColor',
                stroke_width:       '2',
                stroke_linecap:     'round',
                stroke_linejoin:    'round',
            },
            PATH_ATTRIBUTES: [
                {
                    d:              'M0 0h24v24H0z',
                    stroke:         'none',
                },
                {
                    d:              'M8 20h2a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H8v-3h3M15 18a6 6 0 1 0 0-12H4M5 14v6',
                },
                {
                    d:              'M7 9 4 6l3-3',
                },
            ],
        },
        // 30秒巻き戻す
        SEEK_REWIND_30: {
            ATTRIBUTES: {
                id:                 'm424-rewind30-btn',
                title:              '30秒戻る',
                opacity:            '1',
            },
            SVG_ATTRIBUTES: {
                viewBox:            '0 0 24 24',
                fill:               'none',
                stroke:             'currentColor',
                stroke_width:       '2',
                stroke_linecap:     'round',
                stroke_linejoin:    'round',
            },
            PATH_ATTRIBUTES: [
                {
                    d:              'M0 0h24v24H0z',
                    stroke:         'none',
                },
                {
                    d:              'M19 16a6 6 0 0 0-4-10H4M12 16v3a2 2 0 0 0 3 0v-3a2 2 0 0 0-3 0zM6 14h2a2 2 0 0 1 0 3H7h1a2 2 0 0 1 0 3H6',
                },
                {
                    d:              'M7 9 4 6l3-3',
                },
            ],
        },
        // 60秒巻き戻す
        SEEK_REWIND_60: {
            ATTRIBUTES: {
                id:                 'm424-rewind60-btn',
                title:              '60秒戻る',
                opacity:            '1',
            },
            SVG_ATTRIBUTES: {
                viewBox:            '0 0 24 24',
                fill:               'none',
                stroke:             'currentColor',
                stroke_width:       '2',
                stroke_linecap:     'round',
                stroke_linejoin:    'round',
            },
            PATH_ATTRIBUTES: [
                {
                    d:              'M0 0h24v24H0z',
                    stroke:         'none',
                },
                {
                    d:              'M19 16a6 6 0 0 0-4-10H4',
                },
                {
                    d:              'M7 9 4 6l3-3M12 16v3a2 2 0 0 0 3 0v-3a2 2 0 0 0-3 0zM9 14H7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H6',
                },
            ],
        },
        // 15秒進む
        SEEK_FORWARD_15: {
            ATTRIBUTES: {
                id:                 'm424-forward15-btn',
                title:              '15秒進む',
                opacity:            '1',
            },
            SVG_ATTRIBUTES: {
                viewBox:            '0 0 24 24',
                fill:               'none',
                stroke:             'currentColor',
                stroke_width:       '2',
                stroke_linecap:     'round',
                stroke_linejoin:    'round',
            },
            PATH_ATTRIBUTES: [
                {
                    d:              'M0 0h24v24H0z',
                    stroke:         'none',
                },
                {
                    d:              'm17 9 3-3-3-3',
                },
                {
                    d:              'M9 18A6 6 0 1 1 9 6h11m-4 14h2a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-2v-3h3m-6 0v6',
                },
            ],
        },
        // 30秒進む
        SEEK_FORWARD_30: {
            ATTRIBUTES: {
                id:                 'm424-forward30-btn',
                title:              '30秒進む',
                opacity:            '1',
            },
            SVG_ATTRIBUTES: {
                viewBox:            '0 0 24 24',
                fill:               'none',
                stroke:             'currentColor',
                stroke_width:       '2',
                stroke_linecap:     'round',
                stroke_linejoin:    'round',
            },
            PATH_ATTRIBUTES: [
                {
                    d:              'M0 0h24v24H0z',
                    stroke:         'none',
                },
                {
                    d:              'M5.007 16.478A6 6 0 0 1 9 6h11m-5 9.5v3a1.5 1.5 0 0 0 3 0v-3a1.5 1.5 0 0 0-3 0z',
                },
                {
                    d:              'm17 9 3-3-3-3M9 14h1.5a1.5 1.5 0 0 1 0 3H10h.5a1.5 1.5 0 0 1 0 3H9',
                },
            ],
        },
        // 60秒進む
        SEEK_FORWARD_60: {
            ATTRIBUTES: {
                id:                 'm424-forward60-btn',
                title:              '60秒進む',
                opacity:            '1',
            },
            SVG_ATTRIBUTES: {
                viewBox:            '0 0 24 24',
                fill:               'none',
                stroke:             'currentColor',
                stroke_width:       '2',
                stroke_linecap:     'round',
                stroke_linejoin:    'round',
            },
            PATH_ATTRIBUTES: [
                {
                    d:              'M0 0h24v24H0z',
                    stroke:         'none',
                },
                {
                    d:              'M5.007 16.478A6 6 0 0 1 9 6h11m-5 9.5v3a1.5 1.5 0 0 0 3 0v-3a1.5 1.5 0 0 0-3 0z',
                },
                {
                    d:              'm17 9 3-3-3-3m-5 11h-2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H9',
                },
            ],
        },

        // コメントの再読込
        RELOAD_COMMENT: {
            ATTRIBUTES: {
                id:     'm424-reload-comment-btn',
                title:  'コメント再読込',
                opacity: 1,
            },
            SVG_ATTRIBUTES: {
                version:    '1.1',
                height:     '100%',
                width:      '100%',
                viewBox:    '-2 0 20 14',
            },
            PATH_ATTRIBUTES: [{
                fill:   '#eee',
                d:      'M1.5 1h13l.5.5v10l-.5.5H7.71l-2.86 2.85L4 14.5V12H1.5l-.5-.5v-10l.5-.5Zm6 10H14V2H2v9h2.5l.5.5v1.79l2.15-2.14.35-.15ZM13 4H3v1h10V4ZM3 6h10v1H3V6Zm7 2H3v1h7V8Z',
            }],
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
     * @async
     */
    async seekVideo(sec) {
        if( !this.isVideoPage() ) return;

        const current_sec = this.elements.video.currentTime;
        const duration_sec = this.elements.video.duration;
        if( !current_sec || !duration_sec ) {
            // セレクタ情報の再取得処理を追加
            if( document.querySelector(M424.YT.VIDEO_STREAM) ) {
                this.elements = await this.#getPageElements();
                this.log(`[YT.Player::seekVideo] セレクタ情報を再取得しました`);
            } else {
                this.error('[YT.Player::seekVideo] 動画情報が取得できませんでした.');
            }
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

        const selector = `${M424.YT.SELECTOR.CHAT_CONTAINER}[collapsed] #show-hide-button button`;
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
        const { SEEK_REWIND_15, SEEK_REWIND_30, SEEK_REWIND_60, SEEK_FORWARD_15, SEEK_FORWARD_30, SEEK_FORWARD_60 } = M424.YT.Player.CUSTOM_BUTTON;
        this.#addButton(
            SEEK_REWIND_60.ATTRIBUTES,
            SEEK_REWIND_60.SVG_ATTRIBUTES,
            SEEK_REWIND_60.PATH_ATTRIBUTES,
            insertPlace,
            async () => this.seekVideo(-M424.YT.Player.SEEK_TIME.SEC_60)
        );
        this.#addButton(
            SEEK_REWIND_30.ATTRIBUTES,
            SEEK_REWIND_30.SVG_ATTRIBUTES,
            SEEK_REWIND_30.PATH_ATTRIBUTES,
            insertPlace,
            async () => this.seekVideo(-M424.YT.Player.SEEK_TIME.SEC_30)
        );
        this.#addButton(
            SEEK_REWIND_15.ATTRIBUTES,
            SEEK_REWIND_15.SVG_ATTRIBUTES,
            SEEK_REWIND_15.PATH_ATTRIBUTES,
            insertPlace,
            async () => this.seekVideo(-M424.YT.Player.SEEK_TIME.SEC_15)
        );
        this.#addButton(
            SEEK_FORWARD_15.ATTRIBUTES,
            SEEK_FORWARD_15.SVG_ATTRIBUTES,
            SEEK_FORWARD_15.PATH_ATTRIBUTES,
            insertPlace,
            async () => this.seekVideo(M424.YT.Player.SEEK_TIME.SEC_15)
        );
        this.#addButton(
            SEEK_FORWARD_30.ATTRIBUTES,
            SEEK_FORWARD_30.SVG_ATTRIBUTES,
            SEEK_FORWARD_30.PATH_ATTRIBUTES,
            insertPlace,
            async () => this.seekVideo(M424.YT.Player.SEEK_TIME.SEC_30)
        );
        this.#addButton(
            SEEK_FORWARD_60.ATTRIBUTES,
            SEEK_FORWARD_60.SVG_ATTRIBUTES,
            SEEK_FORWARD_60.PATH_ATTRIBUTES,
            insertPlace,
            async () => this.seekVideo(M424.YT.Player.SEEK_TIME.SEC_60)
        );
/*
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
*/
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
        const { ATTRIBUTES, SVG_ATTRIBUTES, PATH_ATTRIBUTES } = M424.YT.Player.CUSTOM_BUTTON.RELOAD_COMMENT;
        const onClick = async () => await this.reloadComment();
        this.#addButton(ATTRIBUTES, SVG_ATTRIBUTES, PATH_ATTRIBUTES, insertPlace, onClick);
    }

    /**
     * 動画プレイヤーにカスタムボタンを追加します。
     * @param {Object} btnAttributes - ボタンオプション
     * @param {string} [buttonOptions.title='MyButton'] - ボタンのツールチップ表示名
     * @param {string} [buttonOptions.id=''] - ボタンのID
     * @param {Object} svgAttributes - svgタグに設定する属性値(連想配列)
     * @param {Object} pathAttributes - pathタグに設定する属性値(連想配列)が格納された配列
     * @param {Object} insertPlace - ボタンの挿入場所
     * @param {Element} [insertPlace.parentElement=ytpRControls] - ボタンの親要素(初期値:右コントロール)
     * @param {Element} [insertPlace.referenceElement=null] - ボタンの挿入位置(初期値:末尾)
     * @param {Function} onClick - ボタンがクリックされた際の処理
     * @private
     */
    #addButton(btnAttributes, svgAttributes, pathAttributes, insertPlace, onClick) {
        if( !this.isVideoPage() ) return;

        // 既にボタンが追加済なら処理を終了する
        const buttonSelector = btnAttributes?.id ? `#${btnAttributes.id}` : `[data-title='${btnAttributes?.title}']`;
        if( this.elements.player.querySelector(buttonSelector) ) {
            this.debug(`[YT.Player::addButton] ボタン追加済みのため、処理を終了する: ${buttonSelector}`);
            return;
        }

        // カスタムボタンを生成
        const button = this.#generateVideoPlayerButton({
            title:      btnAttributes?.title || 'MyButton',
            id:         btnAttributes?.id || '',
            child:      M424.DOM.createSvg(svgAttributes, pathAttributes),
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