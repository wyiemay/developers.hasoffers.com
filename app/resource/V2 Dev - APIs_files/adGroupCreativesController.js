/*
 * adGroupCreatives controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.adGroupCreatives',
    ['$scope', '$routeParams', '$q', 'models',
      function($scope, $routeParams, $q, models) {

    // set local variable of model
    var model = models.get('adGroups');

    /**
     * flag to reload if creative added
     * @type {Boolean}
     */
    var reloadParentGrid = false;

    /**
     * local storage of current grid data
     * @type {object}
     */
    var gridData = {};

    /**
     * adds creative to current adgroup
     * @param {object} event jQuery event object.
     */
    $scope.addCreative = function(event) {
      event.preventDefault();
      reloadParentGrid = true;
      // clear any messages
      $scope.clearAlert('creativesResult');
      var btn = root.angular.element(event.currentTarget),
        id = btn.data('id'),
        row = _.find(gridData.data, function(dataRow) {
          return dataRow.id == id;
        }),
        params = {
          'ad_campaign_id' : $scope.adgroupData.id,
          'offer_file_id'  : id,
          'offer_id'       : row.Offer.id,
          'offer_url_id'   : 0 // @TODO update this from actual dropdown data
        };
      var request = model.addCreativeToAdgroup(params, $q);
      if (request) {
        request.then(function(dataReturn) {
          if (dataReturn.errors) {
            $scope.addError('creativesResult',
              _.first(dataReturn.errors).publicMessage,
              _.pluck(dataReturn.errors, 'err_msg'));
          } else {
            $scope.addSuccess('creativesResult', 'Creative Added Successfully');
            var parent = btn.parent();
            btn.remove();
            parent.append('<div>Added Default</div>');
          }
        });
      }
    };

    /**
     * modal close handler to trigger reload of creatives grid if necessary
     * @return {void}
     */
    $scope.onModalClose = function() {
      if (reloadParentGrid) {
        $scope.$parent.generateTable();
      }
    };

    // creatives table
    var define = model.getOfferFileDefinition();
    $scope.typeFilter = 'all';
    $scope.getDefinition = function() {
      return define;
    };

    /**
     * generates grid column model
     * @return {object} list of columns and settings.
     */
    $scope.getColumnModel = function() {
      var colModel = {
        'display'       : {'name' : 'Creative File', 'template' : '#add-creatives-display-column'},
        'type'          : {},
        'size'          : {},
        'Offer.name'    : {'template' : '#add-creatives-offer-column'}
      };

      _.each(colModel, function(obj, key) {
        if (!obj.name) {
          obj.name = model.determineNicename(key, define);
        }
      });
      return colModel;
    };

    var fetchTableData = function() {
      var params =  {
        'fields' : [
          'display',
          'type',
          'status',
          'id',
          'size',
          'thumbnail',
          'Offer.name'
        ],
        'sort'    : {'id' : 'desc'},
        'contain' : ['Offer'],
        'filters' : $scope.getDefaultFilter(),
        'page'    : 1,
        'limit'   : 10
      };

      model.findCreatives(params).success(function(data) {
        console.warn('Creatives table data call executed in isolate mode', data);
      });
    };

    /**
     * returns needed fields not in column model
     * @return {object} list of fields needed.
     */
    $scope.getExtraFields = function() {
      return {
        'id'        : 'id',
        'thumbnail' : 'thumbnail'
      };
    };

    /**
     * default sort
     * @return {string} default sort.
     */
    $scope.getDefaultSort = function() {
      return 'Stat.conversions desc';
    };

    /**
     * returns anonymous function to interface with model
     * @return {function}
     */
    $scope.getDataCall = function() {
      return $.proxy(model.findCreatives, model);
    };

    /**
     * handler to deal with data when grid is completely rendered
     * @param  {object} event jquery event object.
     * @param  {object} data  data return from api.
     * @return {void}
     */
    $scope.onGridComplete = function(event, data) {
      gridData = data;
      _.each(data.data, function(row) {
        var container = $('#add-creatives-{0}'.format(row.id));
        container.find('.add-link').click($scope.addCreative);
      });
    };

    /**
     * returns api readable filters from selectedFilters
     * @return {object} api filters.
     */
    $scope.getDefaultFilter = function() {
      var filter = {
        'OR' : [
          { 'interface' : 'network' },
          {
            'interface' : 'advertiser',
            'type'      : { 'NOT_EQUAL_TO' : 'hidden' }
          }
        ],
        'status'       : 'active',
        'Offer.status' : 'active'
      };

      if ($scope.adgroupData.type == 'banner') {
        filter.width = $scope.adgroupData.width;
        filter.height = $scope.adgroupData.height;
        if ($scope.typeFilter !== 'all') {
          filter.type = [$scope.typeFilter];
        } else {
          filter.type = ['image banner', 'flash banner', 'html ad'];
        }
      } else {
        filter.type = ['text ad'];
      }

      return filter;
    };

    /**
     * prevents grid controller from adding start date to grid,
     * will pick up from parent if this isn't set
     * @type {Boolean}
     */
    $scope.getStartDate = false;

    /**
     * returns api readable "contain" params
     * @return {object} api contain params.
     */
    $scope.getDefaultContainParams = function() {
      return ['Offer'];
    };

    // grid will be triggered when modal is clicked
    $scope.cancelGridLoad = true;

    $scope.$watch('typeFilter', function(_new, _old) {
      if (_new !== _old) {
        $scope.generateTable();
      }
    });
  }]);

})(this, jQuery);
