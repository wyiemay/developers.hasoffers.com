(function(window) {
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
             * getExternalDoc
             * gets the documentation for external public facing controllers/methods
             * @return promise
             */
            getExternalDoc: function(){
                return $http.get('docSource/External_doc.json');
            },
            /**
             * getModelDoc
             * gets the documentation for the Model
             */
            getModelDoc: function(){
                return $http.get('docSource/Model_doc.json');
            },
            /**
             * findMethod
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
             * bindFields
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
             * buildApiConstructor
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
             * findMethodsByController
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
             * aggregateByController
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
     * A key value store object for storing user information
     */
    docModule.factory('UserInfo', function(){
        /**
         * @param string - key
         * @return value or null
         */
        function getProperty(key){
            return window.localStorage.getItem(key);

        } // getProperty()

        /**
         * @param string - key to set
         * @param mixed - value to set the key to
         */
        function setProperty(key, value){
            try {
                window.localStorage.setItem(key, value);
                return;
            }
            // fail safe for QUOTA_EXCEEDED error
            catch(e){
                return null;
            }

        } // setProperty()

        var hasLocalStorage = 'localStorage' in window && window.localStorage !== null;
        // if we don't have local storage we will return an object
        // that returns null for all it's methods
        if (!hasLocalStorage){
            var nullFunc = function(){ return null; };
            return {
                getProperty: nullFunc,
                setProperty: nullFunc,
            };
        }

        return {
            getProperty: getProperty,
            setProperty: setProperty
        };
    });

    /**
     * hasMethodFilter
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
})(window);
