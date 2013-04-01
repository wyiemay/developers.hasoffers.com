"use strict";

var docModule = angular.module('Docs', ['ui.bootstrap']);

docModule.config(function($routeProvider) {
    /**
     * Routes
     */
    $routeProvider.when('/',
                        {templateUrl: "welcome.html"}
        )
        .when("/controller/:controllerName",
              {controller:  ControllerListCtrl,
               templateUrl: "controllerList.html"}
        )
        .when("/controller/:controllerName/method/:methodName",
              {controller:  MethodViewCtrl,
               templateUrl: "details.html"}
        )
        .otherwise({redirectTo: '/'});
});

/**
 * Utility library
 */
docModule.factory('Util', function($filter, $rootScope,$http) {
    // Public methods:
    return {
        /**
         * gets the documentation for external public facing controllers/methods
         * @return promise
         */
        getExternalDoc: function(){
            var promise = $http.get('docSource/External_doc.json');
            return promise;
        },
        /**
         * gets the documentation for the Model
         */
        getModelDoc: function(){
            var promise = $http.get('docSource/Model_doc.json');
            return promise;
        },
        /**
         * @param controllers - list of controllers to search
         * @param controllerName - controller name to search by
         */
        findMethod: function(controllers,controllerName, methodName) {

            var searchFilters = {
                controllerName: controllerName,
                methodName:     methodName
            };

            var result = controllers.filter(function(value) {
                return (value.controllerName === this.controllerName &&
                        value.methodName     === this.methodName);
            }, searchFilters);

            if (result.length === 0) {
                return null;
            }

            return result[0];
        },
        /**
         * binds fields to be used with the method to the method object
         * @param array - model documentation to extract from
         * @param json  - method data to bind fields to
         * @return json - method with binded fields
         */
        bindFields: function(models,displayCtrl) {
             if (displayCtrl.linkModel != null) {

                 var searchFilter = {
                     namespace: displayCtrl.linkModel
                 };

                 var results = models.filter(function(value) {
                     return (value.namespace === this.namespace);
                 }, searchFilter);

                 if (results.length !== 0) {
                     displayCtrl.fields = results[0].fields;
                 }
             }

             return displayCtrl;
        },
        /**
         * @json - method object
         */
        buildApiConstructor: function(displayCtrl) {

            var paramObjects = {
                filters: {
                    template: "filtersParam.html",
                    nesting: {
                        AND: "AND",
                        OR:  "OR"
                    },
                    operators: [
                        {name: "=",     value: ""},
                        {name: "!=",    value: "NOT_EQUAL_TO"},
                        {name: "<",     value: "LESS_THAN"},
                        {name: "<=",    value: "LESS_THAN_OR_EQUAL_TO"},
                        {name: ">",     value: "GREATER_THAN"},
                        {name: ">=",    value: "GREATER_THAN_OR_EQUAL_TO"},
                        {name: "like",  value: "LIKE"},
                        {name: "rlike", value: "RLIKE"}
                    ]
                },
                data: {
                    template: "dataParam.html"
                },
                sort: {
                    template:   "sortParam.html",
                    directions: ['ASC', 'DESC']
                },
                fields: {
                    template: "fieldsParam.html"
                },
                field: {
                    template: "fieldParam.html"
                },
                contain: {
                    template: "containParam.html"
                },
                other: {
                    template: "otherParam.html"
                }
            };

            var apiParams = [];
            angular.forEach(displayCtrl.params, function(param) {

                var paramType = paramObjects.other;
                if (paramObjects[param.name] != null) {
                    paramType = paramObjects[param.name];
                }

                apiParams.push({
                    value: param,
                    type:  paramType,
                    parse: []
                });
            });

            return apiParams;
        },
        /**
         * @param array - external docs to search in
         * @param string
         */
        findMethodsByController: function(controllers,controllerName) {

            var searchFilters = {
                controllerName: controllerName
            };

            var result = controllers.filter(function(value) {
                return (value.controllerName === this.controllerName);
            }, searchFilters);

            if (result.length === 0) {
                return null;
            }

            return result;
        },
        /**
         * morphs the flat list of controllers into a structured list of [{controllerName to methodNames},...]
         * @param array - list of controllers
         * @return array - see description
         */
        aggregateByController: function(controllers){
            var ctrlrs = {},
                ctrlrsArray = [],
                i = 0;

            for (i; i < controllers.length; i++){
                var controller = controllers[i];

                if (!ctrlrs[controller.controllerName]){
                    ctrlrs[controller.controllerName] = [controller.methodName];
                }
                else
                {
                    ctrlrs[controller.controllerName].push(controller.methodName);
                }
            }

            for (var controllerName in ctrlrs)
            {
                if (ctrlrs.hasOwnProperty(controllerName)){
                    ctrlrsArray.push({controllerName: controllerName, methods: ctrlrs[controllerName]});
                }
            }

            return ctrlrsArray;
        }
    };
});

/**
 * Controller for list of methods
 */
function ControllerListCtrl($scope,
                            $routeParams,
                            Util) {

    Util.getExternalDoc().success(function(controllers){
        $scope.controllerList = Util.findMethodsByController(
            controllers,
            $routeParams.controllerName
        );
    });
}

/**
 * filters controllers based on whether or not the partial matches a method name in the controller
 */
docModule.filter('hasMethodFilter', [function(){
    return function(controllers, methodNamePartial){
        if (methodNamePartial === '' || methodNamePartial === undefined) {
            return controllers;
        }

        // filter controllers which don't have a method matching the partial
        var newList = controllers.filter(function(controller) {
           // turn the array into a string and check if there is any
           // partial instance of the method name in the string of method names
           return controller.methods.join(' ').toLowerCase().match(methodNamePartial.toLowerCase());
        });

        return newList;
    };

}]);

/**
 * Controller for a list of sidebar with controllers and methods
 */
function SideBarController($scope, Util) {
    Util.getExternalDoc().success(function(controllers){
        $scope.ctrlrs = Util.aggregateByController(controllers);
        $scope.searchQuery = "";
        $scope.isFiltering = false;
        $scope.$watch('searchQuery', function(){
            $scope.isFiltering = $scope.searchQuery.length === 0 ? false : true;
        });
    });
}

/**
 * controls the disqus comments
 * resets everytime a new method view is displayed
 */
function DisqusController($scope, $routeParams){
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
}

/**
 * Method view controller
 */
function MethodViewCtrl($scope,
                  $routeParams,
                  $http,
                  Util) {


    Util.getExternalDoc().success(function(data){
        var displayCtrl = Util.findMethod(data,$routeParams.controllerName,
                                         $routeParams.methodName);

        if (displayCtrl != null) {
            Util.getModelDoc().success(function(model){
                $scope.displayCtrl = Util.bindFields(model, displayCtrl);
                $scope.apiParams   = Util.buildApiConstructor($scope.displayCtrl);

                $scope.apiCall = "http://api.hasoffers.com/v3/" +
                    $scope.displayCtrl.controllerName +
                    ".json?Method=" + $scope.displayCtrl.methodName;
            }); // get model doc
        } // display ctrl not null

      /**
       * @param bool - is required
       * @return string
       */
      $scope.displayRequired = function(isRequired) {
          return true === isRequired ? '*' : '';
      };

      /**
       * @return bool - whether there is a contains list
       */
      $scope.hideContain = function() {
          return ($scope.displayCtrl && $scope.displayCtrl.containList == null);
      };

      /**
       * @param object - param to check
       * @return bool - whether or not to show the trash button for this parameter
       */
      $scope.hideTrashButton = function(param) {
          return (param.value.isRequired);
      };

      /**
       * @param array - reference array to modify
       * @return void
       */
      $scope.addFilterField = function(addTo) {
          addTo.push({});
      };

      /**
       * runs the api call
       * @return void
       */
      $scope.runApiCall = function() {
          if ($scope.displayCtrl.networkToken == null ) {
              $scope.apiResponse = 'Please provide Network Token';
              return;
          }

          if ($scope.displayCtrl.networkId == null ) {
              $scope.apiResponse = 'Please provide Network Id';
              return;
          }

          $http.jsonp($scope.apiCall.replace("json", "jsonp") +
                      "&callback=JSON_CALLBACK")
              .success(function(data) {
                  $scope.apiResponse = angular.toJson(data, true);
              })
              .error(function(data) {
                  $scope.apiResponse = angular.toJson(data, true);
              });
      };

      /**
       * constructs a string representation of the api call
       */
      $scope.updateApiCall = function() {

          $scope.apiCall = "http://api.hasoffers.com/v3/" +
              $scope.displayCtrl.controllerName +
              ".json?Method=" + $scope.displayCtrl.methodName;

          if ($scope.displayCtrl.networkToken != null) {
              $scope.apiCall += "&NetworkToken=" + $scope.displayCtrl.networkToken;
          }

          if ($scope.displayCtrl.networkId != null) {
              $scope.apiCall += "&NetworkId=" + $scope.displayCtrl.networkId;
          }

          angular.forEach($scope.apiParams, function(param) {

              var fieldType   = param.value.name;
              var parseValues = param.parse;

              switch (fieldType) {
                  case "filters":
                      // Default nesting to "AND"
                      var nesting = "";
                      if (param.nesting !== "AND") {
                          nesting = "[OR]";
                      }

                      angular.forEach(parseValues, function(value) {

                          // Default operator is equals
                          var operator = "[]";
                          if (value.selectOperator != null) {
                              operator = "[" + value.selectOperator + "]";
                          }

                          if (value.selectField != null &&
                              value.selectValue != null) {

                              $scope.apiCall += "&" + fieldType +
                                  nesting + "[" + value.selectField.name + "]" +
                                  operator + "=" + value.selectValue;
                          }
                      });
                      break;

                  case "sort":
                  case "data":
                      angular.forEach(parseValues, function(value) {

                          if (value.selectField != null &&
                              value.selectValue != null) {

                              $scope.apiCall += "&" + fieldType +
                                  "[" + value.selectField.name + "]" +
                                  "=" + value.selectValue;
                          }
                      });
                      break;

                  case "fields":
                      angular.forEach(parseValues, function(value) {

                          if (value.name != null) {
                              $scope.apiCall += "&" + fieldType +
                                  "[]=" + value.name;
                          }
                      });
                      break;

                  case "field":
                      if (parseValues.selectValue.name != null) {
                          $scope.apiCall += "&" + fieldType +
                              "=" + parseValues.selectValue.name;
                      }
                      break;

                  case "contain":
                      angular.forEach(parseValues, function(value) {

                          if (value.containName != null) {
                              $scope.apiCall += "&" + fieldType +
                                  "[]=" + value.containName;
                          }
                      });
                      break;

                 default:
                      if (parseValues.selectValue != null) {
                          $scope.apiCall += "&" + fieldType +
                              "=" + parseValues.selectValue;
                      }
                      break;
              } // switch
          }); // foreach
      }; // updateApiCall()
    }); // get external doc
} // MethodViewCtrl
