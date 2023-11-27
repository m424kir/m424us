// ==UserScript==
// @name         Youtubeライブのチャット欄にすべてのコメントを表示する
// @namespace    M424
// @version      0.1
// @description  try to take over the world!
// @author       M424
// @match        *://youtube.com/live_chat*
// @match        *://*.youtube.com/live_chat*
// @match        *://youtube.com/live_chat_replay*
// @match        *://*.youtube.com/live_chat_replay*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ｢上位チャット｣から｢すべてのチャット｣が表示されるように選択肢を変更する
    const allChatMenuText = 'すべてのメッセージが表示されます';
    const intervalMs = 2000;
    setInterval( () => {
        const menu = document.querySelector('#live-chat-view-selector-sub-menu #menu a:not(.iron-selected)');
        if( menu?.textContent.includes(allChatMenuText) ) {
            menu.click();
        }
    }, intervalMs);
})();