// ==UserScript==
// @name         Twitterのツイート時間を絶対時間に置き換える
// @namespace    M424
// @version      0.1
// @description  Twitter上のツイートに表示される時間をYYYY/MM/DD (aaa) mm:ddに置換する
// @author       M424
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// @updateURL    https://github.com/m424kir/m424us/raw/master/Twitter%E3%81%AE%E3%83%84%E3%82%A4%E3%83%BC%E3%83%88%E6%99%82%E9%96%93%E3%82%92%E7%B5%B6%E5%AF%BE%E6%99%82%E9%96%93%E3%81%AB%E7%BD%AE%E3%81%8D%E6%8F%9B%E3%81%88%E3%82%8B.user.js
// @downloadURL  https://github.com/m424kir/m424us/raw/master/Twitter%E3%81%AE%E3%83%84%E3%82%A4%E3%83%BC%E3%83%88%E6%99%82%E9%96%93%E3%82%92%E7%B5%B6%E5%AF%BE%E6%99%82%E9%96%93%E3%81%AB%E7%BD%AE%E3%81%8D%E6%8F%9B%E3%81%88%E3%82%8B.user.js
// ==/UserScript==

(function() {
    'use strict';
    // Your code here...
    let WEEK_LABEL = ['日', '月', '火', '水', '木', '金', '土'];

    let toFormatedDateString = function(date) {
        // yyyy/mm/dd (aaa) HH:MM
        let ret = "";
        ret += date.getFullYear();
        ret += '/';
        ret += ('0' + (date.getMonth() + 1)).slice(-2);
        ret += '/';
        ret += ('0' + date.getDate()).slice(-2);
        ret += ' (';
        ret += WEEK_LABEL[(((date.getDay() % WEEK_LABEL.length) + WEEK_LABEL.length) % WEEK_LABEL.length)];
        ret += ') ';
        ret += ('0' + date.getHours()).slice(-2);
        ret += ':';
        ret += ('0' + date.getMinutes()).slice(-2);
        return ret;
    }

    let f = function() {
        document.querySelectorAll('main div[data-testid="primaryColumn"] section article a[href*="/status/"] time').forEach(function(e) {
            let a = e.parentNode;
            let span = document.createElement('span');
            let s0 = e.getAttribute('datetime');
            let s1 = toFormatedDateString(new Date(s0));
            span.setAttribute('datetime', s0);
            span.setAttribute('local-datetime', s1);
            span.textContent = s1;
            a.appendChild(span);
            a.removeChild(e);
        });
    };

    setInterval(f, 1000);
})();