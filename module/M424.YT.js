// ==UserScript==
// @name         M424.YT
// @namespace    M424.YT
// @version      0.1.3
// @description  Youtubeに関する機能を提供する
// @author       M424
// @require      M424.js
// @require      M424.Type.js
// @require      M424.DOM.js
// ==/UserScript==
'use strict';

/**
 * Youtubeに関する基本機能を提供する
 * @namespace
 */
M424.YT = {

    /**
     * セレクタ
     * @constant {Object}
     */
    SELECTOR: {
        YTD_APP:                'ytd-app',
        YTD_WATCH_FLEXY:        'ytd-app ytd-watch-flexy',
        PLAYER:                 '#ytd-player #movie_player',
        VIDEO_STREAM:           '#ytd-player video',
        PLAYER_LEFT_CTRLS:      '#ytd-player .ytp-left-controls',
        PLAYER_RIGHT_CTRLS:     '#ytd-player .ytp-right-controls',
        PLAYER_SETTINGS_BUTTON: '#ytd-player .ytp-settings-button',
        CHAT_CONTAINER:         '#chat-container > ytd-live-chat-frame#chat',
        CHAT_FRAME:             'iframe#chatframe',
        SEARCH_BOX:             '#masthead input#search',
        VIDEO_INFO:             '#microformat script[type="application/ld+json"]',
    },

    /**
     * CSS
     * @constant {Object}
     */
    CSS: {
        YTD_MASTHEAD_HEIGHT:    '--ytd-masthead-height',
    },

    /**
     * サイズ(width/height等)
     */
    SIZE: {
        MASTHEAD_HEIGHT: 56,
    },

    /**
     * 属性
     * @constant {Object}
     */
    ATTRIBUTE: {
        MASTHEAD_HIDDEN:        'masthead-hidden',
    },

    /**
     * クラス
     * @constant {Object}
     */
    CLASS: {
        YTP_BUTTON:                 'ytp-button',
        M424_STYLE_TOOLTIP:         'm424-style-tooltip',
        M424_YTP_BUTTON:            'm424-ytp-button',
        M424_YTP_BUTTON_TOOLTIP:    'm424-ytp-button--tooltip',
    },

    /**
     * イベントリスナー
     * @constant {Object}
     */
    EVENT: {
        YT_PAGE_DATA_UPDATED:   'yt-page-data-updated',
        YT_ACTION:              'yt-action',

        /**
         * yt-actionの詳細
         * @constant {Object}
         */
        ACTION_NAME: {
            YT_MINIPLAYER_ENDPOINT_CHAGED: 'yt-miniplayer-endpoint-changed',
        }
    },

    /**
     * 状態に関する定数群
     * @constant {Object}
     */
    STATUS: {
        /**
         * 現在表示しているページの状態
         * @constant {Object}
         */
        PAGE: {
            HOME:           'home',             // ホーム
            VIDEO:          'video',            // 動画
            SHORTS:         'shorts',           // ショート
            SUBSCRIPTIONS:  'subscriptions',    // 登録チャンネル
            CHANNELS:       'channels',         // ユーザーチャンネル
            HISTORY:        'history',          // 履歴
            PLAYLIST:       'playlist',         // プレイリスト
            OTHER:          'other',            // その他
        },

        /**
         * 配信形態
         * @constant {Object}
         */
        STREAMING: {
            LIVE:    'live',        // 生配信中
            ARCHIVE: 'archive',     // アーカイブ
            VIDEO:   'video',       // 動画
        }
    },

    /**
     * 正規表現に関する定数群
     * @constant {Object}
     */
    REGEX: {
        /**
         * ID
         * @constant {Object}
         */
        ID: {
            VIDEO:      /[?&]v=([^&]+)/,
            PLAYLIST:   /[?&]list=([^&]+)/,
            CHANNEL:    /(user|channel|c)\/([0-9a-zA-Z]*)/,
        },

        /**
         * location.pathname 判別用
         * @constant {Array}
         */
        PATHNAMES: [
            { name: 'home',           regex: /^\/$/ },                    // ホーム
            { name: 'video',          regex: /^\/watch$/ },               // 動画
            { name: 'shorts',         regex: /^\/short\// },              // ショート
            { name: 'subscriptions',  regex: /^\/feed\/subscriptions$/ }, // 登録チャンネル
            { name: 'channels',       regex: /^\/(user|channel|c)\// },   // ユーザーチャンネル
            { name: 'history',        regex: /^\/feed\/history$/ },       // 履歴
            { name: 'playlist',       regex: /^\/playlist$/ },            // プレイリスト
        ],
    },

    /**
     * 現在のページタイプを取得する
     * @returns {M424.YT.STATUS.PAGE} ページタイプ
     */
    getCurrentPageType: () => {
        const { REGEX: { PATHNAMES }, STATUS: { PAGE } } = M424.YT;
        return PATHNAMES.find( e => e.regex.test(location.pathname) ).name || PAGE.OTHER;
    },

    /**
     * 現在、動画ページであるかを判定する
     * @returns {boolean} true:動画ページである
     */
    isVideoPage: () => {
        return M424.YT.getCurrentPageType() === M424.YT.STATUS.PAGE.VIDEO;
    },

    /**
     * 現在のURLから動画IDを取得する。
     * @returns {string|null} 動画ID|取得できない場合はnull
     */
    getVideoId: () => new URLSearchParams(location.search).get('v'),

    /**
     * 検索欄にフォーカスが当たっているかを判定する
     * @returns {boolean} true: 検索欄にフォーカスが当たっている
     */
    isFocusSearchBox: () => {
        const activeElem = document.activeElement;
        return activeElem.tagName === 'INPUT' && activeElem.id === 'search';
    },

    /**
     * ボリュームコントロールにフォーカスしているかを判定する
     * @returns {boolean} true: ボリュームにフォーカスしている
     */
    isFocusVolume: () => {
        const activeElem = document.activeElement;
        return activeElem.classList.contains('ytp-volume-panel');
    },

    /**
     * 動画情報を取得する
     * @returns {Promise<Object|null>} 動画情報のオブジェクト|取得できない場合はnull。
     * @throws {Error} 動画情報の取得に失敗した場合にスローされます
     * @async
     */
    getVideoInfo: async () => {
        if( !M424.YT.isVideoPage() ) return null;

        try{
            const videoInfoNode = await M424.DOM.waitForSelector(M424.YT.SELECTOR.VIDEO_INFO);
            const videoInfo = JSON.parse(videoInfoNode.textContent);
            if( !videoInfo || typeof videoInfo !== 'object' ) {
                throw new Error('[YT::getVideoInfo] 不正なデータ');
            }

            videoInfo.status = videoInfo.publication
                ? videoInfo.duration !== 'PT0S'
                    ? M424.YT.STATUS.STREAMING.ARCHIVE
                    : M424.YT.STATUS.STREAMING.LIVE
                : M424.YT.STATUS.STREAMING.VIDEO
            ;
            // 日付/時間はDay.jsに変換しておく
            videoInfo.duration = M424.DateTime.duration(videoInfo.duration);
            videoInfo.uploadDate = M424.DateTime.of(videoInfo.uploadDate);
            return videoInfo;
        } catch(error) {
            throw error;
        }
    },

    /**
     * 動画が配信(アーカイブ含む)であるか判定する
     * @returns {boolean} true: 生配信中 or 配信アーカイブ
     * @async
     */
    isStreaming: async () => {
        try {
            const videoInfo = await M424.YT.getVideoInfo();
            if( !videoInfo ) {
                throw new Error('[YT::isStreaming] 動画情報の取得に失敗しました');
            }
            return videoInfo.status !== M424.YT.STATUS.STREAMING.VIDEO;
        } catch(error) {
            throw error;
        }
    },
};