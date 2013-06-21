

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.offers',
    [
      '$scope',
      '$timeout',
      '$location',
      '$routeParams',
      'cache',
      'timeoutQueue',
      'models',
      'directiveRegistry',
      function($scope, $timeout, $location, $routeParams, cache, timeoutQueue, models, directiveRegistry) {

        var model = models.get('offers');

        // Data for Browse by Country
        $scope.selectedCountries = [];
        $scope.selectedCountriesLeft = [];
        $scope.selectedCountriesRight = [];

        // Data for Browse by Creative
        $scope.offerFile = {
          type    : {},
          size    : {},
          anySize : true
        };

        /**
         * Search object contains storage of current search/advanced search fields
         * Also contains helpers for adding/removing filters and keywords
         */
        $scope.search = {
          keyword           : '',      // Single keyword search
          newKeyword        : '',      // New keyword staging area before it's added to keywords[]
          isAdvancedVisible : false,   // UI State if the advanced search form is visible
          keywords          : [],      // Array of keywords passed as OR filter to API call

          // Advanced search filters current state and helper functions
          filters: {
            newCountry         : '',     // Staging area for country being added to include list
            countries          : [],
            minPayout          : null,
            maxPayout          : null,
            newCategory        : {},    // Staging are for category being added to categories list
            categories         : [],
            selectedCategories : {},    // Object needed for checkboxes to keep state of what is selected

            // Boolean property set if filter section is selected
            selected: {
              payout   : false,
              category : false,
              country  : false
            },

            // Check if any of the filters have values. Used to display "None Entered" on list of applied filters
            isEmpty: function() {
              // Not empty if payout enabled and has a value
              if (this.selected.payout === true && (!_.isNull(this.minPayout) || !_.isNull(this.maxPayout))) {
                return false;
              }

              // Not empty if category enabled and has a value
              if (this.selected.category && this.categories.length > 0) {
                return false;
              }

              // Not empty if country enabled and has a value
              if (this.selected.country && this.countries.length > 0) {
                return false;
              }

              return true;
            },

            // Add a filter parameter
            addFilter: function(filterType) {
              switch (filterType) {
                case 'country':
                  // Convert this.newCountry string to a country object
                  var newCountry = _.find(
                    $scope.countries,
                    function(country) {
                      return country.name == $scope.search.filters.newCountry;
                    }
                  );

                  if (_.isObject(newCountry)) {
                    this.countries.push(newCountry);

                    // Remove empty and duplicate values from the array
                    this.countries = _.chain(this.countries).uniq().compact().value();
                  }

                  // Reset newCountry to empty since it's been added to an array
                  this.newCountry = '';
                  break;

                case 'category':
                  this.selectedCategories[this.newCategory.value] = true;
                  this.categories.push(this.newCategory);
                  this.categories = _.chain(this.categories).uniq().compact().value();
                  break;
              }
            },

            /**
             * Remove a filter
             *
             * @param {string} filterType - type of filter being removed.
             * @param {mixed} value - value to be removed.
             */
            removeFilter: function(filterType, value) {
              switch (filterType) {
                case 'country':
                  this.countries = _.without(this.countries, value);
                  break;

                case 'category':
                  this.selectedCategories[value.value] = false;
                  this.categories = _.without(this.categories, value);
                  break;
              }
            }
          },

          // Move newKeyword into the keywords array
          addKeyword: function() {
            this.keywords.push(this.newKeyword);
            this.keywords = _.chain(this.keywords).uniq().compact().value();
            this.newKeyword = '';
          },

          // Remove keyword from this.keywords array
          removeKeyword: function(keyword) {
            this.keywords = _.without(this.keywords, keyword);
          }
        };

        // Helper function used when selecting a creative image size.
        // If no specific size is selected, the "All" option will be selected
        $scope.offerFileSizeEmpty = function() {
          return _.isEmpty(_.filterSelected($scope.offerFile.size));
        };

        // Move a country from left (inactive side) to the right (active side)
        $scope.moveCountryRight = function($event) {
          if ($event) {
            $event.preventDefault();
          }

          if ($scope.selectedCountriesLeft.length > 0) {
            _.each($scope.selectedCountriesLeft, function(country) {
              // Convert selectedCountriesLeft to updated country objects
              // This is needed because between the time the select was drawn and now,
              //    $$hasKey has been added to the country objects by angular
              var newCountry = _.find(
                $scope.countries,
                function(c) {
                  return c.code == country.code;
                }
              );

              if (_.isObject(newCountry)) {
                $scope.search.filters.countries.push(newCountry);
              }
            });
            // Remove empty and duplicate values from countries list
            $scope.search.filters.countries = _.chain($scope.search.filters.countries).uniq().compact().value();
          }
        };

        // Move a country from right (active side) to the left (inactive side)
        $scope.moveCountryLeft = function($event) {
          if ($event) {
            $event.preventDefault();
          }

          if ($scope.selectedCountriesRight.length > 0) {
            _.each($scope.selectedCountriesRight, function(country) {
              // Convert selectedCountriesLeft to updated country objects
              // This is needed because between the time the select was drawn and now,
              //    $$hasKey has been added to the country objects by angular
              var removeCountry = _.find(
                $scope.countries,
                function(c) {
                  return c.code == country.code;
                }
              );

              if (_.isObject(removeCountry)) {
                $scope.search.filters.countries = _.without($scope.search.filters.countries, removeCountry);
              }
            });
          }
        };

        $scope.changeCategoryCheckbox = function(category_id) {
          // Inflate the category object
          var category = _.find($scope.categories, function(c) {
            return c.value == category_id;
          });

          if (_.isObject(category)) {
            if ($scope.search.filters.selectedCategories[category_id]) {
              $scope.search.filters.newCategory = category;
              $scope.search.filters.addFilter('category', category);
            } else {
              $scope.search.filters.removeFilter('category', category);
            }
          }
        };


        var queryParams = $location.search();
        if (!$scope.isMobile && queryParams.search) {
          $timeout(function() {
            $scope.search.keyword = queryParams.search;
            root.angular.element('#basicKeywordSearch').focus();
          });
        }

        $scope.updateQueryParams = function() {
          if (!$scope.isMobile) {
            $location.search('search', $scope.search.keyword);
          }
        };

        $scope.updateTable = function() {
          $scope.updateQueryParams();
          $scope.generateTable();
        };

        $scope.getDefinition = function() {
          return model.getOffersDefinition();
        };

        $scope.getDefaultContainParams = function() {
          return {
            0 : 'Country',
            1 : 'OfferCategory'
          };
        };


        /**
         * Isolated data call to generate the offers table. Takes into account the user filters.
         */
        var fetchTableData = function() {
          var params = {
            'fields' : [
              'id',
              'name',
              'default_payout',
              'payout_type',
              'currency',
              'percent_payout'
            ],
            'sort' : {},
            'contain' : {0 : 'Country', 1: 'OfferCategory'},
            'page'    : $scope.table.paging.page,
            'limit'   : $scope.table.paging.pageSize
          };

          params.sort[$scope.table.sort.field] = $scope.table.sort.direction;

          var filters = $scope.processUserFilters();
          if (_(filters).size()) {
            params.filters = filters;
          }

          var dataCall;
          if ($routeParams.context == 'my') {
            dataCall = model.getMyOffers;
          } else {
            dataCall = model.getOffers;
          }

          $scope.incrementLoading();
          dataCall(params).success(function(data) {
            $scope.decrementLoading();
            ($scope.table.addItems || $scope.table.drawTable)(data, params);
          });
        };

        $scope.makePopovers = function() {
          $('.hasTable').find('[data-popover="add_to_parent"]').each(function() {
            var $this = $(this),
              $popEl = $this.parent(),
              title = $this.data('title');

            $popEl.attr('title', title);
            $popEl.popover({
              trigger   : 'hover',
              html      : false,
              content   : $this.text(),
              title     : title,
              placement : 'top'
            });
          });
        };


        var countriesQueueConfig = {
          namespace    : 'offers',
          key          : 'countries',
          getPromise   : model.getCountriesForOffers,
          defaultValue : 'All',
          processData  : function(data) {
            var _this = this;

            _.each(data, function(value) {
              var countries = value.countries,
                  offerId = value.offer_id,
                  countCountries = _.size(countries),
                  pluckField = countCountries > 2 ? 'name' : 'code',
                  list = _(countries).pluck(pluckField).join(', ');

              if (countCountries > 2) {
                list = countCountries + '&nbsp;Countries' +
                  '<span data-popover="add_to_parent" data-title="Countries" style="display: none;">' +
                  list + '</span>';
              }
              _this.cachePut(offerId, list);
            });
          },
          postProcess : $scope.makePopovers
        };

        var categoriesQueueConfig = {
          namespace    : 'offers',
          key          : 'categories',
          getPromise   : model.getCategoriesForOffers,
          defaultValue : '',
          processData  : function(data) {
            var _this = this;

            _.each(data, function(value) {
              var categories = value.categories,
                offerId = value.offer_id,
                list = _.pluck(categories, 'name').join(', ');

              if (_.size(categories) > 2 && !$scope.isMobile) {
                list = _.size(categories) + '&nbsp;Categories' +
                  '<span data-popover="add_to_parent" data-title="Categories" style="display: none;">' +
                  list + '</span>';
              }
              _this.cachePut(offerId, list);
            });
          },
          postProcess : $scope.makePopovers
        };


        var offerCurrencyCodes = {};

        var setupMobile = function() {
          directiveRegistry.onDirectivesReady(['offerMobile'], function() {
            $scope.table = directiveRegistry.get('offerMobile');

            $scope.table.sort = {'field': 'Offer.id', 'direction': 'desc'};
            fetchTableData();
            $scope.generateTable = function() {
              $scope.table.clearItems();
              fetchTableData();
            };

            $scope.table.$on('moreItemsRequested', function() {
              fetchTableData();
            });

            $scope.table.$on('rowRendered', function(localScope, row){
              var offerId = row.scope().Offer.id;

              epcQueue.enqueue(offerId, row.find('.7dayEPCValue').first());

              // For some reason the countries namespace doesn't always switch over so we'll do a hard set here.
              countriesQueue.options.namespace = 'offersMobile';
              countriesQueue.enqueue(offerId, row.find('.offerCountries').first());
              categoriesQueue.enqueue(offerId, row.find('.offerCategories').first());
            });
          });

          // The timeout queue stores data in a pre rendered state. Unfortunately that means we have to make new
          // calls in order to have mobile formatting.
          countriesQueueConfig.namespame = 'offersMobile';
          countriesQueueConfig.postProcess = angular.noop;
          countriesQueueConfig.processData = function(data) {
            var _this = this;
            _(data).each(function(value) {
              var countries = value.countries,
                  offerId = value.offer_id;
              _this.cachePut(offerId, _(countries).pluck('name').join(' <br> '));
            });
          };

          categoriesQueueConfig.namespace = 'offersMobile';
          categoriesQueueConfig.postProcess = angular.noop;
          categoriesQueueConfig.processData = function(data) {
            var _this = this;
            _(data).each(function(value) {
              var categories = value.categories,
                  offerId = value.offer_id;
              _this.cachePut(offerId, _(categories).pluck('name').join(' <br> '));
            });
          };
        };


        var setupDesktop = function() {
          $scope.generateTable = function() {
            fetchTableData();
          };

          directiveRegistry.onDirectivesReady(['offersTable'], function() {
            $scope.table = directiveRegistry.get('offersTable');
            $scope.table.sort = {'field': 'Offer.id', 'direction': 'desc'};

            $scope.table.$on('sortRequested', fetchTableData);
            $scope.table.$on('pagingChanged', fetchTableData);

            $scope.table.$on('rowRendered', function(dirScope, row) {
              var rowOffer = row.scope().Offer;
              var offerId = rowOffer.id;
              offerCurrencyCodes[offerId] = rowOffer.currency;

              epcQueue.enqueue(offerId, row.find('.7dayEPCValue').first());
              countriesQueue.enqueue(offerId, row.find('.offerCountries').first());
              categoriesQueue.enqueue(offerId, row.find('.offerCategories').first());
              thumbnailQueue.enqueue(offerId, row.find('.offerThumbnail').first());
            });

            fetchTableData();
          });
        };


        if ($scope.isMobile) {
          setupMobile();
        } else {
          setupDesktop();
        }

        var epcQueue = timeoutQueue.factory({
          namespace    : 'offers',
          key          : 'erpc',
          getPromise   : model.getEPCForOffers,
          defaultValue : 'New',
          processData  : function(data) {
            var _this = this;


            _.each(data.data, function(value) {
              var offerId = value.Stat.offer_id;
              _this.cachePut(offerId, root.currency.formatCurrency(value.Stat.erpc, offerCurrencyCodes[offerId]));
            });
          }
        });

        var thumbnailQueue = timeoutQueue.factory({
          namespace    : 'offers',
          key          : 'thumbnail',
          getPromise   : model.getThumbnailForOffers,
          defaultValue : '',
          processData  : function(data) {
            var img = '<img alt="{0}" src="{1}" />',
                _this = this;

            _.each(data, function(value) {
              var offer_id = value.offer_id,
                  keys = _.keys(value.Thumbnail);

              if (keys.length) {
                var thumbnail = value.Thumbnail[keys[0]];
                _this.cachePut(offer_id, img.format(thumbnail.display, thumbnail.thumbnail));
              }
            });
          }
        });

        var countriesQueue = timeoutQueue.factory(countriesQueueConfig);

        var categoriesQueue = timeoutQueue.factory(categoriesQueueConfig);


        $scope.routeParams = $routeParams;

        $scope.getDefaultSort = function() {
          if ($routeParams.context == 'my') {
            return 'id desc';
          } else {
            return 'Offer.id desc';
          }
        };


        $scope.getDataCall = function() {
          if ($routeParams.context == 'my') {
            return $.proxy(model.getMyOffers, model);
          } else {
            return $.proxy(model.getOffers, model);
          }
        };

        /**
         * processes chosen filters into api understandable object
         * @return {object}
         */
        $scope.processUserFilters = function() {
          var filter = {};

          // Browse by keywords
          var keywords = _.clone($scope.search.keywords);
          keywords.push($scope.search.keyword);
          keywords = _.chain(keywords).uniq().compact().value();

          if (!_.isEmpty(keywords)) {
            filter.query = [];
            _.each(keywords, function(k) {
              filter.query.push(k);
            });
          }

          // Browse by Country
          if (!_.isEmpty($scope.search.filters.countries)) {
            if (!$scope.search.isAdvancedVisible ||
                ($scope.search.isAdvancedVisible && $scope.search.filters.selected.country)) {

              filter['Country.code'] = filter['Country.code'] || [];
              filter['Country.code'] = _.union(
                filter['Country.code'],
                _.pluck($scope.search.filters.countries, 'code')
              );
            }
          }

          // Browse by Category
          if (!_.isEmpty($scope.search.filters.categories)) {
            if (!$scope.search.isAdvancedVisible ||
                ($scope.search.isAdvancedVisible && $scope.search.filters.selected.category)) {

              filter['OfferCategory.id'] = filter['OfferCategory.id'] || [];
              filter['OfferCategory.id'] = _.union(
                filter['OfferCategory.id'],
                _.pluck($scope.search.filters.categories, 'value')
              );
            }
          }

          if ($scope.search.filters.selected.payout && !_.isNull($scope.search.filters.minPayout)) {
            filter['Offer.default_payout'] = filter['Offer.default_payout'] || {};
            filter['Offer.default_payout'].GREATER_THAN_OR_EQUAL_TO = parseFloat(
              $scope.search.filters.minPayout
            ).toFixed(2);
          }

          if ($scope.search.filters.selected.payout && !_.isNull($scope.search.filters.maxPayout)) {
            filter['Offer.default_payout'] = filter['Offer.default_payout'] || {};
            filter['Offer.default_payout'].LESS_THAN_OR_EQUAL_TO = parseFloat(
              $scope.search.filters.maxPayout
            ).toFixed(2);
          }

          // Browse by Creative Type
          // @todo This feature is not live due to API support
          /*
          if (!_.isEmpty($scope.offerFile.type)) {
            var type   = [],
              width  = [],
              height = [];

            _.each($scope.offerFile.type, function(value, key) {
              if (value === true) {
                type.push(key.replace('_', ' ', 'g'));
              }
            });
            filter['OfferFile.type'] = type;

            // Browse by Creative Size
            // Check we are looking for type image banner before parsing size params
            if (_.contains(type, 'image banner')) {
              // If the any size checkbox is checked, don't send width/height restrictions
              if (!$scope.offerFile.anySize) {
                _.each($scope.offerFile.size, function(value, key) {
                  if (value === true) {
                    var parts = key.split('x');
                    if (parts.length == 2) {
                      width.push(parts[0]);
                      height.push(parts[1]);
                    }
                  }
                });
              }

              filter['OfferFile.width'] = width;
              filter['OfferFile.height'] = height;
            }
          }
          */

          return filter;
        };

        /**
         * returns api readable filters from selectedFilters
         * @return {object} api filters.
         */
        $scope.getDefaultFilter = function() {
          return $scope.processUserFilters();
        };

        /**
         * handles panel apply button
         * @param  {string} panel which panel apply targeted.
         * @return {void}
         */
        $scope.applyPanelFn = function(panel) {
          if (_(['category', 'creative', 'country', 'advanced-search']).contains(panel)) {
            $scope.generateTable();
          }
        };

        // Gather data for options, display
        model.processRequestsToScope($scope, {
          'categories' : 'getCategories'
        });

        model.getCountries($scope);

  }]);
})(this, jQuery);
