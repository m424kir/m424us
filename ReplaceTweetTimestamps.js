// ==UserScript==
// @name         ツイッターの時間を絶対時間に置換する - Replace tweet timestamps with absolute time
// @namespace    M424
// @version      1.1
// @description  各ツイートに表示されるタイムスタンプを絶対時間(YYYY/MM/DD(aaa) HH:mm:dd)に置換する
// @author       M424
// @match        https://twitter.com/*
// @match        https://tweetdeck.twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// @run-at       document-end
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/locale/ja.js
// @updateURL    https://github.com/m424kir/m424us/raw/master/ReplaceTweetTimestamps.js
// @downloadURL  https://github.com/m424kir/m424us/raw/master/ReplaceTweetTimestamps.js
// ==/UserScript==

(() => {
    'use strict';
    const interval_ms = 1000; // 更新頻度(ms)
    const selector = 'main section time[datetime]'; // 時間が記されたセレクタ
    let intervalId = null;
    dayjs.locale('ja');
    // console.log(`[ReplaceTwitterTimestamps] ${location.href}`);

    const isTweetDeck = () => location.hostname === 'tweetdeck.twitter.com';
    const replaceTimestamp = () => {
        const timeElems = document.querySelectorAll(selector);
        const format = `YY/MM/DD(ddd)${isTweetDeck() ? '<br>' : ' '}HH:mm:ss`;
        timeElems.forEach( elem => {
            const timestamp = elem.getAttribute('datetime'); // ISO8601 format string
            const datetime = dayjs(timestamp).format(format);
            const newElem = document.createElement('span');
            newElem.setAttribute('datetime', timestamp);
            newElem.setAttribute('local-datetime', datetime);
            newElem.setAttribute('style', 'text-align: right;');
            newElem.textContent = datetime;

            // 一度置き換えたDOMを再度置換しないようにDOM自体を置き換える
            elem.replaceWith(newElem);
        });
    };

    // ツイートは随時更新されるため、定期的に処理を実行する
    if( intervalId ) {
        clearInterval(intervalId);
        intervalId = null;
    }
    window.setInterval(replaceTimestamp, interval_ms);
})();
