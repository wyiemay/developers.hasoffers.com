/*
 * adGroupDetail controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.adGroupForm',
    ['$scope', '$routeParams', '$location', 'models',
      function($scope, $routeParams, $location, models) {


    // set local variable of model
    var model = models.get('adGroups'),
      showCancel = false;

    $scope.define = model.getAdgroupDefinition();

    if ($routeParams && $routeParams.id > 0) {
      $scope.saveButtonText = 'Update Ad Group';

      // get adgroup data
      model.getAdGroupData($routeParams).success(function(data) {

        $scope.adgroupData = determineFormFromAdGroup(data.AdCampaign);

        // cast needed data and functionality
        // to parent for additional display
        $scope.$parent.adgroupData = $scope.adgroupData;
        $scope.$parent.define = $scope.define;
        $scope.$parent.displaySize = $scope.displaySize;
        showCancel = true;
      });
    } else {
      $scope.saveButtonText = 'Create Ad Group';

      // defaults for adgroup
      $scope.adgroupDataForm = {
        'status'             : 'active',
        'serve_type'         : 'random',
        'optimization_field' : 'cr',
        'type'               : 'text'
      };
    }

    /**
     * controls ng-show directive for optimization field display
     * @param  {string} which display or edit panels.
     * @return {bool}
     */
    $scope.showOptimizationField = function(which) {
      var whichObject = (which == 'display') ? $scope.adgroupData || {} : $scope.adgroupDataForm || {};
      if (whichObject.optimization) {
        return Number(whichObject.optimization) === 1;
      }
      return false;
    };

    /**
     * controls ng-show directive for cancel button
     * @return {void}
     */
    $scope.showCancelButton = function() {
      return showCancel;
    };

    /**
     * controls ng-show directive for size field display
     * @param  {string} which display or edit panels.
     * @return {bool}
     */
    $scope.displaySize = function(which) {
      var whichObject = (which == 'display') ? $scope.adgroupData || {} : $scope.adgroupDataForm || {};

      if (whichObject.type && whichObject.type == 'banner') {
        return true;
      }
      return false;
    };

    /**
     * collects and saves adgroup data
     * @param  {object} $event jQuery event object.
     * @return {void}
     */
    $scope.saveAdGroup = function($event) {

      if ($event) {
        $event.preventDefault();
      }
      $scope.clearAlert('adgroupSaveResult');

      model.saveAdGroup(determineAdGroupFieldsFromForm()).success(function(dataReturn) {
        if (dataReturn.errors && _.size(dataReturn.errors) > 0) {
          $scope.addError('adgroupSaveResult', _.first(dataReturn.errors).publicMessage, _.pluck(dataReturn.errors, 'err_msg'));
        } else {
          $scope.adgroupData = $scope.$parent.adgroupData = determineFormFromAdGroup(dataReturn.AdCampaign);

          // if we're updating, toggle form edit back to display and add success message
          if ($scope.adgroupDataForm.id) {
            $scope.toggleEditAdgroup();
            $scope.addSuccess('adgroupSaveResult', 'Ad Group Saved Successfully');

            // new adgroup created, queue success message and reroute to detail page
          } else {
            $scope.queueMessage('addSuccess', ['adgroupSaveResult', 'Ad Group Saved Successfully']);
            $location.path('/tools/adgroups/{0}'.format($scope.adgroupData.id));
          }
        }
      });
    };

    $scope.isBannerBad = function() {
      if (!$scope.adgroupDataForm) return false;

      var height = $scope.adgroupDataForm.height || '',
        width = $scope.adgroupDataForm.width || '';
      return !(height && width);
    };

    $scope.getFormState = function() {
      var data = $scope.adgroupDataForm,
        form = {'ok' : true};

      if (!data) {
        form.ok = false;
        return form;
      }

      if (!$.trim(data.name)) {
        form.ok = false;
        form.name = true;
      }

      if (data.type == 'banner' && $scope.isBannerBad()) {
        form.ok = false;
      }
      return form;
    };

    var determineAdGroupFieldsFromForm = function() {
      var data = root.angular.copy($scope.adgroupDataForm);

      switch (data.serve_type) {
        case 'optimize':
          data.optimization = 1;
          data.custom_weights = 0;
          break;
        case 'custom_weights':
          data.optimization = 0;
          data.custom_weights = 1;
          break;
        case 'random':
          data.optimization = 0;
          data.custom_weights = 0;
          break;
      }
      delete data.serve_type;
      return data;
    };

    var determineFormFromAdGroup = function(data) {
      // Determine serve type
      if (Number(data.optimization) == 1) {
        data.serve_type = 'optimize';
      } else if (Number(data.custom_weights) == 1) {
        data.serve_type = 'custom_weights';
        data.optimization_field = 'cr';
      } else {
        data.serve_type = 'random';
        data.optimization_field = 'cr';
      }

      if (data.type == 'banner') {
        data.width = Number(data.width);
        data.height = Number(data.height);
      }
      return data;
    };
  }]);
})(this, jQuery);
