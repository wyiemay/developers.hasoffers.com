/*
 * formatter: helper object to format various strings/floats
 */

(function(root, $, undefined){
  'use strict';

  root.Formatter = {

    /* formats rgb color to hex value
     */
    rgbColorToHex : function(str)
    {
      var s = str || this,
        m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(s.toLowerCase());
      return m ? '#' + (1 << 24 | m[1] << 16 | m[2] << 8 | m[3]).toString(16).substr(1) : s.toLowerCase() ;
    },

    /*
     * Decodes html entities
     * from php.js via string.js
     */

    decodeHtmlEntities : function(tmp_str, quote_style)
    {
      var symbol = "", entity = "", hash_map = {};
      if (false === (hash_map = root.Formatter.get_html_translation_table("HTML_ENTITIES", quote_style))) {
        return false;
      }
      delete hash_map["&"];
      hash_map["&"] = "&amp;";
      for (symbol in hash_map) {
        entity = hash_map[symbol];
        tmp_str = tmp_str.split(entity).join(symbol);
      }
      tmp_str = tmp_str.split("&#039;").join("'");
      return tmp_str;
    },

    encodeHtmlEntities : function(tmp_str, quote_style)
    {
      var symbol = "", entity = "", hash_map = {};
      if (false === (hash_map = root.Formatter.get_html_translation_table("HTML_ENTITIES", quote_style))) {
        return false;
      }
      delete hash_map["&"];
      hash_map["&"] = "&amp;";
      for (symbol in hash_map) {
        entity = hash_map[symbol];
        tmp_str = tmp_str.split(symbol).join(entity);
      }
      tmp_str = tmp_str.split("&#039;").join("'");
      return tmp_str;
    },

    titleCaps : function(str, replaceUnderscore) {
      if (replaceUnderscore) {
        str = str.split('_').join(' ');
      }

      return _.map(str.split(' '), function(word) {
        return word.substr(0, 1).toUpperCase() + word.substring(1);
      }).join(' ');
    },

    /**
     * from PHP.js via String.js
     */
    get_html_translation_table : function (table, quote_style) {
      var entities = {},
      hash_map = {},
      decimal;
      var constMappingTable = {},
      constMappingQuoteStyle = {};
      var useTable = {},
      useQuoteStyle = {};

      // Translate arguments
      constMappingTable[0] = 'HTML_SPECIALCHARS';
      constMappingTable[1] = 'HTML_ENTITIES';
      constMappingQuoteStyle[0] = 'ENT_NOQUOTES';
      constMappingQuoteStyle[2] = 'ENT_COMPAT';
      constMappingQuoteStyle[3] = 'ENT_QUOTES';

      useTable = !isNaN(table) ? constMappingTable[table] : table ? table.toUpperCase() : 'HTML_SPECIALCHARS';
      useQuoteStyle = !isNaN(quote_style) ? constMappingQuoteStyle[quote_style]
        : quote_style ? quote_style.toUpperCase()
        : 'ENT_COMPAT';

      if (useTable !== 'HTML_SPECIALCHARS' && useTable !== 'HTML_ENTITIES') {
        throw new Error("Table: " + useTable + ' not supported');
      // return false;
      }

      entities['38'] = '&amp;';
      if (useTable === 'HTML_ENTITIES') {
        entities['160'] = '&nbsp;';
        entities['161'] = '&iexcl;';
        entities['162'] = '&cent;';
        entities['163'] = '&pound;';
        entities['164'] = '&curren;';
        entities['165'] = '&yen;';
        entities['166'] = '&brvbar;';
        entities['167'] = '&sect;';
        entities['168'] = '&uml;';
        entities['169'] = '&copy;';
        entities['170'] = '&ordf;';
        entities['171'] = '&laquo;';
        entities['172'] = '&not;';
        entities['173'] = '&shy;';
        entities['174'] = '&reg;';
        entities['175'] = '&macr;';
        entities['176'] = '&deg;';
        entities['177'] = '&plusmn;';
        entities['178'] = '&sup2;';
        entities['179'] = '&sup3;';
        entities['180'] = '&acute;';
        entities['181'] = '&micro;';
        entities['182'] = '&para;';
        entities['183'] = '&middot;';
        entities['184'] = '&cedil;';
        entities['185'] = '&sup1;';
        entities['186'] = '&ordm;';
        entities['187'] = '&raquo;';
        entities['188'] = '&frac14;';
        entities['189'] = '&frac12;';
        entities['190'] = '&frac34;';
        entities['191'] = '&iquest;';
        entities['192'] = '&Agrave;';
        entities['193'] = '&Aacute;';
        entities['194'] = '&Acirc;';
        entities['195'] = '&Atilde;';
        entities['196'] = '&Auml;';
        entities['197'] = '&Aring;';
        entities['198'] = '&AElig;';
        entities['199'] = '&Ccedil;';
        entities['200'] = '&Egrave;';
        entities['201'] = '&Eacute;';
        entities['202'] = '&Ecirc;';
        entities['203'] = '&Euml;';
        entities['204'] = '&Igrave;';
        entities['205'] = '&Iacute;';
        entities['206'] = '&Icirc;';
        entities['207'] = '&Iuml;';
        entities['208'] = '&ETH;';
        entities['209'] = '&Ntilde;';
        entities['210'] = '&Ograve;';
        entities['211'] = '&Oacute;';
        entities['212'] = '&Ocirc;';
        entities['213'] = '&Otilde;';
        entities['214'] = '&Ouml;';
        entities['215'] = '&times;';
        entities['216'] = '&Oslash;';
        entities['217'] = '&Ugrave;';
        entities['218'] = '&Uacute;';
        entities['219'] = '&Ucirc;';
        entities['220'] = '&Uuml;';
        entities['221'] = '&Yacute;';
        entities['222'] = '&THORN;';
        entities['223'] = '&szlig;';
        entities['224'] = '&agrave;';
        entities['225'] = '&aacute;';
        entities['226'] = '&acirc;';
        entities['227'] = '&atilde;';
        entities['228'] = '&auml;';
        entities['229'] = '&aring;';
        entities['230'] = '&aelig;';
        entities['231'] = '&ccedil;';
        entities['232'] = '&egrave;';
        entities['233'] = '&eacute;';
        entities['234'] = '&ecirc;';
        entities['235'] = '&euml;';
        entities['236'] = '&igrave;';
        entities['237'] = '&iacute;';
        entities['238'] = '&icirc;';
        entities['239'] = '&iuml;';
        entities['240'] = '&eth;';
        entities['241'] = '&ntilde;';
        entities['242'] = '&ograve;';
        entities['243'] = '&oacute;';
        entities['244'] = '&ocirc;';
        entities['245'] = '&otilde;';
        entities['246'] = '&ouml;';
        entities['247'] = '&divide;';
        entities['248'] = '&oslash;';
        entities['249'] = '&ugrave;';
        entities['250'] = '&uacute;';
        entities['251'] = '&ucirc;';
        entities['252'] = '&uuml;';
        entities['253'] = '&yacute;';
        entities['254'] = '&thorn;';
        entities['255'] = '&yuml;';
      }

      if (useQuoteStyle !== 'ENT_NOQUOTES') {
        entities['34'] = '&quot;';
      }
      if (useQuoteStyle === 'ENT_QUOTES') {
        entities['39'] = '&#39;';
      }
      entities['60'] = '&lt;';
      entities['62'] = '&gt;';

      // ascii decimals to real symbols
      for (decimal in entities) {
        if (entities.hasOwnProperty(decimal)) {
          hash_map[String.fromCharCode(decimal)] = entities[decimal];
        }
      }

      return hash_map;
    },

    zeroPadNumber : function(num){
      num = num.toString();
      return num = num.length == 1 ? '0' + num : num;
    },

    /*
     * The following format functions use getVal to determine actual value
     * due to Highcharts formatter: param operating in diff scope
     * depending on where formatter is applied
     */
    getVal : function(val, scope) {
      if (_.isUndefined(val) && scope !== root.Formatter){
        val = scope.value ;
      }
      return val;
    },

    formatString : function(val) {
      return root.Formatter.getVal(val, this);
    },

    formatCurrency : function(val, currencyCode) {
      val = root.Formatter.getVal(val, this);
      return currency.formatCurrency(val, currencyCode || root.Config.network_currency ||'USD');
    },

    formatInteger : function(val) {
      return parseInt(root.Formatter.getVal(val, this), 10);
    },

    formatNumber : function(val) {
      return currency.formatNumber(root.Formatter.getVal(val, this));
    },

    formatHour : function(val) {
      var hour = root.Formatter.getVal(val, this);

      if (hour === 0) {
        hour = "12 am";
      } else if (hour <= 12) {
        hour += " {0}".format(hour == 12 ? 'pm' : 'am');
      } else {
        hour = (hour - 12) + " pm";
      }
      return hour;
    },

    formatMonth : function(val) {
      var month = root.Formatter.getVal(val, this);
      return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month -1];
    },

    /*
     * @TODO check this out, this doesn't look correct
     * copied from MAT formatters
     */
    formatWeek : function(val) {

      val = root.Formatter.getVal(val, this);
      var date = moment(val);
      return "{0}-{1}".format(date.year(), root.Formatter.zeroPadNumber(date.isoWeek()));
    },

    formatDate : function(val) {
      val = root.Formatter.getVal(val, this);
      var date = new Date(val);
      return date.toString('MM/dd');
    },

    formatDateWithYear : function(val) {
      val = root.Formatter.getVal(val, this);
      var date = new Date(val);
      return date.toString('MM/dd/yyyy');
    },

    formatDateHour : function(val) {
      val = root.Formatter.getVal(val, this);
      var date = new Date(val),
        hour = root.Formatter.formatHour(date.getHours());
      return "{0}/{1} {2}".format((date.getMonth() + 1), date.getDate(), hour) ;
    },

    formatDateRelative : function(val) {
      var value = moment(val),
        fullString = value.format('LLLL'),
        relative = '';

      if (!value.isValid()) {
        return 'Unknown Date';
      }

      // If today, display time
      if (value.isAfter(moment().startOf('day'))) {
        relative = value.format('h:m a');
      }

      // Check if over 1 month ago, display date
      if (value.isBefore(moment().subtract(1, 'month'))) {
        relative = value.format('MM-DD-YYYY');
      }

      // Otherwise display relative from now
      relative = value.fromNow();

      return '<span title="{0}">{1}</span>'.format(fullString, relative);
    },

    formatPercent : function(val) {
      val = root.Formatter.getVal(val, this);
      return "{0}%".format(parseInt(val * 1000, 10)/10);
    },

    formatValuePercent : function() {
      return root.Formatter.formatPercent(this.y);
    }
  };

  // extend String
  String.prototype.format = function()
  {
    var s = this;
    for (var i = 0; i < arguments.length; i++) {
      var reg = new RegExp("\\{" + i + "\\}", "gm");
      s = s.replace(reg, arguments[i]);
    }
    return s;
  };

})(this, jQuery);
