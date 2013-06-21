/*
 * main app controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.app',
    [
      '$scope',
      '$http',
      '$window',
      '$location',
      '$timeout',
      '$rootScope',
      '$route',
      'hasSession',
      'api',
      'currentUser',
      'localStorageService',
      function($scope,
               $http,
               $window,
               $location,
               $timeout,
               $rootScope,
               $route,
               hasSession,
               api,
               currentUser,
               localStorage) {

        root.Config.$http = $http;


        var storageDebug = localStorage.isSupported() ? localStorage.get('storageDebug') : false;
        api.logger.enabled = storageDebug;

        if ($location.search()) {
          var debugState = Number($location.search().debug);
          switch (debugState) {
            case 4:
              localStorage.add('storageDebug', true);
              api.logger.enabled = true;
              break;

            case 3:
              localStorage.remove('storageDebug');
              api.logger.enabled = true;
              break;
          }



        }

        $scope.sidebarClass = 'max';
        $scope.sidebarToggleClass = '';
        $scope.contentClass = '';

        var brandPrefs = currentUser.BrandPreferences;
        $rootScope.network_name = root.Config.network_name;

        $rootScope.getPreference = function(pref) {
          return brandPrefs[pref];
        };

        $rootScope.$on('UserLoaded',  function(success) {
          if (success) {
            brandPrefs = currentUser.BrandPreferences;
          }
        });

        /**
         * sets sidebar and content markup with correct classes for display
         * @param  {event} $event jquery event object.
         * @return {void}
         */
        $scope.toggleSidebar = function($event) {
          if ($event) {
            $event.preventDefault();
          }

          if ($scope.sidebarClass !== 'min') {
            $scope.collapseSidebar();
          } else {
            $scope.expandSidebar();
          }
        };

        /**
         * sets sidebar and content markup with correct classes for display in an expanded state
         * @return {void}
         */
        $scope.expandSidebar = function() {
          if ($scope.sidebarClass === 'mobile') { return; }

          $scope.sidebarClass = 'max';
          $scope.contentClass = '';
          $scope.sidebarToggleClass = '';
        };

        /**
         * sets sidebar and content markup with correct classes for display in an collapsed state
         * @return {void}
         */
        $scope.collapseSidebar = function() {
          $scope.sidebarClass = 'min';
          $scope.contentClass = 'max';
          $scope.sidebarToggleClass = 'on';
        };

        /**
         * sets sidebar and content markup with correct class for mobile display
         * @param  {event} $event jquery event object.
         * @return {void}
         */
        $scope.toggleMobileMenu = function($event) {

          // make sure to trigger resize so sidebar is resized when toggled
          $(window).trigger('resize');

          $event.preventDefault();
          if ($scope.sidebarClass !== 'mobile') {
            $scope.sidebarClass = 'mobile';
            $scope.contentClass = 'menu';
          } else {
            $scope.sidebarClass = '';
            $scope.contentClass = '';
          }
        };

        $rootScope.getApiRequests = function() {
          return api.logger.getRequests();
        };

        $rootScope.getApiCallStats = function() {
          return api.logger.getCallStats();
        };

        $rootScope.getApiLogEnabled = function() {
          return api.logger.enabled;
        };

        $rootScope.exportApiLog = function() {
          api.logger.dump();
        };

        // Store the timeout method that will get reset to a new 30 seconds every call to increment loading
        var loadingCountTimeoutID;

        $rootScope.loadingCount = 0;

        $rootScope.incrementLoading = function() {
          $rootScope.loadingCount++;

          clearTimeout(loadingCountTimeoutID);
          loadingCountTimeoutID = setTimeout(function() {
            if ($rootScope.loadingCount > 0) {
              $rootScope.decrementLoading(true);
            }
          }, 30000);
        };

        $rootScope.decrementLoading = function(setToZero) {
          // $timeout is used to prevent issue where UI doesn't update while in a render loop
          // common case is: loading shown while switching routes and then immediately shown again to indicate
          //                 data is loading in table. Without timeout, data rendering in table load is never shown.
          $timeout(
            function() {
              if (setToZero || $rootScope.loadingCount <= 1) {
                $rootScope.loadingCount = 0;
                clearTimeout(loadingCountTimeoutID);
              } else {
                $rootScope.loadingCount--;
              }
            },
            200
          );
        };

        $rootScope.addReturnLocation = function() {
          var loc = $location.path();

          // Only update the return location if it isn't the login or default.
          var found = _.find(['/login', '/dashboard'], function(part) {
            return loc.indexOf(part) !== -1;
          });

          if (!found) {
            $rootScope.returnLocation = loc;
          }
        };

        $rootScope.$on('$routeChangeStart', function() {
          $rootScope.incrementLoading();
          $rootScope.addReturnLocation();
        });

        $rootScope.$on('$routeChangeSuccess', function() {
          $rootScope.decrementLoading();
        });

        $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
          $rootScope.decrementLoading(true);

          var onLoginPage = ($location.url().indexOf('/login') !== -1);

          switch (rejection) {
            case 'missing_permission':
            case 'missing_preference':
              $scope.flashError('This feature is not enabled');
              break;

            case 'login_required':
              if (root.Config.internal_auth === true) {
                window.top.location.href = '/logout';
              } else {
                if (!onLoginPage) {
                  $location.path('/login');
                }
              }
              break;
          }
        });

        // Only hide the preloader once per application load
        $scope.preloadHidden = false;

        $rootScope.$on('sessionLogin', function(localScope, loggedIn) {
          if (!$scope.preloadHidden) {
            $('#preload').addClass('fade').delay(1100).queue(function() {
              $('body').removeClass('preload');
            });
            $scope.preloadHidden = true;
          }
          var onLoginPage = ($location.url().indexOf('/login') !== -1);

          // If on login page, redirect to last location or dashboard.
          if (loggedIn && onLoginPage) {
            $location.path($rootScope.returnLocation || '/dashboard');
          }

          // If not logged in and not on login, redirect to login
          if (!loggedIn && !onLoginPage && !root.Config.internal_auth) {
            $rootScope.addReturnLocation();
            $location.path('/login');
          }
        });

        // Check and trigger sessionLogin
        hasSession.init();

        $scope.flashErrorMessage = {
          text    : '',
          visible : false
        };

        $scope.flashError = function(message) {
          $scope.flashErrorMessage.text = message;
          $scope.flashErrorMessage.visible = true;
          $timeout(function() {
            $scope.flashErrorMessage.visible = false;
          }, 2500);
        };

        // error message handling
        var errorParams = {},
          successParams = {};

        /**
         * Add an error message to the page
         * @param string param   parameter in $scope formatted message will be applied to.
         * @param string title   title of error alert dialog.
         * @param mixed  message (string or array of strings to be formatted as a list) - body of error alert dialog.
         */
        $scope.addError = function(param, title, message) {
          title = title || '';
          message = message || '';
          errorParams[param] = _.uniqueId('alertmsg-');

          // if message is blank, leave blanke
          if (message && _.isString(message) && message.length === 0) {
            message = ''; // handles null/false/undefined
          } else {
            // convert to array
            if (_.isArray(message) === false) {
              message = [message];
            }
            // convert array to ul/li
            message = '<ul><li>{0}</li></ul>'.format(message.join('</li><li>'));
          }

          var formatString = '<div id="{0}" class="alert alert-error">';
          formatString += '<a href="#" class="close" data-dismiss="alert" ng-click="clearAlert(\'{1}\')">×</a>';
          formatString += '<h2>{2}</h2> {3}</div>';
          $scope[param] = formatString.format(errorParams[param], param, title, message);

          // scroll after element added to DOM
          $timeout(
            function() {
              $('body').scrollTo('#' + errorParams[param], 800);
            }, 300
          );
        };

        /**
         * Add a success message to the page
         * @param string param   parameter in $scope formatted message will be applied to.
         * @param string title   title of success alert dialog.
         * @param string message body of succes alert dialog.
         */
        $scope.addSuccess = function(param, title, message) {
          title = title || '';
          message = message || '';
          successParams[param] = _.uniqueId('alertmsg-');

          var formatString = '<div id="{0}" class="alert alert-success">';
          formatString += '<a href="#" class="close" data-dismiss="alert" ng-click="clearAlert(\'{1}\')">×</a>';
          formatString += '<h2>{2}</h2> {3}</div>';
          $scope[param] = formatString.format(successParams[param], param, title, message);

          $timeout(
            function() {
              $scope.clearAlert(param, true);
            }, 5000
          );
        };

        /**
         * Clear a success or error message
         * @param  string  param  parameter in $scope, containing formatted message.
         * @param  boolean fade   whether the alert dialog should simple hide() or fade().
         */
        $scope.clearAlert = function(param, fade) {
          var msgId;

          function hideMessage(msgId, fade) {
            if (fade && msgId) {
              root.angular.element('#' + msgId).fadeOut('fast', function() {
                $scope[param] = '';
              });
            } else {
              if (msgId) {
                root.angular.element('#' + msgId).hide();
              }
              $scope[param] = '';
            }
          }

          if (errorParams[param]) {
            msgId = errorParams[param];
            delete(errorParams[param]);
            hideMessage(msgId, fade);
          }

          if (successParams[param]) {
            msgId = successParams[param];
            delete(successParams[param]);
            hideMessage(msgId, fade);
          }
        };

        var savedMessages = [];
        $scope.queueMessage = function(method, args) {
          savedMessages.push({'method' : method, 'args' : args});
        };

        // body class handling
        $scope.bodyClass = '';

        // listen for page changes and add needed body class
        $scope.$on('$routeChangeSuccess', function(event, route) {
          $scope.bodyClass = route.bodyClass || '';

          $scope.pageTitle = route.pageTitle ? route.pageTitle : '';

          // clear error messages
          if (_.size(errorParams) > 0) {
            _.each(errorParams, function(msgId, param) {
              $scope.clearAlert(param, false);
            });
          }

          // clear success messages
          if (_.size(successParams) > 0) {
            _.each(successParams, function(msgId, param) {
              $scope.clearAlert(param, false);
            });
          }

          if (savedMessages.length > 0) {
            _.each(savedMessages, function(msgObj) {
              if ($scope[msgObj.method]) {
                $scope[msgObj.method].apply($scope, msgObj.args);
              }
            });

            // reset queue
            savedMessages = [];
          }
        });

        /**
         * allows debuging in views
         * @return {void}
         */
        $rootScope.log = function() {
          console.log.apply(console, arguments);
        };

        /**
         * wrapper console.error'ing so it can be turned off on prod easily
         * @return {void}
         */
        $rootScope.logError = function() {
          console.error.apply(console, arguments);
        };


        if (localStorage.isSupported()) {
          var apiSettings = localStorage.get('apiSettings');
          if (apiSettings) {
            $scope.flashError('You are currently logged in on the ' + apiSettings.network_id + ' network' +
              ' as affliate user id ' + apiSettings.affiliate_user_id +
              ': beware making changes.');
          }
        }

        var MOBILE_WIDTH = 755;
        $rootScope.isMobile = ($($window).width() < MOBILE_WIDTH);

        // Detect Mobile has to be throttled or else multiple reload events will be triggered
        // Calling multiple $route.reload()s in succession, causes directiveRegistry errors
        $rootScope.detectMobile = _.throttle(function() {
          var isMobile = ($($window).width() < MOBILE_WIDTH);
          if (isMobile != $rootScope.isMobile) {
            if (!_.isEmpty($route.current.mobileTemplateUrl) || !_.isEmpty($route.current.mobileController)) {
              $timeout(function() {
                $rootScope.isMobile = isMobile;
                $route.reload();
                $rootScope.$broadcast('isMobileSwitched', isMobile);
              });
            } else {
              // Wrap in a $timeout is the best way call an $apply cycle without checking route.phase
              $timeout(function() {
                $rootScope.isMobile = isMobile;
              });
            }
          }
        }, 150);

        $($window).bind('resize', $rootScope.detectMobile);

        // resize our sidebar to height of window and immediately trigger it
        $($window).bind('resize', _.throttle(function() {
          $('#sidebar').height($window.innerHeight || $($window).height());
        }, 100)).trigger('resize');

        // Run textfill rules to resize some text to fit correctly in parent in newly resized window
        $($window).bind('resize', _.throttle(function() {
          root.angular.element('.quickstats p').textfill({maxFontPixels: 28});
        }, 1000));

        if (root.Config.proxy_url) {
          $scope.proxy = {};
          $scope.proxy.enableProxy = false;

          $scope.proxy.setBucketName = function() {
            root.Config.proxyBucket = encodeURIComponent($.trim($scope.proxy.bucketName));
          };

          $scope.proxy.deleteBucket = function() {
            var url = root.Config.proxy_url + encodeURIComponent($.trim($scope.proxy.bucketName));
            $http.jsonp(url + '?_method=delete&callback=JSON_CALLBACK').then(function(){
              $scope.proxy.bucketName = '';
              $scope.proxy.setBucketName();
            });
          };

          $scope.$watch('proxy.enableProxy', function() {
            root.Config.proxyEnabled = $scope.proxy.enableProxy;
            $scope.proxy.setBucketName();
          });

          $scope.proxy.cacheOn = function() {
            return root.Config.proxy_url && root.Config.proxyEnabled && root.Config.proxyBucket;
          };
        }
  }]);

})(this, jQuery);
