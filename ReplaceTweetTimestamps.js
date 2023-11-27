// ==UserScript==
// @name         ツイッターの時間を絶対時間に置換する - Replace tweet timestamps with absolute time
// @namespace    M424
// @version      1.2.0
// @description  各ツイートに表示されるタイムスタンプを絶対時間(YYYY/MM/DD(aaa) HH:mm:dd)に置換する
// @author       M424
// @match        https://twitter.com/*
// @match        https://twitter.com/i/tweetdeck
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// @run-at       document-end
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/locale/ja.js
// ==/UserScript==

/**
 * TwitterもといXが買収されたことにより、tweetdeckが有料化したため、
 * 下記の拡張機能を使用して旧TweetDeckを再現している
 *  ･OldTweetDeck
 *
 * また、URLが変更になったので@matchを更新
 *  旧URL: https://tweetdeck.twitter.com/
 */

(() => {
    'use strict';
    const interval_ms = 1000; // 更新頻度(ms)
    let intervalId = null;
    dayjs.locale('ja');
    // console.log(`[ReplaceTwitterTimestamps] ${location.href}`);

    const isTweetDeck = () => location.href === 'https://twitter.com/i/tweetdeck';
    const selector = isTweetDeck() ? 'time.tweet-timestamp[datetime]' : 'main section time[datetime]'; // 時間が記されたセレクタ
    const replaceTimestamp = () => {
        const timeElems = document.querySelectorAll(selector);
        const format = `YY/MM/DD${isTweetDeck() ? '<br>(ddd)' : '(ddd) '}HH:mm`;
        timeElems.forEach( elem => {
            const timestamp = elem.getAttribute('datetime'); // ISO8601 format string
            const datetime = dayjs(timestamp).format(format);
            const newElem = document.createElement('span');
            newElem.setAttribute('id', 'm424-datetime');
            newElem.setAttribute('datetime', timestamp);
            newElem.setAttribute('style', 'text-align: right; font-size: 0.9rem; min-width: 55px;');
            newElem.innerHTML = datetime;

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