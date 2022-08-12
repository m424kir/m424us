// ==UserScript==
// @name         TweetDeckのツイート時間を絶対時間に置き換える
// @namespace    M424
// @version      0.1
// @description  TweetDeck(+ModernDeck Addon)上のツイートに表示される時間をYYYY/MM/DD (aaa) mm:ddに置換する
// @author       M424
// @match        https://tweetdeck.twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tweetdeck.twitter.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let WEEK_LABEL = ['日', '月', '火', '水', '木', '金', '土'];

    let toFormattedDateString = function(date) {
        // yyyy/mm/dd
        let ret = "";
        ret += (date.getFullYear());
        ret += '/';
        ret += ('0' + (date.getMonth() + 1)).slice(-2);
        ret += '/';
        ret += ('0' + date.getDate()).slice(-2);
        return ret;
    }
    let toFormattedTimeString = function(date) {
        // (aaa) HH:MM
        let ret = "";
        ret += '(';
        ret += WEEK_LABEL[(((date.getDay() % WEEK_LABEL.length) + WEEK_LABEL.length) % WEEK_LABEL.length)];
        ret += ') ';
        ret += ('0' + date.getHours()).slice(-2);
        ret += ':';
        ret += ('0' + date.getMinutes()).slice(-2);
        return ret;
    }

    let f = function() {
        document.querySelectorAll('#container > div time').forEach(function(current) {
            let parrent = current.parentNode;
            let span = document.createElement('span');
            let sDatetime_attribute = current.getAttribute('datetime');
            let tweet_date = new Date(sDatetime_attribute);
            let sDate = toFormattedDateString(tweet_date);
            let sTime = toFormattedTimeString(tweet_date);
            span.setAttribute('datetime', sDatetime_attribute);
            span.setAttribute('local-datetime', sDate + ' ' + sTime);
            span.setAttribute('class', 'tweet-timestamp js-timestamp txt-mute flex-shrink--0');
            span.setAttribute('style', 'text-align:right;');
            span.innerHTML = sDate + '<br>' + sTime;
            parrent.appendChild(span);
            parrent.removeChild(current);
        });
    };

    setInterval(f, 1000);
})();