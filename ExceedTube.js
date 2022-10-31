// ==UserScript==
// @name         ExceedTube
// @namespace    M424
// @version      0.4
// @description  Youtube関連スクリプト群 - Youtube Custom Script
// @author       M424
// ==/UserScript==

/**
 * 読込元のスクリプトに以下の定義を追加してください。
 */
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/M424Common.js
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/LazyFunctionExecutor.js

/**
 * Youtube カスタムクラス
 * - 機能
 *      - 動画プレイヤー内にシークボタンの設置(default:15sec)
 *      - 矢印キー(←, →)によるシーク時間の変更(5sec -> 15sec)
 *      - 修飾キー+矢印キー(←, →)によるシーク(shift:30sec, ctrl:60sec)
 *      - Alt+矢印キー(←, →)時のシークの無効化(ブラウザの戻る/進むを優先)
 *      - 動画ページではヘッダーを隠す(ホバーで表示)
 * @class ExceedTube
 */
 class ExceedTube extends M424Base {

    /**
     * ユーザ設定
     * @type {object}
     */
     #settings = {
        // プレイヤー情報
        player: {
            // シークボタンの表示可否
            show_seek_backward_button: true,
            show_seek_forward_button:  true,
            // コメント再読込ボタンの表示可否
            show_reload_comment_button:  true,
        },

        // マストヘッド
        masthead: {
            // 動画ページ内での動作について
            video_page: {
                hide_display:                   true,   // 表示を隠すか
                show_interval_when_scrolling:   -1,     // スクロールしてから表示するまでの時間(マイナスで表示しない)
                show_interval_when_hover:       250,    // ホバーしてから表示するまでの時間
                hide_interval_when_blur:        250,    // ブラー(マウスが範囲外)してから隠すまでの時間
            },
        },
    };

    /**
     * [Consts] Element属性
     */
    static Attributes = class {
        static Style = class {
            static GUIDE_WIDTH            = '--app-drawer-width';
            static MINI_GUIDE_WIDTH       = '--ytd-mini-guide-width';
            static MASTHEAD_HEIGHT        = '--ytd-masthead-height';

            static THUMBNAIL_WIDTH        = '--m424-subscriptions-thumbnail-width';
            static THUMBNAIL_HEIGHT       = '--m424-subscriptions-thumbnail-height';
        };
        static Class = class {
            static TOOLTIP_STYLE          = 'm424-style-tooltip';             // ツールチップ用CSS
            static PLAYER_BUTTON          = 'm424-player-button';             // プレイヤー内ボタン
            static PLAYER_BUTTON_TOOLTIP  = 'm424-player-button--tooltip';    // プレイヤー内ボタン用ツールチップ
        };
        static ID = class {
            static SVG_DEFS               = 'm424-svg-defs';                  // SVG画像の定義
            static SEEK_BACKWARD_BUTTON   = 'm424-seek-backward-button';      // シークボタン(戻る)
            static SEEK_FORWARD_BUTTON    = 'm424-seek-forward-button';       // シークボタン(進む)
            static RELOAD_COMMENT_BUTTON  = 'm424-reload-comment-button';     // コメント再読込
        };
        static Title = class {
            static SEEK_BACKWARD_BUTTON   = '15秒戻る';                       // シークボタン(戻る)
            static SEEK_FORWARD_BUTTON    = '15秒進む';                       // シークボタン(進む)
            static RELOAD_COMMENT_BUTTON  = 'コメント再読込';                 // コメント再読込
        };
    }

    static Status = class {
        // 配信形態
        static get STREAMING() {
            return {
                LIVE:    'live',        // 生配信中
                ARCHIVE: 'archive',     // アーカイブ
                VIDEO:   'video',       // 動画
            };
        };
        // ページタイプ
        static get PAGE() {
            return {
                HOME:           'home',             // ホーム
                VIDEO:          'video',            // 動画
                SHORTS:         'shorts',           // ショート
                SUBSCRIPTIONS:  'subscriptions',    // 登録チャンネル
                CHANNELS:       'channels',         // ユーザーチャンネル
                HISTORY:        'history',          // 履歴
                PLAYLIST:       'playlist',         // プレイリスト
                OTHER:          'other',            // その他
            }
        }
    };

    /**
     * [Consts] イベント
     */
    static Events = class {
        // [CustomEvent] 独自定義のEvent名(document.addEventListenerからメソッド定義できる)
        static PAGE_UPDATED = 'exceedtube-page-updated';    // ページ更新イベント

        // [LazyFunction] 遅延実行可能なEvent関数名
        static SHOW_MASTHEAD = 'show-masthead';     // マストヘッドの表示処理
        static HIDE_MASTHEAD = 'hide-masthead';     // マストヘッドの非表示処理
    }

    /**
     * [Consts] セレクタ
     */
    static Selector = class {
        static VIDEO                    = 'video.video-stream.html5-main-video';    // HTML5 ビデオ
        static PLAYER                   = '#movie_player';                          // Youtubeプレイヤー
        static PLAYER_LEFT_CONTROLS     = '.ytp-left-controls';                     // Youtubeプレイヤー 左側コントロール
        static PLAYER_RIGHT_CONTROLS    = '.ytp-right-controls';                    // Youtubeプレイヤー 右側コントロール
        static PLAYER_THUMBNAIL         = '.ytp-cued-thumbnail-overlay-image';      // サムネイル
        static PLAYER_SETTINGS_BUTTON   = '.ytp-settings-button'                    // 設定ボタン
        static PLAYER_SUBTITLES_BUTTON  = '.ytp-subtitles-button';                  // 字幕ボタン
        static COMMENT_FRAME            = 'iframe#chatframe';                       // コメント欄
        static YTD_APP                  = 'ytd-app';
        static MASTHEAD                 = 'ytd-masthead#masthead';
        static GUIDE                    = 'tp-yt-app-drawer#guide #contentContainer';
        static MINI_GUIDE               = 'ytd-mini-guide-renderer.ytd-app';
        static MINIPLAYER               = 'ytd-miniplayer.ytd-app';
        static PAGE_MANAGER             = 'ytd-page-manager#page-manager';
        static BROWSE                   = ':is(ytd-watch-flexy, ytd-browse)[role=main]';
        static PRIMARY                  = 'ytd-watch-flexy #primary';
        static SECONDARY                = 'ytd-watch-flexy #secondary';
        static TWO_COLUMN_BROWSE        = 'ytd-two-column-browse-results-renderer';
    };

    /**
     * [Consts] Pathname
     */
    static Pathname = class {
        static HOME          = '/';                     // ホーム
        static EXPLORE       = '/feed/explore';         // 探索
        static VIDEO         = '/watch'                 // 動画
        static SHORTS        = '/shorts';               // ショート
        static SUBSCRIPTIONS = '/feed/subscriptions';   // 登録チャンネル
        static CHANNELS      = '/feed/channels';        // 登録チャンネル - 管理
        static LIBRARY       = '/feed/library';         // ライブラリ
        static DOWNLOADS     = '/feed/downloads';       // オフライン
    }

    /**
     * [Consts] 正規表現
     */
    static Regex = class {
        static VIDEO_ID     = /[?&]v=([^&]+)/;
        static PLAYLIST_ID  = /[?&]list=([^&]+)/;
        static CHANNEL_ID   = /(user|channel|c)\/([0-9a-zA-Z]*)/;
        static GRID_COLUMNS = /^grid\-(?<division_number>\d)\-columns$/;
    };

    /**
     * [Consts] location.pathname 判別用
     */
    static Pathnames = [
        { name: ExceedTube.Status.PAGE.HOME,           path: '/' },                     // ホーム
        { name: ExceedTube.Status.PAGE.VIDEO,          path: '/watch' },                // 動画
        { name: ExceedTube.Status.PAGE.SHORTS,        regex: /^\/short\// },            // ショート
        { name: ExceedTube.Status.PAGE.SUBSCRIPTIONS,  path: '/feed/subscriptions' },   // 登録チャンネル
        { name: ExceedTube.Status.PAGE.CHANNELS,      regex: /^\/(user|channel|c)\// }, // ユーザーチャンネル
        { name: ExceedTube.Status.PAGE.HISTORY,        path: '/feed/history' },         // 履歴
        { name: ExceedTube.Status.PAGE.PLAYLIST,       path: '/playlist' },             // プレイリスト
        { name: ExceedTube.Status.PAGE.OTHER,         regex: /.*/ },                    // その他
    ];

    /**
     * [Consts] シーク時間定義
     */
    static SEEK_TIME = { normal: 15, shift: 30, ctrl: 60 };

    /**
     * [Consts] SVG画像オブジェクト定義
     */
    static SVG = class {
        static ATTRIBUTES = {
            version:    '1,1',
            height:     '100%',
            width:      '100%',
            viewBox:    '0 0 16 16',
        };
        static SEEK_BACKWARD = {
            ATTRIBUTES: {
                id:     ExceedTube.Attributes.ID.SEEK_BACKWARD_BUTTON,
                title:  ExceedTube.Attributes.Title.SEEK_BACKWARD_BUTTON,
            },
            PATH: {
                fill:   '#eee',
                d:      'm8 8 7 4V4zM1 8l7 4V4z',
            },
        };
        static SEEK_FORWARD = {
            ATTRIBUTES: {
                id:     ExceedTube.Attributes.ID.SEEK_FORWARD_BUTTON,
                title:  ExceedTube.Attributes.Title.SEEK_FORWARD_BUTTON,
            },
            PATH: {
                fill:   '#eee',
                d:      'M7.875 8 .938 12V4C.875 4 7.875 8 7.875 8zm7 0-7 4V4z',
            },
        };
        static RELOAD_COMMENT = {
            ATTRIBUTES: {
                id:     ExceedTube.Attributes.ID.RELOAD_COMMENT_BUTTON,
                title:  ExceedTube.Attributes.Title.RELOAD_COMMENT_BUTTON,
            },
            PATH: {
                fill:   '#424242',
                d:      'M1.5 1h13l.5.5v10l-.5.5H7.71l-2.86 2.85L4 14.5V12H1.5l-.5-.5v-10l.5-.5Zm6 10H14V2H2v9h2.5l.5.5v1.79l2.15-2.14.35-.15ZM13 4H3v1h10V4ZM3 6h10v1H3V6Zm7 2H3v1h7V8Z',
            },
        };
    };

    /**
     * [Consts] CSS
     */
    static Css = class {
        static VIDEO_BUTTON_TOOLTIP = `.${ExceedTube.Attributes.Class.PLAYER_BUTTON_TOOLTIP} {
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
        }`;
    }

    /**
     * 現在のロケーション情報
     * @type {location}
     */
    #location;

    /**
     * Youtube Elementの格納場所
     * @type {object}
     */
    #elements = {};

    /**
     * 各種情報
     */
    #info = {
        width: {},
        height: {},
        page: {},   // ページ情報
        video: {},  // 動画情報
    };

    #flag = {
        // ユーザによるスクロール処理が行われたか(判定はマウスホイールによるスクロール処理で判定する)
        user_scroll: false,
    }

    /**
     * イベント管理[LazyFunctionExecutor]
     */
    #events;

    // マウス情報
    #mouse = {
        // 位置情報
        x: 0, y: 0,
    };

    /**
     * @constructor
     * @param {string} scriptId
     * @param {boolean} isDebug
     */
    constructor(scriptId, isDebug = false) {
        super(scriptId, isDebug);
        this.#initialize();
    }

    /**
     * 初期処理
     */
    #initialize() {

        this.#initializeCommon();

        // マウスに関する初期処理
        this.#initializeMouse();

        // キーボードに関する初期処理
        this.#initializeKeyboard();
    }

    /**
     * 初期処理 - 汎用
     */
    #initializeCommon() {

        // イベント管理者 - 初期化
        this.#events = new LazyFunctionExecutor(this.scriptId);

        // URL更新によるページ情報の更新処理
        document.addEventListener('yt-page-data-updated', async () => {

            // ページ情報の更新
            await this.#updatePageInfo();

            // ページ表示に関する状態の更新処理
            this.#updatePageDisplay();

            // ページ遷移に関するイベントを発行
            document.dispatchEvent( new CustomEvent(ExceedTube.Events.PAGE_UPDATED) );
        });
    }

    /**
     * マウス関連の初期実行処理
     */
    #initializeMouse() {
        // マウス位置の初期化
        this.#mouse.x = -1;
        this.#mouse.y = -1;

        // マウス関連のイベントを追加
        this.#defineMouseEvent();
    }

    /**
     * キーボード関連の初期実行処理
     */
    #initializeKeyboard() {
        // キーボード関連のイベントを追加
        this.#defineKeyboardEvent();
    }

    /**
     * マウス情報を更新する
     */
     #updateMouse(evt) {
        this.#mouse.x = evt.clientX;
        this.#mouse.y = evt.clientY;
        //this.debug(`mouse[${this.#mouse.x}, ${this.#mouse.y}]`);
    }

    /**
     * ページの表示に関する更新処理
     */
     #updatePageDisplay() {

        // ページ全体の表示に関する更新処理
        this.#updatePageDisplayGlobal();

        // 動画ページの表示に関する更新処理
        this.#updateVideoPageDisplay();
    }

    /**
     * ページ全体の表示に関する更新処理
     */
    #updatePageDisplayGlobal() {

        // マストヘッドの表示を切り替える
        this.#toggleMastheadDisplay();

    }

    /**
     * 動画ページに関する更新処理
     */
    #updateVideoPageDisplay() {

        if( !this.isVideoPage() ) {
            return;
        }

        // プレイヤーコントロールにボタン追加
        this.#toggleSeekButtonDisplay();
        this.#toggleReloadCommentButtonDisplay();
        this.#defineVideoButtonTooltipStyle();
    }

    /**
     * Youtubeページの情報更新
     *  - ページ更新のイベント発生時にページ情報を更新する
     */
    async #updatePageInfo() {

        // URL情報の更新
        this.#location = location;

        // ページの種類を更新
        this.#updatePageType();

        // 動画IDを取得/更新 - empty is null.
        this.#settings.video_id = this.#getVideoId(this.#location.href);

        // ページのElement情報を更新
        await this.#updatePageElements();

        // ページデータの更新
        await this.#updatePageData();
    }

    /**
     * [async] ページ情報を更新する
     */
    async #updatePageData() {
        const css = window.getComputedStyle(this.#elements.ytd_app);
        this.#info.width.guide      = css.getPropertyValue(ExceedTube.Attributes.Style.GUIDE_WIDTH);
        this.#info.width.mini_guide = css.getPropertyValue(ExceedTube.Attributes.Style.MINI_GUIDE_WIDTH);
        this.#info.height.masthead  = css.getPropertyValue(ExceedTube.Attributes.Style.MASTHEAD_HEIGHT);

        this.#info.width.scrollbar    = window.innerWidth - document.body.clientWidth;
        this.#info.width.page_manager = this.#elements.page_manager.clientWidth;

        // 動画情報を更新
        await this.#updateVideoInfo();
        // 登録チャンネルのページ情報を更新
        await this.#updateSubscriptionsInfo();
        this.debug(this.#info.page);

    }

    /**
     * [async] 動画ページから動画情報を取得する
     */
    async #updateVideoInfo() {

        if( !this.isVideoPage() ) {
            this.#info.video = {};
            return;
        }

        const videoInfoNode = await M424.DOM.querySelectorAsync('script#scriptTag');
        if( !videoInfoNode ) {
            throw new Error('動画情報を取得できませんでした.');
        }
        const videoInfo = JSON.parse(videoInfoNode);
        this.#info.video.title          = videoInfo.name;                       // 動画 - タイトル
        this.#info.video.description    = videoInfo.description;                // 動画 - 説明
        this.#info.video.author         = videoInfo.author;                     // チャンネル名
        this.#info.video.url            = videoInfo.embedUrl;                   // 動画 - URL
        this.#info.video.thumbnailUrl   = videoInfo.thumbnailUrl[0];            // 動画 - サムネイルURL
        this.#info.video.duration       = moment.duration(videoInfo.duration);  // 動画 - 時間 (配信中は"PT0S")
        this.#info.video.genre          = videoInfo.genre;                      // 動画 - ジャンル
        this.#info.video.status         = ExceedTube.Status.STREAMING.VIDEO;    // 配信状況(動画、アーカイブ、配信中)

        if( videoInfo.publication ) {
            this.#info.video.status = ExceedTube.Status.STREAMING.ARCHIVE;
            this.#info.video.startDate = moment(videoInfo.publication[0].startDate);
            if( videoInfo.duration !== 'PT0S') {
                this.#info.video.status = ExceedTube.Status.STREAMING.LIVE;
                this.#info.video.endDate = moment(videoInfo.publication[0].endDate);
            }
        }
        this.debug(this.#info.video);
    }

    /**
     * [async] ページのElement情報を更新する
     */
    async #updatePageElements() {

        this.#elements.ytd_app      = await M424.DOM.querySelectorAsync(ExceedTube.Selector.YTD_APP);
        this.#elements.masthead     = await M424.DOM.querySelectorAsync(ExceedTube.Selector.MASTHEAD);
        this.#elements.guide        = await M424.DOM.querySelectorAsync(ExceedTube.Selector.GUIDE);
        this.#elements.mini_guide   = await M424.DOM.querySelectorAsync(ExceedTube.Selector.MINI_GUIDE);
        this.#elements.miniplayer   = await M424.DOM.querySelectorAsync(ExceedTube.Selector.MINIPLAYER);
        this.#elements.page_manager = await M424.DOM.querySelectorAsync(ExceedTube.Selector.PAGE_MANAGER);
        this.#elements.browse       = await M424.DOM.querySelectorAsync(ExceedTube.Selector.BROWSE);

        // 動画ページに関するElement情報を更新
        if( this.isVideoPage() ) {
            this.#elements.primary                = await M424.DOM.querySelectorAsync(ExceedTube.Selector.PRIMARY);
            this.#elements.secondary              = await M424.DOM.querySelectorAsync(ExceedTube.Selector.SECONDARY);

            // 動画プレイヤー
            this.#elements.player                 = await M424.DOM.querySelectorAsync(ExceedTube.Selector.PLAYER);
            this.#elements.video                  = await M424.DOM.querySelectorAsync(ExceedTube.Selector.VIDEO);
            this.#elements.player_left_controls   = await M424.DOM.querySelectorAsync(ExceedTube.Selector.PLAYER_LEFT_CONTROLS);
            this.#elements.player_right_controls  = await M424.DOM.querySelectorAsync(ExceedTube.Selector.PLAYER_RIGHT_CONTROLS);
            this.#elements.player_settings_button = await M424.DOM.querySelectorAsync(ExceedTube.Selector.PLAYER_SETTINGS_BUTTON);

            // 配信 or アーカイブ
            if( this.isStreaming() ) {
                // コメント
                this.#elements.comment = await M424.DOM.querySelectorAsync(COMMENT_FRAME);
            }
        }
    }

    /**
     * [async] 登録チャンネルのページ情報を更新する
     */
    async #updateSubscriptionsInfo() {

        if( !this.isSubscriptionsPage() ) return;

        /**
         *  登録チャンネルの動画サムネイルサイズを更新する
         */
        // 1⃣動画コンテンツの幅・高さを取得
        const [thumbnailWidth, thumbnailHeight] = (async () => {

            const mainNode = await M424.DOM.querySelectorAsync(ExceedTube.Selector.TWO_COLUMN_BROWSE, this.#elements.browse);

            // 1行に表示するアイテム数を取得する
            const columnItem = (() => {
                let ret = 1;
                mainNode?.classList.forEach( cls => {
                    const matches = cls.match(ExceedTube.Regex.GRID_COLUMNS);
                    if( matches?.groups ) {
                        ret = parseInt(matches.groups.division_number);
                    }
                });
                return ret;
            })();

            const contentBase = Math.floor( (mainNode.clientWidth / columnItem - 16) / 16 ) ?? 13;
            if( contentBase > 18 ) { contentBase = 13; }
            return [contentBase * 16, contentBase * 9];
        })();

        // 取得したサイズをサムネイルに適用
        const thumbnail = { width: this.#info.width.thumbnail, height: this.#info.height.thumbnail };
        if( thumbnailWidth != thumbnail.width || thumbnailHeight != thumbnail.height ) {
            this.#elements.browse.style.setProperty(ExceedTube.Attributes.Style.THUMBNAIL_WIDTH,  `${thumbnailWidth}px`,  'important');
            this.#elements.browse.style.setProperty(ExceedTube.Attributes.Style.THUMBNAIL_HEIGHT, `${thumbnailHeight}px`, 'important');
            this.log("サムネイルサイズ更新!!!");
        }
    }

    /**
     * 現在のページの種類を取得/更新する
     */
     #updatePageType() {
        this.#info.page.type = ExceedTube.Pathnames.find( e => e.regex
            ? e.regex.test(this.#location.pathname)
            : e.path === this.#location.pathname
        ).name || ExceedTube.Status.PAGE.OTHER;
    }

    /**
     * 現在のページが動画ページかどうかを返す
     * @returns true: 現在のページが動画ページ
     */
    isVideoPage() {
        return ( this.#info.page.type === ExceedTube.Status.PAGE.VIDEO && this.#settings.video_id );
    }

    /**
     * 現在のページが「登録チャンネル」かどうかを返す
     * @returns true: 現在のページが「登録チャンネル」
     */
     isSubscriptionsPage() {
        return ( this.#info.page.type === ExceedTube.Status.PAGE.SUBSCRIPTIONS );
    }

    /**
     * テキスト入力欄にフォーカスしているか
     * @param {Event} evt
     * @returns true: テキスト入力欄にフォーカスしている
     */
    #isFocusTextInputField(evt) {
        const textFields = ['EMBED', 'INPUT', 'OBJECT', 'TEXTAREA', 'IFRAME'];
        return ( textFields.includes(document.activeElement.tagName) || evt.target.isContentEditable );
    }

    /**
     * ボリュームにフォーカスしているか
     * @returns true: ボリュームにフォーカスしている
     */
    #isFocusVolume() {
        return document.activeElement.classList.contains('ytp-volume-panel');
    }

    /**
     * マウスポインターがマストヘッド上に置かれているか
     * @returns true: マウスポインターがマストヘッド上に置かれている
     */
    #isHoverMasthead() {
        const windowWidth = document.documentElement.getBoundingClientRect().width;
        return ( this.#mouse.x.between(0, windowWidth, true) && this.#mouse.y.between(0, 56, true) );
    }

    /**
     * 検索欄にフォーカスが当たっているか
     * @returns true: 検索欄にフォーカスが当たっている
     */
     #isFocusSearchBox() {
        const activeElem = document.activeElement;
        return (activeElem.tagName === 'INPUT' && activeElem.id === 'search' );
    }

    /**
     * 動画が配信(アーカイブ含む)であるか判定する
     *
     * @returns {Boolean} true: 生配信中 or 配信アーカイブ
     */
    isStreaming() {
        return ( this.#info.video.status !== ExceedTube.Status.STREAMING.VIDEO );
    }

    /**
     * Y軸方向にスクロールされているか
     * @returns true: スクロールされている
     */
    #isScrollY() {
        return (window.scrollY > 1);
    }

    /**
     * マストヘッドが表示可能か
     *  - 表示条件
     *      1. not(動画ページ) ※必須条件
     *      2. and(表示するまでの時間 >= 0, Y軸のスクロール量 > 0)
     *      3. or(ヘッダ上にホバーしている, 検索欄にフォーカスしている)
     * @param {string} eventType - 実行されているEventタイプ
     * @returns true: マストヘッドが表示可能
     */
     #canShowMasthead(eventType) {
        if( !this.isVideoPage() ) {
            return true;
        }
        let ret = false;
        switch(eventType) {
            case 'mousemove':
            case 'mouseenter':
            case 'mouseleave':
            case 'focus':
            case 'blur':
                ret = ret || this.#isHoverMasthead() || this.#isFocusSearchBox();
            case 'scroll':
                ret = ret || this.#settings.masthead.video_page.show_interval_when_scrolling >= 0 && this.#isScrollY();
                break;
        }
        return ret;
    }

    /**
     * 動画IDを取得する
     *  - 動画IDが検出できない or 動画ページでなければ null を返す
     * @param {string} url
     * @returns {string} 動画ID or null
     */
    #getVideoId(url) {
        return this.#info.page.type === ExceedTube.Status.PAGE.VIDEO
            ? url.match(ExceedTube.Regex.VIDEO_ID)[1] || null
            : null
        ;
    }

    /**
     * 動画を指定秒シークする
     * @param {Number} sec
     */
    #seekVideo(sec) {
        if( !this.isVideoPage() ) {
            return;
        }
        const current_sec  = this.#elements.video.currentTime;
        const duration_sec = this.#elements.video.duration;
        if( !current_sec || !duration_sec ) {
            throw Error('[ExceedTube][seekVideo] 動画情報が取得できませんでした.');
        }
        // 動画が終点(シーク可能範囲が0.1秒未満)で+シーク or 始点で-シークなら処理しない
        if( (sec > 0 && duration_sec - current_sec < 0.1) || (sec < 0 && current_sec < 0.1) ) {
            return;
        }
        const postSeekTime_sec = Math.min( duration_sec, Math.max(0, current_sec + sec) );
        this.#elements.video.currentTime = postSeekTime_sec;
        this.debug(`${Math.ceil(postSeekTime_sec - current_sec)}sec seek. ${M424.Time.toHMS(~~postSeekTime_sec)} / ${M424.Time.toHMS(~~duration_sec)}`);
        //this.debug(`time: ${postSeekTime_sec.toFixed(3)} / ${duration_sec.toFixed(3)}`);
    }

    /**
     * マウスイベントを定義する
     */
    #defineMouseEvent() {
        const eventTypes = ['mousemove', 'mouseenter', 'mouseleave', 'scroll', 'focus', 'blur'];
        eventTypes.forEach( evType => {
            switch(evType) {
                // マウスの位置に関するイベント
                case 'mousemove': case 'mouseenter': case 'mouseleave':
                    document.addEventListener( evType, e => {
                        this.#updateMouse(e);
                        this.#toggleMastheadDisplay(evType);
                    });
                    break;
                // スクロールに関するイベント
                case 'scroll':
                    document.addEventListener( evType, e => {
                        this.#toggleMastheadDisplay(evType);
                    });
                    break;
                // 検索欄のフォーカスに関するイベント
                case 'focus': case 'blur':
                    document.querySelector('input#search').addEventListener( evType, e => {
                        this.log(evType);
                        this.#toggleMastheadDisplay(evType);
                    });
                    break;
                default:
                    throw SyntaxError(`想定外のイベントが渡されました: ${evType}`);
            }
        });
    }

    /**
     * キーボードイベントを定義する
     */
    #defineKeyboardEvent() {

        // キー入力イベント
        document.addEventListener('keydown', evt => {

            if( !this.isVideoPage() ) {
                return;
            }

            // キー入力[←, →]
            //  - 既存ショートカット(5sec seek)を削除して、新たに定義する(15sec seek)
            //  - Altキー押下時は、ブラウザの入力(forword/back)を優先する
            if( ['ArrowLeft', 'ArrowRight'].includes(evt.code) ) {
                this.debug( `キー入力: {code: ${evt.code}, shift: ${evt.shiftKey}, ctrl: ${evt.ctrlKey}, alt: ${evt.altKey}}` );

                // 特定のフォーカス時は処理しない
                if( this.#isFocusTextInputField(evt) || this.#isFocusVolume() ) {
                    this.debug( `${this.#isFocusVolume() ? "ボリューム" : "テキスト欄"}にフォーカスされているため、処理を中断しました.` );
                    return;
                }

                if( evt.altKey ) {
                    this.debug( `ブラウザ側の処理を優先するため処理を中断します. {キー入力: Alt + ${evt.code === 'ArrowLeft' ? "←" : "→"}}` );
                    evt.stopPropagation();
                    return;
                }

                // キー入力をなかったことにする
                evt.preventDefault();

                // シークする
                const seekTime_sec = (() => {
                    const sec = evt.shiftKey ? ExceedTube.SEEK_TIME.shift : evt.ctrlKey ? ExceedTube.SEEK_TIME.ctrl : ExceedTube.SEEK_TIME.normal;
                    return 'ArrowLeft' === evt.code ? -sec : sec;
                })();
                this.#seekVideo(seekTime_sec);

            }
        }, true);
    }

    /**
     * プレイヤー内のボタン用ツールチップのCSSを定義
     */
     #defineVideoButtonTooltipStyle() {

        const target = document.head.querySelector(`.${ExceedTube.Attributes.Class.TOOLTIP_STYLE}`);
        if( target ) {
            return;
        }
        let cssElem = document.createElement('style');
        cssElem.className = ExceedTube.Attributes.Class.TOOLTIP_STYLE;
        cssElem.setAttribute('type', 'text/css');
        cssElem.textContent = ExceedTube.Css.VIDEO_BUTTON_TOOLTIP;
        document.head.appendChild(cssElem);
    }

    /**
     * コメント再読込ボタンの表示を切り替える
     */
    #toggleReloadCommentButtonDisplay() {

        if( !this.isStreaming() ) {
            return;
        }

        // 挿入位置の設定
        const insertPlace = {
            control:    this.#elements.player_right_controls,
            beforeNode: this.#elements.player_settings_button,
        };

        // コメント再読込ボタン
        this.#toggleButtonDisplay(
            this.#settings.player.show_reload_comment_button,
            ExceedTube.SVG.RELOAD_COMMENT.ATTRIBUTES,
            ExceedTube.SVG.RELOAD_COMMENT.PATH,
            () => { this.#reloadComment(); },
            insertPlace,
        );
    }
    /**
     * コメント再読込を再読込する
     */
    #reloadComment() {
        if( this.isStreaming() ) {
            const comment = this.#elements.comment.contentWindow.document;
            const selectors = 'tp-yt-paper-listbox#menu a.iron-selected';
            const selectedCommentMenu = M424.DOM.querySelectorAsync(selectors, comment);
            selectedCommentMenu.click();
        }
    }

    /**
     * シークボタンの表示を切り替える
     */
     #toggleSeekButtonDisplay() {

        // 挿入位置の設定
        const insertPlace = {
            control: this.#elements.player_right_controls,
            beforeNode: this.#elements.player_settings_button,
        };

        // 戻るボタン
        this.#toggleButtonDisplay(
            this.#settings.player.show_seek_backward_button,
            ExceedTube.SVG.SEEK_BACKWARD.ATTRIBUTES,
            ExceedTube.SVG.SEEK_BACKWARD.PATH,
            () => { this.#seekVideo(-ExceedTube.SEEK_TIME.normal); },
            insertPlace,
        );
        // 進むボタン
        this.#toggleButtonDisplay(
            this.#settings.player.show_seek_forward_button,
            ExceedTube.SVG.SEEK_FORWARD.ATTRIBUTES,
            ExceedTube.SVG.SEEK_FORWARD.PATH,
            () => { this.#seekVideo(ExceedTube.SEEK_TIME.normal); },
            insertPlace,
        );
    }

    /**
     * 動画プレイヤー内の独自ボタンの表示を切り替える
     *  - 表示時、オブジェクトがなければ生成する
     *  - 表示/非表示の切り替えは、display属性で切り替える
     *
     * @param {Boolean} isShow - ボタンの表示可否
     * @param {Object} buttonOptions - ボタンに関する属性設定(連想配列)
     * @param {Object} svgOptions - ボタンの画像設定(連想配列)
     * @param {Function} clickFunc - 押下時の処理
     * @param {Object} insertPlace - 表示位置の指定(連想配列)
     */
     #toggleButtonDisplay(isShow, buttonOptions, svgOptions, clickFunc, insertPlace) {
        // Process if video page
        if( !this.isVideoPage() ) {
            return;
        }

        // ボタン追加済なら表示切替
        const button = this.#elements.player.querySelector(`#${buttonOptions.id}`);
        if( button ) {
            button.style.display = isShow ? 'inline' : 'none';
            return;
        }

        // ボタンを生成
        if( isShow ) {

            // SVG画像を生成
            let svg = this.#generateSvg(ExceedTube.SVG.ATTRIBUTES, svgOptions);

            // ボタンを生成
            let playerButton = this.#generatePlayerButton({
                title:      buttonOptions.title,
                id:         buttonOptions.id,
                child:      svg,
                opacity:    1,
                onclick:    clickFunc,
            });

            const controlNode = insertPlace.control || this.#elements.player_right_controls;
            const insertNode  = insertPlace.beforeNode || this.#elements.player_settings_button;
            controlNode.insertBefore(playerButton, insertNode);
        }
    }

    /**
     * 再利用可能なSVG画像オブジェクトを事前定義する
     */
    #defineReuseSvg() {
        const target = document.head.querySelector(`.${ExceedTube.Attributes.ID.SVG_DEFS}`);
        if( target ) {
            return;
        }

        const namespaceURI = 'http://www.w3.org/2000/svg';
        let svg = document.createElementNS(namespaceURI, 'svg');
        svg.id = ExceedTube.Attributes.ID.SVG_DEFS;

        let defs = document.createElementNS(namespaceURI, 'defs');
        defs.appendChild(this.#generateSymbol(ExceedTube.SVG.SEEK_BACKWARD));   // 15sec backward
        defs.appendChild(this.#generateSymbol(ExceedTube.SVG.SEEK_FORWARD));    // 15sec forward
        defs.appendChild(this.#generateSymbol(ExceedTube.SVG.RELOAD_COMMENT));  // reload comment

        svg.appendChild(defs);
        document.head.appendChild(svg);
    }

    /**
     *
     * @param {Object} template
     * @returns
     */
    #generateSymbol(template) {
        const namespaceURI = 'http://www.w3.org/2000/svg';
        let symbol = document.createElementNS(namespaceURI, 'symbol');
        let path   = document.createElementNS(namespaceURI, 'path');

        symbol.setAttributeNS(null, template.ATTRIBUTES);
        path.setAttributeNS(null, template.PATH);
        symbol.appendChild(path);
        return symbol;
    }

    /**
     * SVG画像オブジェクトを生成する
     * @param {Object} svgOptions - SVGタグの属性設定(連想配列)
     * @param {Object} pathOptions - PATHタグの属性設定(連想配列)
     * @returns {Object} svg画像Element
     */
    #generateSvg(svgOptions, pathOptions) {
        const namespaceURI = 'http://www.w3.org/2000/svg';
        let svg = document.createElementNS(namespaceURI, 'svg');
        let path = document.createElementNS(namespaceURI, 'path');

        svg.setAttributesNS(null, svgOptions);
        path.setAttributesNS(null, pathOptions);
        svg.appendChild(path);

        return svg;
    }

    /**
     * ビデオプレイヤー用のボタンを生成する
     * @param {Object} options - ボタンElement用の属性設定(連想配列)
     * @returns ボタンElement
     */
    #generatePlayerButton(options) {
        if( !this.isVideoPage() ) {
            return;
        }

        const title = options.title || 'Button';

        let button = document.createElement('button');
        button.className = `ytp-button ${ExceedTube.Attributes.Class.PLAYER_BUTTON}`;
        button.dataset.title = title;

        // ツールチップ表示イベントを追加
        button.addEventListener('mouseover', function () {
            let tooltip = document.createElement('div');
            let rect = this.getBoundingClientRect();

            tooltip.className = ExceedTube.Attributes.Class.PLAYER_BUTTON_TOOLTIP;
            tooltip.textContent = title;
            tooltip.style.display = 'inline';

            tooltip.style.left = rect.left + rect.width / 2 + 'px';
            tooltip.style.top = rect.top - 1 + 'px';

            const mouseleaveEvent = function() {
                tooltip.remove();
                this.removeEventListener('mouseleave', mouseleaveEvent);
            }
            this.addEventListener('mouseleave', mouseleaveEvent);

            document.body.appendChild(tooltip);
        });

        if( options.id ) {
            button.id = options.id;
        }
        if( options.child ) {
            button.appendChild(options.child);
        }
        if( options.onclick ) {
            button.onclick = options.onclick;
        }
        button.opacity = options.opacity || '.5';

        return button;
    }

    /**
     * マストヘッドの表示処理をsetTimeoutに登録する
     * @param {Number} interval
     */
    #registShowMasthead(interval) {
        // 非表示処理を中断する
        if( this.#events.isReady(ExceedTube.Events.HIDE_MASTHEAD) ) {
            this.#events.delete(ExceedTube.Events.HIDE_MASTHEAD);
        }
        // 表示処理 実行中は、何もしない
        if( this.#events.isReady(ExceedTube.Events.SHOW_MASTHEAD) ) {
            return;
        }
        this.#events.regist( this.#showMasthead.bind(this), interval, {name: ExceedTube.Events.SHOW_MASTHEAD} );
    }

    /**
     * マストヘッドの非表示処理をsetTimeoutに登録する
     * @param {Number} interval
     */
    #registHideMasthead(interval) {
        // 非表示処理を中断する
        if( this.#events.isReady(ExceedTube.Events.SHOW_MASTHEAD) ) {
            this.#events.delete(ExceedTube.Events.SHOW_MASTHEAD);
        }
        // 非表示処理 実行中は、何もしない
        if( this.#events.isReady(ExceedTube.Events.HIDE_MASTHEAD) ) {
            return;
        }
        this.#events.regist( this.#hideMasthead.bind(this), interval, {name: ExceedTube.Events.HIDE_MASTHEAD} );
    }

    /**
     * マストヘッドを表示する
     */
    #showMasthead() {
        if( this.#elements.ytd_app ) {
            this.#elements.ytd_app.removeAttribute('masthead-hidden');
            this.#elements.ytd_app.style.cssText += '--ytd-masthead-height: 56px;';
        }
    }
    /**
     * マストヘッドを隠す
     */
    #hideMasthead() {
        if( this.#elements.ytd_app ) {
            this.#elements.ytd_app.setAttribute('masthead-hidden');
            this.#elements.ytd_app.style.cssText += '--ytd-masthead-height: 0px;';
        }
    }

    /**
     * マストヘッドの表示を切り替える
     */
    #toggleMastheadDisplay(eventType) {
        const show_interval = eventType === 'scroll'
            ? this.#settings.masthead.video_page.show_interval_when_scrolling
            : this.#settings.masthead.video_page.show_interval_when_hover
        ;
        !this.#settings.masthead.video_page.hide_display || this.#canShowMasthead(eventType)
            ? this.#registShowMasthead(show_interval)
            : this.#registHideMasthead(this.#settings.masthead.video_page.hide_interval_when_blur)
        ;
    }
}