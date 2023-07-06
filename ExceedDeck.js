// ==UserScript==
// @name         ExceedDeck
// @namespace    M424
// @version      0.3.0
// @description  TweetDeckに関するカスタマイズ
// @author       M424
// @match        https://tweetdeck.twitter.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// @updateURL    https://github.com/m424kir/m424us/raw/master/ExceedDeck.js
// @downloadURL  https://github.com/m424kir/m424us/raw/master/ExceedDeck.js
// ==/UserScript==

(function() {
    'use strict';

    /**
     * 機能1: 画像をマウスホイールで切り替える
     *  - 下方向のホイールで｢次の画像｣、上方向のホイールで｢前の画像｣に切り替える
     */
    {
        const imageContainerSelector = 'div[role=group]';
        const nextButtonSelector = 'div[aria-label=次のスライド][role=button]';
        const prevButtonSelector = 'div[aria-label=前のスライド][role=button]';

        /**
         * マウスホイール量によって、画像を切り替える
         * @param {MouseEvent} e - マウスイベント
         */
        const switchImageOnWheel = (e) => {
            const imageContainer = document.querySelector(imageContainerSelector);
            if( !imageContainer ) return;

            const imageSwitchButtonSelector = e.deltaY > 0 ? nextButtonSelector : prevButtonSelector;
            imageContainer.querySelector(imageSwitchButtonSelector)?.click();
        };
        document.addEventListener('wheel', switchImageOnWheel);
    }

    /**
     * 機能2: カラムを(横)スクロールできるようにする
     *  - 下記の箇所でスクロールすると、カラムが(横)スクロールする
     *    - カラムヘッダ上
     *    - 下端のスクロールバー上
     */
    {
        const mainContentsSelector = 'main[role=main]';
        const scrollContentsSelector = 'main[role=main] > div';
        const sideMenuSelector = 'div.css-1dbjc4n.r-18u37iz.r-5swwoo.r-bnwqim';
        const columnSelector = 'div.css-1dbjc4n.r-cpa5s6';
        const columnHeaderSelector = 'div.css-1dbjc4n[data-testid=root]';

        /**
         * 特定の位置でマウスホイールした場合、横スクロールを行う
         * @param {MouseEvent} e - マウスイベント
         */
        const horizontalScrollOnWheel = (e) => {
            const mainContents = document.querySelector(mainContentsSelector);
            const scrollContents = document.querySelector(scrollContentsSelector);

            // メインコンテンツ上に存在するか
            const sideMenuWidth = document.querySelector(sideMenuSelector)?.clientWidth;
            const isMouseOnMainContents = e.clientX > sideMenuWidth;

            // スクロール可能な位置に存在するか
            const columnHeaderHeight = document.querySelector(columnHeaderSelector)?.offsetHeight;
            const columnHeight = document.querySelector(columnSelector)?.clientHeight;
            const isMouseOnHorizontalScrollable = isMouseOnMainContents && (
                e.clientY <= columnHeaderHeight  // カラムヘッダー上に存在する
                || e.clientY >= columnHeight        // スクロールバー上に存在する
            );
            if( !scrollContents || !isMouseOnHorizontalScrollable ) return;

            // スクロール量を取得する
            const scrollAmount = () => {
                const mainContentsWidth = mainContents.clientWidth;
                const columnWidth = document.querySelector(columnSelector).clientWidth;
                const columnItems = document.querySelectorAll(columnSelector).length;

                const maxScrollAmount = columnWidth * columnItems - mainContentsWidth;
                const currentScrollAmount = Math.ceil(scrollContents.scrollLeft);

                // 制限値を超えた場合はスクロールを行わない
                if( (e.deltaY < 0 && currentScrollAmount === 0) || (e.deltaY > 0 && currentScrollAmount > maxScrollAmount) ) {
                    return 0;
                }
                return Math.sign(e.deltaY) * columnWidth;
            }
            scrollContents.scrollLeft += scrollAmount();
        };
        document.addEventListener('wheel', horizontalScrollOnWheel);
    }
})();