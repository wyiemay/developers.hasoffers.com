(function(root, $, undefined) {
  'use strict';

  // Declare app level module which depends on filters, and services
  root.Application = angular.module(
    'hasApp',
    [
      'hasApp.filters',
      'ngSanitize',
      'hasOffers.serviceLayer',
      'hasOffers.hasTable',
      'ui'
    ]
  )
  .config(
    [
      '$routeProvider',
      '$locationProvider',
      '$httpProvider',
      function($routeProvider, $locationProvider, $httpProvider) {

        $locationProvider.hashPrefix('!');

        // Add an error interceptor to catch 401 not authorized errors and present user with login
        $httpProvider.responseInterceptors.push(['$rootScope', '$q', function(scope, $q) {
          function httpComplete(response) {
            var url = response.config.url,
                hasError = false;

            var isApiCall = url.indexOf(root.Config.api_endpoint) === 0 ||
                  url.indexOf(encodeURIComponent(root.Config.api_endpoint)) !== -1;

            // console.log('members', _.hasMembers(response, 'data', 'response', 'errorMessage'));
            // returns properly but for some reason breaks this call. TODO: investigate.
            if (isApiCall && response.data && response.data.response &&
                response.data.response.errorMessage) {
              response.errorMessage = response.data.response.errorMessage;
              response.errorDetails = [];
              _.each(response.data.response.errors, function(error) {
                if (error.err_msg) {
                  response.errorDetails = error.err_msg;
                }
              });

              if (scope.logError) {
                scope.logError('API Error - ' + response.errorMessage, response.errorDetails);
              }
              hasError = true;

              if (response.data.response.httpStatus == 401) {
                scope.$broadcast('http_status_401');
              }
            }

            // API response format is too verbose, eliminate un-necessary fields from API response
            if (_.hasMembers(response, 'data', 'response', 'data')) {
              response.data = response.data.response.data;
            }

            if (hasError) {
              // The promise returned by $http is a mutated promise object
              // that adds a nice .error() method instead of wrapping your success and error in a .then()
              // .error() transforms your response to only return the data property
              response.data = response.data || {};
              response.data.errorDetails = response.errorDetails;
              response.data.errorMessage = response.errorMessage;
              return $q.reject(response);
            }

            scope.$broadcast('successful_api_call', url);

            return response;
          }

          return function(promise) {
            return promise.then(httpComplete, httpComplete);
          };
        }]);

        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';

        $httpProvider.defaults.transformRequest = function(data) {
          if (_.isObject(data)) {
            data = $.param(data);
          }

          return data;
        };

        _(root.Routes).each(function(params, location) {
          /**
           * Add resolve requirements.
           * If any of these requirements are not met, the route will not render:
           *  - Ensure they are logged in (will fail if not logged in on login page if using internal_auth)
           *  - Check any required user permissions
           *  - Check required brand preferences
           */
          if (root.Config.internal_auth || params.templateUrl != 'partials/login.html') {
            var resolve = params.resolve || {};
            resolve.needsLogin = function($q, hasSession) {
              var deferred = $q.defer();
              var promise = hasSession.isLoggedIn();

              promise.then(
                function(result) {
                  deferred.resolve(result);
                },
                function() {
                  deferred.reject('login_required');
                }
              );

              return deferred.promise;
            };

            /**
             * For every permission defined in the route as a requirement
             *  - Create a promise that will be resolved/rejected by currentUser if permission exists
             *  - Resolve route if no permissions defined or currentUser has all required permissions
             *  - Reject route if any required permission does not exist
             */
            resolve.hasPermissions = function($q, currentUser) {
              var deferred = $q.defer(),
                  dependancies = [];

              _.each(params.permissions, function(permission) {
                var permissionDeferred = $q.defer(),
                    promise = currentUser.hasPermissionPromise(permission);

                promise.then(function() {
                  permissionDeferred.resolve();
                }, function() {
                  permissionDeferred.reject('missing_permission');
                });
                dependancies.push(permissionDeferred.promise);
              });

              if (dependancies.length === 0) {
                deferred.resolve();
              } else {
                $q.all(dependancies).then(function() {
                  deferred.resolve();
                }, function(reason) {
                  deferred.reject(reason);
                });
              }

              return deferred.promise;
            };

            /**
             * For every preference defined in the route as a requirement
             *  - Create a promise that will be resolved/rejected by currentUser if preference is required value
             *  - Resolve route if no preferences defined or currentUser has all required preferences
             *  - Reject route if any required preferences are not set to required value
             */
            resolve.checkPreferences = function($q, currentUser) {
              var deferred = $q.defer(),
                  dependancies = [];

              _.each(params.preferences, function(value, pref) {
                var permissionDeferred = $q.defer(),
                    promise = currentUser.checkPreference(pref, value);

                promise.then(function() {
                  permissionDeferred.resolve();
                }, function() {
                  permissionDeferred.reject('missing_preference');
                });
                dependancies.push(permissionDeferred.promise);
              });

              if (dependancies.length === 0) {
                deferred.resolve();
              } else {
                $q.all(dependancies).then(function() {
                  deferred.resolve();
                }, function(reason) {
                  deferred.reject(reason);
                });
              }

              return deferred.promise;
            };

            resolve.checkMobile = function($rootScope, $route) {
              if ($rootScope.isMobile) {
                if (params.mobileTemplateUrl) {
                  $route.current.templateUrl = params.mobileTemplateUrl;
                }
                if (params.mobileController) {
                  $route.current.controller = params.mobileController;
                }
              }
            };

            params.resolve = resolve;
          }

          $routeProvider.when(location, params);
        });

        $routeProvider.otherwise({redirectTo: '/dashboard'});
      }
    ]
  ).run();
})(this, jQuery);
