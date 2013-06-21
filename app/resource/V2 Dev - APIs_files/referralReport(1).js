/*
 * referral report controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.referralReport',
    ['$scope', 'directiveRegistry', 'models', '$window', 'currentUser',
      function($scope, directiveRegistry, models, $window, currentUser) {

    $scope.pageState = 'report';

    /**
     * modifies returned data to fill in missing data and convert the api hash map to an array.
     * @param  {object} data  api data return.
     */
    var model = models.get('referralReport');
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
    $scope.getFilter = function() {
      var filter = {};

      var textFilter = $.trim($scope.nameFilter);
      if ($scope.displayFields !== 'date' && textFilter) {
        filter.OR = {
          'ReferredAffiliate.company' : {
            'conditional': 'LIKE',
            'values' : '%' + textFilter + '%'
          }
        };
      }
      return filter;
    };

    directiveRegistry.onDirectivesReady(['referralDatePicker', 'referralTable'], function() {
      $scope.table = directiveRegistry.get('referralTable');
      $scope.datePicker = directiveRegistry.get('referralDatePicker');

      $scope.sortDir = 'desc';
      $scope.sortField = 'ReferredAffiliate.company';
      $scope.table.sort.field = $scope.sortField;
      $scope.table.sort.direction = $scope.sortDir;

      $scope.table.$on('pagingChanged', $scope.updateTableData);
      $scope.$watch('displayFields', $scope.updateTableData);

      $scope.table.$on('sortRequested', function() {
        $scope.sortField = $scope.table.sort.field;
        $scope.sortDir = $scope.table.sort.direction;
        $scope.updateTableData();
      });
    });


    var getApiParams = function() {
      var params = {};
      params.groups = [];
      params.fields = ['Stat.amount'];
      params.contain = {
        'Stat': {
          'filters': {
            'Stat.date' : {
              'conditional' : 'BETWEEN',
              'values' : [
                $scope.datePicker.getStartDate(),
                $scope.datePicker.getEndDate()
              ]
            }
          }
        }
      };

      switch ($scope.displayFields) {
        case 'affiliate' :
          params.fields.push('ReferredAffiliate.company');
          params.groups.push('ReferredAffiliate.company');
          break;
        case 'date' :
          params.fields.push('Stat.date');
          params.groups.push('Stat.date');
          break;
        case 'both' :
          params.groups.push('Stat.date');
          params.fields.push('Stat.date');

          params.fields.push('ReferredAffiliate.company');
          params.groups.push('ReferredAffiliate.company');
          break;
      }

      params.sort = {};
      params.sort[$scope.table.sort.field] = $scope.sortDir;



      if (!_(params.fields).contains($scope.table.sort.field)) {
        delete(params.sort);
      }
      params.filters = $scope.getFilter();

      params.page = $scope.table.paging.page;
      params.limit = $scope.table.paging.pageSize;

      return params;
    };

    $scope.updateTableData = function() {
      $scope.fetchingData = true;
      model.getReportData(getApiParams()).success(function(data) {
        $scope.mutateGridData(data, getApiParams());
        $scope.table.drawTable(data, getApiParams());
        $scope.fetchingData = false;
      });
    };

    $scope.getReferralUrl = function() {
      if (currentUser.BrandPreferences.custom_referral_link) {
        return currentUser.BrandPreferences.custom_referral_link.replace(
          '{affiliate_id}',
          root.Config.affiliate_id
        );
      }

      var path = $window.location.pathname;
      var pubIndex = path.indexOf('publisher/');

      // This is a hacky attempt to find the root of the cake app.
      // We know that the pub interface always runs at /publisher from the cake app, but the cake app itself
      // can run from any directory. As such, we should just look for our known path and assume anything before it
      // is the base path.
      if (pubIndex) {
        path = path.substring(0, pubIndex);
        if (path.charAt(path.length - 1) !== '/') {
          path += '/';
        }
      } else {
        path = '/';
      }

      return $window.location.origin + path + 'signup/' + root.Config.affiliate_id;
    };

    $scope.displayFields = 'affiliate';

    $scope.searchFilter = function() {
      $scope.updateTableData();
    };
  }]);

})(this, jQuery);
