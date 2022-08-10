// ==UserScript==
// @name         Youtubeカスタムショートカット
// @namespace    M424
// @version      0.1
// @description  Youtubeのショートカットを無効化したり、上書きしたり、新しく定義したりなどカスタムする
// @author       M424
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// ==/UserScript==

(function() {

    // ショートカット実行用メソッド定義
    var custom_shortcutor = function(e) {

        // 動画ページの確認
        let youtube_player = document.getElementById("movie_player");
        if( undefined === youtube_player ) {
            // 未定義なので、処理を終了
            console.log("YoutubeCustomShortcut: 動画プレイヤーが見つかりません.");
            return;
        }

        //////////////////////////////////////////////////////////////////
        // メソッド定義
        //////////////////////////////////////////////////////////////////
        /**
          * 動画プレイヤーの再生時間を指定秒シークする
          */
        let seeker = function(player, seekTime_sec) {
            let currentTime_sec = player.getCurrentTime();
            player.seekTo( currentTime_sec + seekTime_sec );
        }

        //////////////////////////////////////////////////////////////////
        // カスタムショートカット定義
        //////////////////////////////////////////////////////////////////

        // キー入力: ←, →
        if( e.keyCode === 37 || e.keyCode === 39 ) {

            // Chromeの戻る/進むショートカットの場合は、
            // Youtubeのショートカットを無効化させる
            if( event.altKey ) {
                event.stopPropagation();
                return;
            }
            // 素及びShift押下時の処理は定義されているため、無効化する
            else if( !event.ctrlKey ) {
                event.stopPropagation();
            }
            let seekTime_sec = e.shiftKey ? 30 : e.ctrlKey ? 60 : 15; // シーク時間の決定
            seekTime_sec *= e.keyCode === 37 ? -1 : 1; // 戻るか進むか
            seeker(youtube_player, seekTime_sec);
        }
    }

    // カスタムショートカット定義の呼び出し
    window.addEventListener("keydown", custom_shortcutor, true);
})();