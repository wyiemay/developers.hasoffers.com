 (function(root){
  "use strict";

  var apiKey = function($scope, models) {
    var model = models.get('apiKey');

    model.getApiKey().success(function(data) {
      console.log(data);
    })
  };



  referralList.$inject = ['$scope', 'models']

  root.Application.controller('Controllers.apiKey', apiKey);
})(this);
 