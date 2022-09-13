// ==UserScript==
// @name         ExceedTube Wrapper
// @namespace    M424
// @version      1.0
// @description  Youtubeカスタムスクリプト[ExceedTube]を呼び出すラッパースクリプト
// @author       M424
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/M424Common.js
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/ExceedTube.js
// ==/UserScript==

(function() {
    'use strict';
    const SCRIPTID = 'ExceedTube';

    // ExceedTube生成
    let exceedTube = new ExceedTube(SCRIPTID, false);
})();