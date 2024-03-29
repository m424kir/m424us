// ==UserScript==
// @name         M424.DOM
// @namespace    M424.DOM
// @version      1.0.5
// @description  DOMに関する機能を提供する名前空間
// @author       M424
// @require      M424.js
// @require      M424.Type.js
// ==/UserScript==
'use strict';

/**
 * DOMに関する機能を提供する名前空間
 * @namespace
 */
M424.DOM = {

    /**
     * Elementの属性を一括登録する
     * @param {Element} elem - 属性を設定する対象の要素
     * @param {Object} attributes - {key: value}型の連想配列
     */
    setAttributes: (elem, attributes) => {
        Object.entries(attributes).forEach( ([key, value]) => {
            elem.setAttribute(key, value);
        });
    },

    /**
     * Elementの属性を一括登録する（名前空間指定可能）
     * @param {string} namespace - 属性の名前空間
     * @param {Element} elem - 属性を設定する対象の要素
     * @param {Object} attributes - {key: value}型の連想配列
     */
    setAttributesNS: (namespace, elem, attributes) => {
        Object.entries(attributes).forEach( ([key, value]) => {
            // jsでは変数名に-(ハイフン)を使用できないため、変数名は_(アンダーバー)で代用しているため戻す
            elem.setAttributeNS(namespace, key.replace(/_/g, '-'), value);
        });
    },

    /**
     * 引数で渡されたデータ取得関数からデータが取得されるまで待機する関数
     * @param {Node} observedElement - 監視対象のDOM要素
     * @param {Function} getterFunc - データ取得関数
     * @param {number} [timeout=10000] - タイムアウトまでの待機時間（ミリ秒）
     * @returns {Promise} データが取得された場合に解決されるPromise
     * @throws {TypeError} getterFuncが関数でない場合に例外をスローします
     * @throws {TypeError} timeoutが数値でない場合に例外をスローします
     * @async
     */
    waitForData: (observedElement, getterFunc, timeout = 10000) => {
        if( !M424.Type.isNode(observedElement)  ) {
            throw new TypeError('引数[baseElement]はDOM要素[Element]である必要があります。');
        }
        if( !M424.Type.isFunction(getterFunc) ) {
            throw new TypeError('引数[getterFunc]は関数[function]である必要があります。');
        }
        if( !M424.Type.isNumber(timeout) ) {
            throw new TypeError('引数[timeout]は数値[number]である必要があります。');
        }

        return new Promise( (resolve, reject) => {

            let overallTimeoutTimer;
            let observer;

            /**
             * 実行結果を処理する内部メソッド
             * @param {any} result - 実行結果となる要素
             * @param {string} [error] - エラーメッセージ（オプション）
             */
            const onDone = (result, error) => {
                clearTimeout(overallTimeoutTimer);
                observer?.disconnect();
                error ? reject(error) : resolve(result);
            };

            /**
             * データの取得を実行する内部メソッド
             * @returns {boolean} true: データが取得できた
             */
            const onExecute = () => {
                const result = getterFunc();
                if( M424.Type.isNotNullAndNotUndefined(result) ) {
                    onDone(result);
                    return true;
                }
                return false;
            };

            // 既に存在する場合は結果を返して終了
            if( onExecute() ) return;

            // タイムアウトの設定
            overallTimeoutTimer = setTimeout( () => {
                onDone(null, new M424.TimeoutError('データの取得に失敗しました'));
            }, timeout);

            // 対象データが取得できるまで、DOMの変更を監視する
            observer = new MutationObserver( onExecute );
            observer.observe(observedElement, {childList: true, subtree: true});
        });
    },

    /**
     * 指定されたセレクタが取得できるまで待機する関数
     * @param {string} selector - 取得するセレクタ
     * @param {Element|Document|DocumentFragment} baseElement - 基底エレメント
     * @param {number} [timeout=10000] - タイムアウトまでの待機時間（ミリ秒）
     * @returns {Promise<Element>} セレクタが取得された場合に解決されるPromise
     * @throws {TypeError} selectorが文字列でない場合に例外をスローします
     * @throws {TypeError} timeoutが数値でない場合に例外をスローします
     * @async
     */
    waitForSelector: (selector, baseElement=document.documentElement, timeout = 10000) => {
        if( !M424.Type.isString(selector) ) {
            throw new TypeError('引数[selector]は文字列[string]である必要があります。');
        }
        if( !baseElement || !baseElement.querySelector ) {
            throw new TypeError('引数[baseElement]はDOM要素[Element]である必要があります。');
        }
        if( !M424.Type.isNumber(timeout) ) {
            throw new TypeError('引数[timeout]は数値[number]である必要があります。');
        }
        return M424.DOM.waitForData(baseElement, () => baseElement.querySelector(selector), timeout);
    },

    /**
     * 指定されたElementからCSS情報を取得する関数
     * @param {Element} element - CSS情報を取得するElement
     * @returns {CSSStyleDeclaration} CSS情報
     * @throws {TypeError} 引数がElement型でない場合に例外をスローします
     * @throws {Error} windowオブジェクトがgetComputedStyle関数を持っていない場合に例外をスローします
     */
    getCSS: (element) => {
        if( !M424.Type.isElement(element) ) {
            throw new TypeError('引数はElement型である必要があります。');
        }
        else if (typeof window.getComputedStyle !== 'function') {
            throw new Error('windowオブジェクトにgetComputedStyle関数が存在しません。');
        }
        return window.getComputedStyle(element);
    },

    /**
     * [async] 指定されたセレクタの要素が取得できるまで待機し、取得後にCSS情報を返す関数
     * @param {string} selector - CSSセレクタ
     * @param {number} [timeout=10000] - タイムアウト時間（ミリ秒）（省略可能）
     * @returns {Promise<CSSStyleDeclaration>} CSS情報が取得された場合に解決されるPromise
     * @throws {TypeError} 引数が正しい型でない場合に例外をスローします
     * @throws {Error} 要素の取得に失敗した場合に例外をスローします
     */
    waitForCSS: async (selector, timeout = 10000) => {
        const elem = await M424.DOM.waitForSelector(selector, document, timeout);
        return M424.DOM.getCSS(elem);
    },

    /**
     * [async] 指定されたセレクタのプロパティ値が取得できるまで待機する関数
     * @param {string} selector - CSSセレクタ
     * @param {string} property - 取得したいプロパティ名
     * @param {number} [timeout=10000] - タイムアウト時間（ミリ秒）
     * @returns {Promise<string>} プロパティ値が取得された場合に解決されるPromise
     */
    waitForPropertyValue: async (selector, property, timeout = 10000) => {
        const css = await M424.DOM.waitForCSS(selector, timeout);
        return M424.DOM.waitForData( () => css.getPropertyValue(property), timeout);
    },

    /**
     * SVG画像オブジェクトを生成する
     * @param {Object} svgAttributes - SVGタグの属性設定(連想配列)
     * @param {Object} pathAttributes - PATHタグの属性設定(連想配列)が格納された配列
     * @returns {SVGElement} 生成されたSVG画像Element
     */
    createSvg: (svgAttributes, pathAttributes) => {
        const svgElem  = document.createElementNS(M424.Consts.NAMESPACE_URI.SVG, 'svg');

        M424.DOM.setAttributesNS(null, svgElem, svgAttributes);
        const paths = pathAttributes.map(attributes => {
            const pathElem = document.createElementNS(M424.Consts.NAMESPACE_URI.SVG, 'path');
            M424.DOM.setAttributesNS(null, pathElem, attributes);
            return pathElem;
        });
        svgElem.append(...paths);

        return svgElem;
    },

    /**
     * テキスト入力欄にフォーカスしているかを判定する
     * @param {Event} evt - イベントオブジェクト
     * @returns true: テキスト入力欄にフォーカスしている
     */
    isFocusTextInputField: (evt) => {
        const textFields = ['EMBED', 'INPUT', 'OBJECT', 'TEXTAREA', 'IFRAME'];
        return ( textFields.includes(document.activeElement.tagName) || evt.target.isContentEditable );
    },
};
