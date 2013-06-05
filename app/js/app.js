(function(window) {
    'use strict';

    var docModule = angular.module('Docs', ['ui.bootstrap.accordion']);
    var apiCategories = {
        brand: {
          shortName: 'brand',
          longName: 'Brand API'
        },
        affiliate: {
            shortName: 'affiliate',
            longName: 'Affiliate API'
        }
    };
    var defaultApiCategory = apiCategories.brand;



    /**
     * Route configuration.
     *
     * @param {ng.$routeProvider} $routeProvider
     */
    docModule.config(function($routeProvider) {
        $routeProvider.when('/:apiCategory',
                {templateUrl: 'welcome.html'}
            )
            .when('/:apiCategory/controller/:controllerName',
                {controller: ControllerListCtrl, templateUrl: 'controllerList.html'}
            )
            .when('/:apiCategory/controller/:controllerName/method/:methodName',
                {controller: MethodViewCtrl, templateUrl: 'details.html'}
            )
            .otherwise({redirectTo: '/' + defaultApiCategory.shortName});
    });


    /**
     * Globals Setup
     *
     * @param {ng.$routeProvider} $routeProvider
     * @param {ng.$route} $route
     */
    docModule.run(function($rootScope, $route, $location) {

        var validCategory = function(val) {
            var valFound = false;

            // check to see if apiCategory param matches a apiCategory from object
            angular.forEach($rootScope.apiCategories, function(category) {
                if (category.shortName === val) {
                    valFound = true;
                    return false;
                }
            });

            return valFound;
        };

        $rootScope.apiCategories = apiCategories;
        $rootScope.$on('$routeChangeStart', function(next, current) {

            // redirect if unacceptaple apiCategory
            if (!validCategory(current.params.apiCategory)) {
                $location.path('/' + defaultApiCategory.shortName);
            }
        });

        $rootScope.$on('$routeChangeSuccess', function(e, current, previous) {

            // only broadcast or update apiCategory if is valid
            if (validCategory(current.params.apiCategory)){
                if ($rootScope.apiCategory !== current.params.apiCategory) {
                    $rootScope.$broadcast('apiCategoryChange');
                }

                $rootScope.apiCategory = current.params.apiCategory;
            }
        });
    });

    /**
     * Utility service
     */
    docModule.factory('Util', function($http, $rootScope) {
        // Public methods:
        return {
            /**
             * Gets documentation for external public facing controllers/methods.
             *
             * @return {ng.$HttpPromise}  A promise for the get request.
             */
            getExternalDoc: function() {
                var externalDoc = ($rootScope.apiCategory === $rootScope.apiCategories.affiliate.shortName) ?
                    'resource/External_doc.json' : 'resource/External_doc.json';
                return $http.get(externalDoc);
            },

            /**
             * Gets documentation for the models.
             *
             * @return {ng.$HttpPromise}  A promise for the get request.
             */
            getModelDoc: function() {
                // else case assumes category == 'brand'
                var externalDoc = ($rootScope.apiCategory === $rootScope.apiCategories.affiliate.shortName) ?
                    'resource/Model_doc.json' : 'resource/Model_doc.json';
                return $http.get(externalDoc);
            },

            /**
             * Returns the method definition if one with a specified name is found in the specified
             * controller.
             *
             * @param  {Array}   methods         List of methods to search.
             * @param  {string}  controllerName  Controller in which to search for the method.
             * @param  {string}  methodName      Name of the method to search for.
             * @return {?Object}                 The method definition or null if not found.
             */
            findMethod: function(methods, controllerName, methodName) {
                var searchFilters = {
                    controllerName: controllerName,
                    methodName: methodName
                };

                var result = methods.filter(function(value) {
                    return (value.controllerName === this.controllerName &&
                            value.methodName === this.methodName);
                }, searchFilters);

                if (result.length === 0) {
                    return null;
                }

                return result[0];
            },

            /**
             * Binds fields to be used with the method to the method object.
             *
             * @param  {Array.<Object>} models  Domain models.
             * @param  {Object}         method  A method to bind fields to.
             * @return {Object}                 The method passed in, with fields bound.
             */
            bindFields: function(models, method) {
                 if (method.linkModel != null) {
                     var searchFilter = {
                         namespace: method.linkModel
                     };

                     var results = models.filter(function(value) {
                         return (value.namespace === this.namespace);
                     }, searchFilter);

                     if (results.length !== 0) {
                         method.fields = results[0].fields;
                     }
                 }

                 return method;
            },

            /**
             * Returns an array of details for a method's parameters, including the template to
             * display their details to the user.
             *
             * @param  {Object}                  method  The method definition.
             * @return {Array.<Object>}                  An array of details about each parameter
             *                                           for the method.
             */
            buildApiConstructor: function(method) {

                // remove 'contain' and 'fields' if viewing affiliate api
                if ($rootScope.apiCategory === $rootScope.apiCategories.affiliate.shortName) {

                    var filteredArr = [];
                    angular.forEach(method.params, function(param) {
                        if(param.name !== 'contain' && param.name !== 'fields') {
                            filteredArr.push(param);
                        }
                    });
                    method.params = filteredArr;
                }

                var paramObjects = {
                    filters: {
                        template: 'partials/filtersParam.html',
                        nesting: {
                            AND: 'AND',
                            OR: 'OR'
                        },
                        operators: [
                            {name: '=',     value: ''},
                            {name: '!=',    value: 'NOT_EQUAL_TO'},
                            {name: '<',     value: 'LESS_THAN'},
                            {name: '<=',    value: 'LESS_THAN_OR_EQUAL_TO'},
                            {name: '>',     value: 'GREATER_THAN'},
                            {name: '>=',    value: 'GREATER_THAN_OR_EQUAL_TO'},
                            {name: 'like',  value: 'LIKE'},
                            {name: 'rlike', value: 'RLIKE'}
                        ]
                    },
                    data: {
                        template: 'partials/dataParam.html'
                    },
                    sort: {
                        template: 'partials/sortParam.html',
                        directions: ['ASC', 'DESC']
                    },
                    fields: {
                        template: 'partials/fieldsParam.html'
                    },
                    field: {
                        template: 'partials/fieldParam.html'
                    },
                    contain: {
                        template: 'partials/containParam.html'
                    },
                    other: {
                        template: 'partials/otherParam.html'
                    }
                };

                var apiParams = [];
                angular.forEach(method.params, function(param) {
                    var paramType = paramObjects.other;
                    if (paramObjects[param.name] != null) {
                        paramType = paramObjects[param.name];
                    }

                    apiParams.push({
                        value: param,
                        type: paramType,
                        parse: []
                    });
                });

                return apiParams;
            },

            /**
             * Returns all the methods in the specified controller.
             *
             * @param  {Array.<Object>}  methods        The methods to search in.
             * @param  {string}          controllerName The name of the controller whose methods to
             *                                          return.
             * @return {?Array.<Object>}                The matching methods, or null if none found.
             */
            findMethodsByController: function(methods, controllerName) {
                var searchFilters = {
                    controllerName: controllerName
                };

                var result = methods.filter(function(value) {
                    return (value.controllerName === this.controllerName);
                }, searchFilters);

                if (result.length === 0) {
                    return null;
                }

                return result;
            },

            /**
             * Groups a flat list of methods by controller.
             * [{controllerName to methodNames},...]
             *
             * @param  {Array.<Object>} methods  List of methods.
             * @return {Array.<Object>}          List of controllers with their methods nested.
             */
            aggregateByController: function(methods) {
                var ctrlrs = {},
                    ctrlrsArray = [],
                    i = 0;

                for (i; i < methods.length; i++) {
                    var method = methods[i];

                    if (ctrlrs[method.controllerName]) {
                        ctrlrs[method.controllerName].push(method.methodName);
                    }
                    else {
                        ctrlrs[method.controllerName] = [method.methodName];
                    }
                }

                for (var controllerName in ctrlrs) {
                    if (ctrlrs.hasOwnProperty(controllerName)) {
                        ctrlrsArray.push({
                            controllerName: controllerName,
                            methods: ctrlrs[controllerName]
                        });
                    }
                }

                return ctrlrsArray;
            }
        };
    });

    /**
     * A key/value storage service for user information, backed by localStorage.
     */
    docModule.factory('UserInfo', function() {
        /**
         * Returns user value set for the specified property in localStorage.
         *
         * @param  {string} key  The property whose value to get.
         * @return {?*}          The value if set, or null if not set.
         */
        function getProperty(key) {
            return window.localStorage.getItem(key);
        }

        /**
         * Attempts to set a property for the user in localStorage.
         * Silently fails if attempt to set property fails.
         *
         * @param {string} key    The name of the property to set.
         * @param {*}      value  The value to set for the property.
         */
        function setProperty(key, value) {
            try {
                window.localStorage.setItem(key, value);
            }
            catch (e) {
                // fail safe for QUOTA_EXCEEDED error
            }
        }

        var hasLocalStorage = 'localStorage' in window && window.localStorage !== null;
        // if we don't have local storage we will return an object
        // that returns null for all it's methods
        if (!hasLocalStorage) {
            var nullFunc = function() { return null; };
            return {
                getProperty: nullFunc,
                setProperty: nullFunc
            };
        }

        return {
            getProperty: getProperty,
            setProperty: setProperty
        };
    });

    /**
     * Creates a filter (hasMethodFilter) that returns controllers which have a method whose name is
     * a partial match.
     */
    docModule.filter('hasMethodFilter', [function() {
        return function(controllers, methodNamePartial) {
            if (methodNamePartial === '' || angular.isUndefined(methodNamePartial)) {
                return controllers;
            }

            // filter controllers which don't have a method matching the partial
            return controllers.filter(function(controller) {
               // turn the array into a string and check if there is any
               // partial instance of the method name in the string of method names
               return controller.methods.join(' ')
                   .toLowerCase()
                   .match(methodNamePartial.toLowerCase());
            });
        };
    }]);
})(window);
