// ==UserScript==
// @name         M424.Mouse
// @namespace    M424.Mouse
// @version      1.0.2
// @description  マウスに関する機能を提供するクラス
// @author       M424
// @require      M424.js
// @require      M424.Type.js
// ==/UserScript==
'use strict';

/**
 * マウスに関する機能を提供するクラス
 * @class
 */
M424.Mouse = class Mouse extends M424.Base {

    /**
     * マウスイベント名
     * @static
     */
    static EVENT_NAMES = {
        CLICK:          'click',        // 要素がクリックされたときに発生します。
        DBLCLICK:       'dblclick',     // 要素がダブルクリックされたときに発生します。
        MOUSE_DOWN:     'mousedown',    // マウスボタンが要素の上で押されたときに発生します。
        MOUSE_UP:       'mouseup',      // マウスボタンが要素の上で離されたときに発生します。
        MOUSE_OVER:     'mouseover',    // マウスポインターが要素の上に乗ったときに発生します。
        MOUSE_OUT:      'mouseout',     // マウスポインターが要素の上から離れたときに発生します。
        MOUSE_ENTER:    'mouseenter',   // マウスポインタが要素に入った瞬間に発生します。(子要素は含まない)
        MOUSE_LEAVE:    'mouseleave',   // マウスポインタが要素から出た瞬間に発生します。(子要素は含まない)
        MOUSE_MOVE:     'mousemove',    // マウスポインタが要素上を移動するたびに発生します。
        CONTEXT_MENU:   'contextmenu',  // 要素上で右クリックしたときに発生します。
    };

    /**
     * マウスイベントを監視する要素
     * @type {Element}
     * @private
     */
    #element;

    /**
     * マウス位置
     * @type {{x: number, y: number}}
     * @private
     */
    #position;

    /**
     * マウスポインタが要素内に存在するか
     * @type {boolean}
     * @private
     */
    #isMouseWithin;

    /**
     * マウスイベントに関するコールバック関数群
     * @type {Object.<string, Function>}
     * @private
     */
    #callbacks;

    /**
     * コンストラクタ
     * @constructor
     * @param {Element} element - マウスイベントを監視する要素
     * @param {Boolean} [isDebugMode=false] - デバックログを出力するか
     */
    constructor(element, isDebugMode=false) {
        super('Mouse', isDebugMode);
        this.#element = element;
        this.#position = { x: -1, y: -1 };
        this.#isMouseWithin = false;
        this.#callbacks = {};
        this.#initialize();
    }

    /**
     * 初期処理 - 各種マウスイベントの登録処理
     *  - mouseenter - マウスポインタが要素に入った瞬間に発生します。
     *  - mouseleave - マウスポインタが要素から出た瞬間に発生します。
     *  - mousemove - マウスポインタが要素上を移動するたびに発生します。
     * @private
     */
    #initialize() {
        const { MOUSE_ENTER, MOUSE_LEAVE, MOUSE_MOVE } = M424.Mouse.EVENT_NAMES;
        this.#element.addEventListener( MOUSE_ENTER, ev => this.#handleMouseEvent(ev) );
        this.#element.addEventListener( MOUSE_LEAVE, ev => this.#handleMouseEvent(ev) );
        this.#element.addEventListener( MOUSE_MOVE,  ev => this.#handleMouseEvent(ev) );
    }

    /**
     * マウスに関するイベントハンドラ
     * @param {MouseEvent} mouseEvent - マウスイベントオブジェクト
     * @throws {Error} イベントタイプが不明な場合に例外が発生します
     * @private
     */
    #handleMouseEvent(mouseEvent) {
        const eventType = mouseEvent.type;
        switch( eventType ) {
            case M424.Mouse.EVENT_NAMES.MOUSE_ENTER:
                this.#handleMouseEnter(mouseEvent);
                break;
            case M424.Mouse.EVENT_NAMES.MOUSE_LEAVE:
                this.#handleMouseLeave(mouseEvent);
                break;
            case M424.Mouse.EVENT_NAMES.MOUSE_MOVE:
                this.#handleMouseMove(mouseEvent);
                break;
            default:
                throw new Error(`Unknown event type: ${eventType}`);
        }
    }

    /**
     * mouseenterに関するイベントハンドラ
     * @param {MouseEvent} mouseEvent - マウスイベントオブジェクト
     * @private
     */
    #handleMouseEnter(mouseEvent) {
        this.#isMouseWithin = true;
        this.#executeCallback( mouseEvent.type, mouseEvent );
    }

    /**
     * mouseleaveに関するイベントハンドラ
     * @param {MouseEvent} mouseEvent - マウスイベントオブジェクト
     * @private
     */
    #handleMouseLeave(mouseEvent) {
        this.#isMouseWithin = false;
        this.#executeCallback( mouseEvent.type, mouseEvent );
    }

    /**
     * mousemoveに関するイベントハンドラ
     * @param {MouseEvent} mouseEvent - マウスイベントオブジェクト
     * @private
     */
    #handleMouseMove(mouseEvent) {
        this.#position = { x: mouseEvent.clientX, y: mouseEvent.clientY };
        this.#executeCallback( mouseEvent.type, mouseEvent );
    }

    /**
     * マウスイベントに関するコールバック関数を設定する
     * @param {string} eventName - イベント名
     * @param {Function} callback - eventNameで実行するコールバック関数
     * @throws {TypeError} callbackが関数でない場合に例外が発生します
     * @throws {Error} eventNameがmouseに関するイベントでない場合に例外が発生します
     */
    setCallback(eventName, callback) {
        if( M424.Type.isFunction(callback) ) {
            if( Object.values(M424.Mouse.EVENT_NAMES).includes(eventName) ) {
                this.#callbacks[eventName] = callback;
            } else {
                throw new Error(`Invalid event name: ${eventName}`);
            }
        } else {
            throw new TypeError(`Invalid callback function for event: ${eventName}`);
        }
    }

    /**
     * マウスイベントに関するユーザ定義のコールバック関数を実行する
     * @param {string} eventName - イベント名
     * @param {MouseEvent} event - マウスイベントオブジェクト
     * @private
     */
    #executeCallback(eventName, event) {
        if( eventName in this.#callbacks && M424.Type.isFunction(this.#callbacks[eventName]) ) {
            this.#callbacks[eventName](event);
        }
    }

    /**
     * XY座標が範囲内にあるかどうかを判定する
     * @param {Number} startX - X座標の範囲の開始値
     * @param {Number} endX - X座標の範囲の終了値
     * @param {Number} startY - Y座標の範囲の開始値
     * @param {Number} endY - Y座標の範囲の終了値
     * @param {Boolean} [inclusive=false] - 範囲に開始値と終了値を含むかどうか (省略可能)
     * @returns {Boolean} true: XY座標が範囲内に含まれる
     */
    isInRange(startX, endX, startY, endY, inclusive = false) {
        return this.isInRangeX(startX, endX, inclusive) && this.isInRangeY(startY, endY, inclusive);
    }

    /**
     * X座標が範囲内にあるかどうかを判定する
     * @param {Number} start - 範囲の開始値
     * @param {Number} end - 範囲の終了値
     * @param {Boolean} [inclusive=false] - 範囲に開始値と終了値を含むかどうか (省略可能)
     * @returns {Boolean} true: X座標が範囲内に含まれる
     */
    isInRangeX(start, end, inclusive = false) {
        return M424.Util.isInRange(this.#position.x, start, end, inclusive);
    }

    /**
     * Y座標が範囲内にあるかどうかを判定する
     * @param {Number} start - 範囲の開始値
     * @param {Number} end - 範囲の終了値
     * @param {Boolean} [inclusive=false] - 範囲に開始値と終了値を含むかどうか (省略可能)
     * @returns {Boolean} true: Y座標が範囲内に含まれる
     */
    isInRangeY(start, end, inclusive = false) {
        return M424.Util.isInRange(this.#position.y, start, end, inclusive);
    }

    /**
     * マウスポインタが要素内に含まれているかどうかを判定する
     * @returns {boolean} マウスポインタが要素内に含まれているかどうか
     */
    get isMouseWithin() {
        return this.#isMouseWithin;
    }

    /**
     * マウスの座標を取得します。
     * @returns {{x: number, y: number}} マウスの座標を示すオブジェクト
     */
    get position() {
        return this.#position;
    }

    /**
     * マウスのX座標を取得します。
     * @returns {number} マウスのX座標
     */
    get x() {
        return this.#position.x;
    }

    /**
     * マウスのY座標を取得します。
     * @returns {number} マウスのY座標
     */
    get y() {
        return this.#position.y;
    }

    /**
     * マウスの座標を設定します。
     * @param {number} clientX - マウスのクライアントX座標
     * @param {number} clientY - マウスのクライアントY座標
     */
    setPos(clientX, clientY) {
        this.#position = { x: clientX, y: clientY };
    }

    /**
     * マウスの座標を設定します。
     * @param {{x: number, y: number}} clientPos - マウス座標情報
     */
    set position(clientPos) {
        this.#position = clientPos;
    }

    /**
     * マウスのX座標を設定します。
     * @param {number} clientX - マウスのクライアントX座標
     */
    set x(clientX) {
        this.#position.x = clientX;
    }

    /**
     * マウスのY座標を設定します。
     * @param {number} clientY - マウスのクライアントY座標
     */
    set y(clientY) {
        this.#position.y = clientY;
    }
};