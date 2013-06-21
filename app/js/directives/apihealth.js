angular.module('Docs').directive('apiHealth',function($http) {
   return {
      restrict: 'A', // was E
      controller: function HealthCheckCtrl($scope, $http) {
          var health_check_url = 'http://api.hasoffers.com/v3/Internal_HealthCheck.jsonp?Method=full&NetworkId=demo&callback=JSON_CALLBACK';

          //$scope.statusClass = 'text-error';
          //$scope.statusClass = 'btn-warning';

          $http({method: 'jsonp', url: health_check_url}).
            success(function(data, status) {
                if( angular.isDefined(data.response.data) && data.response.data === 'STELLAR' ) {
                  //$scope.statusClass = 'text-success';
                  $scope.apiSuccess = true;
                }
            });
      },
      //templateUrl: 'partials/apihealth.html'
   };
});
