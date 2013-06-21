/*  */

(function(root, $, undefined) {
  'use strict';

  root.AppModules = root.AppModules || {};
  root.AppModules.directives = root.AppModules.directives || [];

  root.Application.directive('shortDatePicker', ['directiveRegistry', function(directiveRegistry) {
      return {
        'restrict'    : 'E',
        'templateUrl' : 'short-date-picker.tpl',
        'replace'     : true,
        'link'        : function(scope, element, attrs) {

          var formDate = function(date) {
            return date.format('YYYY-MM-DD');
          };

          var formRangeString = function(start) {
            return start.format('MMM Do, YYYY') + ' - ' + moment().format('MMM Do, YYYY');
          };

          var ranges = [
            {
              'startDate'     : formDate(moment().subtract('days', 7)),
              'endDate'       : formDate(moment()),
              'relativeRange' : 'Last 7 Days',
              'verboseRange'  : formRangeString(moment().subtract('days', 7))
            },
            {
              'relativeRange' : 'Last 30 Days',
              'startDate'     : formDate(moment().subtract('days', 30)),
              'endDate'       : formDate(moment()),
              'verboseRange'  : formRangeString(moment().subtract('days', 30))
            },
            {
              'relativeRange' : 'Last 365 Days',
              'startDate'     : formDate(moment().subtract('days', 365)),
              'endDate'       : formDate(moment()),
              'verboseRange'  : formRangeString(moment().subtract('days', 365))
            },
            {
              'relativeRange' : 'All Time',
              'startDate'     : formDate(moment('20070101', 'YYYYMMDD')),
              'endDate'       : formDate(moment()),
              'verboseRange'  : formRangeString(moment('20070101', 'YYYYMMDD'))
            }
          ];

          scope.displayRanges = [];
          _.each(ranges, function(piece, index) {
            scope.displayRanges.push({'index' : index, 'range' : piece.relativeRange});
          });

          scope.selectedDateIndex = 0;

          scope.setSelectedIndex = function(index) {
            scope.selectedDateIndex = index;
          };

          scope.getStartDate = function() {
            return ranges[scope.selectedDateIndex].startDate;
          };

          scope.getEndDate = function() {
            return ranges[scope.selectedDateIndex].endDate;
          };

          scope.getSelectedDateRange = function() {
            return ranges[scope.selectedDateIndex];
          };

          var loaded = false;
          scope.$watch('selectedDateIndex', function() {
            var changeFunction = scope[attrs.changeFn] || root.angular.noop;
            // Defer the change function when the values are initially set.
            if (!loaded) {
              loaded = true;
              return;
            }
            changeFunction();
            scope.$broadcast('selectedDateChanged');
          });

          directiveRegistry.register(scope, attrs.name || 'shortDatePicker');
        }

      };
    }]
  );

})(this, jQuery);
