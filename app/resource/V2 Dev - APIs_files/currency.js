/*!
 * Adapted from accounting.js v0.3.2 ( Copyright 2011, Joss Crowcroft)
 *
 * Freely distributable under the MIT license.
 * Portions of accounting.js are inspired or borrowed from underscore.js
 *
 * Full details and documentation:
 * http://josscrowcroft.github.com/accounting.js/
 */
(function (root, undefined) { /* --- Setup --- */
  // Create the local library object, to be exported or referenced globally later
  var lib = {};
  // Current version
  lib.version = '0.3.2';
  /* --- Exposed settings --- */
  // The library's settings configuration object. Contains default parameters for
  // currency and number formatting
  lib.settings = {
    currency:{
      symbol:"$",
      format:"%s%v",
      decimal:".",
      thousand:",",
      precision:2
    },
    number:{
      precision:0,
      thousand:",",
      decimal:"."
    }
  };

  lib.currencies = {
    'USD':{ symbol:'$',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'EUR':{ symbol:'€',    format:"%v%s", decimal:",", thousand:".", precision:2 },
    'ALL':{ symbol:'Lek',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'ARS':{ symbol:'AR$',  format:"%s%v", decimal:",", thousand:".", precision:2 },
    'AWG':{ symbol:'ƒ',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'AUD':{ symbol:'$A',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'AZN':{ symbol:'ман',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'BSD':{ symbol:'B$',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'BBD':{ symbol:'Bds$', format:"%s%v", decimal:".", thousand:",", precision:2 },
    'BYR':{ symbol:'p.',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'BZD':{ symbol:'BZ$',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'BMD':{ symbol:'Bd.$', format:"%s%v", decimal:".", thousand:",", precision:2 },
    'BOB':{ symbol:'$b',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'BAM':{ symbol:'KM',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'BWP':{ symbol:'P',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'BGN':{ symbol:'лв',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'BRL':{ symbol:'R$',   format:"%s%v", decimal:",", thousand:".", precision:2 },
    'GBP':{ symbol:'£',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'BND':{ symbol:'$',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'CAD':{ symbol:'CAN $',format:"%s%v", decimal:".", thousand:",", precision:2 },
    'KYD':{ symbol:'Cl$',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'CLP':{ symbol:'C$',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'CNY':{ symbol:'¥',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'COL':{ symbol:'COL$', format:"%s%v", decimal:".", thousand:",", precision:2 },
    'CRC':{ symbol:'₡',    format:"%s%v", decimal:",", thousand:".", precision:2 },
    'HRK':{ symbol:'kn',   format:"%s%v", decimal:",", thousand:".", precision:2 },
    'CUP':{ symbol:'₱',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'CZK':{ symbol:'Kč',   format:"%v%s", decimal:",", thousand:".", precision:2 },
    'DKK':{ symbol:'kr',   format:"%s%v", decimal:",", thousand:".", precision:2 },
    'DOP':{ symbol:'RD$',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'XCD':{ symbol:'$',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'EGP':{ symbol:'£',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'SVC':{ symbol:'$',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'EEK':{ symbol:'kr',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'FKP':{ symbol:'£',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'FJD':{ symbol:'$F',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'GHC':{ symbol:'¢',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'GIP':{ symbol:'£',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'GTQ':{ symbol:'Q',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'GGP':{ symbol:'£',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'GYD':{ symbol:'$',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'HNL':{ symbol:'L',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'HKD':{ symbol:'HK$',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'HUF':{ symbol:'Ft',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'ISK':{ symbol:'kr',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'INR':{ symbol:'₹',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'IDR':{ symbol:'Rp',   format:"%s%v", decimal:",", thousand:".", precision:2 },
    'IRR':{ symbol:'﷼',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'IMP':{ symbol:'£',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'ILS':{ symbol:'₪',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'JMD':{ symbol:'J$',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'JPY':{ symbol:'¥',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'JEP':{ symbol:'£',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'KZT':{ symbol:'лв',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'KPW':{ symbol:'₩',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'KRW':{ symbol:'₩',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'KGS':{ symbol:'лв',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'LAK':{ symbol:'₭',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'LVL':{ symbol:'Ls',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'LBP':{ symbol:'£',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'LRD':{ symbol:'L$',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'LTL':{ symbol:'Lt',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'MKD':{ symbol:'ден',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'MYR':{ symbol:'RM',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'MUR':{ symbol:'₨',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'MXN':{ symbol:'MXN$', format:"%s%v", decimal:".", thousand:",", precision:2 },
    'MNT':{ symbol:'₮',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'MZN':{ symbol:'MT',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'NAD':{ symbol:'$',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'NPR':{ symbol:'₨',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'ANG':{ symbol:'ƒ',    format:"%s%v", decimal:",", thousand:".", precision:2 },
    'NZD':{ symbol:'NZ$',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'NIO':{ symbol:'C$',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'NGN':{ symbol:'₦',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'NOK':{ symbol:'kr',   format:"%s%v", decimal:",", thousand:".", precision:2 },
    'OMR':{ symbol:'﷼',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'PKR':{ symbol:'₨',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'PAB':{ symbol:'B/.',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'PYG':{ symbol:'Gs',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'PEN':{ symbol:'S/.',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'PHP':{ symbol:'Php',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'PLN':{ symbol:'zł',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'QAR':{ symbol:'﷼',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'RON':{ symbol:'lei',  format:"%s%v", decimal:",", thousand:".", precision:2 },
    'RUB':{ symbol:'руб. ',format:"%v%s", decimal:",", thousand:".", precision:2 },
    'SHP':{ symbol:'£',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'SAR':{ symbol:'﷼',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'RSD':{ symbol:'Дин.', format:"%s%v", decimal:".", thousand:",", precision:2 },
    'SCR':{ symbol:'₨',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'SGD':{ symbol:'S$',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'SBD':{ symbol:'$',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'SOS':{ symbol:'S',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'ZAR':{ symbol:'R',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'LKR':{ symbol:'₨',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'SEK':{ symbol:'kr',   format:"%v%s", decimal:",", thousand:".", precision:2 },
    'CHF':{ symbol:'CHF',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'SRD':{ symbol:'$',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'SYP':{ symbol:'£',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'TWD':{ symbol:'NT$',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'THB':{ symbol:'฿',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'TTD':{ symbol:'TT$',  format:"%s%v", decimal:".", thousand:",", precision:2 },
    'TRY':{ symbol:'TL',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'TRL':{ symbol:'₤',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'TVD':{ symbol:'$',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'UAH':{ symbol:'₴',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'AED':{ symbol:'د.إ',  format:"%v%s", decimal:".", thousand:",", precision:2 },
    'UYU':{ symbol:'$U',   format:"%s%v", decimal:",", thousand:".", precision:2 },
    'UZS':{ symbol:'лв',   format:"%s%v", decimal:".", thousand:",", precision:2 },
    'VEF':{ symbol:'Bs',   format:"%s%v", decimal:",", thousand:".", precision:2 },
    'VND':{ symbol:'₫',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'YER':{ symbol:'﷼',    format:"%s%v", decimal:".", thousand:",", precision:2 },
    'ZWD':{ symbol:'Z$',   format:"%s%v", decimal:".", thousand:",", precision:2 }
  };

  /* --- Internal Helper Methods --- */
  // Store reference to possibly-available ECMAScript 5 methods for later
  var nativeMap = Array.prototype.map,
    nativeIsArray = Array.isArray,
    toString = Object.prototype.toString;

  /**
   * Tests whether supplied parameter is a string
   * from underscore.js
   */

  function isString(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  }

  /**
   * Tests whether supplied parameter is a string
   * from underscore.js, delegates to ECMA5's native Array.isArray
   */

  function isArray(obj) {
    return nativeIsArray ? nativeIsArray(obj) : toString.call(obj) === '[object Array]';
  }

  /**
   * Tests whether supplied parameter is a true object
   */

  function isObject(obj) {
    return obj && toString.call(obj) === '[object Object]';
  }

  /**
   * Extends an object with a defaults object, similar to underscore's _.defaults
   *
   * Used for abstracting parameter handling from API methods
   */

  function defaults(object, defs) {
    var key;
    object = object || {};
    defs = defs || {};
    // Iterate over object non-prototype properties:
    for (key in defs) {
      if (defs.hasOwnProperty(key)) {
        // Replace values with defaults only if undefined (allow empty/zero values):
        if (object[key] == null) object[key] = defs[key];
      }
    }
    return object;
  }

  /**
   * Implementation of `Array.map()` for iteration loops
   *
   * Returns a new Array as a result of calling `iterator` on each array value.
   * Defers to native Array.map if available
   */

  function map(obj, iterator, context) {
    var results = [],
      i, j;
    if (!obj) return results;
    // Use native .map method if it exists:
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    // Fallback for native .map:
    for (i = 0, j = obj.length; i < j; i++) {
      results[i] = iterator.call(context, obj[i], i, obj);
    }
    return results;
  }

  /**
   * Check and normalise the value of precision (must be positive integer)
   */

  function checkPrecision(val, base) {
    val = Math.round(Math.abs(val));
    return isNaN(val) ? base : val;
  }

  /**
   * Parses a format string or object and returns format obj for use in rendering
   *
   * `format` is either a string with the default (positive) format, or object
   * containing `pos` (required), `neg` and `zero` values (or a function returning
   * either a string or object)
   *
   * Either string or format.pos must contain "%v" (value) to be valid
   */

  function checkCurrencyFormat(format) {
    var defaults = lib.settings.currency.format;
    // Allow function as format parameter (should return string or object):
    if (typeof format === "function") format = format();
    // Format can be a string, in which case `value` ("%v") must be present:
    if (isString(format) && format.match("%v")) {
      // Create and return positive, negative and zero formats:
      return {
        pos:format,
        neg:format.replace("-", "").replace("%v", "-%v"),
        zero:format
      };
      // If no format, or object is missing valid positive value, use defaults:
    } else if (!format || !format.pos || !format.pos.match("%v")) {
      // If defaults is a string, casts it to an object for faster checking next time:
      return (!isString(defaults)) ? defaults : lib.settings.currency.format = {
        pos:defaults,
        neg:defaults.replace("%v", "-%v"),
        zero:defaults
      };
    }
    // Otherwise, assume format was fine:
    return format;
  }

  /* --- API Methods --- */
  /**
   * Takes a string/array of strings, removes all formatting/cruft and returns the raw float value
   * alias: accounting.`parse(string)`
   *
   * Decimal must be included in the regular expression to match floats (defaults to
   * accounting.settings.number.decimal), so if the number uses a non-standard decimal
   * separator, provide it as the second argument.
   *
   * Also matches bracketed negatives (eg. "$ (1.99)" => -1.99)
   *
   * Doesn't throw any errors (`NaN`s become 0) but this may change in future
   */
  var unformat = lib.unformat = lib.parse = function (value, decimal) {
    // Recursively unformat arrays:
    if (isArray(value)) {
      return map(value, function (val) {
        return unformat(val, decimal);
      });
    }
    // Fails silently (need decent errors):
    value = value || 0;
    // Return the value as-is if it's already a number:
    if (typeof value === "number") return value;
    // Default decimal point comes from settings, but could be set to eg. "," in opts:
    decimal = decimal || lib.settings.number.decimal;
    // Build regex to strip out everything except digits, decimal point and minus sign:
    var regex = new RegExp("[^0-9-" + decimal + "]", ["g"]),
      unformatted = parseFloat(("" + value).replace(/\((.*)\)/, "-$1")// replace bracketed values with negatives
        .replace(regex, '')// strip out any cruft
        .replace(decimal, '.') // make sure decimal point is standard
      );
    // This will fail silently which may cause trouble, let's wait and see:
    return !isNaN(unformatted) ? unformatted : 0;
  };
  /**
   * Implementation of toFixed() that treats floats more like decimals
   *
   * Fixes binary rounding issues (eg. (0.615).toFixed(2) === "0.61") that present
   * problems for accounting- and finance-related software.
   */
  var toFixed = lib.toFixed = function (value, precision) {
    precision = checkPrecision(precision, lib.settings.number.precision);
    var power = Math.pow(10, precision);
    // Multiply up by precision, round accurately, then divide and use native toFixed():
    return (Math.round(lib.unformat(value) * power) / power).toFixed(precision);
  };
  /**
   * Format a number, with comma-separated thousands and custom precision/decimal places
   *
   * Localise by overriding the precision and thousand / decimal separators
   * 2nd parameter `precision` can be an object matching `settings.number`
   */
  var formatNumber = lib.formatNumber = function (number, precision, thousand, decimal) {
    // Resursively format arrays:
    if (isArray(number)) {
      return map(number, function (val) {
        return formatNumber(val, precision, thousand, decimal);
      });
    }
    // Clean up number:
    number = unformat(number);
    // Build options object from second param (if object) or all params, extending defaults:
    var opts = defaults((isObject(precision) ? precision : {
        precision:precision,
        thousand:thousand,
        decimal:decimal
      }), lib.settings.number),
    // Clean up precision
      usePrecision = checkPrecision(opts.precision),
    // Do some calc:
      negative = number < 0 ? "-" : "",
      base = parseInt(toFixed(Math.abs(number || 0), usePrecision), 10) + "",
      mod = base.length > 3 ? base.length % 3 : 0;
    // Format the number:
    return negative + (mod ? base.substr(0, mod) + opts.thousand : "") + base.substr(mod).replace(/(\d{3})(?=\d)/g, "$1" + opts.thousand) + (usePrecision ? opts.decimal + toFixed(Math.abs(number), usePrecision).split('.')[1] : "");
  };
  /**
   * Format a number into currency
   *
   * Usage: accounting.formatMoney(number, symbol, precision, thousandsSep, decimalSep, format)
   * defaults: (0, "$", 2, ",", ".", "%s%v")
   *
   * Localise by overriding the symbol, precision, thousand / decimal separators and format
   * Second param can be an object matching `settings.currency` which is the easiest way.
   *
   * To do: tidy up the parameters
   */
  var formatMoney = lib.formatMoney = function (number, symbol, precision, thousand, decimal, format) {
    // Resursively format arrays:
    if (isArray(number)) {
      return map(number, function (val) {
        return formatMoney(val, symbol, precision, thousand, decimal, format);
      });
    }
    // Clean up number:
    number = unformat(number);
    // Build options object from second param (if object) or all params, extending defaults:
    var opts = defaults((isObject(symbol) ? symbol : {
        symbol:symbol,
        precision:precision,
        thousand:thousand,
        decimal:decimal,
        format:format
      }), lib.settings.currency),
    // Check format (returns object with pos, neg and zero):
      formats = checkCurrencyFormat(opts.format),
    // Choose which format to use for this value:
      useFormat = number > 0 ? formats.pos : number < 0 ? formats.neg : formats.zero;
    // Return with currency symbol added:
    return useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(number), checkPrecision(opts.precision), opts.thousand, opts.decimal));
  };

  var formatCurrency = lib.formatCurrency = function (number, currency_code) {
    if (!currency_code) {
      currency_code = window.Config.network_currency || 'USD';
    }
    var formatInfo = lib.currencies[currency_code.toUpperCase()];
    return formatMoney(
        number,
        formatInfo.symbol,
        formatInfo.precision,
        formatInfo.thousand,
        formatInfo.decimal,
        formatInfo.format);
  }
  /**
   * Format a list of numbers into an accounting column, padding with whitespace
   * to line up currency symbols, thousand separators and decimals places
   *
   * List should be an array of numbers
   * Second parameter can be an object containing keys that match the params
   *
   * Returns array of accouting-formatted number strings of same length
   *
   * NB: `white-space:pre` CSS rule is required on the list container to prevent
   * browsers from collapsing the whitespace in the output strings.
   */
  lib.formatColumn = function (list, symbol, precision, thousand, decimal, format) {
    if (!list) return [];
    // Build options object from second param (if object) or all params, extending defaults:
    var opts = defaults((isObject(symbol) ? symbol : {
        symbol:symbol,
        precision:precision,
        thousand:thousand,
        decimal:decimal,
        format:format
      }), lib.settings.currency),
    // Check format (returns object with pos, neg and zero), only need pos for now:
      formats = checkCurrencyFormat(opts.format),
    // Whether to pad at start of string or after currency symbol:
      padAfterSymbol = formats.pos.indexOf("%s") < formats.pos.indexOf("%v") ? true : false,
    // Store value for the length of the longest string in the column:
      maxLength = 0,
    // Format the list according to options, store the length of the longest string:
      formatted = map(list, function (val, i) {
        if (isArray(val)) {
          // Recursively format columns if list is a multi-dimensional array:
          return lib.formatColumn(val, opts);
        } else {
          // Clean up the value
          val = unformat(val);
          // Choose which format to use for this value (pos, neg or zero):
          var useFormat = val > 0 ? formats.pos : val < 0 ? formats.neg : formats.zero,
          // Format this value, push into formatted list and save the length:
            fVal = useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(val), checkPrecision(opts.precision), opts.thousand, opts.decimal));
          if (fVal.length > maxLength) maxLength = fVal.length;
          return fVal;
        }
      });
    // Pad each number in the list and send back the column of numbers:
    return map(formatted, function (val, i) {
      // Only if this is a string (not a nested array, which would have already been padded):
      if (isString(val) && val.length < maxLength) {
        // Depending on symbol position, pad after symbol or at index 0:
        return padAfterSymbol ? val.replace(opts.symbol, opts.symbol + (new Array(maxLength - val.length + 1).join(" "))) : (new Array(maxLength - val.length + 1).join(" ")) + val;
      }
      return val;
    });
  };

  lib.jgFmt = function(cellValue, options, rowObject) {
    var currencyCode = undefined;
    if (options.currencyField && rowObject[option.currencyField]) {
      currencyCode = rowObject[option.currencyField];
    }
    return lib.formatCurrency(cellValue, currencyCode);
  };

  /* --- Module Definition --- */
  // Export currency for CommonJS. If being loaded as an AMD module, define it as such.
  // Otherwise, just add `currency` to the global object
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = lib;
    }
    exports.currency = lib;
  } else if (typeof define === 'function' && define.amd) {
    // Return the library as an AMD module:
    define([], function () {
      return lib;
    });
  } else {
    // Use currency.noConflict to restore `currency` back to its original value.
    // Returns a reference to the library's `currency` object;
    // e.g. `var numbers = currency.noConflict();`
    lib.noConflict = (function (oldCurrency) {
      return function () {
        // Reset the value of the root's `currency` variable:
        root.currency = oldCurrency;
        // Delete the noConflict method:
        lib.noConflict = undefined;
        // Return reference to the library to re-assign it:
        return lib;
      };
    })(root.currency);
    // Declare `fx` on the root (global/window) object:
    root['currency'] = lib;
  }
  // Root will be `window` in browser or `global` on the server:
}(this));
