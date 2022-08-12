// ==UserScript==
// @name         Twitterのツイート時間を絶対時間に置き換える
// @namespace    M424
// @version      0.1
// @description  Twitter上のツイートに表示される時間をYYYY/MM/DD (aaa) mm:ddに置換する
// @author       M424
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
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