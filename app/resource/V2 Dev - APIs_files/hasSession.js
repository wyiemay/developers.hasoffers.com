/*
 * hasSession service
 */

(function(root, undefined) {
  'use strict';

  root.Application.service('hasSession', [
    '$rootScope',
    '$q',
    'cookieStorageService',
    'currentUser',
    'api',
    'localStorageService',
    function($rootScope, $q, cookieStorageService, currentUser, api, localStorage) {

      var canBroadcast = true,
        broadcastTimeout;

      return {
        loggedIn : null,

        init : function() {
          if (root.Config.logout) {
            $rootScope.addReturnLocation();
            cookieStorageService.add('publisher_from_page', $rootScope.returnLocation, 300);
            window.top.location.href = '/logout';
          }

          if (!root.Config.internal_auth) {
            root.Config.affiliate_id = cookieStorageService.get('affiliate_id');
            root.Config.affiliate_user_id = cookieStorageService.get('affiliate_user_id');
            root.Config.session_token = cookieStorageService.get('session_token');
          }

          // This section is or overridding api settings via the debug controller.
          if (localStorage.isSupported()) {
            var apiSettings = localStorage.get('apiSettings');
            if (apiSettings) {
              this.loggedIn = true;
              root.Config.affiliate_user_id = apiSettings.affiliate_user_id;
              root.Config.session_token = apiSettings.sessionToken;
              root.Config.api_endpoint = apiSettings.api_endpoint;
              root.Config.api_network_id = apiSettings.network_id;

              // Killing the affiliate_id since it's not something we known until we refresh the user
              // and the current user service will only populate the field if it's empty.
              delete(root.Config.affiliate_id);
              currentUser.refresh();
            }
          }

          if (root.Config.affiliate_id && root.Config.affiliate_user_id &&
              root.Config.session_token && !this.loggedIn) {
            this.loggedIn = true;
            currentUser.refresh();
          }


          // http responseInterceptor will trigger 401
          // that needs to be triggered with a pub/sub model because of dependency injection issues
          var $this = this;
          $rootScope.$on('http_status_401', function() {
            $this.loggedIn = false;
            $this.emitState();
          });

          this.isLoggedIn();
        },

        doLogin : function(email, password) {
          var $this = this,
            deferred = $q.defer();


          // Override has been specified in debug - use the specified session token and network info.
          if (localStorage.isSupported()) {
            var apiSettings = localStorage.get('apiSettings');
            if (apiSettings) {
              $this.loggedIn = true;

              root.Config.affiliate_user_id = apiSettings.affiliate_user_id;
              root.Config.session_token = apiSettings.sessionToken;
              root.Config.api_endpoint = apiSettings.endpoint;
              root.Config.api_network_id = apiSettings.network_id;

              $this.emitState();

              // Stop broadcasting login failures or successes after a successful login.
              // This will prevent all the outstanding api calls from messing with our auth pages.
              canBroadcast = false;
              broadcastTimeout = setTimeout(function() {
                canBroadcast = true;
              }, 3500);

              deferred.resolve();
              return deferred.promise;
            }
          }

          var promise = api.get('Authentication/getSessionToken', {email: email, password: password});

          promise.success(function(data) {
            $this.loggedIn = true;

            root.Config.affiliate_id = data.affiliate_id;
            root.Config.affiliate_user_id = data.affiliate_user_id;
            root.Config.session_token = data.SessionToken;

            cookieStorageService.add('session_token', root.Config.session_token, null);
            cookieStorageService.add('affiliate_id', root.Config.affiliate_id, null);
            cookieStorageService.add('affiliate_user_id', root.Config.affiliate_user_id, null);


            deferred.resolve(data);

            $this.emitState();

            // Stop broadcasting login failures or successes after a successful login.
            // This will prevent all the outstanding api calls from messing with our auth pages.
            canBroadcast = false;
            broadcastTimeout = setTimeout(function() {
              canBroadcast = true;
            }, 3500);

          });

          promise.error(function(data) {
            $this.loggedIn = false;
            $this.emitState();
            deferred.reject(data);
          });

          return deferred.promise;
        },

        isLoggedIn : function() {
          var deferred = $q.defer();
          if (_.isNull(this.loggedIn)) {
            $rootScope.$on('sessionLogin', function(localScope, loggedIn) {
              if (loggedIn === true) {

                deferred.resolve(true);
              } else {
                deferred.reject(false);
              }
            });
          } else {
            if (this.loggedIn === true) {
              deferred.resolve(true);
            } else {
              deferred.reject(false);
            }
          }
          this.emitState();
          return deferred.promise;
        },

        logOut : function() {
          if (root.Config.internal_auth) {
            return window.top.location.href = '/logout';
          }

          var $this = this,
            deferred = $q.defer();

          var promise = api.get('Authentication/destroySessionToken');

          promise.success(function() {
            clearTimeout(broadcastTimeout);
            canBroadcast = true;

            $this.loggedIn = false;
            currentUser.logOut();
            $this.emitState();
            deferred.resolve(true);
          });

          return deferred.promise;
        },

        emitState : function() {
          if (canBroadcast) {
            $rootScope.$broadcast('sessionLogin', this.loggedIn);
          }
        }
      };
    }
  ]);
})(this);
