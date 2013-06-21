/*
 * dashboard controller
 * performance widgets on the dashboard are directives, and self-contained,
 * pulling options from the directive markup within the dashboard partial
 *
 * This controller should be used to populate these directive markup locations and options
 *
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.dashboard',
    ['$scope',
      function($scope) {
        // widget data will be stored in widgets namespace
        $scope.widgets = {};
    }]
  );

})(this, jQuery);
