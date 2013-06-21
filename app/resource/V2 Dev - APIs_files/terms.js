/*
 * Terms of Service Controller
 */

(function(root) {
  'use strict';

  root.Application.controller('Controllers.terms',
    ['$scope', 'models', function($scope, models) {
      
      var promise = models.get('terms').getTerms();
      $scope.incrementLoading();

      promise.success(function(data) {
        $scope.terms = data;
        $scope.decrementLoading();
      });

      promise.error(function() {
        $scope.termsError = true;
        $scope.decrementLoading();
      });

    }]);
})(this);
