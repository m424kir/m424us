// ==UserScript==
// @name         say
// @namespace    M424
// @version      1.0
// @description  say
// @author       M424
// @match        https://www.youtube.com/*
// @exclude      https://www.youtube.com/live_chat*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @require      https://raw.githubusercontent.com/m424kir/m424us/master/M424Common.js
// ==/UserScript==

(async function() {
    'use strict';
    const SCRIPTID = 'say';
    console.log("START");
    await M424.sleep(1000);
    console.log("END");
})();