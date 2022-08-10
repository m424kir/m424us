// ==UserScript==
// @name         Youtube Masthead Hider
// @namespace    M424
// @version      0.2
// @description  youtubeの上部固定ヘッダを隠します(ホバーで表示)
// @author       M424
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @updateURL    https://github.com/m424kir/m424us/raw/master/YoutubeMastheadHider.user.js
// @downloadURL  https://github.com/m424kir/m424us/raw/master/YoutubeMastheadHider.user.js
// ==/UserScript==

(function () {
    'use strict'
    let $ = {
        mode: {
            debug: true,
        },
        // 現在のURL
        current_url: '',
        // マウスポイント
        mouse: { x: -1, y: -1 },
        // マストヘッド関連
        masthead: {
            position_y_start: 0,
            position_y_end:   56,
            hover: {
                id: -1,
                show_interval_ms: 300,
                toggle: false,
            },
        },
        regex: {
            video_page: new RegExp('https:\/\/www\.youtube\.com\/(watch|live_chat)\\?'),
        },

        /**
          * デバッグ出力
          */
        log: (...msg) => {
            console.log('[Youtube Masthead Hider] ', ...msg);
        },
        debug: (...msg) => {
            if( $.mode.debug ) {
                console.log('[Youtube Masthead Hider] ', ...msg);
            }
        },

        /**
          * ページ遷移用イベントの発火
          */
        triggerPageTransition: () => {
            const evt = new CustomEvent('pagetransition', { detail: location.href });
            document.dispatchEvent(evt);
        },

        /**
          * ページ遷移の検知
          * @description URLが変更される毎にイベントを発火させるための処理を追加する
          */
        detectPageTransition: () => {
            // ページ監視を開始する
            new MutationObserver(() => {
                if ($.current_url != location.href) {
                    $.log('ページURL変更を検知: [' + $.current_url + '] -> [' + location.href + ']');
                    $.triggerPageTransition();
                    $.current_url = location.href;
                }
            }).observe(document.body, { childList: true, subtree: true, attributes: true });

            // ページ遷移イベントをセット
            $.events.addEventListener();
        },

        /**
         * イベント処理群
         */
        events: {
            addEventListener: () => {
                document.addEventListener('pagetransition', $.events.pagetransition);
                document.addEventListener('mousemove', $.events.mousemove);
                document.querySelector('input#search').addEventListener('blur', $.events.searchboxBlur);
                document.addEventListener('fullscreenchange', $.events.fullscreenchange);
            },

            /**
             * ページ遷移時のイベント処理
             * @description 遷移先によって、マストヘッドの表示を切り替える
             */
            pagetransition: (e) => {
                $.debug('ページ遷移イベント処理開始');

                // マストヘッド非表示時のスタイルを定義
                if( !document.querySelector('.m424-hide-masthead') ) {
                    $.debug("create style m424-hide-masthead");
                    let node = document.createElement('style');
                    node.className = 'm424-hide-masthead';
                    node.setAttribute('type', 'text/css');
                    node.textContent = `html:not([fullscreen]) ytd-app { margin-top: -56px; }`;
                    document.head.appendChild(node);
                }
                // 遷移先によって、マストヘッドの表示を切り替え
                if( $.regex.video_page.test(location.href) ) {
                    $.debug("hide masthead");
                    $.hideMasthead();
                }
                else {
                    $.debug("show masthead");
                    $.showMasthead();
                }
            },

            /**
             * マウス移動時のイベント
             * @description マウスオーバー時、マストヘッド表示
             */
            mousemove: (e) => {
                $.mouse.x = e.clientX;
                $.mouse.y = e.clientY;
                
                $.debug("mouse[" + e.clientX + ", " + e.clientY + "]");

                if( $.isMouseOverMasthead() ) {
                    if( !$.masthead.hover.toggle ) {
                        $.masthead.hover.toggle = true;
                        clearTimeout($.masthead.hover.id);
                        $.masthead.hover.id = setTimeout($.showMasthead, $.masthead.hover.show_interval_ms);
                    }
                }
                else {
                    $.masthead.hover.toggle = false;
                    $.masthead.hover.toggle = false;
                    $.hideMasthead();
                }
            },

            /**
             * 検索ボックスからフォーカスを失ったときのイベント
             */
            searchboxBlur: (e) => {
                e.currentTarget.blur();
                $.hideMasthead();
            },

            /**
             * フルスクリーン時のイベント
             */
            fullscreenchange: (e) => {
                if (document.fullscreenElement) {
                    document.querySelector('html').setAttribute('fullscreen', '')
                } else {
                    document.querySelector('html').removeAttribute('fullscreen')
                }
            },
        },

        /**
         * マストヘッドにマウスオーバーしているか
         * @returns true:マウスオーバーしている
         */
        isMouseOverMasthead: () => {
            return (
                ( $.masthead.position_y_start <= $.mouse.y ) &&
                ( $.mouse.y <= $.masthead.position_y_end )
            );
        },

        /**
         * 検索欄がアクティブになっているか
         * @returns true:検索欄がアクティブ
         */
        isSearchFieldActive: () => {
            const activeElem = document.activeElement;
            return (activeElem.tagName == 'INPUT' && activeElem.id == 'search');
        },

        /**
         * マストヘッドの非表示
         */
        hideMasthead: () => {
            // 検索欄アクティブ時またはマウスオーバー時は隠さない
            if( $.isSearchFieldActive() || $.isMouseOverMasthead() ) return;
            document.querySelector('ytd-app').setAttribute("masthead-hidden");
            document.querySelector('.m424-hide-masthead').disabled = false;
        },

        /**
         * マストヘッドの表示
         */
        showMasthead: () => {
            document.querySelector('ytd-app').removeAttribute("masthead-hidden");
            if( !$.regex.video_page.test(location.href) ) {
                document.querySelector('.m424-hide-masthead').disabled = true;
            }
        },
    }

    $.detectPageTransition();

})();
