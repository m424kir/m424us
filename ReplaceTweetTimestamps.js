// ==UserScript==
// @name         Replace tweet timestamps with absolute time
// @namespace    M424
// @version      1.0
// @description  各ツイートに表示されるタイムスタンプを絶対時間(YYYY/MM/DD (aaa) mm:dd)に置換する
// @author       M424
// @match        https://twitter.com/*
// @match        https://tweetdeck.twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// @run-at       document-end
// @updateURL    https://github.com/m424kir/m424us/raw/master/ReplaceTweetTimestamps.js
// @downloadURL  https://github.com/m424kir/m424us/raw/master/ReplaceTweetTimestamps.js
// ==/UserScript==

(() => {
    'use strict';
    const url = window.location.href;
    // console.log(`[ReplaceTwitterTimestamps] ${url}`);

    /**
     * 各種設定
     *  - 環境毎に変更してください
     */
    const settings = {
        /**
         * 曜日表記
         */
        weekdays: ['日', '月', '火', '水', '木', '金', '土'],

        /**
         * 更新頻度(ms)
         */
        interval: 1000,
    };

    /**
     * タイムスタンプを絶対時間に更新する
     */
    const updateTimestamps = () => {

        /**
         * 対象サイトがTwitterDeckか判定する
         * @param {String} url
         * @returns true if TweetDeck, else Twitter
         */
        const isTwitterDeck = (url) => {
            return (url.match(/tweetdeck.twitter.com/) != null);
        }

        /**
         * `yyyy/mm/dd'フォーマットの文字列を生成する
         * @param {Date} date - タイムスタンプのDateオブジェクト
         * @returns 'yyyy/mm/dd'形式の文字列
         */
        const toFormattedDateString = (date) => {
            const year      = date.getFullYear();
            const month     = ('0' + (date.getMonth() + 1)).slice(-2);
            const day       = ('0' + date.getDate()).slice(-2);
            return `${year}/${month}/${day}`;
        }

        /**
         * `(aaa) HH:MM'フォーマットの文字列を生成する
         * @param {Date} date - タイムスタンプのDateオブジェクト
         * @returns '(aaa) HH:MM'形式の文字列
         */
        const toFormattedTimeString = (date) => {
            const dayOfWeek = settings.weekdays[date.getDay()];
            const hours     = ('0' + date.getHours()).slice(-2);
            const minutes   = ('0' + date.getMinutes()).slice(-2);
            return `(${dayOfWeek}) ${hours}:${minutes}`;
        }

        /**
         * タイムスタンプの文字列を置き換える
         * @param {Element} elem - 置き換えるタイムスタンプElement
         */
        const replaceTimestamp = (elem) => {
            const timestamp = elem.getAttribute('datetime');
            const date = new Date(timestamp);
            const formatted_date = toFormattedDateString(date);
            const formatted_time = toFormattedTimeString(date);
            const span = document.createElement('span');
            span.setAttribute('datetime', timestamp);
            span.setAttribute('local-datetime', `${formatted_date} ${formatted_time}`);
            if( isTwitterDeck(url) ) {
                /* 恐らく拡張機能「ModernDeck」によるカスタマイズが入っているので注意 */
                span.setAttribute('class', 'tweet-timestamp js-timestamp txt-mute flex-shrink--0');
                span.setAttribute('style', 'text-align:right;');
                span.innerHTML = `${formatted_date}<br>${formatted_time}`;
            }
            else {
                span.textContent = `${formatted_date} ${formatted_time}`;
            }
            // 一度置き換えたDOMを再度置換しないようにDOM自体を置き換える
            elem.replaceWith(span);
        }

        const query = (url) => {
            return isTwitterDeck(url)
                ? '#container > div time'
                : 'main div[data-testid="primaryColumn"] section article a[href*="/status/"] time'
            ;
        };
        // タイムスタンプ一覧を取得し、絶対時間に置き換える
        const targets = document.querySelectorAll(query(url));
        // console.log(`[ReplaceTwitterTimestamps] ${new Date()}: ${targets.length}`);
        targets.forEach( (elem) => {
            replaceTimestamp(elem);
        });
    };

    // ツイートは随時更新されるため、定期的に置き換える
    setInterval(updateTimestamps, settings.interval);
})();
