/* Event directives along with jqGrid */

(function(root, $, undefined) {
  'use strict';

  root.Application.directive('performanceChartWidget',
    ['chartService', 'models', function(chartService, models) {
      return {
        restrict: 'E',
        templateUrl: 'js/application/dashboard/partials/performanceChartWidget.html',
        transclude: true,
        compile: function() {
          return function($scope) {
            $scope.chartId = _.uniqueId('performanceChartWidget_');
            $scope.performanceChartLoaded = false;
            $scope.chartInterval = 'Stat.date';

            $scope.processUserFilters = function() { return {}; };

            var chartParams = {
                data_start: moment().subtract(7, 'days').format('YYYY-MM-DD'),
                data_end: moment().format('YYYY-MM-DD'),
                fields: [
                  'Stat.conversions',
                  'Stat.clicks',
                  'Stat.payout',
                  'Stat.impressions',
                  'Stat.date'
                ],
                timestamp: 'Stat.date',
                groups: ['Stat.date'],
                type: 'line',
                lineStyles: ['solid']
              };

            // callback to handle chart rendered trigger
            $scope.chartCallback = function() {
              return;
            };

            $scope.getLineStyleByIndex = function(idx) {
              var lineStyles = ['solid', 'solid', 'solid', 'solid'];
              return lineStyles[idx];
            };

            $scope.model = models.get('statsReport');

            $scope.getDefinition = function() {
              return $scope.model.getDefinition();
            };

            $scope.model.getReportData(chartParams).success(function(stats) {

              if (_.isUndefined(stats.data) || _.size(stats.data) === 0) {
                $scope.performanceChartLoaded = true;
                root.angular.element('#' + $scope.chartId)
                  .html('<div class="no-data"><p class="no-data-available">' +
                  '<em>No Data</em></p><p class="msg"></p>' +
                  '<a href="#!/offers" class="btn"><i class="sprite-arrowright"></i>' +
                  '<span>Browse Offers</span></div>');
                return;
              }

              // Need to give this our newly created datehour
              // field so it knows which field to use for the xaxis.
              $scope.currentReport = {
                selectedMetrics: [
                  'Stat.conversions',
                  'Stat.clicks',
                  'Stat.payout',
                  'Stat.impressions'
                ],
                selectedInterval: 'Stat.date',
                selectedFilters: null,
                chartType: 'line',
                rowCount: null
              };

              chartService.buildChart({
                'data': stats.data,
                'params': chartParams
              }, $scope, '#' + $scope.chartId);
              $scope.performanceChartLoaded = true;
            });
          };
        }
      };
    }]
  );
})(this, jQuery);
