// ==UserScript==
// @name         ExceedTube
// @namespace    M424
// @version      0.1
// @description  Youtube関連スクリプト群 - Youtube Custom Script
// @author       M424
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/M424Common.js
// @require      ExceedTube.css https://raw.githubusercontent.com/m424kir/m424us/master/ExceedTube.css
// ==/UserScript==

/**
 * CSS読込
 */
let css;
css = GM_getResourceText ("ExceedTube.css");
GM_addStyle (css);

/**
 * Youtube カスタムクラス
 * @class ExceedTube
 */
class ExceedTube extends M424Base {
    
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

    static ButtonOptions = class {
        static SVG = {
            version:    '1,1',
            height:     '100%',
            width:      '100%',
            viewBox:    '0 0 16 16',
        };
        static SEEK_BACKWARD = {
            button: {
                id:     'm424-seek-backward-button',
                title:  '15秒戻る', 
            }, 
            svg: {
                fill:   '#eee',
                d:      'm8 8 7 4V4zM1 8l7 4V4z',
            },
        };
        static SEEK_FORWARD = {
            button: {
                id:     'm424-seek-forward-button',
                title:  '15秒進む', 
            }, 
            svg: {
                fill:   '#eee',
                d:      'M7.875 8 .938 12V4C.875 4 7.875 8 7.875 8zm7 0-7 4V4z',
            },
        };
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
        page_type,

        // プレイヤー情報
        player: {
            // シークボタンの表示可否
            seek_backward_button: true,
            seek_forward_button:  true,
        },
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
        document.addEventListener('yt-page-data-updated', function() {
            // 情報の更新
            this.#update();

            // ページ遷移に関するイベントを発行
            document.dispatchEvent( new CustomEvent('exceedtube-page-updated') );
        });
    }

    /**
     * Youtubeページの情報更新
     */
    #update() {
        // URL情報の更新
        this.#location = location;

        // ページの種類を更新
        this.#updatePageType();

        // 動画IDを取得/更新 - empty is null.
        this.#settings.video_id = this.#getVideoId(this.#location.href);

        // プレイヤーに関するElement情報を更新
        if( this.#isVideoPage() ) {
            this.#elements.player = document.querySelector(ExceedTube.Selector.PLAYER);
            this.#elements.video  = this.#elements.player.querySelector(ExceedTube.Selector.VIDEO);
            this.#elements.player_left_controls  = this.#elements.player.querySelector(ExceedTube.Selector.PLAYER_LEFT_CONTROLS);
            this.#elements.player_right_controls = this.#elements.player.querySelector(ExceedTube.Selector.PLAYER_RIGHT_CONTROLS);
        }
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
     * @param {*} evt 
     * @returns true: テキスト入力欄にフォーカスしている
     */
    #isForcusTextInputField(evt) {
        const activeElem = document.activeElement;
        return (
            ['EMBED', 'INPUT', 'OBJECT', 'TEXTAREA', 'IFRAME'].includes(activeElem.tagName) === true || 
            evt.target.isContentEditable
        );
    }

    /**
     * ボリュームにフォーカスしているか
     * @returns true: ボリュームにフォーカスしている
     */
    #isForcusVolume() {
        const activeElem = document.activeElement;
        return activeElem.classList.contains('ytp-volume-panel');
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
     * 現在の動画に関するIDを取得する
     * @param {string} url 
     * @returns {string} 動画ID or null
     */
    #getVideoId(url) {
        return this.#settings.page_type === 'video'
            ? url.match(ExceedTube.Regex.VIDEO_ID)
            : null
        ;
    }

    /**
     * 動画ページの場合、指定秒シークする
     * @param {Number} sec 
     */
    #seekVideo(sec) {
        if( this.#isVideoPage() ) {
            this.#elements.video.currentTime = Math.max(0, video.currentTime + sec);
            this.debug(`${sec}秒シークしました. 現在:${M424.Time.toHMS(video.currentTime)}`);
        }
    }

    /**
     * 戻るシークボタンの表示を切り替える
     */
     #toggleSeekBackwardButtonDisplay() {
        this.#toggleSeekButtonDisplay(
            this.#settings.player.seek_backward_button, 
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
            this.#settings.player.seek_forward_button, 
            ExceedTube.SEEK_TIME.normal, 
            ExceedTube.ButtonOptions.SEEK_FORWARD.button,
            ExceedTube.ButtonOptions.SEEK_FORWARD.svg,
        );
    }

    /**
     * シークボタンの表示を切り替える
     */
     #toggleSeekButtonDisplay(isDisabled, seekTime_sec, buttonOptions, svgOptions) {
        // Process if video page
        if( !this.#isVideoPage() ) {
            return;
        }

        let seekButton = this.#elements.player.querySelector(`#${buttonOptions.id}`);
        // ボタン追加済なら表示切替
        if( seekButton ) {
            seekButton.disabled = isDisabled;
            return;
        }

        // ボタンを生成
        if( isDisabled ) {

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
            let reference = this.#elements.player.querySelector(ExceedTube.Selector.PLAYER_SETTINGS_BUTTON);
            this.#elements.player_right_controls.insertBefore(button, reference);
        }
    }

    /**
     * SVG画像オブジェクトを生成する
     * @param {Object} svgOptions - {key:value}型の連想配列
     * @param {Object} pathOptions - {key:value}型の連想配列
     * @returns 
     */
    #generateSvg(svgOptions, pathOptions) {
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        svg.setAttributesNS(svgOptions);
        path.setAttributesNS(pathOptions);
/*        
        for( let i of Object.entries(svgOptions) ) {
            svg.setAttributeNS(null, i[0], i[1]);
        }
        for( let i of Object.entries(pathOptions) ) {
            path.setAttributeNS(null, i[0], i[1]);
        }
*/
        svg.appendChild(path);

        return svg;
    }

    /**
     * ビデオプレイヤー用のボタンを生成する
     * @param {Object} options - {key:value}型の連想配列
     * @returns ボタンElement
     */
    #generatePlayerButton(options) {
        if( !this.#isVideoPage() ) {
            return;
        }

        let title = options.title || 'Button';
        
        let button = document.createElement('button');
        button.className = 'ytp-button m424-player-button';
        button.dataset.title = title;

        // ツールチップ表示イベントを追加
        button.addEventListener('mouseover', function () {
            let tooltip = document.createElement('div');
            let rect = this.getBoundingClientRect();

            tooltip.className = 'm424-player-button--tooltip';
            tooltip.textContent = title;

            tooltip.style.left = rect.left + rect.width / 2 + 'px';
            tooltip.style.top = rect.top - 8 + 'px';

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
}