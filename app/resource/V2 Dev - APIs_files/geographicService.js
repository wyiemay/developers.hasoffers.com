/**
 * Handles countries and timezones.
 *
 */

(function(root) {
  'use strict';

  root.Application.service('geographic', ['$rootScope', '$q', 'api', 'localStorageService',
    function($rootScope, $q, api, localStorage) {

      var countries = {};
      var countriesArray = [];
      var timeZones = {};

      var usStates = {
        'AL' : 'Alabama',
        'AK' : 'Alaska',
        'AZ' : 'Arizona',
        'AR' : 'Arkansas',
        'CA' : 'California',
        'CO' : 'Colorado',
        'CT' : 'Connecticut',
        'DE' : 'Delaware',
        'DC' : 'District of Columbia',
        'FL' : 'Florida',
        'GA' : 'Georgia',
        'HI' : 'Hawaii',
        'ID' : 'Idaho',
        'IL' : 'Illinois',
        'IN' : 'Indiana',
        'IA' : 'Iowa',
        'KS' : 'Kansas',
        'KY' : 'Kentucky',
        'LA' : 'Louisiana',
        'ME' : 'Maine',
        'MD' : 'Maryland',
        'MA' : 'Massachusetts',
        'MI' : 'Michigan',
        'MN' : 'Minnesota',
        'MO' : 'Missouri',
        'MT' : 'Montana',
        'NE' : 'Nebraska',
        'NV' : 'Nevada',
        'NH' : 'New Hampshire',
        'NJ' : 'New Jersey',
        'NM' : 'New Mexico',
        'NY' : 'New York',
        'NC' : 'North Carolina',
        'ND' : 'North Dakota',
        'OH' : 'Ohio',
        'OK' : 'Oklahoma',
        'OR' : 'Oregon',
        'PA' : 'Pennsylvania',
        'RI' : 'Rhode Island',
        'SC' : 'South Carolina',
        'SD' : 'South Dakota',
        'TN' : 'Tennessee',
        'TX' : 'Texas',
        'UT' : 'Utah',
        'VT' : 'Vermont',
        'VA' : 'Virginia',
        'WA' : 'Washington',
        'WV' : 'West Virginia',
        'WI' : 'Wisconsin',
        'WY' : 'Wyoming'
      };

      var canadaProvinces = {
        'AB' : 'Alberta',
        'BC' : 'British Columbia',
        'MB' : 'Manitoba',
        'NB' : 'New Brunswick',
        'NF' : 'Newfoundland',
        'NT' : 'Northwest Territories',
        'NS' : 'Nova Scotia',
        'NU' : 'Nunuvat',
        'ON' : 'Ontario',
        'PE' : 'Prince Edward Island',
        'QC' : 'Quebec',
        'SK' : 'Saskatchewan',
        'YT' : 'Yukon Territory'
      };


      var fetchGeoData = function() {

        if (localStorage.isSupported()) {
          countries = localStorage.get('countriesObj') || {};
          timeZones = localStorage.get('timeZones') || {};
        }

        var promises = [];
        if (!Object.keys(countries).length) {
          promises.push(api.get('Application/findAllCountries').success(
            function(data) {
              _.each(data, function(ct) {
                var country = ct.Country;
                countries[country.code] = country.name;
              });
              localStorage.add('countriesObj', countries);
            })
          );
        }

        if (!Object.keys(timeZones).length) {
          promises.push(api.get('Application/findAllTimezones').success(
            function(data) {

              // Looks for +/-00:00 and grabs the +00 part out in a group.
              var offset_regex = /(?:[\+|\-]\d+)(?=:\d+)/;
              _(data).each(function(current) {
                var tz = current.Timezone;

                var offset = offset_regex.exec(tz.gmt);

                // GMT entries don't have an offset match so we'll just fill it in with a zero adjustment.
                if (offset) {
                  var test = offset[0];
                  offset = test.slice(0, 1) + Number(test.slice(1));
                } else {
                  offset = '+0';
                }

                timeZones[tz.keyword] = tz;
                timeZones[tz.keyword].hour_offset = offset;
              });

              localStorage.add('timeZones', timeZones);
            })
          );
        }

        if (promises) {
          $q.all(promises).then(function() {
            geoObject.loaded = true;
            $rootScope.$broadcast('geoInfoLoaded');
          });
        } else {
          geoObject.loaded = true;
          $rootScope.$broadcast('geoInfoLoaded');
        }
      };


      var geoObject = {
        'loaded' : false,
        'getCountries' : function() {
          if (countriesArray.length === 0) {
            _.each(countries, function(name, code) {
              countriesArray.push({'name': name, 'code': code});
            });
          }
          return countriesArray;
        },

        'getTimezone' : function() {
          var tz = jstz.determine().name();

          if (!tz) {
            return 'GMT';
          }

          // Some special cases where API timezone info doesn't line up with IANA timezone names returned by jstz
          var jstzTimezonesToAPI = {
            'Europe/Berlin'       : 'Europe/Amsterdam',
            'Pacific/Honolulu'    : 'America/Adak',
            'America/Halifax'     : 'America/Glace_Bay',
            'Africa/Lagos'        : 'Africa/Algiers',
            'Europe/Helsinki'     : 'Europe/Athens',
            'Africa/Johannesburg' : 'Africa/Cairo',
            'Asia/Baghdad'        : 'Africa/Addis_Ababa',
            'Asia/Shanghai'       : 'Asia/Hong_Kong',
            'Pacific/Fiji'        : 'Etc/GMT-12'
          };

          if (jstzTimezonesToAPI[tz]) {
            return jstzTimezonesToAPI[tz];
          }

          var tzObj = _(timeZones).find({'keyword' : tz});
          if (tzObj) {
            return tzObj.keyword;
          }
          return 'America/Los_Angeles';
        },

        getTimezones : function() {
          return timeZones;
        },

        'determineCountryNiceName' : function(countryCode) {
          return countries[countryCode] || countryCode;
        },

        'getCountryRegions' : function(countryCode) {
          var regions = null;
          if (!countryCode) { return null; }
          switch(countryCode.toLowerCase()) {
            case 'ca':
              regions = canadaProvinces;
              break;
            case 'us':
              regions = usStates;
              break;
            default:
              return null;
          }
          var out = [];
          _.each(regions, function(name, code) {
            out.push({'name' : name, 'code' : code});
          });
          return out;
        }
      };

      $rootScope.$on('UserLoaded', function(success) {
        if (success) {
          fetchGeoData();
        }
      });

      return geoObject;
    }]
  );
})(this);
