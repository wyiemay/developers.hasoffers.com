"use strict";

angular.module('Docs', [])
    .config(function($routeProvider) {

        $routeProvider.when('/',
                            {controller:  WelcomeCtrl,
                             templateUrl: "welcome.html"}
            )
            .when("/controller/:controllerName",
                  {controller:  ControllerListCtrl,
                   templateUrl: "controllerList.html"}
            )
            .when("/controller/:controllerName/method/:methodName",
                  {controller:  ViewCtrl,
                   templateUrl: "details.html"}
            )
            .otherwise({redirectTo: '/'});
    })
    .run(['$rootScope', '$http', function($rootScope, $http) {

        $http.get('source/External_doc.json')
            .success(function(data) {

            if (data != null) {
                $rootScope.controllers = data;
            }
        });

        $http.get('source/Model_doc.json')
            .success(function(data) {

            if (data != null) {
                $rootScope.models = data;
            }
        });
    }])
    .factory('Util', function($filter, $rootScope) {

        // Public:
        return {

            findMethod: function(controllerName, methodName) {

                var searchFilters = {
                    controllerName: controllerName,
                    methodName:     methodName
                };

                var result = $rootScope.controllers.filter(function(value) {

                    return (value.controllerName === this.controllerName &&
                            value.methodName     === this.methodName);
                }, searchFilters);

                if (result.length === 0) {
                    return null;
                }

                return result[0];
            },
            bindFields: function(displayCtrl) {

                 if (displayCtrl.linkModel != null) {

                     var searchFilter = {
                         namespace: displayCtrl.linkModel
                     };

                     var results = $rootScope.models.filter(function(value) {
                         return (value.namespace === this.namespace);
                     }, searchFilter);

                     if (results.length !== 0) {
                         displayCtrl.fields = results[0].fields;
                     }
                 }

                 return displayCtrl;
            },
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
            findMethodsByController: function(controller) {

                var searchFilters = {
                    controllerName: controller
                };

                var result = $rootScope.controllers.filter(function(value) {

                    return (value.controllerName === this.controllerName);
                }, searchFilters);

                if (result.length === 0) {
                    return null;
                }

                return result;
            }
        };
    });

function WelcomeCtrl() {
}

function ControllerListCtrl($scope,
                            $routeParams,
                            Util) {

    $scope.controllerList = Util.findMethodsByController(
        $routeParams.controllerName
    );
}

function ViewCtrl($scope,
                  $routeParams,
                  $http,
                  Util) {

    $scope.displayCtrl = Util.findMethod($routeParams.controllerName,
                                         $routeParams.methodName);

    if ($scope.displayCtrl != null) {

        $scope.displayCtrl = Util.bindFields($scope.displayCtrl);
        $scope.apiParams   = Util.buildApiConstructor($scope.displayCtrl);

        $scope.apiCall = "http://api.hasoffers.com/Api/json" +
            "?Target=" + $scope.displayCtrl.controllerName +
            "&Method=" + $scope.displayCtrl.methodName;

        $scope.displayRequired = function(isRequired) {

            if (true === isRequired) {
                return "*";
            }

            return "";
        };

        $scope.hideContain = function() {
            return ($scope.displayCtrl.containList == null);
        };

        $scope.hideApiResponse = function() {
            return ($scope.apiResponse == null);
        };

        $scope.hideTrashButton = function(param) {
            return (param.value.isRequired);
        };

        $scope.addFilterField = function(addTo) {
            addTo.push({});
        };

        $scope.runApiCall = function() {

            $http.jsonp($scope.apiCall.replace("json", "jsonp") +
                        "&callback=JSON_CALLBACK")
                .success(function(data) {
                    $scope.apiResponse = angular.toJson(data, true);
                })
                .error(function(data) {
                    $scope.apiResponse = angular.toJson(data, true);
                });
        };

        $scope.updateApiCall = function() {

            $scope.apiCall = "http://api.hasoffers.com/Api/json" +
                "?Target=" + $scope.displayCtrl.controllerName +
                "&Method=" + $scope.displayCtrl.methodName;

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
                }
            });
        };
    }
}
