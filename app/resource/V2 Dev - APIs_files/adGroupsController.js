/*
 * adgroups controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.adGroups',
    ['$scope', '$q', 'directiveRegistry', 'models',
      function($scope, $q, directiveRegistry, models) {

        /**
         * default sort
         * @return {string} default sort.
         */
        $scope.getDefaultSort = function() {
          return 'Stat.conversions desc';
        };

        var model = models.get('adGroups');

        /**
         * modifies returned data to fill in missing data and convert the api hash map to an array.
         * @param  {object} data  api data return.
         */
        $scope.mutateGridData = function(data, params) {
          var zeroFill = {}, fields = params.fields;

          // create default values for Stat based on column model
          _.each(fields, function(field) {
            field = field.split('.');
            if (field[0] == 'Stat') {
              zeroFill[field[1]] = 0;
            }
          });

          // determine if row.Stat is null, if so, fill it in with defaults;
          var arr = [];
          _.each(data.data, function(row) {
            if (!row.Stat) {
              row.Stat = zeroFill;
            }
            arr.push(row);
          });
          data.data = arr;
        };

        /**
         * returns api readable filters from selectedFilters
         * @return {object} api filters.
         */
        $scope.getDefaultFilter = function() {
          var filter = {};
          if ($scope.statusFilter) {
            filter.status = [$scope.statusFilter];
          }

          var textFilter = $.trim($scope.nameFilter);
          if (textFilter) {
            filter.OR = {
              'name' : {'LIKE' : '%' + textFilter + '%'},
              'id'   : {'LIKE' : '%' + textFilter + '%'}
            };
          }
          return filter;
        };

        /**
         * returns start date
         * @return {string} date in format YYYY-mm-dd.
         */
        $scope.getStartDate = function() {
          return $scope.datePicker.getStartDate();
        };

        /**
         * returns end date
         * @return {string} date in format YYYY-mm-dd.
         */
        $scope.getEndDate = function() {
          return $scope.datePicker.getEndDate();
        };

        /**
         * returns api readable "contain" params
         * @return {object} api contain params.
         */
        $scope.getDefaultContainParams = function() {
          return {0 : 'Stat'};
        };


        directiveRegistry.onDirectivesReady(['adgroupsDatePicker'], function() {
          $scope.datePicker = directiveRegistry.get('adgroupsDatePicker');
        });

        if (!$scope.isMobile) {
          directiveRegistry.onDirectivesReady(['adgroupsTable'], function() {
            $scope.table = directiveRegistry.get('adgroupsTable');
            $scope.table.clearItems = angular.noop;

            $scope.$watch('statusFilter', _.after(1, $scope.clearAndRefresh));
            $scope.table.$on('pagingChanged', $scope.updateTableData);
            $scope.table.$on('tableRenderComplete', function() {
              $('#adgroup-check-all').unbind('click');

              // target header checkbox to toggle all checkboxes on/off,
              // need to use jQuery since we're out of angular's realm
              $('#adgroup-check-all').click(function(e) {
                e.stopPropagation();
                if ($(this).prop('checked')) {
                  $('.adgroup_checkbox').prop('checked', true);
                } else {
                  $('.adgroup_checkbox').prop('checked', false);
                }
              });
            });
          });

        } else {
          directiveRegistry.onDirectivesReady(['adgroupsMobile'], function() {
            $scope.table = directiveRegistry.get('adgroupsMobile');
            $scope.table.$on('moreItemsRequested', $scope.updateTableData);

            // The Status filter has it's value changed 2 times as the page initializes. This simply
            // ignores all the changes during initialization and then processes any user requests afterwards.
            var lazyChangeFn = _.after(2, $scope.clearAndRefresh);
            $scope.$watch('statusFilter', lazyChangeFn);

            $scope.clearAndRefresh();
          });
        }

        $scope.statusFilter = 'active';

        var getApiParams = function() {
          var params = {};
          params.fields = [
            'check',
            'id',
            'name',
            'type',
            'size',
            'status',
            'width',
            'height',
            'interface',
            'Stat.impressions',
            'Stat.clicks',
            'Stat.ctr',
            'Stat.conversions',
            'Stat.cpc',
            'Stat.payout'
          ];
          params.contain = $scope.getDefaultContainParams();

          params.filters = $scope.getDefaultFilter();
          params.data_start = $scope.getStartDate();
          params.data_end = $scope.getEndDate();

          params.page = $scope.table.paging.page;
          params.limit = $scope.table.paging.pageSize;
          return params;
        };

        $scope.updateTableData = function() {
          var promise = model.getAdGroupData(getApiParams());
          $scope.incrementLoading();

          promise.success(function(data) {
            $scope.mutateGridData(data, getApiParams());

            if ($scope.table.drawTable) {
              $scope.table.drawTable(data);
            } else {
              $scope.table.addItems(data);
            }
            $scope.decrementLoading();
          });

          return promise;
        };

        $scope.selectedAction = '';
        // watch for selected action change
        if (!$scope.isMobile) {
          $scope.$watch('selectedAction', function(_new) {
            if (_new) {
              var updatePromises = [],
                map = {
                  'pause'  : {'status' : 'paused', 'message' : 'paused'},
                  'active' : {'status' : 'active', 'message' : 'made active'},
                  'delete' : {'status' : 'deleted', 'message' : 'made inactive'}
                },
                adGroups = $('.adgroup_checkbox:checked');
              _.each(adGroups, function(el) {
                updatePromises.push(
                  model.saveAdGroup({
                    'id'     : $(el).data('id'),
                    'status' : map[$scope.selectedAction].status
                  })
                );
              });

              $q.all(updatePromises).then(function() {
                if (adGroups.length) {
                  $scope.addSuccess(
                    'adgroupSaveResult',
                    'Ad Group{0} successfully {1}.'.format(
                      updatePromises.length > 1 ? 's' : '',
                      map[$scope.selectedAction].message
                    )
                  );
                  $scope.updateTableData();
                }
                $scope.selectedAction = '';
              });
            }
          });
        }

        // for mobile, does an update and clears old rows
        $scope.clearAndRefresh = function() {
          $scope.table.clearItems();
          $scope.updateTableData();
        };
      }
    ]);

})(this, jQuery);
