(function(window, DISQUS) {
    'use strict';

    /**
     * Controller for list of methods
     */
    window.ControllerListCtrl = function($scope, $routeParams, Util) {
        Util.getExternalDoc().success(function(controllers){
            $scope.controllerList = Util.findMethodsByController(
                controllers,
                $routeParams.controllerName
            );
        });
    };

    /**
     * Controller for a list of sidebar with controllers and methods
     */
    window.SideBarController = function($scope, Util) {
        Util.getExternalDoc().success(function(controllers){
            $scope.ctrlrs = Util.aggregateByController(controllers);
            $scope.searchQuery = '';
            $scope.isFiltering = false;
            $scope.$watch('searchQuery', function(){
                $scope.isFiltering = $scope.searchQuery.length === 0 ? false : true;
            });
        });
    };

    /**
     * controls the disqus comments
     * resets everytime a new method view is displayed
     */
    window.DisqusController = function($scope, $routeParams){
       var identifier = $routeParams.controllerName + '::' + $routeParams.methodName;
       var url = document.location.origin + '/#!' + identifier;

       // reset the disqus comments for the current page
       DISQUS.reset({
         reload: true,
         config: function () {
           this.page.identifier = identifier;
           this.page.url = url;
         }
       });
    };

    /**
     * Method view controller
     */
    window.MethodViewCtrl = function($scope, $routeParams, $http, Util, UserInfo) {
        Util.getExternalDoc().success(function(data){
            var displayCtrl = Util.findMethod(data,$routeParams.controllerName,
                                             $routeParams.methodName);

            if (displayCtrl != null) {
                Util.getModelDoc().success(function(model){
                    $scope.displayCtrl = Util.bindFields(model, displayCtrl);
                    $scope.apiParams   = Util.buildApiConstructor($scope.displayCtrl);
                    // default to user info
                    $scope.displayCtrl.networkToken = UserInfo.getProperty('NetworkToken');
                    $scope.displayCtrl.networkId = UserInfo.getProperty('NetworkId');
                    $scope.updateApiCall();
                }); // get model doc
            } // display ctrl not null

          /**
           * displayRequired
           * @param bool - is required
           * @return string
           */
          $scope.displayRequired = function(isRequired) {
              return true === isRequired ? '*' : '';
          };

          /**
           * hideContain
           * @return bool - whether there is a contains list
           */
          $scope.hideContain = function() {
              return ($scope.displayCtrl && $scope.displayCtrl.containList == null);
          };

          /**
           * hideTrashButton
           * @param object - param to check
           * @return bool - whether or not to show the trash button for this parameter
           */
          $scope.hideTrashButton = function(param) {
              return (param.value.isRequired);
          };

          /**
           * addFilterField
           * @param array - reference array to modify
           * @return void
           */
          $scope.addFilterField = function(addTo) {
              addTo.push({});
          };

          /**
           * runApiCall
           * runs the api call
           * @return void
           */
          $scope.runApiCall = function() {
              if ($scope.displayCtrl.networkToken == null ) {
                  $scope.apiResponse = 'Please provide Network Token';
                  return;
              }

              // update user info
              UserInfo.setProperty('NetworkToken', $scope.displayCtrl.networkToken);

              if ($scope.displayCtrl.networkId == null ) {
                  $scope.apiResponse = 'Please provide Network Id';
                  return;
              }

              // update user info
              UserInfo.setProperty('NetworkId', $scope.displayCtrl.networkId);

              $http.jsonp($scope.apiCall.replace('json', 'jsonp') +
                          '&callback=JSON_CALLBACK')
                  .success(function(data) {
                      $scope.apiResponse = angular.toJson(data, true);
                  })
                  .error(function(data) {
                      $scope.apiResponse = angular.toJson(data, true);
                  });
          };

          /**
           * updateApiCall
           * constructs a string representation of the api call
           */
          $scope.updateApiCall = function() {

              $scope.apiCall = 'http://api.hasoffers.com/v3/' +
                  $scope.displayCtrl.controllerName +
                  '.json?Method=' + $scope.displayCtrl.methodName;

              if ($scope.displayCtrl.networkToken != null) {
                  $scope.apiCall += '&NetworkToken=' + $scope.displayCtrl.networkToken;
              }

              if ($scope.displayCtrl.networkId != null) {
                  $scope.apiCall += '&NetworkId=' + $scope.displayCtrl.networkId;
              }

              angular.forEach($scope.apiParams, function(param) {

                  var fieldType   = param.value.name;
                  var parseValues = param.parse;

                  switch (fieldType) {
                      case 'filters':
                          // Default nesting to "AND"
                          var nesting = '';
                          if (param.nesting !== 'AND') {
                              nesting = '[OR]';
                          }

                          angular.forEach(parseValues, function(value) {

                              // Default operator is equals
                              var operator = '[]';
                              if (value.selectOperator != null) {
                                  operator = '[' + value.selectOperator + ']';
                              }

                              if (value.selectField != null &&
                                  value.selectValue != null) {

                                  $scope.apiCall += '&' + fieldType +
                                      nesting + '[' + value.selectField.name + ']' +
                                      operator + '=' + value.selectValue;
                              }
                          });
                          break;

                      case 'sort':
                      case 'data':
                          angular.forEach(parseValues, function(value) {

                              if (value.selectField != null &&
                                  value.selectValue != null) {

                                  $scope.apiCall += '&' + fieldType +
                                      '[' + value.selectField.name + ']' +
                                      '=' + value.selectValue;
                              }
                          });
                          break;

                      case 'fields':
                          angular.forEach(parseValues, function(value) {

                              if (value.name != null) {
                                  $scope.apiCall += '&' + fieldType +
                                      '[]=' + value.name;
                              }
                          });
                          break;

                      case 'field':
                          if (parseValues.selectValue.name != null) {
                              $scope.apiCall += '&' + fieldType +
                                  '=' + parseValues.selectValue.name;
                          }
                          break;

                      case 'contain':
                          angular.forEach(parseValues, function(value) {

                              if (value.containName != null) {
                                  $scope.apiCall += '&' + fieldType +
                                      '[]=' + value.containName;
                              }
                          });
                          break;

                     default:
                          if (parseValues.selectValue != null) {
                              $scope.apiCall += '&' + fieldType +
                                  '=' + parseValues.selectValue;
                          }
                          break;
                  } // switch
              }); // foreach
          }; // updateApiCall()
        }); // get external doc
    }; // MethodViewCtrl
})(window, DISQUS);
