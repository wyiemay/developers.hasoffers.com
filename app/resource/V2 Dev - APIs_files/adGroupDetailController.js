/*
 * adGroupDetail controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.adGroupDetail',
    ['$scope', '$routeParams', '$q', 'directiveRegistry', 'models', '$window', '$timeout',
      function($scope, $routeParams, $q, directiveRegistry, models, $window, $timeout) {

    // set local variable of model
    var model = models.get('adGroups');
    $scope.page = {'interface' : 'creatives'};

    // get hostnames for dropdown
    model.getHostnames().success(function(data) {
      $scope.hostNameList = [];
      _.each(data, function(row) {
        $scope.hostNameList.push({'id' : row.Hostname.id, 'label' : row.Hostname.domain});
      });
    });

    var editMode = false;

    /**
     * toggles edit mode
     * @param  {object} $event jquery event.
     * @return {null}
     */
    $scope.toggleEditAdgroup = function($event) {
      if ($event) {
        $event.preventDefault();
      }
      editMode = !editMode;
      if (editMode) {
        $scope.adgroupDataForm = {};
        _.each($scope.adgroupData, function(v, k) {
          $scope.adgroupDataForm[k] = v;
        });
      }
    };

    /**
     * controls ng-show directive for edit mode
     * @param  {string} which display or edit panels.
     * @return {bool}
     */
    $scope.editModeShow = function(which) {
      if (which == 'display') {
        return !editMode;
      }
      return editMode;
    };

    $scope.isNotReadOnly = function() {
      if (!$scope.adgroupData) {
        return false;
      }

      return $scope.adgroupData.interface === 'affiliate';
    };

    var showsObj = {};
    /**
     * controls show/hide variables for various code generation options
     * @param  {object} $event jquery event object.
     * @param  {string} ns   which panel.
     * @return {void}
     */
    $scope.toggleShow = function($event, ns) {
      showsObj[ns] = !showsObj[ns];
    };

    /**
     * handles ng-show directive for various code generation options
     * @param  {string} ns namespace requested.
     * @return {bool}
     */
    $scope.getShow = function(ns) {
      return showsObj[ns] || false;
    };

    /**
     * handles ng-show directive for displaying tracking code format dropdown
     * @return {bool}
     */
    $scope.showTrackingFormat = function() {
      if ($scope.adgroupData && $scope.adgroupData.type) {
        return $scope.adgroupData.type !== 'text';
      }
      return false;
    };


    // setup default states
    $scope.trackingFormat = 'javascript';
    $scope.trackingDomain = '';
    $scope.adTagReturn = '';

    $scope.$watch('adgroupData', function(newVal) {
      if (newVal) {$scope.generateAdTag();}
    });

    //Check if either dropdown changed
    $scope.$watch(function() {
      return $scope.trackingFormat + $scope.trackingDomain;
    }, function() {
      $scope.generateAdTag();
    });

    // Watch the optional sections. They have update buttons so we only need to check when the user deactivates the
    // section.
    $scope.$watch('affiliateSource', function(newVal) {
      if (!newVal) { $scope.generateAdTag(); }
    });

    $scope.$watch('subId', function(newVal) {
      if (!newVal) { $scope.generateAdTag(); }
    });

    $scope.$watch('clickRedirect', function(newVal) {
      if (!newVal) { $scope.generateAdTag(); }
    });

    /**
     * collects and processes generation of adgroup tag code
     * @return {void}
     */
    var currentRequest = null;
    $scope.generateAdTag = function() {
      if (!$scope.adgroupData) {
        return;
      }
      //Abort any running requests so we don't get irrelevant code showing in the box.
      if (currentRequest) {
        currentRequest.reject();
      }

      var params = {
        'id'       : $scope.adgroupData.id,
        'format'   : $scope.adgroupData.type == 'text' ? 'javascript' : $scope.trackingFormat || 'javascript',
        'domain'   : $scope.trackingDomain,
        'source'   : $scope.trackingSource,
        'aff_sub'  : $scope.affSub1,
        'aff_sub2' : $scope.affSub2,
        'aff_sub3' : $scope.affSub3,
        'aff_sub4' : $scope.affSub4,
        'aff_sub5' : $scope.affSub5
      };

      if ($scope.trackingRedirectEncode) {
        params.eredirect = $scope.trackingRedirect;
      } else {
        params.redirect = $scope.trackingRedirect;
      }
      $scope.tagLoading = true;

      currentRequest = model.getAdgroupCode(params);
      currentRequest.success(function(generateReturn) {
        $scope.adTagReturn = generateReturn.CampaignCode;
        $scope.tagLoading = false;
        currentRequest = null;
      });

    };

    $scope.selectedAction = '';
    $scope.$watch('selectedAction', function(_new) {
      if (_new) {
        modifySelected(_new);
      }
      $scope.selectedAction = '';
    });

    // creatives table
    var getSelected = function(which) {
      $scope.clearAlert('creativesStatusResult');

      // looking inside the grid, this is not accessable to angular model, so we fallback to jQuery
      var selected = _.map($('.creative_checkbox:checked'), function(el) {
        return $(el).data('id');
      });

      if (_.size(selected) === 0) {
        return false;
      }
      return selected;
    };

    $scope.updateWeight = function(creative, display_name) {

      // prevent falling through if currently saving or item hasn't been updated
      if(creative.saving || creative.custom_weight == creative.temp_weight) { return; }

      creative.saving = true;

      var promise = model.updateCreativeWeight(creative.id, creative.temp_weight);
      promise.success(function(data) {
        creative.temp_weight = creative.custom_weight = data.AdCampaignCreative.custom_weight;
        creative.saving = false;
      });

      promise.error(function(){
        $scope.flashError('There was a problem saving custom weight for ' + display_name);
        creative.saving = false;
      });
    };

    var modifySelected = function(which) {
      var map = {
          'pause'  : {'status' : 'paused', 'message' : 'paused'},
          'resume' : {'status' : 'active', 'message' : 'resumed'},
          'delete' : {'status' : 'deleted', 'message' : 'deleted'}
        },
        selected = getSelected(which);

      if (selected) {
        model.updateCreativesStatus(selected, map[which].status, $q).then(function() {
          $scope.addSuccess('creativesStatusResult', 'Creatives successfully {0}'.format(map[which].message));
          $scope.updateTableData();
        });
      }
    };

    $scope.statusValues = [];

    directiveRegistry.onDirectivesReady(['creativesDatePicker', 'creativesTable'], function() {
      $scope.table = directiveRegistry.get('creativesTable');
      $scope.datePicker = directiveRegistry.get('creativesDatePicker');

      $scope.$watch('statusFilter', function(_new, _old, _scope) {
        $scope.updateTableData();
      });
      $scope.table.$on('pagingChanged', function() {
        $scope.updateTableData();
      });

      $scope.table.$on('tableRenderComplete', function() {
        $('#creative-check-all').unbind('click');
        // target header checkbox to toggle all checkboxes on/off,
        // need to use jQuery since we're out of angular's realm
        $('#creative-check-all').click(function(e) {
          e.stopPropagation();
          if ($(this).prop('checked')) {
            $('.creative_checkbox').prop('checked', true);
          } else {
            $('.creative_checkbox').prop('checked', false);
          }
        });
      });
    });

    var getApiParams = function() {
      var params = {};
      params.contain = $scope.getDefaultContainParams();

      params.filters = $scope.getDefaultFilter();

      params.page = $scope.table.paging.page;
      params.limit = $scope.table.paging.pageSize;
      return params;
    };

    /**
     * default sort
     * @return {string} default sort.
     */
    $scope.getDefaultSort = function() {
      return 'Stat.conversions desc';
    };

    $scope.updateTableData = function() {
      var promise = model.getCreativeData(getApiParams());

      promise.error(function() {
        $scope.table.noData = true;
      });

      promise.success(function(data) {
        // Don't want to pass the params object by reference here so we'll just rebuild the object each time.

        mutateTableData(data, getApiParams());
        $scope.table.drawTable(data, getApiParams());
      });
    };

    var mutateTableData = function(data, params) {
      var zeroFill, fields;
      fields = params.fields;

      zeroFill = {};
      // create default values for Stat based on column model
      _.each(fields, function(field) {
        var parts = field.split('.');
        if (parts[0] == 'Stat') {
          zeroFill[parts[1]] = 0;
        }
      });
      $scope.statusValues = [];
      // determine if row.Stat is null, if so, fill it in with defaults;
      _.each(data.data, function(row) {
        if (!row.Stat) {
          row.Stat = zeroFill;
        }

        // add temp_weight
        row.AdCampaignCreative.temp_weight = row.AdCampaignCreative.custom_weight;

        $scope.statusValues.push(row.status);
      });

      $scope.statusValues = _.uniq($scope.statusValues);
    };

    /**
     * returns api readable filters from selectedFilters
     * @return {object} api filters.
     */
    $scope.getDefaultFilter = function() {
      var filter = {
        'id' : $routeParams.id
      };
      if ($scope.statusFilter !== 'all') {
        filter.status = [$scope.statusFilter];
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
      // The api executes contains as an Inner join in it's query. This means any contain with an
      // empty member will cause the row to simply not be returned.  However, placing the filters into
      // the contains object will cause the API to run the contains as part of a Left join instead.
      return {
        0: 'Offer',
        1: 'OfferFile',
        2: 'OfferUrl',
        'Stat': {
          'filters': {
            'Stat.date': {
              'conditional': 'BETWEEN',
              'values': [
                $scope.datePicker.getStartDate(), $scope.datePicker.getEndDate()
              ]
            }
          }
        }
      };
    };
    $scope.statusFilter = 'active';

    /**
     * sets taskbarOffset which is used in the template by ui-scrollfix
     */
    $scope.updateTaskbarOffset = function() {
      /* using taskbar-positioner so that if taskbar previously scrollfixed 
         it's offset will be set to the static taskbar-positioner */
      var $taskbar = $('.taskbar-positioner:first');
      if (_.isObject($taskbar.offset())) {
        $scope.taskbarOffset = $taskbar.offset().top - 40;
      }
    };

    $scope.updateTaskbarOffset(); // run right away
    $timeout($scope.updateTaskbarOffset, 1500); // run again 1.5 seconds later

    // run .5 seconds after resize
    $($window).on('resize',
      _.debounce(function(){
        $timeout($scope.updateTaskbarOffset);
      }, 500)
    );

  }]);
})(this, jQuery);
