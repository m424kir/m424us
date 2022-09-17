// ==UserScript==
// @name         ExceedTube
// @namespace    M424
// @version      0.2.1
// @description  Youtube関連スクリプト群 - Youtube Custom Script
// @author       M424
// ==/UserScript==

/**
 * 読込元のスクリプトに以下の定義を追加してください。
 */
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/M424Common.js

/**
 * Youtube カスタムクラス
 * @class ExceedTube
 */
 class ExceedTube extends M424Base {

    /**
     * [Consts] Element属性
     */
    static Attributes = class {
        static Class = class {
            static TOOLTIP_STYLE          = 'm424-style-tooltip';             // ツールチップ用CSS
            static PLAYER_BUTTON          = 'm424-player-button';             // プレイヤー内ボタン
            static PLAYER_BUTTON_TOOLTIP  = 'm424-player-button--tooltip';    // プレイヤー内ボタン用ツールチップ
        };
        static ID = class {
            static SEEK_BACKWARD_BUTTON   = 'm424-seek-backward-button';      // シークボタン(戻る)
            static SEEK_FORWARD_BUTTON    = 'm424-seek-forward-button';       // シークボタン(進む)
        };
        static Title = class {
            static SEEK_BACKWARD_BUTTON   = '15秒戻る';                       // シークボタン(戻る)
            static SEEK_FORWARD_BUTTON    = '15秒進む';                       // シークボタン(進む)
        };
    }

    /**
     * [Consts] イベント
     */
    static Events = class {
        static PAGE_UPDATED = 'exceedtube-page-updated';    // ページ更新イベント
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
        static CHANNEL      = /(user|channel|c)/;
    };

    /**
     * [Consts] Pathnameの種類一覧
     */
     static Pathnames = [
        { name: 'home',           path: '/' },
        { name: 'video',          path: '/watch' },
        { name: 'short',         regex: /shorts/ },
        { name: 'subscriptions',  path: '/feed/subscriptions' },
        { name: 'channel',       regex: /^\/(user|channel|c)\// },
        { name: 'other',         regex: /.*/ },
    ];

    /**
     * [Consts] シーク時間定義
     */
    static SEEK_TIME = { normal: 15, shift: 30, ctrl: 60 };

    /**
     * [Consts] ボタンオプション
     */
    static ButtonOptions = class {
        static SVG = {
            version:    '1,1',
            height:     '100%',
            width:      '100%',
            viewBox:    '0 0 16 16',
        };
        static SEEK_BACKWARD = {
            button: {
                id:     ExceedTube.Attributes.ID.SEEK_BACKWARD_BUTTON,
                title:  ExceedTube.Attributes.Title.SEEK_BACKWARD_BUTTON,
            },
            svg: {
                fill:   '#eee',
                d:      'm8 8 7 4V4zM1 8l7 4V4z',
            },
        };
        static SEEK_FORWARD = {
            button: {
                id:     ExceedTube.Attributes.ID.SEEK_FORWARD_BUTTON,
                title:  ExceedTube.Attributes.Title.SEEK_FORWARD_BUTTON,
            },
            svg: {
                fill:   '#eee',
                d:      'M7.875 8 .938 12V4C.875 4 7.875 8 7.875 8zm7 0-7 4V4z',
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
     * 各種設定
     * @type {object}
     */
    #settings = {
        // 現在のページタイプ
        page_type: '',

        // プレイヤー情報
        player: {
            // シークボタンの表示可否
            show_seek_backward_button: true,
            show_seek_forward_button:  true,
        },

        // マストヘッドの表示可否
        hide_masthead: true,
    };

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
        // ページデータの更新イベント
        document.addEventListener('yt-page-data-updated', () => {
            // 情報の更新
            this.#updatePageInfo();

            // 動画ページに関する更新処理
            this.#updateVideo();

            // ページ遷移に関するイベントを発行
            document.dispatchEvent( new CustomEvent(ExceedTube.Events.PAGE_UPDATED) );
        });

        // マウス関連のイベントを追加
        this.#defineMouseEvent();

        // キーボード関連のイベントを追加
        this.#defineKeyboardEvent();

        // マウスに関する初期処理
        this.#initializeMouse();

        // キーボードに関する初期処理
        this.#initializeKeyboard();
    }

    /**
     * マウス関連の初期実行処理
     */
    #initializeMouse() {
        this.#mouse.x = -1;
        this.#mouse.y = -1;
    }

    /**
     * キーボード関連の初期実行処理
     */
    #initializeKeyboard() {
        // nop
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
     * 動画ページに関する更新処理
     */
    #updateVideo() {
        if( !this.#isVideoPage() ) {
            return;
        }

        // マストヘッドの表示を切り替える
        this.#toggleMastheadDisplay();

        // プレイヤーコントロールにボタン追加
        this.#toggleSeekBackwardButtonDisplay();
        this.#toggleSeekForwardButtonDisplay();

        // ボタン用ツールチップ定義追加
        if( !document.head.querySelector(`.${ExceedTube.Attributes.Class.TOOLTIP_STYLE}`) ) {
            let cssElem = document.createElement('style');
            cssElem.className = ExceedTube.Attributes.Class.TOOLTIP_STYLE;
            cssElem.setAttribute('type', 'text/css');
            cssElem.textContent = ExceedTube.Css.VIDEO_BUTTON_TOOLTIP;
            document.head.appendChild(cssElem);
        }
    }

    /**
     * Youtubeページの情報更新
     *  - ページ更新のイベント発生時にページ情報を更新する
     */
    #updatePageInfo() {
        // URL情報の更新
        this.#location = location;
        // ページの種類を更新
        this.#updatePageType();

        // 動画IDを取得/更新 - empty is null.
        this.#settings.video_id = this.#getVideoId(this.#location.href);

        // ページのElement情報を更新
        this.#updatePageElements();
    }

    /**
     * ページのElement情報を更新する
     */
    #updatePageElements() {

        this.#elements.ytd_app = document.querySelector('ytd-app');

        // 動画プレイヤーに関するElement情報を更新
        if( this.#isVideoPage() ) {
            this.#elements.player                 = document.querySelector(ExceedTube.Selector.PLAYER);
            this.#elements.video                  = this.#elements.player.querySelector(ExceedTube.Selector.VIDEO);
            this.#elements.player_left_controls   = this.#elements.player.querySelector(ExceedTube.Selector.PLAYER_LEFT_CONTROLS);
            this.#elements.player_right_controls  = this.#elements.player.querySelector(ExceedTube.Selector.PLAYER_RIGHT_CONTROLS);
            this.#elements.player_settings_button = this.#elements.player.querySelector(ExceedTube.Selector.PLAYER_SETTINGS_BUTTON);
        }
    }

    /**
     * 現在のページの種類を取得/更新する
     */
     #updatePageType() {
        let result = ExceedTube.Pathnames.find( e => e.regex
            ? e.regex.test(this.#location.pathname)
            : e.path === this.#location.pathname
        );
        this.#settings.page_type = result.name || 'other';
    }

    /**
     * 現在のページが動画のページかどうかを返す
     * @returns true: 現在のページが動画ページ
     */
    #isVideoPage() {
        return ( this.#settings.page_type === 'video' && this.#settings.video_id );
    }

    /**
     * テキスト入力欄にフォーカスしているか
     * @param {Event} evt
     * @returns true: テキスト入力欄にフォーカスしている
     */
    #isForcusTextInputField(evt) {
        const textFields = ['EMBED', 'INPUT', 'OBJECT', 'TEXTAREA', 'IFRAME'];
        return ( textFields.includes(document.activeElement.tagName) || evt.target.isContentEditable );
    }

    /**
     * ボリュームにフォーカスしているか
     * @returns true: ボリュームにフォーカスしている
     */
    #isForcusVolume() {
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
     #isForcusSearchBox() {
        const activeElem = document.activeElement;
        return (activeElem.tagName === 'INPUT' && activeElem.id === 'search' );
    }

    /**
     * マストヘッドが表示可能か
     * @returns true: マストヘッドが表示可能
     */
     #canShowMasthead() {
        return this.#isHoverMasthead() || this.#isForcusSearchBox();
    }

    /**
     * 動画IDを取得する
     *  - 動画IDが検出できない or 動画ページでなければ null を返す
     * @param {string} url
     * @returns {string} 動画ID or null
     */
    #getVideoId(url) {
        return this.#settings.page_type === 'video'
            ? url.match(ExceedTube.Regex.VIDEO_ID)[1] || null
            : null
        ;
    }

    /**
     * 動画ページの場合、指定秒シークする
     * @param {Number} sec
     */
    #seekVideo(sec) {
        if( this.#isVideoPage() ) {
            let current_sec = this.#elements.video.currentTime;
            let duration_sec = this.#elements.video.duration;

            // 動画が終点(シーク可能範囲が0.1秒未満)で+シーク or 始点で-シークなら処理しない
            if( (sec > 0 && duration_sec - current_sec < 0.1) || (sec < 0 && current_sec < 0.1) ) {
                return;
            }
            this.#elements.video.currentTime = Math.min( duration_sec, Math.max(0, current_sec + sec) );
            this.debug(`${Math.ceil(this.#elements.video.currentTime - current_sec)}sec seek. ${M424.Time.toHMS(~~this.#elements.video.currentTime)} / ${M424.Time.toHMS(~~duration_sec)}`);
            //this.debug(`time: ${this.#elements.video.currentTime.toFixed(3)} / ${duration_sec.toFixed(3)}`);
        }
    }

    /**
     * マウスイベントを定義する
     */
    #defineMouseEvent() {

        // マウス移動に関するイベント
        const eventTypes = ['mousemove', 'mouseenter', 'mouseleave'];
        eventTypes.forEach( eventType => {
            document.addEventListener(eventType, evt => {
                this.#updateMouse(evt);
                this.#toggleMastheadDisplay();
            });
        });
        // 検索欄のフォーカスが外れた際のイベント
        document.querySelector('input#search').addEventListener('blur', evt => {
            evt.currentTarget.blur();
            this.#toggleMastheadDisplay();
        });
    }

    /**
     * キーボードイベントを定義する
     */
    #defineKeyboardEvent() {

        // キー入力イベント
        document.addEventListener('keydown', evt => {

            if( !this.#isVideoPage() ) {
                return;
            }

            // キー入力[←, →]
            //  - 既存ショートカット(5sec seek)を削除して、新たに定義する(15sec seek)
            //  - Altキー押下時は、ブラウザの入力(forword/back)を優先する
            if( ['ArrowLeft', 'ArrowRight'].includes(evt.code) ) {
                this.debug( `キー入力: {code: ${evt.code}, shift: ${evt.shiftKey}, ctrl: ${evt.ctrlKey}, alt: ${evt.altKey}}` );

                // 特定のフォーカス時は処理しない
                if( this.#isForcusTextInputField(evt) || this.#isForcusVolume() ) {
                    this.debug( `${this.#isForcusVolume() ? "ボリューム" : "テキスト欄"}にフォーカスされているため、処理を中断しました.` );
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
     * 戻るシークボタンの表示を切り替える
     */
     #toggleSeekBackwardButtonDisplay() {
        this.#toggleSeekButtonDisplay(
            this.#settings.player.show_seek_backward_button,
            -ExceedTube.SEEK_TIME.normal,
            ExceedTube.ButtonOptions.SEEK_BACKWARD.button,
            ExceedTube.ButtonOptions.SEEK_BACKWARD.svg,
        );
    }

    /**
     * 進むシークボタンの表示を切り替える
     */
     #toggleSeekForwardButtonDisplay() {
        this.#toggleSeekButtonDisplay(
            this.#settings.player.show_seek_forward_button,
            ExceedTube.SEEK_TIME.normal,
            ExceedTube.ButtonOptions.SEEK_FORWARD.button,
            ExceedTube.ButtonOptions.SEEK_FORWARD.svg,
        );
    }

    /**
     * シークボタンの表示を切り替える
     * @param {Boolean} isShow - シークボタンの表示可否
     * @param {Number} seekTime_sec - シーク時間(秒)
     * @param {Object} buttonOptions - シークボタンに関する属性設定(連想配列)
     * @param {Object} svgOptions - シークボタンの画像設定(連想配列)
     */
     #toggleSeekButtonDisplay(isShow, seekTime_sec, buttonOptions, svgOptions) {
        // Process if video page
        if( !this.#isVideoPage() ) {
            return;
        }

        let seekButton = this.#elements.player.querySelector(`#${buttonOptions.id}`);
        // ボタン追加済なら表示切替
        if( seekButton ) {
            seekButton.style.display = isShow ? 'inline' : 'none';
            return;
        }

        // ボタンを生成
        if( isShow ) {

            // SVG画像を生成
            let svg = this.#generateSvg(ExceedTube.ButtonOptions.SVG, svgOptions);

            // 戻るボタンを生成
            let button = this.#generatePlayerButton({
                title:      buttonOptions.title,
                id:         buttonOptions.id,
                child:      svg,
                opacity:    1,
                onclick:    () => { this.#seekVideo(seekTime_sec); },
            });

            // 設定ボタンの横に配置する
            this.#elements.player_right_controls.insertBefore(button, this.#elements.player_settings_button);
        }
    }

    /**
     * SVG画像オブジェクトを生成する
     * @param {Object} svgOptions - SVGタグの属性設定(連想配列)
     * @param {Object} pathOptions - PATHタグの属性設定(連想配列)
     * @returns {Object} svg画像Element
     */
    #generateSvg(svgOptions, pathOptions) {
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

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
        if( !this.#isVideoPage() ) {
            return;
        }

        let title = options.title || 'Button';

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
        if( !this.#isVideoPage() ) {
            return;
        }
        if( this.#canShowMasthead() ) {
            return;
        }
        if( this.#elements.ytd_app ) {
            this.#elements.ytd_app.setAttribute('masthead-hidden');
            this.#elements.ytd_app.style.cssText += '--ytd-masthead-height: 0px;';
        }
    }

    /**
     * マストヘッドの表示を切り替える
     */
    #toggleMastheadDisplay() {
        !this.#settings.hide_masthead ||
            this.#canShowMasthead() ? this.#showMasthead() : this.#hideMasthead()
        ;
    }
}