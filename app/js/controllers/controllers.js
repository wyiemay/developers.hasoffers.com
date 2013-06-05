(function(window, DISQUS) {
    'use strict';

    /**
     * Controller for list of methods.
     *
     * @param {Object}                     $scope        Angular scope.
     * @param {ng.$routeParams}            $routeParams  Angular $routeParams service.
     * @param {Object.<string, Function>}  Util          Util service.
     * @constructor
     */
    window.ControllerListCtrl = function($scope, $routeParams, Util) {
        Util.getExternalDoc().success(function(controllers) {
            $scope.controllerList = Util.findMethodsByController(
                controllers,
                $routeParams.controllerName
            );
        });
    };

    /**
     * Controller for a list of sidebar with controllers and methods.
     *
     * @param {Object}                     $scope  Angular scope.
     * @param {Object.<string, Function>}  Util    Util service.
     */
    window.SideBarController = function($scope, Util) {
      $scope.$on('apiCategoryChange', function() {
          Util.getExternalDoc().success(function(controllers) {
              $scope.ctrlrs = Util.aggregateByController(controllers);
              $scope.searchQuery = '';
              $scope.isFiltering = false;
              $scope.$watch('searchQuery', function() {
                  $scope.isFiltering = ($scope.searchQuery.length !== 0);
              });
          });
      });
    };

    /**
     * Controller to manage the Disqus comments.
     * Resets every time a new method view is displayed.
     *
     * @param {Object}           $scope        Angular scope.
     * @param {ng.$routeParams}  $routeParams  Angular $routeParams service.
     */
    window.DisqusController = function($scope, $routeParams) {
        var identifier = $routeParams.controllerName + '::' + $routeParams.methodName;
        var url = document.location.origin + '/#!' + identifier;

         // reset the disqus comments for the current page
        DISQUS.reset({
            reload: true,
            config: function() {
                this.page.identifier = identifier;
                this.page.url = url;
            }
        });
    };

    /**
     * Method view controller.
     *
     * @param {Object}                     $scope         Angular scope.
     * @param {ng.$routeParams}            $routeParams   Angular $routeParams service.
     * @param {ng.$http}                   $http          Http service.
     * @param {Object.<string, Function>}  Util           Util service.
     * @param {Object.<string, Function>}  UserInfo       UserInfo service.
     */
    window.MethodViewCtrl = function($scope, $routeParams, $http, Util, UserInfo) {
        Util.getExternalDoc().success(function(data) {
            var displayedMethod = Util.findMethod(
                data,
                $routeParams.controllerName,
                $routeParams.methodName
            );

            if (displayedMethod != null) {
                Util.getModelDoc().success(function(model) {
                    $scope.displayedMethod = Util.bindFields(model, displayedMethod);
                    $scope.apiParams = Util.buildApiConstructor($scope.displayedMethod);

                    // default to user info
                    $scope.displayedMethod.networkToken = UserInfo.getProperty('NetworkToken');
                    $scope.displayedMethod.networkId = UserInfo.getProperty('NetworkId');
                    $scope.displayedMethod.affiliateKey = UserInfo.getProperty('AffiliateKey');
                    $scope.updateApiCall();
                }); // get model doc
            } // display ctrl not null

            /**
             * Returns a string to indicate whether something is required; '*' if required, else an
             * empty string.
             *
             * @param  {boolean} isRequired  Whether or not the item is required.
             * @return {string}              An asterisk if the item is required, else empty string.
             */
            $scope.displayRequired = function(isRequired) {
                return true === isRequired ? '*' : '';
            };

            /**
             * Returns a boolean stating whether or not the contain list should be hidden.
             *
             * @return {boolean} Whether there is a contains list for the currently displayed method.
             */
            $scope.hideContain = function() {
                return ($scope.displayedMethod && $scope.displayedMethod.containList == null);
            };

            /**
             * Returns a boolean stating whether or not the trash icon should be hidden for the
             * specified item, i.e. if it is required it should not have a trash icon.
             *
             * @param  {Object} param  The object to consider.
             * @return {boolean}       Whether or not to show the trash button for this parameter.
             */
            $scope.hideTrashButton = function(param) {
                return param.value.isRequired;
            };

            /**
             * Adds an empty object to the end of an array.
             *
             * @param {Array} addTo  The array to add an empty object to.
             */
            $scope.addFilterField = function(addTo) {
                addTo.push({});
            };

            /**
             * Executes the API call that the user has set up.
             */
            $scope.runApiCall = function() {

                if ($scope.apiCategory === $scope.apiCategories.affiliate.shortName) {
                    if ($scope.displayedMethod.affiliateKey == null) {
                        $scope.apiResponse = 'Please provide an Affiliate Key';
                        return;
                    }
                    //update user info
                    UserInfo.setProperty('AffiliateKey', $scope.displayedMethod.affiliateKey);
                }

                if ($scope.apiCategory === $scope.apiCategories.brand.shortName) {
                    if ($scope.displayedMethod.networkToken == null) {
                        $scope.apiResponse = 'Please provide Network Token';
                        return;
                    }
                    // update user info
                    UserInfo.setProperty('NetworkToken', $scope.displayedMethod.networkToken);
                }

                if ($scope.displayedMethod.networkId == null) {
                    $scope.apiResponse = 'Please provide Network Id';
                    return;
                }
                // update user info
                UserInfo.setProperty('NetworkId', $scope.displayedMethod.networkId);
                $scope.apiError = false;
                $scope.responseLoading = true;
                $scope.apiResponse = '';
                $http.jsonp($scope.apiCall.replace('json', 'jsonp') + '&callback=JSON_CALLBACK')
                    .success(function(data) {
                        $scope.apiResponse = angular.toJson(data, true);
                        $scope.responseLoading = false;
                    })
                    .error(function(data) {
                        $scope.apiResponse = angular.toJson(data, true) || 'an unexpected error occured';
                        $scope.responseLoading = false;
                    });
            };

            /**
             * Prepares the URL for an API call for the current method, with the parameters entered by
             * the user on the form.
             */
            $scope.updateApiCall = function() {
                $scope.apiCall = 'http://api.hasoffers.com/v3/' +
                    $scope.displayedMethod.controllerName +
                    '.json?Method=' + $scope.displayedMethod.methodName;

                // set keys depending on apiCategory
                if ($scope.apiCategory === $scope.apiCategories.affiliate.shortName) {
                    if ($scope.displayedMethod.affiliateKey != null) {
                        $scope.apiCall += '&api_key=' + $scope.displayedMethod.affiliateKey;
                    }
                }

                if ($scope.apiCategory === $scope.apiCategories.brand.shortName){
                    if ($scope.displayedMethod.networkToken != null) {
                        $scope.apiCall += '&NetworkToken=' + $scope.displayedMethod.networkToken;
                    }
                }

                if ($scope.displayedMethod.networkId != null) {
                    $scope.apiCall += '&NetworkId=' + $scope.displayedMethod.networkId;
                }

                angular.forEach($scope.apiParams, function(param) {
                    var fieldType = param.value.name;
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

                                if (value.selectField != null && value.selectValue != null) {
                                    $scope.apiCall += '&' + fieldType +
                                        nesting + '[' + value.selectField.name + ']' +
                                        operator + '=' + value.selectValue;
                                }
                            });
                            break;

                        case 'sort':
                        case 'data':
                            angular.forEach(parseValues, function(value) {
                                if (value.selectField != null && value.selectValue != null) {
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
