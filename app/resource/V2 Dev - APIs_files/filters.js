/*
 * filters
 */

(function(root, $, undefined) {
  'use strict';

  root.angular.module('hasApp.filters', []).
    filter('notIn', function() {
      return function(input, el) {

        var rejects = _.map($(el).find('option'), function(val) { return $(val).attr('value'); }),
          returns = [];

        _.each(input, function(item) {
          if (_.indexOf(rejects, item.value) === -1) {
            returns[returns.length] = item;
          }
        });

        return returns;
      };
    })
    .filter('include', function() {
      return function(input, includes) {
        if (_.isUndefined(input)) {
          return;
        }

        return _.intersection(input, includes);
      };
    })
    .filter('exclude', function() {
      return function(input, rejects) {
        if (_.isUndefined(input)) {
          return;
        }

        if (_.isUndefined(rejects)) {
          return input;
        }

        return _.difference(input, rejects);
      };
    })
    .filter('ifEmpty', function() {
      return function(input, altValue) {
        if (!$.trim(input)) {
          return altValue;
        }

        return input;
      };
    })
    .filter('maskCreditCard', function() {
      return function(input) {
        if (!input) {
          return null;
        }

        input = input.toString().replace(/-/g, '');

        if (input.length > 4) {
          return new Array(input.length - 3).join('&bull;') + input.slice(-4);
        }

        return input.slice(-4);
      };
    })
    .filter('percent', function() {
      return function(input) {
        if (!input) {
          return '0%';
        }

        return parseFloat(input).toFixed(2) + '%';
      };
    })
    .filter('parseDate', function() {
      return function(input, format) {
        if (!input) {
          return '';
        }

        return moment(input).format(format);
      };
    })
    .filter('relativeDate', function() {
      return function(input) {
        if (!input) {
          return '';
        }

        return root.Formatter.formatDateRelative(input);
      };
    })
    .filter('capitalize', function() {
      return function(input) {
        if (!input) {
          return '';
        }

        var words = input.split(' '),
            capitalizedWords = [];

        _.each(words, function(word) {
          capitalizedWords.push(word.charAt(0).toUpperCase() + word.slice(1));
        });
        return capitalizedWords.join(' ');
      };
    })

    /**
     * Truncate Filter - source http://jsfiddle.net/oluckyman/QQ7aF/
     * @param   text
     * @param   int     length  default is 10
     * @param   string  end     default is "..."
     * @return  string
     * length of result <= length
     * truncates at word boundary (if possible)
     * indicates missing text (if possible)
     */
    .filter('truncate', function() {
      return function (text, length, end) {
        if (!text) {
          return '';
        }

        length = length || 10;
        end = end || '...';

        if (text.length <= length) {
          return text;
        }

        if (length < end.length) {
          return text.substring(0, length);
        }

        return text.substring(0, length-end.length+1).replace(/(^|\W+)\w*$/,end);
      };
    })

    /**
     * Format an address based on various semi-standard fields
     * @param  object obj    Object containing address properties
     * @param  string prefix [optional] property prefix in object (ie property is obj.foobar_zipcode)
     * @return string        Formatted Address
     */
    .filter('formatAddress', ['geographic', function(geographic) {


      return function(obj, prefix) {
        if (!obj) {
          return '';
        }

        var lookup, city_region_separator, rows;

        prefix = prefix || '';

        lookup = {
          address1 : obj[prefix + 'address1'] || obj[prefix + 'bank_address'] || null,
          address2 : obj[prefix + 'address2'] || null,
          city     : obj[prefix + 'city'] || '',
          region   : obj[prefix + 'region'] || '',
          zipcode  : obj[prefix + 'zipcode'] || obj[prefix + 'postal_code'] || '',
          country  : obj[prefix + 'country'] ||
                     obj[prefix + 'country_code'] ||
                     obj[prefix + 'destination_country_code'] || null
        };
        city_region_separator = lookup.city && lookup.region ? ', ' : ' ';

        // Convert Country Code to Country Name
        if (lookup.country) {
          lookup.country = geographic.determineCountryNiceName(lookup.country);
        }

        rows = [
          lookup.address1,
          lookup.address2,
          $.trim(lookup.city + city_region_separator + lookup.region + ' ' + lookup.zipcode),
          lookup.country
        ];

        return _.compact(rows).join('<br />');
      };
    }])

    // Format API readale payment method string into human readable string
    .filter('formatPaymentMethod', function() {
      return function(input) {
        if (!input) {
          return '';
        }

        var paymentMethods = {
          'check'          : 'Check',
          'direct_deposit' : 'Direct Deposit',
          'other'          : 'Other',
          'payoneer'       : 'Payoneer',
          'paypal'         : 'PayPal',
          'payquicker'     : 'PayQuicker',
          'wire'           : 'Wire'
        };

        return paymentMethods[input] || input;
      };
    })

    .filter('currency', function() {
      return function(amount, currency_code) {
        amount = amount || 0;
        currency_code = currency_code || window.Config.network_currency;
        return window.currency.formatCurrency(amount, currency_code);
      };
    })

    .filter('formattedJson', function() {
      return function(json) {
        return JSON.stringify(json, null, 2);
      };
    })

    .filter('enum', function() {
      return function(key, enumName) {
        if (root.Config.Enums[enumName]) {
          return root.Config.Enums[enumName][key] || key;
        }
        return key;
      };
    })

    .filter('contains', function() {
      return function(arr, field) {
        return _.contains(arr, field);
      };
    });

})(this, jQuery);
