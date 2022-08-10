// ==UserScript==
// @name         Youtubeカスタムショートカット
// @namespace    M424
// @version      0.2
// @description  Youtubeのショートカットを無効化したり、上書きしたり、新しく定義したりなどカスタムする
// @author       M424
// @match        https://www.youtube.com/watch?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// ==/UserScript==

let hideCursorTimer;

(function() {
    // @match        https://www.youtube.com/*

    //////////////////////////////////////////////////
    // 定数
    //////////////////////////////////////////////////
    const C_Html5VideoSelector = '.video-stream.html5-main-video';
    const C_YoutubeVideoWrapperSelector = '#movie_player';
    const C_SeekButtonOpacity = 0.3;
    const C_SeekTimeS = 15;
    const C_SeekTimeM = 30;
    const C_SeekTimeL = 60;

    'use strict';
    // メイン画面のロード完了を待つ
    const mo = new MutationObserver((data1, data2) => {
        const video = document.querySelector(C_Html5VideoSelector);
        if( video ) {
            // クリックによるシーク処理を追加する
            //appendClickSeeker();
            // カスタムショートカット定義の呼び出し
            document.addEventListener("keydown", customShortcutor, true);
            mo.disconnect();
            return;
        }
    })
    mo.observe(document.body, {
        childList: true, subtree: true
    });

    const appendClickSeeker = () => {

        const video = document.querySelector(C_Html5VideoSelector);
        const videoWrapper = document.querySelector(C_YoutubeVideoWrapperSelector);

        const common = document.createElement('div');
        common.style.position = 'absolute';
        common.style.height = '80%';
        common.style.width = '20%';
        common.style.top = '10%';
//        common.style.display = 'inline-block'
        common.style.display = 'flex';

        common.style.zIndex = '100';

        common.style.backgroundColor = '#202020';
        common.style.opacity = 0;
        common.style.transition = '.3s';
        common.style.alignItems = 'center';
        common.style.justifyContent = 'center';
        common.style.fontSize = '5em';
        common.style.userSelect = 'none';

        const left = common.cloneNode();
        const right = common.cloneNode();
        right.style.right = '0';
        right.innerHTML = '15秒進む';
        left.innerHTML = '15秒戻る';

        const seeker = (seconds) => {
            return (e) => {
                video.currentTime += seconds;
            }
        }

        const showSeekButton = (e) => {
            return (e) => {
                e.target.style.opacity = C_SeekButtonOpacity;
            }
        }
        const hideSeekButton = (e) => {
            return (e) => {
                e.target.style.opacity = 0;
            }
        }
        const hideCursorer = (e) => {
            return (e) => {
                e.target.style.cursor = 'auto';
                e.target.style.opacity = C_SeekButtonOpacity;
                clearTimeout(hideCursorTimer);
                hideCursorTimer = setTimeout(function() {
                    e.target.style.cursor = 'none';
                    e.target.style.opacity = 0;
                }, 3000);
            }
        }

        left.addEventListener( 'dblclick', seeker(-C_SeekTimeS) );
        right.addEventListener( 'dblclick', seeker(C_SeekTimeS) );

        left.addEventListener( 'mouseover', showSeekButton() );
        left.addEventListener( 'mouseout', hideSeekButton() );
        left.addEventListener( 'mousemove', hideCursorer() );
        right.addEventListener( 'mouseover', showSeekButton() );
        right.addEventListener( 'mouseout', hideSeekButton() );
        right.addEventListener( 'mousemove', hideCursorer() );

        videoWrapper.appendChild(left);
        videoWrapper.appendChild(right);

    }

    // ショートカット実行用メソッド定義
    const customShortcutor = (e) => {

        const video = document.querySelector(C_Html5VideoSelector);
        const videoWrapper = document.querySelector(C_YoutubeVideoWrapperSelector)

        /*
         * サンプル
         *  - 指定キー押下時のイベントを中断する
            var list = [74,75,76,70,77,67];
            if(list.indexOf(e.keyCode) != -1) e.stopPropagation();
         */

        // キー入力: ←, →
        if( e.code === 'ArrowLeft' || e.code === 'ArrowRight' ) {

            // ブラウザショートカット時を優先
            if( e.altKey ) {
                e.stopPropagation();
                return;
            }
            // キー入力で実行されるイベントを取り消す(キー入力をなかったことにする)
            e.preventDefault();

            // シークする
            video.currentTime += (() => {
                const dir = e.code === 'ArrowLeft' ? -1 : 1;
                const sec = e.shiftKey ? C_SeekTimeM : e.ctrlKey ? C_SeekTimeL : C_SeekTimeS;
                return (dir * sec);
            })();
        }
    }

})();