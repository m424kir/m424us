// ==UserScript==
// @name         Youtubeカスタムショートカット
// @namespace    M424
// @version      0.3
// @description  Youtubeのショートカットを無効化したり、上書きしたり、新しく定義したりなどカスタムする
// @author       M424
// @match        https://www.youtube.com/watch?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function() {
    const SCRIPTID = 'Youtubeカスタムショートカット';

    // 定数クラス
    class Consts {
        // Youtube Selector
        static Selector = class {
        static VIDEO = ".video-stream.html5-main-video";
        static VIDEO_WRAPPER = "#movie_player";
        };

        // Youtube Player Seek
        static SeekTime = [15, 30, 60];
    }

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
         * カスタムショートカットを定義する
         */
        #defineCustomEvent() {
            this.debug("start defineCustomEvent");
            document.addEventListener("keydown", evt => {

                // キー入力: ←, →
                if( ['ArrowLeft', 'ArrowRight'].indexOf(evt.code) !== -1 ) {

                    this.debug( `InputKey: {code: ${evt.code}, shift: ${evt.shiftKey}, ctrl: ${evt.ctrlKey}, alt: ${evt.altKey}}` );

                    // 音量調節、テキスト入力欄にフォーカス時は処理しない
                    if( this.#isVolumePanelFocus() || this.#isTextInputFocus() ) {
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
        #isTextInputFocus() {
            const activeElem = document.activeElement;
            return (
                ['INPUT', 'TEXTAREA'].indexOf(activeElem.tagName.toUpperCase()) !== -1 ||
                activeElem.getAttribute('contenteditable') == 'true'
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
    }

    let exec = new YoutubeCustomShortcut(false);
})();