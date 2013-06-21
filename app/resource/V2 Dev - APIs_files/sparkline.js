/**
 * Sample:
 * <sparkline color="purple" backgroundcolor="red" fillColor="yellow" items="arrayOfData"></sparkline>
 */


(function(root, $, undefined) {
  'use strict';

  root.Application.directive('sparkline',
    ['directiveRegistry', function(directiveRegistry) {
      return {
        'templateUrl' : 'partials/chartTemplates/sparkline.html',
        'restrict'    : 'E',
        'transclude'  : true,
        'replace '    : true,
        'scope' : {
          'items' : '=',
          'label' : '='
        },
        'link' : function (scope, element, attrs) {
          var chart, chartElement, chartParams, labelElement, options, statusElement;

          chartElement = element.find('.chart').hide();
          statusElement = element.find('.status');
          labelElement = element.find('.textlabel');

          options = {
            'backgroundColor' : attrs.backgroundcolor || '',
            'color'           : attrs.color || '#444444',
            'fillColor'       : attrs.fillcolor || '#e9e9e9',
            'loadingText'     : attrs.loadingText || 'LOADING',
            'noDataText'      : attrs.noDataText || 'NO DATA'
          };

          chartParams = {
            'chart': {
              'margin'              : [0, 0, 0, 0],
              'plotBackgroundColor' : options.backgroundColor,
              'renderTo'            : chartElement[0],
              'type'                : 'area',
              'reflow'              : true
            },
            'plotOptions': {
              'series' : {
                'fillColor' : options.fillColor,
                'lineWidth' : 1.3,
                'shadow'    : false,
                'states': {
                  'hover': {
                    'lineWidth' : 1.7
                  }
                },
                'marker': {
                  'enabled' : false,
                  'states'  : {
                    'hover' : {
                      'enabled' : false
                    }
                  }
                }
              }
            },
            'xAxis' : {
              'lineWidth'          : 0,
              'alternateGridColor' : 'transparent',
              'gridLineColor'      : 'transparent',
              'labels' : {
                'enabled' : false
              }
            },
            'yAxis' : {
              'lineWidth'          : 0,
              'alternateGridColor' : 'transparent',
              'gridLineColor'      : 'transparent',
              'labels' : {
                'enabled' :false
              }
            },
            'legend' : {
              'enabled' : false
            },
            'tooltip' : {
              'enabled' : false
            },
            'series': [{
              'color' : options.color,
              'data'  : scope.items
            }]
          };

          if (attrs.grid !== undefined) {
            chartParams.xAxis.gridLineWidth = 1;
            chartParams.xAxis.gridLineColor = '#ededed';
            chartParams.xAxis.tickPixelInterval = 15;
            chartParams.xAxis.endOnTick = true;
            chartParams.xAxis.startOnTick = true;

            chartParams.yAxis.gridLineWidth = 1;
            chartParams.yAxis.gridLineColor = '#ededed';
            chartParams.yAxis.tickPixelInterval = 15;
            chartParams.yAxis.endOnTick = true;
            chartParams.yAxis.startOnTick = true;
          }

          chart = new root.Highcharts.Chart(chartParams);

          var updateLabel = function() {
            if (scope.label && chartElement.is(":visible")) {
              var xExtremes = chart.xAxis[0].getExtremes(),
                  yExtremes = chart.yAxis[0].getExtremes();

              // Add padding inside graph by modifying extremes of the axis
              // yExtremes.dataMax/4 gives you 25% padding on the left side of the graph
              // xExtremes.dataMax/8 gives you 12.5% padding on the bottom side of the graph
              chart.xAxis[0].setExtremes(xExtremes.dataMin - (xExtremes.dataMax/4), xExtremes.dataMax);
              chart.yAxis[0].setExtremes(yExtremes.dataMin - (yExtremes.dataMax/8), yExtremes.dataMax);

              labelElement.text(scope.label);
              labelElement.show();
            }
          };

          scope.$watch('label', function() {
            updateLabel();
          });

          scope.$watch('items', function (newValue) {
            statusElement.text(options.loadingText);

            if (!_.isArray(newValue)) {
              statusElement.show();
              chartElement.hide();
              return;
            }

            var noData = _(newValue).chain().find(function(val) {
              return val !== 0;
            }).isUndefined().value();

            if (newValue.length === 0 || noData) {
              statusElement.text(options.noDataText);
              chartElement.hide();
              labelElement.hide();
              statusElement.show();
            } else {
              statusElement.hide();
              labelElement.hide();
              chartElement.show();

              chart.series[0].setData(newValue);

              updateLabel();

              // Update the chart size to the current width and height of the chart element
              chart.setSize(chartElement.width(), chartElement.height(), false);

              // Setting hasUserSize to null allows chart.reflow events to still get triggered after chart.setSize
              // If this isn't set to null, the chart won't resize when your window resizes
              chart.hasUserSize = null;
            }
          }, true);

          if (attrs.name) {
            directiveRegistry.register(scope, attrs.name);
          }
        }
      };
    }]
  );

})(this, jQuery);
