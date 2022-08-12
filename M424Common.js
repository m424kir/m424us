// ==UserScript==
// @name         M424Common
// @version      1.0
// @description  commonクラス
// @author       M424
// ==/UserScript==


// 基底クラス
class M424Base {
    #isDebug;
    constructor(isDebugMode = false) {
        this.#isDebug = isDebugMode;
    }
    log(...msg) {
        console.log(`[${SCRIPTID}]`, ...msg);
    }
    debug(...msg) {
        if( this.#isDebug ) { this.log(...msg); }
    }
}

/**
 * Elementの属性を一括登録する
 * @param {*} obj 
 */
Element.prototype.setAttributes = (obj) => {
    for( let i of Object.entries(obj) ) {
        this.setAttribute(i[0], i[1]);
    }    
}

/**
 * 自身が指定引数範囲内に含まれるか判定する
 * @param {Number} a 
 * @param {Number} b 
 * @param {Boolean} inclusive 
 * @returns 
 */
Number.prototype.between = function(a, b, inclusive) {
    let min = Math.min.apply(Math, [a, b]);
    let max = Math.max.apply(Math, [a, b]);
    return inclusive ? min <= this && this <= max : min < this && this < max;
}