/*
 * sidebar controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.sidebar',
    [
      '$scope', '$location', '$timeout', 'localStorageService', 'hasSession', 'currentUser', 'models',
      function($scope, $location, $timeout, localStorageService, hasSession, currentUser, models) {

        $scope.links = {
          'account'   : [],
          'offers'    : [],
          'reports'   : [],
          'tabs'      : [],
          'tools'     : [],
          'subNavMap' : {}
        };

        $scope.$on('UserLoaded', function(success) {
          if (success) {
            $scope.hasPermission = $.proxy(currentUser.hasPermission, currentUser);
            $scope.BrandPrefs = currentUser.BrandPreferences;
            $scope.Manager = currentUser.AccountManager;

            models.get('customPage').getPages().success(function(data) {
              _(data).each(function(item) {
                var link = item.CustomMenuLink;
                if (link.type == 'link') {
                  switch (link.tab) {
                    case 'ad_manager':
                    case 'snapshot':
                      $scope.links.subNavMap[link.custom_page_id] = 'tools';
                      $scope.links.tools.push(link);
                      break;
                    case 'stats' :
                      $scope.links.subNavMap[link.custom_page_id] = 'performance';
                      $scope.links.reports.push(link);
                      break;
                    case 'support' :
                      $scope.links.subNavMap[link.custom_page_id] = 'account';
                      $scope.links.account.push(link);
                      break;
                    default :
                      $scope.links.subNavMap[link.custom_page_id] = link.tab;
                      $scope.links[link.tab].push(link);
                      break;
                  }
                } else {
                  $scope.links.tabs.push(link);
                }
              });
            });
          }
        });

        $scope.updateMessageCount = function() {
          models.get('messages').getMessageCount($scope);
        };

        $scope.updateMessageCountInterval = 0;
        $scope.updateMessageCountTimeout = 0;

        // Update the new message count every 10 seconds
        $scope.startMessageCountInterval = function() {
          if (!$scope.updateMessageCountInterval) {
            $scope.updateMessageCountInterval = setInterval(function() {
              $scope.$apply(function() {
                $scope.updateMessageCount();
              });
            }, 10000);
          }
        };

        /**
         * We don't want to poll for new messages all day if the user isn't actually active on the site at all.
         * This creates a function that will throttled to only be invoked at most once every two seconds.
         * Throttling is necessary because this is called everytime there is a successful API call.
         */
        $scope.resetMessageCountTimeout = _.throttle(function() {
          // Start the timeout process from scratch if there was a previous timeout established
          clearTimeout($scope.updateMessageCountTimeout);

          // If the update interval isn't running right now because of previous inactivity, start it
          if (!$scope.updateMessageCountInterval) {
            $scope.startMessageCountInterval();
          }

          // After two minutes of no API activity, clear the interval so we stop checking for updates
          $scope.updateMessageCountTimeout = setTimeout(function() {
            clearInterval($scope.updateMessageCountInterval);
          }, 120000);
        }, 2000);

        $scope.$on('successful_api_call', function(event, url) {
          // Only trigger a reset of timeout for an API request other than checking how many messages user has
          if (url.indexOf('Method=getAffiliateUserAlerts') === -1) {
            $scope.resetMessageCountTimeout();
          }
        });

        $scope.$on('http_status_401', function() {
          clearInterval($scope.updateMessageCountInterval);
        });

        $scope.loggedIn = false;
        $scope.$on('sessionLogin', function(localScope, loggedIn) {
          $scope.loggedIn = loggedIn;

          if (loggedIn) {
            $scope.updateMessageCount();
            $scope.startMessageCountInterval();
            $scope.resetMessageCountTimeout();
          } else {
            delete($scope.affiliate);
          }
        });

        $scope.logOut = function($event) {
          $event.preventDefault();

          hasSession.logOut().then(function() {
            $location.path('/login');
          });
        };

        var subNavState = {},
          subNavClickState = {},
          translateRouteMap = {
            'conversion'        : 'performance',
            'performanceDetail' : 'performance',
            'referral'          : 'performance',
            'savedReport'       : 'performance',
            'adgroup'           : 'tools',
            'adgroups'          : 'tools',
            'messages'          : 'mail',
            'message'           : 'mail'
          };

        var translateRoute = function(route) {
          return translateRouteMap[route] || route;
        };

        // listen for and adjust sidebar states on page change
        $scope.$on('$routeChangeSuccess', function() {
          var newRoute = translateRoute($location.$$path.replace('/', '').split('/').shift());

          // Custom pages require a lookup to set correct subNavState
          if (newRoute == 'page') {
            newRoute = $scope.links.subNavMap[$location.$$path.replace('/', '').split('/').pop()];
          }

          subNavState[newRoute] = 'on';
          subNavClickState[newRoute] = true;

          if ($scope.sidebarClass == 'mobile') {
            $scope.$parent.sidebarClass = '';
            $scope.$parent.contentClass = '';
          }

          _.each(['dashboard', 'billing', 'mail', 'account'], function(key) {
            if (newRoute !== key) {
              subNavState[key] = '';
              subNavClickState[key] = false;
            }
          });
        });

        $scope.quicksearch = '';
        $scope.submitQuicksearch = function() {
          if (this.quicksearch) {
            $location.path('/offers');
            $location.search('search', this.quicksearch);
            this.quicksearch = '';
          }
        };

        $scope.toggleSubnav = function($event, subnav) {
          $event = $event || {type : 'click', preventDefault : function() {}};
          $event.preventDefault();

          switch ($event.type) {
            case 'mouseenter':
            case 'mouseover':
              subNavState[subnav] = 'on';

              if ($scope.$parent.sidebarClass == 'min') {
                $scope.$parent.toggleSidebar();
              }
              break;

            case 'mouseleave':
            case 'mouseout':
              // This state is being handled by the mouseout in subnavHover
              break;

            // Handles click type events
            default:
              // check if click but already open from hover, should stay open and save that it's clicked
              if (!(subNavState[subnav] == 'on' && !subNavClickState[subnav])) {
                subNavState[subnav] = (subNavState[subnav] == 'on') ? '' : 'on';
              }
              subNavClickState[subnav] = (subNavState[subnav] == 'on');
          }
        };

        $scope.$parent.$watch('sidebarClass', function(_new) {
          if (_new === 'min') {
            _.each(subNavState, function(val, subnav) {
              subNavState[subnav] = '';
              subNavClickState[subnav] = false;
            });
          }
        });

        $scope.subnavHover = function($event) {
          if ($event) {
            $event.preventDefault();

            if (_.indexOf(['mouseleave', 'mouseout'], $event.type) != -1) {
              _.each(subNavState, function(value, key) {
                if (value == 'on') {
                  if (!subNavClickState[key]) {
                    subNavState[key] = '';
                  }
                }
              });
            }
          }
        };

        $scope.getSubClass = function(subnav) {
          if (_.isUndefined(subNavState[subnav])) {
            subNavState[subnav] = '';
          }
          return subNavState[subnav];
        };
      }
    ]
  );

})(this, jQuery);
