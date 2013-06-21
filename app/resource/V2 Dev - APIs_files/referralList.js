 (function(root){
  "use strict";

  var referralList = function($scope, models, directiveRegistry) {
    var model = models.get('referralReport');

    model.getReferralList().success(function(data) {
      $scope.referralList = data;
    });
  };

  referralList.$inject = ['$scope', 'models', 'directiveRegistry']

  root.Application.controller('Controllers.referralList', referralList);

})(this);
 