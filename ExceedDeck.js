// ==UserScript==
// @name         ExceedDeck
// @namespace    M424
// @version      0.4.1
// @description  TweetDeckに関するカスタマイズ
// @author       M424
// @match        https://twitter.com/i/tweetdeck
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// ==/UserScript==

/**
 * TwitterもといXが買収されたことにより、tweetdeckが有料化したため、
 * 下記の拡張機能を使用して旧TweetDeckを再現している
 *  ･OldTweetDeck
 *
 * また、URLが変更になったので@matchを更新
 *  旧URL: https://tweetdeck.twitter.com/
 */

(function() {
    'use strict';

    /**
     * 機能1: 画像をマウスホイールで切り替える
     *  - 下方向のホイールで｢次の画像｣、上方向のホイールで｢前の画像｣に切り替える
     */
    {
        const imageContainerSelector = '#open-modal .js-modal-panel';
        const nextButtonSelector = '.mdl-media-next';
        const prevButtonSelector = '.mdl-media-prev';

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
        const mainContentsSelector = '.js-app-content.app-content';
        const scrollContentsSelector = '.js-app-columns-container.app-columns-container';
        const sideMenuSelector = 'header.js-app-header';
        const columnSelector = 'section.js-column.column';
        const columnHeaderSelector = 'header.column-header';

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
                //console.log(mainContentsWidth, columnWidth, columnItems, maxScrollAmount, currentScrollAmount);
                return Math.sign(e.deltaY) * columnWidth;
            }
            scrollContents.scrollLeft += scrollAmount();
        };
        document.addEventListener('wheel', horizontalScrollOnWheel);
    }
})();