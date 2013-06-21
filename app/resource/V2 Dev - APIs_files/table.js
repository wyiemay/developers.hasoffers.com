/*
 * universal table controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.table',
    ['$scope', '$element', '$location', '$rootScope', 'sessionStorageService', '$timeout',
    function($scope, $element, $location, $rootScope, sessionStorageService, $timeout) {

    //populate markup
    var tableOptions = {
        'sessionStorageService' : sessionStorageService,
        '$scope'                : $scope,
        '$rootScope'            : $rootScope,
        '$location'             : $location,
        'dataCall'              : null,
        'pager'                 : '#{0}_pager'.format($scope.gridName),
        'definition'            : null,
        'defaultSort'           : null,
        'columnTitles'          : false,
        'noPageHistory'         : true //@TODO, determine how to implement
      },
      gridElement, defaultGridHtml, gridDataChange, gridComplete;

    var generateTable = function($event) {
      if (_.isFunction($scope.gridDataChange)) {
        gridDataChange = $scope.gridDataChange;
      }

      if (_.isFunction($scope.getGridOptions)) {
        tableOptions.gridOptions = $scope.getGridOptions();
      }

      if (_.isFunction($scope.onGridComplete)) {
        gridComplete = $scope.onGridComplete;
      }

      if ($event) {
        $event.preventDefault();
      }

      $scope.fetchingData = true;
      $rootScope.incrementLoading();

      // populate dataCall, definition and defaultSort options
      tableOptions.dataCall = $scope.getDataCall();
      tableOptions.definition = $scope.getDefinition();
      tableOptions.defaultSort = $scope.getDefaultSort();

      if (_($scope.getHourOffset).isFunction()) {
        tableOptions.hour_offset = $scope.getHourOffset();
      }

      if (!defaultGridHtml) {
        defaultGridHtml = $element.html();
      } else {
        $element.html(defaultGridHtml);
      }
      gridElement = $element.find('table.jqgrid');
      // reference to parent scope if necessary
      if (_.isFunction($scope.setGridElement)) {
        $scope.setGridElement(gridElement);
      }

      // set default alignment if available
      if (_.isFunction($scope.getDefaultAlign)) {
        gridElement.addClass($scope.getDefaultAlign);
      }

      var innerGridComplete = function() {
        $scope.fetchingData = false;
        $rootScope.decrementLoading();
        setPagingData();
      };

      if (gridDataChange) {
        gridElement.bind('gridDataChange', $.proxy(gridDataChange, $scope));
      }

      if (gridComplete) {
        gridElement.bind('gridComplete', $.proxy(gridComplete, $scope));
      }
      gridElement.bind('gridComplete', $.proxy(innerGridComplete, $scope));

      // get default filter if possible
      if (_.isFunction($scope.getDefaultFilter)) {
        tableOptions.defaultFilter = $scope.getDefaultFilter();
      }

      // get default contain params if possible
      if (_.isFunction($scope.getDefaultContainParams)) {
        tableOptions.defaultContainParams = $scope.getDefaultContainParams();
      }

      // extend tableOptions here to always grab latest columns, extraFields
      var cols = $scope.getColumnModel();
      _.extend(tableOptions, {
        'columns'     : cols,
        'groupBy'     : _.isFunction($scope.determineGroups) ? $scope.determineGroups(_.keys(cols)) : '',
        'extraFields' : _.isFunction($scope.getExtraFields) ? $scope.getExtraFields() : {}
      });

      // update latest start/end dates if necessary
      if (_.isFunction($scope.getStartDate)) {
        tableOptions.startDate = $scope.getStartDate();
        tableOptions.endDate = $scope.getEndDate();
      }

      tableOptions.ignoreUndefined = $scope.gridIgnoreUndefined;

      gridElement.grid(tableOptions);
    };

    // replace parent.buildGrid if it's angular.noop
    if ($scope.buildGrid == root.angular.noop) {
      $scope.buildGrid = generateTable;
    }

    $scope.triggerResize = function() {
      if (!_.isUndefined(gridElement)) {
        gridElement.jqGrid('setGridWidth', $element.width());
      }
    };

    // alias generateTable to parent
    $scope.generateTable = generateTable;

    /**
     * called by table directive, after html has been rendered
     * allows hook from parent to disable the intial load
     * @return {void}
     */
    $scope.triggerInitialGridLoad = function() {
      if ($scope.cancelGridLoad) {
        return;
      }
      $scope.generateTable();
    };

    /**
     * pagination methods for externally controlling the grid
     */

    $scope.gridPageNumrows = 20;
    $scope.gridPageNumrowOptions = [10, 20, 50, 100, 200];

    $scope.gridPageSetNumrows = function(e, numrows) {
      if (e) {
        e.preventDefault();
      }
      if ($scope.gridPageNumrows !== numrows) {
        $scope.gridPageNumrows = numrows;
        gridElement.jqGrid('setGridParam', {'rowNum' : $scope.gridPageNumrows});
        reloadGrid(1);

        if ($scope.isInModal) {
          gridElement
            .parents('jq-grid')
            .find('.grid-pagination')
            .find('.grid-page-numrows')
            .text($scope.gridPageNumrows);
        }

      }
    };

    var currentPage = 0;
    var setPagingData = function() {
      $timeout(function() {
        $scope.gridPageTotal = gridElement.jqGrid('getGridParam', 'lastpage');
        $scope.gridPageCurrent = gridElement.jqGrid('getGridParam', 'page');
        currentPage = $scope.gridPageCurrent;

        //This is a hacky fix because our bindings aren't compiling properly when the table is redrawn.
        // Rather than tracing through the grid draw cycle we'll just modify the page total field by hand for now.
        populatePagingFields($element.find('.grid-pagination'));
        updatePagination();
      });
    };
    var resetPagingData = function() {
      $scope.gridPageTotal = 1;
      $scope.gridPageCurrent = 1;
      updatePagination();
    };
    var reloadGrid = function(page) {
      $scope.fetchingData = true;
      $rootScope.incrementLoading();
      gridElement.trigger('reloadGrid', [
        {'page' : page}
      ]);
    };
    var updatePagination = function() {
      // within a modal, pagination is not updated automatically due to $compile issues with directives,
      // so we need to fall back to the old-fashioned method
      if ($scope.isInModal) {
        var pagContainer = gridElement.parents('jq-grid').find('.grid-pagination');
        populatePagingFields(pagContainer);
      }
    };

    var populatePagingFields = function(pagContainer) {

      // event binding can be reverted, so we need to bind every time,
      // removing old binding manually to be sure
      pagContainer.find('a').unbind('click');
      pagContainer.find('.grid-page-prev').bind('click.pagination', $scope.gridPrevPage);
      pagContainer.find('.grid-page-next').bind('click.pagination', $scope.gridNextPage);

      pagContainer.find('.dropdown-menu a').bind('click.pagination', function(e) {
        var val = $(e.currentTarget).data('val');
        $scope.gridPageSetNumrows(e, val);
      });

      pagContainer.find('.grid-page-input').val($scope.gridPageCurrent);
      pagContainer.find('.grid-page-total').text($scope.gridPageTotal);
      pagContainer.find('.grid-page-numrows').text($scope.gridPageNumrows);

      if ($scope.gridPageNextDisabled() == 'disabled') {
        pagContainer.find('.grid-page-next').addClass('disabled');
      } else {
        pagContainer.find('.grid-page-next').removeClass('disabled');
      }

      if ($scope.gridPagePrevDisabled() == 'disabled') {
        pagContainer.find('.grid-page-prev').addClass('disabled');
      } else {
        pagContainer.find('.grid-page-prev').removeClass('disabled');
      }
    };

    resetPagingData();

    $scope.gridPageNextDisabled = function() {
      var disabled = false;
      if (_.min([$scope.gridPageTotal, $scope.gridPageCurrent]) === 0) {
        disabled = true;
      } else if ($scope.gridPageCurrent == $scope.gridPageTotal) {
        disabled = true;
      }
      return disabled ? 'disabled' : '';
    };

    $scope.gridUpdatePage = function() {
      if (currentPage !== $scope.gridPageCurrent) {
        reloadGrid($scope.gridPageCurrent);
      }
    };

    $scope.gridPagePrevDisabled = function() {
      var disabled = false;
      if ($scope.gridPageTotal === 0 || $scope.gridPageCurrent < 2) {
        disabled = true;
      }
      return disabled ? 'disabled' : '';
    };

    $scope.gridPrevPage = _.throttle(function(e) {
      if (e) {
        e.preventDefault();
      }

      if ($scope.gridPagePrevDisabled() == 'disabled') {
        return;
      } else {
        $scope.gridPageCurrent--;
        reloadGrid($scope.gridPageCurrent);
      }
    }, 280);

    $scope.gridNextPage = _.throttle(function(e) {

      if (e) {
        e.preventDefault();
      }

      if ($scope.gridPageNextDisabled() == 'disabled') {
        return;
      } else {
        $scope.gridPageCurrent++;
        reloadGrid($scope.gridPageCurrent);
      }
    }, 280);

  }]);

})(this, jQuery);

/**
 * Sample grid call
 * $("#browse_grid").grid({
      api: document,
      pager:'#browse_grid_pager',
      controller:'advertiser/stats',
      findMethod:'report_apps_summary',
      extraFields:{},
      columns :{
        'id' : {name:'ID',cssClass:"text",width:"80",fixed:true},
        'name':{name:'Name',cssClass:"text",template:'#site_name_column'},
        'status' : {name:'Status',cssClass:"text",definition:{type:"string"}},
        'mobile_app_type':{name:'Type',cssClass:"text"},
        'installs':{name:'Installs',cssClass:"text"},
        'events':{name:'Events',cssClass:"text"},
        'avg_users_day':{name:'Avg users/day',cssClass:"text"},
        //'sdk_version':{name:'SDK Version',cssClass:"text",width:"50"},
        'delete':{name:' ',cssClass:"text",template:'#delete_column',width:"95",sortable:false,fixed:true}
      },
      countController : {url:'advertiser/sites/count'},
      defaultSort:"name",
      startDate:$.main.dateRanger.getStartDate(),
      endDate:$.main.dateRanger.getEndDate(),
      ignoreUndefined: true,
      enabledelete: false,
      filterOnHashChange : {
        "status" : {
          "field" : "status",
          "tpl" : {
            "format" : function(field, val)
            {
              if (val != "all")
              {
                return "{0}='{1}'".format(field,val);
              }
              return '';
            }
          }
        }
      },
      simpleSearch :
      {
        container : ".search-box",
        searchFields : ['name']
      }
    });
 */
