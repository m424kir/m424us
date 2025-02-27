// ==UserScript==
// @name         M424Datetime
// @namespace    M424.DateTime
// @version      1.0.0
// @description  日付及び時刻に関する機能を提供する名前空間
// @author       M424
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/locale/ja.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/plugin/duration.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1/plugin/customParseFormat.js
// @require      M424.Type
// ==/UserScript==
'use strict';

/**
 * 日付及び時刻に関する機能を提供する名前空間(Day.jsを使用)
 * @namespace
 */
M424.DateTime = {
  /**
   * 日付及び時刻、期間フォーマットの正規表現定数
   * @constant {Object}
   */
  REGEXP_PATTERN: {
    DATE: {
      VALID_OUT: /[YMDHhmsSZdAa]/,
      VALID_IN: /[YMDHhmsSZXx]/,
      INVALID_OUT:
        /(?<!Y)(Y|Y{3})(?!Y)|Y{5,}|M{5,}|D{3,}|H{3,}|h{3,}|m{3,}|s{3,}|Z{3,}|S{4,}|(?<!S)S{1,2}(?!S)|d{5,}|A{2,}|a{2,}/,
      INVALID_IN:
        /(?<!Y)(Y|Y{3})(?!Y)|Y{5,}|M{5,}|D{3,}|H{3,}|h{3,}|m{3,}|s{3,}|Z{3,}|S{4,}|X{2,}|x{2,}/,
    },
    DURATION: /^(y(ears)?|M|m(illiseconds|inutes|onths|s)?|d(ays)?|w(eeks)?|h(ours)?|s(econds)?)$/,
  },

  /**
   * 日付や時刻のフォーマット定数
   * @constant {Object}
   */
  FORMATS: {
    DATE_TIME: 'YYYY/MM/DD HH:mm:ss',
    DATE_TIME_WITH_DAY: 'YYYY/MM/DD(ddd) HH:mm:ss',
    DATE_TIME_JP: 'YYYY年MM月DD日 HH時mm分ss秒',
    DATE_TIME_WITH_DAY_JP: 'YYYY年MM月DD日(ddd) HH時mm分ss秒',
    DATE: 'YYYY/MM/DD',
    DATE_WITH_DAY: 'YYYY/MM/DD(ddd)',
    DATE_JP: 'YYYY年MM月DD日',
    DATE_WITH_DAY_JP: 'YYYY年MM月DD日(ddd)',
    TIME: 'HH:mm:ss',
    TIME_JP: 'HH時mm分ss秒',
    TIME_12H_AMPM: 'hh:mm:ss(A)',
    TIME_12H_AMPM_JP: 'hh時mm分ss秒(A)',
  },

  /**
   * Day.jsで使用するプラグイン一覧 - この定義以外は許可しない
   * @constant {Object}
   */
  PLUGINS: {
    DURATION: dayjs_plugin_duration,
    CUSTOM_PARSE_FORMAT: dayjs_plugin_customParseFormat,
  },

  /**
   * Day.jsプラグインが読み込まれていないならロードします
   * @param {M424.DateTime.PLUGINS} plugin - Day.jsプラグイン
   */
  ensurePluginLoaded: (plugin) => {
    const validPlugins = Object.values(M424.DateTime.PLUGINS);
    if (validPlugins.includes(plugin) && !plugin.$i) {
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
    if (locale() !== 'ja') {
      locale('ja');
    }
    ensurePluginLoaded(PLUGINS.CUSTOM_PARSE_FORMAT);

    if (M424.Type.isString(date) && format && isValidFormat(format, false)) {
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
    const { ensurePluginLoaded, PLUGINS, REGEXP_PATTERN } = M424.DateTime;

    ensurePluginLoaded(PLUGINS.DURATION);

    if (unit && M424.Type.isNumber(duration)) {
      return dayjs.duration(duration, REGEXP_PATTERN.DURATION.test(unit) ? unit : undefined);
    }
    return dayjs.duration(duration);
  },

  /**
   * 指定された秒数からHH:mm:ss形式の文字列に変換します
   * @param {number} sec - 秒数
   * @returns {string} "HH:mm:ss"形式の文字列
   */
  secondsToHMS: (sec) => {
    return M424.DateTime.duration(sec, 's').format(M424.DateTime.FORMATS.TIME);
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
  isValidFormat: (format, isOutput = true) => {
    const { DATE } = M424.DateTime.REGEXP_PATTERN;
    return isOutput
      ? DATE.VALID_OUT.test(format) && !DATE.INVALID_OUT.test(format)
      : DATE.VALID_IN.test(format) && !DATE.INVALID_IN.test(format);
  },

  /**
   * 日付を指定したフォーマットで文字列として返します。
   * @param {string|number|Date|Dayjs} date - 日付文字列|ミリ秒|(Date|Day.js)オブジェクト
   * @param {string|undefined} [format] - フォーマット文字列
   * @returns {string} フォーマットされた日付文字列
   */
  format: (date, format) => {
    const datetime = M424.DateTime.of(date);
    if (format && M424.DateTime.isValidFormat(format, true)) {
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
