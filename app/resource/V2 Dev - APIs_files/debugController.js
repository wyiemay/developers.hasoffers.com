(function(root) {
  "use strict";

  root.Application.controller('Controllers.debugPanel',
    ['$scope', 'currentUser', 'localStorageService', '$http', '$timeout',
      function($scope, currentUser, localStorageService, $http, $timeout) {


      $scope.conf = {
        'affiliate_user_id' : root.Config.affiliate_user_id,
        'api_network_id' : root.Config.api_network_id
      };

      root.OriginalApiSettings = _(
        localStorageService.get('originalApiSettings') || root.OriginalApiSettings || {}
      ).extend($scope.conf);

      localStorageService.add('originalApiSettings', root.OriginalApiSettings);



      $scope.revertApiSettings = function() {
        _(root.OriginalApiSettings).each(function(setting, key) {
          root.Config[key] = setting;
        });

        $scope.conf = {
          'affiliate_user_id' : root.Config.affiliate_user_id,
          'api_network_id' : root.Config.api_network_id
        };

        localStorageService.remove('apiSettings');

        reloadCountdown(3, 'Restored original session token');
      };


      $scope.setApiSettings = function() {

        var outUrl = root.Config.sessionTokenUrl +
                     '&callback=JSON_CALLBACK' +
                     '&NetworkId=' + $scope.conf.api_network_id +
                     '&affiliate_user_id=' + $scope.conf.affiliate_user_id;

        var request = $http.jsonp(outUrl);

        request.success(function(data) {
          if (!data) {
            $scope.message = 'There was an error getting a session token ' +
              '- check the affiliate user id and try again';
            return;
          }

          var apiSettings = {
            'sessionToken' : data,
            'affiliate_user_id' : $scope.conf.affiliate_user_id,
            'network_id': $scope.conf.api_network_id,
            'api_endpoint' : root.Config.fallbackApiUrl
          };

          localStorageService.add('apiSettings', apiSettings);

          reloadCountdown(3, 'Created session token');
        });
      };


      var reloadCountdown = function(seconds, message) {
        seconds = Number(seconds);
        var countDownTimeout;

        $scope.message =  message + ' - reloading page in ' + seconds + ' seconds.';
        var countDownTick = function() {
          seconds -= 1;
          $scope.message =  message + ' - reloading page in ' + seconds + ' seconds.';
          if (!seconds) {
            $timeout.cancel(countDownTimeout);
            document.location.reload();
          } else {
            countDownTimeout = $timeout(countDownTick, 1000);
          }
        };

        countDownTimeout = $timeout(countDownTick, 1000);
      };
  }]);
})(this);
