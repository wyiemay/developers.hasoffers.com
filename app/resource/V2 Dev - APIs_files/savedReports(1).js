/*
 * savedReports controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.savedReports',
    ['$scope', 'models', function($scope, models) {


    var model = models.get('savedReports');

    // populate scope with saved reports data
    model.getSavedReports().success(function(savedReportsData) {
      _.each(savedReportsData, function(report) {
        report.dateRangeTitle = model.getPresetTitle(report.SavedReport.data.DateRange.preset);
      });
      $scope.savedReports = savedReportsData;
    });

    $scope.defaultDateRange = {
      'last_week' : '{0} - {1}'.format(
        moment().subtract(7, 'days').format('YYYY-MM-DD'),
        moment().format('YYYY-MM-DD')
      ),
      'today' : moment().format('YYYY-MM-DD')
    };
  }]);

})(this, jQuery);
