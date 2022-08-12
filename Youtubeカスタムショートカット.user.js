// ==UserScript==
// @name         Youtubeカスタムショートカット
// @namespace    M424
// @version      0.4
// @description  Youtubeのショートカットを無効化したり、上書きしたり、新しく定義したりなどカスタムする
// @author       M424
// @match        https://www.youtube.com/watch?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @updateURL    https://github.com/m424kir/m424us/raw/master/Youtube%E3%82%AB%E3%82%B9%E3%82%BF%E3%83%A0%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%AB%E3%83%83%E3%83%88.user.js
// @downloadURL  https://github.com/m424kir/m424us/raw/master/Youtube%E3%82%AB%E3%82%B9%E3%82%BF%E3%83%A0%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%AB%E3%83%83%E3%83%88.user.js
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPTID = 'Youtubeカスタムショートカット';

    // 定数クラス

    class Consts {
        // Youtube Selector
        static Selector = class {
            static VIDEO = ".video-stream.html5-main-video";
            static VIDEO_WRAPPER = "#movie_player";
            static VIDEO_CONTROLS_RIGHT = "div.ytp-right-controls";
            static VIDEO_CONTROLS_LEFT = "div.ytp-left-controls";
            static VIDEO_ICON_SETTINGS = 'button.ytp-button.ytp-settings-button';
        };

        // Youtube Custom Style
        static Css = class {
            static VIDEO_ICON_TOOLTIP = `.m424-player-button--tooltip { font-size: 13px !important; font-weight: 500 !important; line-height: 15px !important; position: fixed !important; transform: translate(-50%, -150%) !important; pointer-events: none !important; color: rgb(238, 238, 238) !important; background-color: rgba(28, 28, 28, 0.9) !important; text-shadow: rgba(0, 0, 0, 0.5) 0px 0px 2px !important; padding: 5px 9px; border-radius: 2px !important; }`;
        };

        // Youtube Player Seek
        static SEEK_TIME = [15, 30, 60];
    };

    // 基底
    class M424Base {
        #isDebug;
        constructor(isDebugMode = false) {
            this.#isDebug = isDebugMode;
        }
        log(...msg) {
            console.log(`[${SCRIPTID}]`, ...msg);
        }
        debug(...msg) {
            if( this.#isDebug ) { this.log(...msg); }
        }
    }
    // カスタムショートカット定義
    class YoutubeCustomShortcut extends M424Base {

        settings = {
            player_seek_backward_button: true,
            player_seek_forward_button: true,
        };

        /**
         * コンストラクタ
         * @param isDebugMode
         */
        constructor(isDebugMode = false) {
            super(isDebugMode);
            this.debug("constructor");

            // プレイヤーの描画完了を検知
            this.#detectVideoOnLoad();
        }

        /**
         * ビデオプレイヤー読込完了を検知する
         */
        #detectVideoOnLoad() {
            this.debug("start detectVideoOnLoad");
            const observer = new MutationObserver( () => {
                if( document.querySelector(Consts.Selector.VIDEO) ) {
                    this.#defineCustomEvent();
                    observer.disconnect();
                }
            });
            observer.observe(document.body, {childList: true, subtree: true});
        }

        /**
         * カスタムイベントを定義する
         */
        #defineCustomEvent() {
            this.debug("start defineCustomEvent");
            // キーボードショートカット定義
            this.#defineKeyboardCustomEvent();

            // ビデオプレイヤーショートカット定義
            this.#defineVideoCustomEvent();
        }

        /**
         * ビデオプレイヤーに関するカスタムイベントを定義する
         */
        #defineVideoCustomEvent() {

            this.debug("start defineVideoCustomEvent");

            // Seek Backward Button
            this.#playerSeekBackwardButton();

            // Seek Forward Button
            this.#playerSeekForwardButton();

            // tooltip css
            let node = document.createElement('style');
            node.className = 'm424-style-tooltip';
            node.setAttribute('type', 'text/css');
            node.textContent = Consts.Css.VIDEO_ICON_TOOLTIP;
            document.head.appendChild(node);
        }

        /**
         * キーボードに関するカスタムイベントを定義する
         */
        #defineKeyboardCustomEvent() {
            document.addEventListener("keydown", evt => {

                // キー入力: ←, →
                if( ['ArrowLeft', 'ArrowRight'].indexOf(evt.code) !== -1 ) {

                    this.debug( `InputKey: {code: ${evt.code}, shift: ${evt.shiftKey}, ctrl: ${evt.ctrlKey}, alt: ${evt.altKey}}` );

                    // 音量調節、テキスト入力欄にフォーカス時は処理しない
                    if( this.#isVolumePanelFocus() || this.#isTextInputFocus(evt) ) {
                        this.debug(`${this.#isVolumePanelFocus() ? "音量調節" : "テキスト入力欄"}がフォーカスされているため、処理を中断しました`);
                        return;
                    }
                    // ブラウザショートカット時を優先
                    if( evt.altKey ) {
                        this.debug( `ブラウザ側の処理を優先するため処理を中断します. Input: Alt+${evt.code === 'ArrowLeft' ? "←" : "→"}` );
                        evt.stopPropagation();
                        return;
                    }
                    // キー入力で実行されるイベントを取り消す(キー入力をなかったことにする)
                    evt.preventDefault();

                    // シークする
                    const seekTime_sec = (() => {
                        const dir = 'ArrowLeft' === evt.code ? -1 : 1;
                        const sec = Consts.SeekTime[evt.shiftKey ? 1 : evt.ctrlKey ? 2 : 0];
                        return (dir * sec);
                    })();
                    this.#seekVideo(seekTime_sec);
                }
            }, true);
        }

        /**
         * テキスト入力欄にフォーカスしているか
         */
        #isTextInputFocus(evt) {
            const activeElem = document.activeElement;
            return (
                ['EMBED', 'INPUT', 'OBJECT', 'TEXTAREA', 'IFRAME'].includes(activeElem.tagName) === true || 
                evt.target.isContentEditable
            );
        }

        /**
         * 音量調節にフォーカスしているか
         */
        #isVolumePanelFocus() {
            const activeElem = document.activeElement;
            return activeElem.classList.contains('ytp-volume-panel');
        }

        /**
         * ビデオプレイヤーを指定秒シークする
         * @param {number} sec
         */
        #seekVideo(sec) {
            const video = document.querySelector(Consts.Selector.VIDEO);
            video.currentTime = Math.max(0, video.currentTime + sec);
            this.debug( `[seekVideo] seek: ${sec}sec, currentTime: ${video.currentTime}` );
        }

        /**
         * ビデオプレイヤーにボタンを生やす
         * @param {boolean} isControlRight 
         * @param options 
         */
         #createPlayerButton(isControlRight = true, options) {

            this.debug("start createPlayerButton");

            // ビデオプレイヤー コントロール Element
            let videoControlsElem = document.querySelector(isControlRight ? Consts.Selector.VIDEO_CONTROLS_RIGHT : Consts.Selector.VIDEO_CONTROLS_LEFT);

            let button = document.createElement('button');
            button.className = 'ytp-button m424-player-button';
            button.dataset.title = options.title;
            button.addEventListener('mouseover', function () {
                let tooltip = document.createElement('div');
                let rect = this.getBoundingClientRect();

                tooltip.className = 'm424-player-button--tooltip';
                tooltip.textContent = this.dataset.title;

                tooltip.style.left = rect.left + rect.width / 2 + 'px';
                tooltip.style.top = rect.top - 8 + 'px';

                function mouseleave() {
                    tooltip.remove();
                    this.removeEventListener('mouseleave', mouseleave);
                }
                this.addEventListener('mouseleave', mouseleave);

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

            if( isControlRight ) {
                // 設定[Settings]の前にシークボタンを配置する
                let reference = videoControlsElem.querySelector(Consts.Selector.VIDEO_ICON_SETTINGS);
                videoControlsElem.insertBefore(button, reference);
            }
            else {
                videoControlsElem.appendChild(button);
            }
        }

        /**
         * SVG画像オブジェクトを生成する
         * @param  svgOptions 
         * @param  pathOptions 
         * @returns 
         */
         #createSvg(svgOptions, pathOptions) {
            let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            for( let i of Object.entries(svgOptions) ) {
                svg.setAttributeNS(null, i[0], i[1]);
            }
            for( let i of Object.entries(pathOptions) ) {
                path.setAttributeNS(null, i[0], i[1]);
            }
            svg.appendChild(path);

            return svg;
        }

        /**
         * 指定秒戻るボタンの表示/?非表示?
         */
        #playerSeekBackwardButton() {
            if( this.settings.player_seek_backward_button === true ) {

                // 表示用のSVG画像を生成
                let svg = this.#createSvg({
                    version: '1,1',
                    height: '100%',
                    width:  '100%',
                    viewBox: '0 0 16 16',
                }, {
                    fill: '#eee',
                    d: 'M293.0002-67.00336l7 4v-8zM286.0002-67.00336l7 4v-8z',
                    transform: 'translate(-285 75.003)',
                });

                // ボタンを生成
                this.#createPlayerButton(true, {
                    title: '15秒戻る',
                    id: 'm424-seek-backward-button',
                    child: svg,
                    opacity: 1,
                    onclick: () => { this.#seekVideo(-Consts.SEEK_TIME[0]); },
                });
                this.debug('create seek backward button');
            }
            else {
                // 非表示 未実装
            }
        }

        /**
         * 指定秒進むボタンの表示/?非表示?
         */
        #playerSeekForwardButton() {
            if( this.settings.player_seek_forward_button === true ) {

                // 表示用のSVG画像を生成
                let svg = this.#createSvg({
                    version: '1,1',
                    height: '100%',
                    width:  '100%',
                    viewBox: '0 0 16 16',
                }, {
                    fill: '#eee',
                    d: 'M312.87545-67.00336l-6.9375 4v-8c-.0625 0 6.9375 4 6.9375 4zM319.87545-67.00336l-7 4v-8z',
                    transform: 'translate(-305 75.003)',
                });

                // ボタンを生成
                this.#createPlayerButton(true, {
                    title: '15秒進む',
                    id: 'm424-seek-forward-button',
                    child: svg,
                    opacity: 1,
                    onclick: () => { this.#seekVideo(Consts.SEEK_TIME[0]); },
                });
                this.debug('create seek forward button');
            }
            else {
                // 非表示 未実装
            }
        }
    }

    let exec = new YoutubeCustomShortcut(true);
})();