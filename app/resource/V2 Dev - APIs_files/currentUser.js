/**
 * currentUser service.
 * Stores the currently logged in users affiliate and affiliate_user information.
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.service('currentUser',
    ['$rootScope', '$q', 'api', 'geographic', function($rootScope, $q, api) {
      return {
        'AffiliateUser'    : {},
        'Affiliate'        : {},
        'AccountManager'   : {},
        'UserPreferences'  : {},
        'BrandPreferences' : {},
        'Brand'            : {},
        'loading'          : false,
        'isLoaded'         : false,

        /*
         * Fetches new data for the user.
         */
        refresh : function(ignoreLoading) {
          var $this = this;
          if (ignoreLoading || !$this.loading) {
            $this.loading = true;

            var userPromise, brandPromise;

            userPromise = api.get(
              'AffiliateUser/getContext',
              {'affiliate_user_id': root.Config.affiliate_user_id}
            );


            userPromise.success(function(data) {
              if (!root.Config.affiliate_id) {
                root.Config.affiliate_id = data.Affiliate.id;
              }

              _.each(data, function(val, key) {
                $this[key] = val;
              });
              window.Config.network_currency = $this.BrandPreferences.network_currency;
            });

            brandPromise = api.get('BrandInformation/getBrandInformation', {});
            brandPromise.success(function(data) {
              $this.Brand = data.BrandInformation;
            });
            $q.all([
              userPromise,
              brandPromise
            ]).then(function() {
              $this.loading = false;
              $this.isLoaded = true;
              $rootScope.$broadcast('UserLoaded', true);
            }, function() {
              $this.loading = false;
              $rootScope.$broadcast('UserLoaded', false);
              throw new Error('User info failed to load. Application will not function properly.');
            });
          }
        },

        logOut : function() {
          this.AffiliateUser    = {};
          this.Affiliate        = {};
          this.AccountManager   = {};
          this.UserPreferences  = {};
          this.BrandPreferences = {};
          this.Brand            = {};
        },

        /*
         * Checks if the current user has a specified permission.
         * @param perm string - Permission string to test for.
         * @return boolean
         */
        hasPermission: function(perm) {
          if (!_.has(this.AffiliateUser, 'access')) {
            return false;
          }

          return _.contains(this.AffiliateUser.access, 'Affiliate.' + perm);
        },

        hasPermissionPromise: function(perm) {
          var deferred = $q.defer(),
              $this = this,
              resolveIt;

          resolveIt = function(deferred, perm) {
            if (this.hasPermission(perm)) {
              deferred.resolve();
            } else {
              deferred.reject();
            }
          };

          if (this.isLoaded) {
            resolveIt.call(this, deferred, perm);
          } else {
            $rootScope.$on('UserLoaded', function() {
              resolveIt.call($this, deferred, perm);
            });
          }

          return deferred.promise;
        },

        /**
         * Check if preference is set to desired value
         *
         * @param  {string} pref      brand preference
         * @param  {mixed}  value     desired value for preference
         * @param  {object} $scope    (optional) automatically sets $scope[scopeVar] with result
         * @param  {string} scopeVar  (optional) property of $scope to store result of preference check
         * @return {promise}          will be resolved to true if preference is desired value
         */
        checkPreference : function(pref, value, $scope, scopeVar) {
          var deferred = $q.defer(),
              $this = this,
              resolveIt;

          resolveIt = function(deferred, pref, value) {
            var actual = this.getPreferenceValue(pref);
            if (actual == value) {
              deferred.resolve(actual);
            } else {
              deferred.reject(actual);
            }
          };

          if (this.isLoaded) {
            resolveIt.call(this, deferred, pref, value);
          } else {
            $rootScope.$on('UserLoaded', function() {
              resolveIt.call($this, deferred, pref, value);
            });
          }

          if ($scope && scopeVar) {
            deferred.promise.then(function() {
              $scope[scopeVar] = true;
            }, function() {
              $scope[scopeVar] = false;
            });
          }

          return deferred.promise;
        },

        // Only call if you know the currentUser is loaded
        getPreferenceValue : function(pref) {
          if (_.isEmpty(this.BrandPreferences)) {
            return null;
          }

          return this.BrandPreferences[pref];
        },

        setPreferenceValue : function(pref, value) {
          return root.Api.get('UserPreferences/setValue', {'name' : pref, 'value' : value});
        }
      };
    }
  ]);
})(this, jQuery);
