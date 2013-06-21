/*
 * Custom Page Controller
 */

(function(root) {
  'use strict';

  root.Application.controller('Controllers.customPage',
    ['$scope', '$routeParams', 'models', 'currentUser', '$timeout',
      function($scope, $routeParams, models, currentUser, $timeout) {

      $scope.page_id = $routeParams.id;
      $scope.not_found = false;
      $scope.page = {};

      // Do macro substitutions on html content
      var doMacros = function() {
        $scope.page.html = $scope.page.html.replace('<affiliate_id>', currentUser.Affiliate.id || '');
        $scope.page.html = $scope.page.html.replace('<firstname>', currentUser.AffiliateUser.first_name || '');
        $scope.page.html = $scope.page.html.replace('<lastname>', currentUser.AffiliateUser.last_name || '');
        $scope.page.html = $scope.page.html.replace('<email>', currentUser.AffiliateUser.email || '');
        $scope.page.html = $scope.page.html.replace('<company>', currentUser.Affiliate.company || '');
      };

      var promise = models.get('customPage').getPage($scope.page_id);

      promise.success(function(data) {
        if (!_(data).hasMembers(0, 'CustomPage')) {
          $scope.not_found = true;
          return;
        }

        $scope.page = data[0].CustomPage;
        $scope.page.html = '<h1>' + $scope.page.title + '</h1>' + $scope.page.html;

        //$scope.page.html = '<script>document.location.href="http://developers.hasoffers.com";</script>';

        $scope.$on('UserLoaded', function() {
          $timeout(function() {
            doMacros();
          });
        });
        if (currentUser.isLoaded) {
          doMacros();
        }
      });

      promise.error(function() {
        $scope.not_found = true;
      });
    }]);

})(this);
