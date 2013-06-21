/*
 * adgroups controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.adGroupsOfferModal',
    ['$scope', '$q', 'models',
      function($scope, $q, models) {


    var model = models.get('adGroups'),
      define = model.getAdgroupDefinition(),
      currentData = {};

    $scope.getDefinition = function() {
      return define;
    };

    /**
     * generates grid column model
     * @return {object} list of columns and settings.
     */
    $scope.getColumnModel = function() {
      var colModel = {
        'id' : {width: '80', fixed: true},
        'name': {'template' : '#adgroup-name-column'},
        'type' : {},
        'size' : {'template' : '#adgroup-size-column'},
        'status' : {},
        'add' : {'template' : '#adgroup-add-column'}
      };

      _.each(colModel, function(obj, key)
      {
        if (! obj.name) {
          obj.name = model.determineNicename(key, define);
        }
      });
      return colModel;
    };

    /**
     * returns needed fields not in column model
     * @return {object} list of fields needed.
     */
    $scope.getExtraFields = function()
    {
      return {'width': 'width', 'height': 'height', 'type': 'type', 'offer_id': 'offer_id'};
    };

    /**
     * default sort
     * @return {string} default sort.
     */
    $scope.getDefaultSort = function()
    {
      return 'name desc';
    };

    /**
     * returns anonymous function to interface with model
     * @return {function}
     */
    $scope.getDataCall = function()
    {
      return $.proxy(model.getAdGroupData, model);
    };

    $scope.setGridElement = function(elm) {
      $scope.gridElement = elm;
    };

    /**
     * handles on grid complete bindings
     * @return {void}
     */
    $scope.onGridComplete = function(event, data)
    {
      currentData = data.data;
      // make sure any clicks on links will dismiss the modal window as well
      $scope.gridElement.find('.dismiss-modal').click(function() {
        $scope.dismiss();
      });

      $scope.gridElement.find('.add-adgroup').click($scope.addCreative);
      /*
      $('#adgroup-check-all').unbind('click');
      // target header checkbox to toggle all checkboxes on/off, need to use jQuery since we're out of angular's realm
      $("#adgroup-check-all").click(function(e)
      {
        e.stopPropagation();
        if ($(this).prop('checked')) {
          $(".adgroup_checkbox").prop('checked', true);
        } else {
          $(".adgroup_checkbox").prop('checked', false);
        }
      });
      */
    };

    /**
     * returns api readable filters from selectedFilters
     * @return {object} api filters.
     */
    $scope.getDefaultFilter = function()
    {
      var filter = {
        'status' : ['active']
      };

      if ($scope.offerFile) {
        if ($scope.offerFile.type == 'image banner') {
          filter.width = $scope.offerFile.width;
          filter.height = $scope.offerFile.height;
          filter.type = 'banner';
        }
      }

      return filter;
    };

    /**
     * adds creative to selected adgroup
     * @param {event} event jquery event object.
     */
    $scope.addCreative = function(event) {
      event.preventDefault();

      // clear any messages
      $scope.clearAlert('adgroupAddResult');
      var btn = root.angular.element(event.currentTarget),
        id = btn.data('id'),
        params = {
          'ad_campaign_id' : id,
          'offer_file_id' : $scope.offerFile.id,
          'offer_id' : $scope.offerData.Offer.id,
          'offer_url_id' : 0 // @TODO update this from actual dropdown data
        };

      model.addCreativeToAdgroup(params, $q).then(
        function(dataReturn) {
          $scope.addSuccess('adgroupAddResult', 'Creative Added Successfully');
          var parent = btn.parent();
          btn.remove();
          parent.append('<div>Added Default</div>');
        },
        function(response) {
          $scope.addError('adgroupAddResult', response.errorMessage, response.errorDetails);
        }
      );
    };

  }]);
})(this, jQuery);
