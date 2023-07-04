// ==UserScript==
// @name         M424
// @namespace    M424
// @version      1.1.0
// @description  独自定義の機能を提供する名前空間
// @author       M424
// ==/UserScript==
'use strict';

/**
 * 独自定義の機能を提供する名前空間
 * @namespace
 */
const M424 = {};

/**
 * 基底クラス
 * @class
 */
M424.Base = class Base {

    /**
     * ログレベル
     * @static
     */
    static LOG_LEVEL = {
        INFO:  'info',
        DEBUG: 'debug',
        WARN:  'warn',
        ERROR: 'error',
    };

    /**
     * デバッグ出力を行うかのフラグ
     * @type {Boolean}
     * @private
     */
    #isDebug;

    /**
     * クラス識別子
     *  - ログ出力時に該当クラスを一意に識別するための文字列
     * @type {string}
     * @private
     */
    #classIdentifier;

    /**
     * @constructor
     * @param {string} classIdentifier - クラス識別子
     * @param {Boolean} [isDebugMode=false] - デバックログを出力するか
     */
    constructor(classIdentifier, isDebugMode = false) {
        this.#classIdentifier = classIdentifier;
        this.#isDebug = isDebugMode;
    }

    /**
     * クラス識別子を出力します
     * @returns {string} クラス識別子
     */
    get classIdentifier() { return this.#classIdentifier; }

    /**
     * デバッグモードかどうかを取得します
     * @returns {boolean} デバッグモードかどうか
     */
    get isDebugMode() { return this.#isDebug; }

    /**
     * infoログ出力
     * @param  {...any} msg - 出力メッセージ
     */
    log(...msg) {
        this.#outputLog(M424.Base.LOG_LEVEL.INFO, ...msg);
    }

    /**
     * debugログ出力
     *  - デバッグ出力ON(#isDebug===true)の場合のみ出力を行う
     * @param  {...any} msg - 出力メッセージ
     */
    debug(...msg) {
        if( this.#isDebug ) { this.#outputLog(M424.Base.LOG_LEVEL.DEBUG, ...msg); }
    }

    /**
     * warnログ出力
     * @param  {...any} msg - 出力メッセージ
     */
    warn(...msg) {
        this.#outputLog(M424.Base.LOG_LEVEL.WARN, ...msg);
    }

    /**
     * errorログ出力
     * @param  {...any} msg - 出力メッセージ
     */
    error(...msg) {
        this.#outputLog(M424.Base.LOG_LEVEL.ERROR, ...msg);
    }

    /**
     * ログ出力
     *  - 出力メッセージが複数の場合はスペースで区切られます
     * @param {string} logType - ログタイプ
     * @param  {...any} msg - 出力メッセージ
     * @private
     */
    #outputLog(logType, ...msg) {
        const logPrefix = `[${this.#classIdentifier}]`;

        if( logType === M424.Base.LOG_LEVEL.INFO ) {
            console.log(logPrefix, ...msg);
        }
        else if( logType === M424.Base.LOG_LEVEL.DEBUG ) {
            // Chromeだとconsole.debugが出力されないためlogを使用
            console.log(logPrefix, ...msg);
        }
        else if( logType === M424.Base.LOG_LEVEL.WARN ) {
            console.warn(logPrefix, ...msg);
        }
        else if( logType === M424.Base.LOG_LEVEL.ERROR ) {
            console.error(logPrefix, ...msg);
        }
        // 必要に応じて、他のログレベルに対応した処理を追加する
    }
};

/**
 * 定数を提供する名前空間
 * @namespace
 */
M424.Consts = {

    /**
     * イベントリスナー
     * @constant {Object}
     */
    EVENT: {
        MOUSE_MOVE:     'mousemove',
        MOUSE_ENTER:    'mouseenter',
        MOUSE_LEAVE:    'mouseleave',
        FOCUS:          'focus',
        BLUR:           'blur',
    },

    /**
     * namespace URI
     * @constant {Object}
     */
    NAMESPACE_URI: {
        SVG: 'http://www.w3.org/2000/svg',
    },

    /**
     * データ型
     * @constant {Object}
     */
    DATA_TYPE: {
        PRIMITIVE:  'primitive',  // プリミティブ型
        OBJECT:     'object',     // オブジェクト型
    },

    /**
     * プリミティブ型
     * @constant {Object}
     */
    PRIMITIVE_TYPE: {
        NULL:       'null',
        UNDEFINED:  'undefined',
        NUMBER:     'number',
        BIGINT:     'bigint',
        BOOLEAN:    'boolean',
        SYMBOL:     'symbol',
        STRING:     'string',
    },

    /**
     * オブジェクト型
     * @constant {Object}
     */
    OBJECT_TYPE: {
        OBJECT:     'object',
        FUNCTION:   'function',
    },
};


/**
 * システムに関する機能を提供する名前空間
 * @namespace
 */
M424.System = {

    /**
     * 指定時間（ミリ秒）だけ処理を一時停止する関数（精度はsetTimeoutに依存）
     * @param {number} ms - 一時停止する時間（ミリ秒）
     * @returns {Promise<void>} - 一時停止が終了した後に解決されるPromise
     * @async
     */
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    /**
     * 指定時間（ミリ秒）だけ処理を一時停止する関数（高精度）
     * @param {number} ms - 一時停止する時間（ミリ秒）
     * @returns {Promise<void>} - 一時停止が終了した後に解決されるPromise
     * @async
     */
    accurateSleep: (ms) => {
        return new Promise(resolve => {
            const start = performance.now();
            const delay = () => {
                ( performance.now() - start >= ms ) ? resolve() : requestAnimationFrame(delay);
            };
            requestAnimationFrame(delay);
        });
    },

    /**
     * 通常Throwできない箇所でエラーを発生させるラッパー関数(3項演算子等)
     * @param {string} message - エラーメッセージ
     * @param {Error} [type=Error] - エラーオブジェクトタイプ (extends Error)
     * @throws {TypeError} 引数 "type" が有効なエラーオブジェクトでない場合にスローされます
     * @example
     *  // 3項演算子の条件を満たさない場合にエラーを発生させる
     *  is(xxx) ? yyy : throwError('エラー');               // Error: エラー
     *  is(xxx) ? yyy : throwError('エラー', SyntaxError);  // SyntaxError: エラー
     *  is(xxx) ? yyy : throwError('エラー', Number);       // TypeError: 無効なエラーオブジェクトの型です。Errorクラスまたはそのサブクラスを指定してください。
     *
     */
    throwError: (message, type = Error) => {
        if( !(type === Error || type.prototype instanceof Error) ) {
            throw new TypeError("無効なエラーオブジェクトの型です。Errorクラスまたはそのサブクラスを指定してください。");
        }
        throw new type(message);
    },

    /**
     * 引数の指定を強制するための関数
     * @throws {TypeError} - 引数が指定されていない、または無効な値が渡された場合にエラーをスロー
     * @example
     *  // サンプルで実行する関数
     *  function greet(name = M424.System.mandatory()) {
     *      console.log(`こんにちは、${name}さん！！！！`);
     *  }
     *  greet();            // TypeError: 引数が指定されていない、または無効な値が渡されました。
     *  greet(undefined);   // TypeError: 引数が指定されていない、または無効な値が渡されました。
     *  greet("太郎");      // 処理が正常に実行される(こんにちは、太郎さん)
     *  greet(null);        // 処理が正常に実行される(こんにちは、nullさん)
     */
    mandatory: () => {
        throw new TypeError("引数が指定されていない、または無効な値が渡されました。");
    },
};

/**
 * 日付[yyyy/mm/dd]/時刻[hh:mm:ss]に関する機能を提供する名前空間
 * @namespace
 */
M424.DateTime = {
    /**
     * 以下のライブラリを使用しています
     *  - Day.js
     *      - https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
     *      - https://cdn.jsdelivr.net/npm/dayjs@1/locale/ja.js
     *      - https://cdn.jsdelivr.net/npm/dayjs@1/plugin/duration.js
     *      - https://cdn.jsdelivr.net/npm/dayjs@1/plugin/customParseFormat.js
     */

    /**
     * 日付や時刻のフォーマット定数
     * @constant {Object}
     */
    FORMATS: {
        DATE_TIME:              'YYYY/MM/DD HH:mm:ss',
        DATE_TIME_WITH_DAY:     'YYYY/MM/DD(ddd) HH:mm:ss',
        DATE_TIME_JP:           'YYYY年MM月DD日 HH時mm分ss秒',
        DATE_TIME_WITH_DAY_JP:  'YYYY年MM月DD日(ddd) HH時mm分ss秒',
        DATE:                   'YYYY/MM/DD',
        DATE_WITH_DAY:          'YYYY/MM/DD(ddd)',
        DATE_JP:                'YYYY年MM月DD日',
        DATE_WITH_DAY_JP:       'YYYY年MM月DD日(ddd)',
        TIME:                   'HH:mm:ss',
        TIME_JP:                'HH時mm分ss秒',
        TIME_12H_AMPM:          'hh:mm:ss(A)',
        TIME_12H_AMPM_JP:       'hh時mm分ss秒(A)',
    },

    /**
     * Day.jsで使用するプラグイン一覧 - この定義以外は許可しない
     * @constant {Object}
     */
    PLUGINS: {
        DURATION:            dayjs_plugin_duration,
        CUSTOM_PARSE_FORMAT: dayjs_plugin_customParseFormat,
    },

    /**
     * Day.jsプラグインが読み込まれていないならロードします
     * @param {M424.DateTime.PLUGINS} plugin - Day.jsプラグイン
     */
    ensurePluginLoaded: (plugin) => {
        const validPlugins = Object.values(M424.DateTime.PLUGINS);
        if( validPlugins.includes(plugin) && !plugin.$i ) {
            dayjs.extend(plugin);
        }
    },

    /**
     * ロケール情報を取得/設定する。
     * @param {string|undefined} [locale] 設定するロケール.
     * @returns {string} Day.jsに設定されているロケール情報
     * @description 引数の有無で処理が異なる
     *  - 引数有: ロケールを設定し、設定したロケール情報を返す。
     *  - 引数無: 現在のロケール情報を返す。
     */
    locale: (locale) => dayjs.locale(locale),

    /**
     * 日付からDay.jsオブジェクトを生成します
     * @param {string|number|Date|Dayjs} date - 日付文字列|ミリ秒|(Date|Day.js)オブジェクト
     * @param {string|undefined} [format] - フォーマット文字列
     * @returns {Dayjs} Day.jsオブジェクト
     */
    of: (date, format) => {
        const { locale, ensurePluginLoaded, PLUGINS, isValidFormat } = M424.DateTime;

        // ロケール及びプラグインのロード
        if( locale() !== 'ja' ) { locale('ja'); }
        ensurePluginLoaded(PLUGINS.CUSTOM_PARSE_FORMAT);

        const className = M424.Type.getClassName(date);
        if( className === 'String' && format && isValidFormat(format, false) ) {
            return dayjs(date, format);
        }
        return dayjs(date);
    },

    /**
     * 指定された時間と単位に基づいて、Durationオブジェクトを生成します。
     * @param {number|Object|string} duration - 単位に基づく数値|単位指定のオブジェクト|ISO 8601 duration文字列
     * @param {string} [unit] - 時間の単位(省略時はミリ秒)
     * @returns {dayjs.duration} Durationオブジェクト
     * @description 時間の単位[unit]は以下の値を指定できます。
     *  - 年: 'y', 'years'
     *  - 月: 'M', 'months'
     *  - 日: 'd', 'days'
     *  - 週: 'w', 'weeks'
     *  - 時: 'h', 'hours'
     *  - 分: 'm', 'minutes'
     *  - 秒: 's', 'seconds'
     *  - ミリ秒: 'ms', 'milliseconds'
     *
     *  @example オブジェクト指定の例:
     *   M424.DateTime.duration({
     *      seconds: 2,
     *      minutes: 2,
     *      months: 3,
     *      years: 1
     *   });
     */
    duration: (duration, unit) => {
        M424.DateTime.ensurePluginLoaded(M424.DateTime.PLUGINS.DURATION);

        const className = M424.Type.getClassName(duration);
        if( className === 'Number' && unit ) {
            const validPattern = /^(y(ears)?|M|m(illiseconds|inutes|onths|s)?|d(ays)?|w(eeks)?|h(ours)?|s(econds)?)$/;
            return dayjs.duration(duration, validPattern.test(unit) ? unit : undefined);
        }
        return dayjs.duration(duration);
    },

    /**
     * 日付のフォーマット文字列が有効かどうかを判定します。
     * @param {string} format - フォーマット文字列
     * @param {boolean} [isOutput=true] - 出力用の日付フォーマット形式かどうか
     * @returns {boolean} true: フォーマット文字列が有効
     * @description
     *  - 入力フォーマット(isOutput = false): M424.DateTime.ofで使用
     *  - 出力フォーマット(isOutput = true): M424.DateTime.formatで使用
     */
    isValidFormat: (format, isOutput=true) => {
        const validPattern = new RegExp(`[YMDHhmsSZ${isOutput ? 'dAa' : 'Xx'}]`, 'g');
        const invalidPattern = new RegExp(
            '(?<!Y)(Y|Y{3})(?!Y)|Y{5,}|M{5,}|D{3,}|H{3,}|h{3,}|m{3,}|s{3,}|Z{3,}|S{4,}|'
             + (isOutput ? '(?<!S)S{1,2}(?!S)|d{5,}|A{2,}|a{2,}' : 'X{2,}|x{2,}'), 'g'
        );
        return validPattern.test(format) && !invalidPattern.test(format);
    },

    /**
     * 日付を指定したフォーマットで文字列として返します。
     * @param {string|number|Date|Dayjs} date - 日付文字列|ミリ秒|(Date|Day.js)オブジェクト
     * @param {string|undefined} [format] - フォーマット文字列
     * @returns {string} フォーマットされた日付文字列
     */
    format: (date, format) => {
        const datetime = M424.DateTime.of(date);
        if( format && M424.DateTime.isValidFormat(format, true) ) {
            return datetime.format(format);
        }
        return datetime.format(); // default format(ISO8601)
    },

    /**
     * 日付を"YYYY/MM/DD HH:mm:ss"形式の文字列に変換します。
     * @param {string|number|Date|Dayjs} date - 日付文字列|ミリ秒|(Date|Day.js)オブジェクト
     * @returns {string} "YYYY/MM/DD HH:mm:ss"形式の文字列
     */
    toDateTime: (date) => M424.DateTime.format(date, M424.DateTime.FORMATS.DATE_TIME),

    /**
     * 日付を"YYYY/MM/DD"形式の文字列に変換します。
     * @param {string|number|Date|Dayjs} date - 日付文字列|ミリ秒|(Date|Day.js)オブジェクト
     * @returns {string} "YYYY/MM/DD"形式の文字列
     */
    toDate: (date) => M424.DateTime.format(date, M424.DateTime.FORMATS.DATE),

    /**
     * 日付を"HH:mm:ss"形式の文字列に変換します。
     * @param {string|number|Date|Dayjs} date - 日付文字列|ミリ秒|(Date|Day.js)オブジェクト
     * @returns {string} "HH:mm:ss"形式の文字列
     */
    toTime: (date) => M424.DateTime.format(date, M424.DateTime.FORMATS.TIME),

    /**
     * 日付をUnixエポック(1970/01/01 00:00:00 UTC)からの経過秒数に変換します
     * @param {string|number|Date|Dayjs} date - 日付文字列|ミリ秒|(Date|Day.js)オブジェクト
     * @returns {number} Unixエポックからの経過秒数
     */
    toSeconds: (date) => M424.DateTime.of(date).unix(),

    /**
     * 日付をUnixエポック(1970/01/01 00:00:00 UTC)からの経過ミリ秒数に変換します。
     * @param {string|number|Date|Dayjs} date - 日付文字列|ミリ秒|(Date|Day.js)オブジェクト
     * @returns {number} Unixエポックからの経過ミリ秒数
     */
    toMilliSeconds: (date) => M424.DateTime.of(date).valueOf(),

};

/**
 * 配列に関する機能を提供する名前空間
 * @namespace
 */
M424.Array = {

    /**
     * 配列から特定の要素を削除した配列を返す
     * @param {Array} array - 削除したい要素を含む配列
     * @param {Function} callbackFn - 配列の要素を削除する条件が書かれたコールバック関数
     *   @param {any} element - 配列の要素
     *   @returns {Boolean} true: 要素が取り除かれる。false: 要素は残される
     * @param {Boolean} [isFirstOnly=false] - 最初に条件を満たした要素のみを削除するかどうか
     * @returns {Object} 削除後の配列と削除された要素の情報を含むオブジェクト
     *   - array: 削除後の配列
     *   - removedElements: 削除された要素の配列
     * @throws {TypeError} array パラメータが配列でない場合にエラーをスローします
     */
    remove: (array, callbackFn, isFirstOnly = false) => {
        if( !Array.isArray(array) ) {
            throw new TypeError('引数[array]は配列である必要があります');
        }
        const removedElements = [];
        let isFirstRemoved = false;

        const newArray = array.filter( element => {
            if( callbackFn(element) ) {
                if( !isFirstOnly || !isFirstRemoved ) {
                    removedElements.push(element);
                    isFirstRemoved = true;
                    return false;
                }
            }
            return true;
        });
        return { array: newArray, removedElements };
    },
};

/**
 * 汎用ユーティリティを提供する名前空間
 * @namespace
 */
M424.Util = {

    /**
     * 現在のURLのクエリパラメータをデコードしてオブジェクトとして取得する。
     * @returns {Object} デコードされたクエリパラメータのオブジェクト。
     * @description URLSearchParamsを使用してパラメータを取得しますが、このメソッドではキーのデコードを行いません。
     * 通常の使用ではデコードは必要ありませんが、キーのデコードが必要な場合は別途処理を追加する必要があります。
     */
    getURLParams: () => Object.fromEntries(new URLSearchParams(location.search)),

    /* キーのデコードも行う場合の処理
        () => {
            const params = Array.from(new URLSearchParams(location.search).entries());
            const decodedParams = params.map( ([key,value]) => [decodeURIComponent(key), value] );
            return Object.fromEntries(decodedParams);
        },
    */

    /**
     * 渡された値がタイムアウトの識別子（タイマーID）かどうかを判別します。
     * @param {Number} value - 判別する値
     * @returns {boolean} タイムアウトの識別子かどうかを表す真偽値
     */
    isTimeoutId: (value) => typeof value === 'number' && value > 0,

    /**
     * [1-9a-z]のランダムな文字列を生成する(10文字)
     * @returns {string} ランダム生成した文字列(10文字)
     */
    randomString: () => Math.random().toString(36).substring(2, 12),

    /**
     * 引数が正の整数かどうかを判定する
     * @param {Number} number - 判定したい整数
     * @returns {boolean} - 引数が正の整数(0は含まない)の場合はtrue、それ以外の場合はfalse
     * @throws {TypeError} 引数が数値でない場合に例外をスローします
     */
    isPositiveInt: (number) => {
        if( !M424.Type.isNumber(number) ) {
            throw new TypeError('引数は数値である必要があります');
        }
        return Number.isSafeInteger(number) && Math.sign(number) === 1;
    },

    /**
     * 引数が負の整数かどうかを判定する
     * @param {Number} number - 判定したい整数
     * @returns {boolean} - 引数が負の整数(0は含まない)の場合はtrue、それ以外の場合はfalse
     * @throws {TypeError} 引数が数値でない場合に例外をスローします
     */
    isNegativeInt: (number) => {
        if( !M424.Type.isNumber(number) ) {
            throw new TypeError('引数は数値である必要があります');
        }
        return Number.isSafeInteger(number) && Math.sign(number) === -1;
    },

    /**
     * Array対応版 Math.max
     *  - 引数内に数値が含まれていれば、数値以外が含まれていても処理が実行される
     * @param  {...(Number|Number[])} args - NumberまたはNumber配列
     * @returns {Number} 引数内で一番大きなNumber. 引数が空の場合はnull. Number以外の場合はNaN.
     */
    max: (...args) => {
        // 階層化している引数をフラットにする
        const flattenedArgs = args.flat();
        if( flattenedArgs.length === 0 ) {
            return null; // 引数が空の場合
        }
        // 数値のみにフィルタリングする
        const validNumbers = flattenedArgs.filter( arg => M424.Type.isNumber(arg) );
        if( validNumbers.length === 0 ) {
            return NaN; // 数値が存在しない場合
        }
        return Math.max(...validNumbers);
    },

    /**
     * Array対応版 Math.min
     *  - 引数内に数値が含まれていれば、数値以外が含まれていても処理が実行される
     * @param  {...(Number|Number[])} args - NumberまたはNumber配列
     * @returns {Number} 引数内で一番小さなNumber. 引数が空の場合はnull. Number以外の場合はNaN.
     */
    min: (...args) => {
        // 階層化している引数をフラットにする
        const flattenedArgs = args.flat();
        if( flattenedArgs.length === 0 ) {
            return null; // 引数が空の場合
        }
        // 数値のみにフィルタリングする
        const validNumbers = flattenedArgs.filter( arg => M424.Type.isNumber(arg) );
        if( validNumbers.length === 0 ) {
            return NaN; // 数値が存在しない場合
        }
        return Math.min(...validNumbers);
    },

    /**
     * 指定された数値が範囲内にあるかどうかを判定する
     * @param {Number} num - 判定したい数値
     * @param {Number} start - 範囲の開始値
     * @param {Number} end - 範囲の終了値
     * @param {Boolean} [inclusive=false] - 範囲に開始値と終了値を含むかどうか (省略可能)
     * @returns {Boolean} 数値が範囲内に含まれる場合はtrue、そうでない場合はfalse
     */
    isInRange: (num, start, end, inclusive = false) => {
        const min = M424.Util.min(start, end);
        const max = M424.Util.max(start, end);
        return inclusive
            ? min <= num && num <= max
            : min < num && num < max
        ;
    },
};
