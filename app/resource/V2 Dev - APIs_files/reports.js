/*
 * main app controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.reports',
    [
      '$scope',
      '$location',
      'sessionStorageService',
      'chartService',
      'digestService',
      '$routeParams',
      '$rootScope',
      '$timeout',
      'models',
      'api',
      'directiveRegistry',
      function($scope,
               $location,
               sessionStorageService,
               chartService,
               digestService,
               $routeParams,
               $rootScope,
               $timeout,
               models,
               api,
               directiveRegistry) {

        // handle panel states for report options and filter
        var reportType, savedReportType, define, savedReportModel, path, categoryWarningShown = false;

        savedReportModel = models.get('savedReports');

        path = $location.$$path.split('/')[1];

        $scope.isPerformanceDetailReport = false;

        /**
         * determine model from path or saved report type
         * @param  {string} which path or saved report type
         * @return {void}
         */
        var setupReport = function(which, currentReport) {
          if (which == 'performanceDetail') {
            $scope.isPerformanceDetailReport = true;
          }

          switch (which) {
            case 'performance' :
            case 'performanceDetail' :
            case 'stats' :
              $scope.reportModel = models.get('statsReport');
              reportType = 'performance';
              savedReportType = 'stats';
              break;
            case 'conversion' :
            case 'conversions' :
              $scope.reportModel = models.get('conversionReport');
              reportType = 'log';
              savedReportType = 'conversions';
              break;
            default :
              throw new Error('Could not determine report model for ' + which);
          }

          if (path == 'savedReport') {
            categoryWarningShown = true;
          }

           // grabs selector options to populate options panel
          $scope.optionsSelectors = $scope.reportModel.getSelectorOptions();
          $scope.reportOptions = {};

          // interval options
          $scope.intervalSelectors = $scope.reportModel.getIntervalOptions();

          // radio buttons need to reference within object to get around scoping issues
          // see https://github.com/angular/angular.js/issues/1100
          $scope.selectedInterval = {'type': ''};

          // filter controls
          $scope.selectedFilters = [];

          if (path == 'performanceDetail') {
            $scope.selectedFilters = $scope.reportModel.determineFiltersFromParam($scope, $routeParams);
          }

          $scope.filterValues = [];
          $scope.selectedFilterValue = '';

          $scope.filterList = $scope.reportModel.getFilterList();

          $scope.selectedFilterType = '';

          $scope.$watch('selectedFilterType', function(_new) {
            $scope.selectedFilterValue = '';
            if (_new !== '') {
              var type = _.find($scope.filterList, function(tp) {
                return tp.value == _new;
              });
              if (type.dataCall) {
                $scope.filterValues = [];
                var p = type.dataCall($scope, 'filterValues');

                // filters will not return a promise if they don't need to fetch data.
                if (p && p.success) {
                  $scope.loadingFilters = true;
                  p.success(function() {
                    $scope.loadingFilters = false;
                  });
                }
              } else {
                $scope.filterValues = false;
              }
            } else {
              $scope.filterValues = [
                {'value' : '', 'label' : 'Select filter type'}
              ];
            }
          });

          define = $scope.reportModel.getDefinition();

          // reset datepicker to default if necessary
          if ($location.$$path.split('/').pop() == 'default') {
            var preset, presetFn;

            preset = (reportType == 'log') ? 'today' : 'last_week';
            presetFn = savedReportModel.timePresetFunctionMap[preset];

            $scope.setDateRange({
                'start_date' : presetFn.dateStart().format('YYYY-MM-DD'),
                'end_date' : presetFn.dateEnd().format('YYYY-MM-DD')
              },
              { 'preset' : preset }
            );
          }

          if ($scope.isMobile) {
            directiveRegistry.onDirectivesReady(reportType + '_mobile',
                                                getMobileSetupMethod(reportType + '_mobile'));
          } else {
            directiveRegistry.onDirectivesReady('reportTable', function() {
              if (!gridBuilt && !_(['performanceDetail','savedReport']).contains(path)) {
                $scope.buildGrid();
                gridBuilt = true;
              }
            });
          }

          if (!currentReport) {
            // handle report options
            $scope.currentReport = sessionStorageService.get('performanceReportSettings') ||
                $scope.reportModel.getDefaultReport();
            $scope.populateOptions($scope.currentReport);
          } else {
            $scope.currentReport = currentReport;
            $scope.populateOptions($scope.currentReport);

            // This is a hold out from the pre mobile days. Causes the chart to fetch data if it doesn't have any.
            if(!$scope.isMobile) {
              $scope.buildGrid();
            }
          }
        };

        /**
         * Fetch the data needed to display the sparklines associated with an offer
         * Inspects the original API request that was used to generate the list of stats that this row belongs to
         * Pulls out data specific to this row that is needed to uniquely identify the data we are interested in
         * Fetches stat fields, grouped by a sensible timeframe and assigns result to local row scope
         *
         * @param  {object}  row  object generated by rowRendered broadcast
         */
        $scope.populateChartData = function(row) {
          var defaultChartData, expectedRowCount, originalParams, params, promise, scope, timeframe;

          scope = row.scope();
          scope.chartData = {};
          defaultChartData = {};
          originalParams = scope._params;

          var startMoment = moment(originalParams.data_start),
              endMoment = moment(originalParams.data_end);

          // Adjust timeframe so you don't end up with an overwhelming number of data points in sparkline
          if (originalParams.data_start == originalParams.data_end) {
            timeframe = 'Stat.hour';
            expectedRowCount = 24;
          } else if (endMoment.diff(startMoment, 'weeks') >= 6) {
            timeframe = 'Stat.week';
            expectedRowCount = endMoment.diff(startMoment, 'weeks');
          } else {
            timeframe = 'Stat.date';
            expectedRowCount = endMoment.diff(startMoment, 'days');
          }

          // Params object that will be sent to Stats API
          params = {
            'filters' : {},
            'fields'  : {},
            'groups'  : [timeframe]
          };

          params.filters = {
            'Stat.date' : {
              'conditional' : 'BETWEEN',
              'values'      : [
                originalParams.data_start,
                originalParams.data_end
              ]
            }
          };

          // API doesn't return Stat row for {timeframe} if there are no stats for that timeframe
          // Zero pad a hash map with the number of expected rows
          for (var i = 0; i <= expectedRowCount; i++) {
            defaultChartData[i] = 0;
          }

          // Build the API filter based of the fields grouped on in original request
          // and their respected values in the data for this row
          _(originalParams.groups).each(function(field) {
            var value = 'NULL',
                parts = field.split('.'),
                apiTable = parts[0],
                apiField = parts[1];

            if (_(scope).hasMembers(apiTable, apiField)) {
              value = scope[apiTable][apiField] || 'NULL';
            }

            params.filters[field] =  {
              'conditional' : 'EQUAL_TO',
              'values'      : value
            };
          });

          params.fields = [
            'Stat.conversions',
            'Stat.impressions',
            'Stat.clicks',
            'Stat.payout'
          ];

          promise = api.get('Report/getStats', params);

          promise.success(function(data) {
            var index;

            data = data.data || data;

            _(params.fields).each(function(field) {
              scope.chartData[field] = angular.copy(defaultChartData);
            });

            _(data).each(function(row) {
              if (timeframe == 'Stat.hour') {
                index = row.Stat.hour;
              } else if (timeframe == 'Stat.week') {
                // Stat.week is in the format YYYYWW (where WW is the mapped week of the year)
                var year = row.Stat.week.substring(0,4),
                    week = row.Stat.week.substring(4,6);
                index = moment().year(year).week(week).diff(startMoment, 'weeks');
              } else {
                index = moment(row.Stat.date, 'YYYY-MM-DD').diff(startMoment, 'days');
              }

              _(params.fields).each(function(field) {
                var parts = field.split('.'),
                    apiTable = parts[0],
                    apiField = parts[1];

                if (_(row).hasMembers(apiTable, apiField)) {
                  scope.chartData[field][index] = parseFloat(row[apiTable][apiField]);
                }
              });
            });

            _(params.fields).each(function(field) {
              scope.chartData[field] = _(scope.chartData[field]).values();
            });
          });
        };

        /**
         * Returns a configured function that will set the $scope.table variable as well as configure the
         * $scope.buildGrid method. Intended to be used as a callback to onDirectivesReady.
         *
         * @param tableName - The name of the table expected to be loaded.
         * @returns {Function} - A preconfigured callback for the directiveRegistry.
         */
        var getMobileSetupMethod = function(tableName) {

          // Need to configure the callback for the directiveRegistry so we know which table to get.
          return function() {
            $scope.onDataCallComplete = function(data, params) {
              $scope.table.addItems(data, params);
            };

            $scope.table = directiveRegistry.get(tableName);

            if (reportType == 'performance') {
              $scope.table.paging = {
                'count'     : 0,
                'page'      : 1,
                'pageSize'  : 5
              };

              $scope.table.$on('rowRendered', function(event, row) {
                $scope.populateChartData(row);

                // Setup row scope methods for changing the active sparkline metrics
                var rowScope = row.scope();
                rowScope.activeChart = rowScope.activeChart || 'Stat.conversions';
                rowScope.activeChartLabel = 'con';

                rowScope.setActiveChart = rowScope.setActiveChart || function(field) {
                  var map = {
                    'con' : 'Stat.conversions',
                    'imp' : 'Stat.impressions',
                    'clk' : 'Stat.clicks',
                    'pay' : 'Stat.payout'
                  };
                  rowScope.activeChart = map[field];
                  rowScope.activeChartLabel = field;
                };

                rowScope.getChartData = rowScope.getChartData || function() {
                  if (!_(rowScope).hasMembers('chartData', rowScope.activeChart)) {
                    return null;
                  }
                  return rowScope.chartData[rowScope.activeChart];
                };
              });
            }
            fetchReportData();

            // Easier to override the build grid command than rewire all the filter callbacks to handle mobile.
            $scope.buildGrid = function() {
              $scope.table.clearItems();
              fetchReportData();
            };

            $scope.table.$on('moreItemsRequested', function() {
              fetchReportData();
            });
          };
        };


        /**
         * handles save report click
         * @param  {bool} forceNew forces save as new
         * @return {void}
         */
        $scope.saveReport = function(forceNew) {

          var saveOptions;

          saveOptions = {
            'currentReport' : $scope.currentReport,
            'name'          : $scope.savedReportName,
            'type'          : savedReportType,
            'filters'       : $scope.selectedFilters,
            'dateRange' : {
              'start_date' : $scope.getStartDate(),
              'end_date'   : $scope.getEndDate(),
              'preset'     : $scope.datePicker.getType()
            }
          };

          if ($scope.savedReportId > 0 && !forceNew) {
            saveOptions.id = $scope.savedReportId;
          }

          savedReportModel.saveReport(saveOptions).then(
            function() {
              $scope.addSuccess('saveReportResult', 'Report Saved Successfully');
            },
            function(saveData) {
              $scope.addError('saveReportResult', saveData.errorMessage, saveData.errorDetails);
            }
          );
        };

        $scope.setReportTimeline = function() {
          var preset = $scope.datePicker.getType();
          $scope.savedReportTimeline = '{0} - {1} (Preset: {2})'.format(
            $scope.getStartDate(true).format('MMM. D, YYYY'),
            $scope.getEndDate(true).format('MMM. D, YYYY'),
            savedReportModel.getPresetTitle(preset)
          );
        };

        /**
         * gets saved report and forces determination of model and currentReport settings
         * @return {void}
         */
        var getSavedReportData = function() {
          $scope.savedReportId = $routeParams.id;
          savedReportModel.getSavedReport($scope.savedReportId).success(function(reportData) {
            $scope.setDateRange(
              reportData[$scope.savedReportId].reportData,
              reportData[$scope.savedReportId].SavedReport.data.DateRange
            );
            setupReport(
              reportData[$scope.savedReportId].SavedReport.type,
              reportData[$scope.savedReportId].reportData
            );
            $scope.savedReportName = reportData[$scope.savedReportId].SavedReport.name;
          });
        };

        $scope.isPerformanceReport = function() {
          return reportType == 'performance';
        };

        // used to populate display
        $scope.rowCounts = {
          '3'  : 'Top 3 Offers',
          '5'  : 'Top 5 Offers',
          '10' : 'Top 10 Offers',
          '0'  : 'Offer Totals'
        };

        $scope.downloadReportLink = false;

        $scope.downloadReport = function() {
          var params = constructApiParams();
          delete(params.limit);
          delete(params.page);

          var modal = directiveRegistry.get('downloadReportModal');

          $scope.downloadReportGenerating = true;
          $scope.downloadReportFailed = false;

          modal.show();
          var promise = $scope.reportModel.getDownloadReportLink(params);

          promise.then(function(data) {
            $scope.downloadReportLink = data.data;
            $scope.downloadReportGenerating = false;
          });

          promise.then(angular.noop, function() {
            $scope.downloadReportLink = false;
            $scope.downloadReportGenerating = false;
            $scope.downloadReportFailed = true;
          });
        };

        /**
         * handles various states and functionality when panels opened/closed
         * @param  {string} panel  which panel is open.
         * @param  {bool} closed if true, panel has been closed, false if panel has been opened.
         * @return {void}
         */
        $scope.togglePanelFn = function(panel, closed, ns) {
          switch (ns) {
            case 'default' :
              if (closed || panel !== 'datepicker') {
                $scope.datePicker.cancel();
              } else {
                $scope.datePicker.show();
              }
              break;
            case 'chart-interval' :
              $scope.chartInterval = panel;
              $scope.buildChart();
              break;
          }
        };

        /**
         * determines if there are selected filters
         * @return {true}
         */
        $scope.hasSelectedFilters = function() {
          return ($scope.selectedFilters && _.size($scope.selectedFilters) > 0);
        };

        /**
         * handler for click on add filter button
         * @param {object} $event jquery event.
         */
        $scope.addFilter = function($event) {
          $scope.$parent.clearAlert('filterMessage');

          if ($event) {
            $event.preventDefault();
          }

          var err = false;
          if ($scope.selectedFilterType === '') {
            err = 'You must select a filter type';
          } else if ($scope.selectedFilterValue === '') {
            err = 'You must select a filter value';
          }

          // determine if it already exists
          _.each($scope.selectedFilters, function(filter) {
            if (filter.entity == $scope.selectedFilterType && filter.value == $scope.selectedFilterValue) {
              err = 'Filter already exists';
            }
          });

          if (err) {
            $scope.$parent.addError('filterMessage', 'Error', err);
          } else {
            var id = $scope.selectedFilters.length,
              valRow = _.find($scope.filterValues, function(row) {
                return row.value == $scope.selectedFilterValue;
              }),
              typeRow = _.find($scope.filterList, function(tp) {
                return tp.value == $scope.selectedFilterType;
              });

            if($scope.filterValues === false) {
              valRow = {'label': $scope.selectedFilterValue};
            }

            $scope.selectedFilters[id] = {
              'id'     : id,
              'entity' : $scope.selectedFilterType,
              'field'  : typeRow.field ? typeRow.field : false,
              'value'  : $scope.selectedFilterValue,
              'label'  : '{0}: {1}'.format($scope.selectedFilterType, valRow.label),
              'matchType': typeRow.matchType || 'exact'
            };
          }
        };

        /**
         * click handler for remove filter
         * @param  {object} $event jquery event object.
         * @param  {integer} id     array key for event.
         * @return {void}
         */
        $scope.removeFilter = function($event, id) {
          if ($event) {
            $event.preventDefault();
          }

          $scope.selectedFilters = _($scope.selectedFilters).reject(function(filter) {
            return filter.id == id;
          });
        };

        /**
         * processes chosen filters into api understandable object
         * @param  {array} selectedFilters array of filter objects.
         * @return {object}
         */
        $scope.processUserFilters = function(selectedFilters) {
          var filter = {};

          _(selectedFilters).each(function(row) {

            // The api coerces all values to strings on saved reports so we need to check if the field is empty or
            // was formally a boolean value.
            var isValidField = row.field && !_(['true', 'false']).contains(row.field);
            var field = isValidField ? row.field : 'Stat.{0}_id'.format(row.entity.toLowerCase());
            var valTemplate = '{0}';

            if (!filter[field]) {
              if(row.matchType === 'exact') {
                filter[field] = {'conditional' : 'EQUAL_TO', 'values' : []};
              } else {
                filter[field] = {'conditional' : 'LIKE', 'values': []};
                valTemplate = '%{0}%';
              }
            }

            filter[field].values.push(valTemplate.format(row.value));
          });
          return filter;
        };

        /**
         * Populates form from options
         * @param  {object} options :fields, chart type, number of charted rows.
         * @return {null}
         */
        $scope.populateOptions = function(options) {
          // handle fields selections
          _.each(options.fields, function(field) {
            $scope.reportOptions[field] = true;
          });

          // set chart type
          $scope.setChartType(null, options.chartType, 'chart-type');

          // set interval selction
          $scope.selectedInterval.type = $scope.currentReport.selectedInterval = options.intervalType;
          $scope.togglePanel(null, $scope.selectedInterval.type, 'chart-interval');
          $scope.setRowCount(null, options.rowCount);

          $scope.currentReport.selectedMetrics = options.selectedMetrics;
          $scope.metricDisplay = $scope.getSelectedMetricsDisplay();
          $scope.selectedFilters = _.clone(options.selectedFilters || []);
        };

        $scope.$watch('reportOptions.Category', function(newVal) {
          if (newVal && !categoryWarningShown && $scope.categoryWarningModal) {
            $scope.categoryWarningModal.show();
            categoryWarningShown = true;
          }
        });

        /**
         * Sets offer count from action
         * @param {mixed} $event change event or falsie.
         * @param {integer} cnt    number of rows to chart.
         */
        $scope.setRowCount = function($event, cnt) {
          if ($event) {
            $event.preventDefault();
          }

          $scope.rowCount = cnt;
          chartService.clearCurrentSet();
          $scope.buildChart();
        };

        /**
         * Sets chart type from selection
         * @param {mixed} $event change event || null.
         * @param {string} type   Chart type.
         * @param {string} ns     Namespace used in togglePanel.
         */
        $scope.setChartType = function($event, type, ns) {
          if ($event) {
            $event.preventDefault();
          }

          ns = ns || 'default';
          $scope.togglePanel($event, type, ns);
          $scope.currentReport.chartType = type;
          $scope.buildChart();
        };

        /**
         * returns human readable list of selected metrics for display
         * @return {string} list of selected metrics.
         */
        $scope.getSelectedMetricsDisplay = function() {
          return _($scope.currentReport.selectedMetrics).map(function(metric) {
            return $scope.reportModel.determineNicename(metric);
          }).join(' / ');
        };

        /**
         * handles selection/deselection of graph metric
         * @param  {object} $event jquery event object.
         * @param  {string} metric chosen metric.
         * @return {void}
         */
        $scope.selectMetric = function($event, metric) {
          if ($event) {
            $event.preventDefault();
          }

          var metrics = _($scope.currentReport.selectedMetrics);
          if (metrics.contains(metric)) {
            if(metrics.size() === 1) { return; }
            $scope.currentReport.selectedMetrics = metrics.reject(function(met) {
              return met === metric;
            });
          } else {
            $scope.currentReport.selectedMetrics.push(metric);
          }

          $scope.metricDisplay = $scope.getSelectedMetricsDisplay();
          $scope.buildChart();

        };

        $scope.getLineStyleByIndex = function(idx) {
          var lineStyles = ['solid', 'dashed', 'dotted', 'dashDot'];
          var goodIdx = idx;

          // keep going down until we get a valid line style index -
          // just in case we ever track more than our list length we should loop around the line types.
          while (goodIdx >= lineStyles.length) {
            goodIdx -= lineStyles.length;
          }

          return lineStyles[goodIdx];
        };

        /**
         * adds/removes 'selected' class from metric dropdown options
         * @param  {string} metric metric value.
         * @return {boolean}
         */
        $scope.metricSelected = function(metric) {
          return $scope.currentReport && _($scope.currentReport.selectedMetrics).contains(metric);
        };

        /**
         * returns start date
         * @return {string} date in format YYYY-MM-DD or moment object.
         */
        $scope.getStartDate = function(returnAsObject) {
          if ($scope.datePicker) {
            var d = $scope.datePicker.getStartDate();
            if (returnAsObject) {
              return moment(d);
            }

            return d;
          }
        };

        /**
         * returns end date
         * @return {string} date in format YYYY-MM-DD or moment object.
         */
        $scope.getEndDate = function(returnAsObject) {
          if ($scope.datePicker) {
            var d = $scope.datePicker.getEndDate();
            if (returnAsObject) {
              return moment(d);
            }
            return d;
          }
        };

        /**
         * sets datePicker date ranges and presets
         * @param {object} reportData report data with corrected start and end dates
         * @param {object} dateRange  saved date range settings
         */
        $scope.setDateRange = function(reportData, dateRange) {
          if (reportData.start_date && reportData.end_date){
            $scope.datePicker.setDate(reportData.start_date, reportData.end_date, true);
            if (dateRange) {
              $scope.datePicker.setType(dateRange.preset);
            }
            $scope.setReportTimeline();
          }
        };

        /**
         * handles panel apply button
         * @param  {string} panel which panel apply targeted.
         * @return {void}
         */
        $scope.applyPanelFn = function(panel) {
          if (_(['options', 'filters']).contains(panel)) {
            $scope.currentReport.fields = _.filterSelected($scope.reportOptions);
            $scope.currentReport.selectedInterval = $scope.selectedInterval.type;
            $scope.currentReport.selectedFilters = $scope.selectedFilters;
            $scope.buildGrid();
          }
        };

        /**
         * reorders columns based on model definitions
         * adds additional columns when requested field is related_entities
         * @param  {array} cols columns to sort.
         * @return {array}      sorted columns.
         */
        $scope.processColumns = function(cols) {
          var colOrder = $scope.reportModel.getColumnOrder();

          return _.chain(cols)
            .filter(function(col) {
              return _.contains(colOrder, col);
            })
            .sortBy(function(col) {
              var order = _.indexOf(colOrder, col);
              if (order === -1) {
                order = cols.length;
              }
              return order;
            })
            // convert column to entity.name if it is a related_entities
            .map(function(col) {
              if (col.indexOf('.') === -1) {
                col = $scope.reportModel.getNameField(col);
              }
              return col;
            }).value();
        };

        /**
         * determines grouped columns
         * @param  {array} cols list of chosen columns.
         * @param  {bool} ignoreInterval  do we add interval to grouping.
         * @return {array}      list of grouped
         * mns.
         */
        $scope.determineGroups = function(cols, ignoreInterval) {
          var groups = [];
          _.each(cols, function(field) {
            var fieldSplit = field.split('.');
            if (fieldSplit.length > 1 &&
                  define.related_entities[fieldSplit[0]] &&
                  define.related_entities[fieldSplit[0]].groupable) {
              groups.push($scope.reportModel.getIdField(fieldSplit[0]));
            }

            // The performance report will allow you to group on some stat fields so this
            // just figures out if the individual field is groupable rather than the whole entity.
            if (_(define.singleFieldGroups).contains(field)) {
              groups.push(field);
            }
          });

          // We don't need to group by id if we're getting all the offers.
          if ($scope.rowCount == '0' || reportType != 'performance') {
            groups = _.reject(groups, function(group) {
              return group === 'Stat.offer_id';
            });
          }
          if (!ignoreInterval && $scope.groupByInterval) {
            groups.push($scope.currentReport.selectedInterval);
          }
          return _.unique(groups);
        };

        /**
         * returns api readable filters from selectedFilters
         * @return {object} api filters.
         */
        $scope.getDefaultFilter = function() {
          return $scope.processUserFilters($scope.currentReport.selectedFilters || {});
        };

        $scope.getHourOffset = function() {
          return $scope.datePicker.getTimezoneOffset();
        };

        /**
         * getter to return define
         * @return {object} field definition.
         */
        $scope.getDefinition = function() {
          return define;
        };

        /**
         * prepares column model for jqGrid
         * @return {object} Columns used to display requested report.
         */
        $scope.getColumnModel = function() {
          var colModel = {},
            fields = $scope.processColumns($scope.currentReport.fields),
            reportsCols = $('#reportsColumnSnippets');

          if ($scope.groupByInterval) {
            fields.unshift($scope.currentReport.selectedInterval);
          }
          _.each(fields, function(field) {
            var reportColId = '#report_column_{0}'.format(field.split('.').join('_').toLowerCase());
            colModel[field] = {'name' : $scope.reportModel.determineNicename(field, define)};
            if (reportsCols.find(reportColId).length > 0) {
              colModel[field].template = reportColId;
            } else if (_.contains(root.Config.Enums.currencyFields, field)) {
              colModel[field].formatoptions = {'currencyField': 'Stat.currency'};
            }
          });

          //The date column is irrelevant on the performance table so we'll skip it.
          if(reportType == 'performance' && !$scope.groupByInterval) {
            delete(colModel['Stat.date']);
          }
          return colModel;
        };

        /**
         * process current fields selections, finds those that are
         * related entities and returns the field as entity.id
         * @return {array} list of entity.id fields.
         */
        $scope.getExtraFields = function() {
          return _.chain($scope.currentReport.fields)
            .filter(function(entity) {
              return !_.isUndefined(define.related_entities[entity]);
            })
            .map(function(entity) {
              return $scope.reportModel.getIdField(entity);
            })
            .value();
        };

        /**
         * Returns default sort
         * @return {string} default column sort.
         */
        $scope.getDefaultSort = function() {
          return _.hasMembers($scope, 'currentReport', 'defaultSort') ?
             $scope.currentReport.defaultSort : 'Stat.offer_id desc';
        };

        /**
         * getter for model function used to get grid data
         * @return {function} [description].
         */
        $scope.getDataCall = function() {
          return $scope.reportModel ? $.proxy($scope.reportModel.getReportData, $scope.reportModel) : false;
        };

        // access to grid element, will be set by table controller
        var gridElement;

        /**
         * getter for grid options
         * @return {object} grid options.
         */
        $scope.getGridOptions = function() {
          if (reportType == 'performance') {
            return {
              'beforeSelectRow' : $.proxy(function(id) {
                chartService.changeColorState(id);
              }, chartService)
            };
          } else {
            return {};
          }
        };

        /**
         * setter
         * @param {jquery element} el element where grid is housed.
         */
        $scope.setGridElement = function(el) {
          gridElement = el;

          if (reportType == 'performance') {
            gridElement.bind(
              'gridComplete',
              $.proxy(
                function() {
                  chartService.highlightMetrics();

                  /** needed to position .triangles absolutely within table cells **/
                  _.each($('.col-name'), function(el) {
                    el = $(el);
                    el.height(el.parent().height());
                  });
                },
                chartService
              )
            );
          }
        };

        /**
         * getter
         * @return {jquery element} element where grid is housed.
         */
        $scope.getGridElement = function() {
          return gridElement;
        };

        /**
         * child controller table will override this function,
         * for now just set to angular noop in case there's a problem.
         *
         */
        $scope.buildGrid = root.angular.noop;

        /**
         * Callback function for grid data change
         * @param  {event} $event
         * @param  {object} gridData returned data from grid.
         * @return {null}
         */
        $scope.gridDataChange = function($event, gridData) {
          // if reportType is performance, trigger chart build.
          if (reportType == 'performance') {
            $scope.buildChart(gridData);
          }
        };

        var fetchReportSummaryDataCalled = false;
        $scope.reportSummaryToggle = '';

        $scope.toggleReportSummary = function() {
          $scope.reportSummaryToggle = $scope.reportSummaryToggle == 'on' ? '' : 'on';
          if ($scope.reportSummaryToggle == 'on') {
            if (!fetchReportSummaryDataCalled) {
              $scope.fetchReportSummaryData();
            }
          }
        };

        $scope.reportSummary = {
          impressions : {total : 0, data : null},
          conversions : {total : 0, data : null},
          clicks      : {total : 0, data : null},
          payout      : {total : 0, data : null},
          ctr         : {total : 0, data : null},
          ltr         : {total : 0, data : null},
          erpc        : {total : 0, data : null}
        };

        $scope.reportSummaryFields = ['impressions', 'conversions', 'clicks', 'payout', 'ctr', 'ltr', 'erpc'];

        // local variables
        var lastGridData, chartHtml;

        /**
         * builds chart through chartService
         * @param  {object} gridData grid data returned.
         * @return {void}
         */
        $scope.buildChart = function(gridData) {
          // don't do anything if no gridData available
          if (!gridData && !lastGridData) {
            return;
          }

          // rebuild chart using the last valid grid data sent,
          // updating last known data if new data available
          if (!gridData) {
            gridData = _.clone(lastGridData);
          } else {
            lastGridData = _.clone(gridData);
          }

          // reset html or store if first-run
          if (!chartHtml) {
            chartHtml = $(location).html();
          } else {
            $(location).html(chartHtml);
          }

          var startMoment = moment($scope.getStartDate()),
              endMoment = moment($scope.getEndDate());

          if ($scope.getStartDate() == $scope.getEndDate()) {
            $scope.chartInterval = 'Stat.hour';
            $scope.intervalSelectors = $scope.reportModel.getIntervalOptions();
          } else if (endMoment.diff(startMoment, 'days') > 14) {
            // Hide the hour interval selectors if the date range is beyond 2 weeks.

            if ($scope.chartInterval.indexOf('hour') > -1) {
              $scope.chartInterval = 'Stat.date';
            }
            $scope.intervalSelectors = _.reject($scope.reportModel.getIntervalOptions(), function(option) {
              return option.field.indexOf('hour') > -1;
            });
          } else {
            $scope.intervalSelectors = $scope.reportModel.getIntervalOptions();
          }

          // Set data to null so sparklines enter the loading state
          _($scope.reportSummaryFields).each(function(field) {
            $scope.reportSummary[field].data = null;
          });

          if (fetchReportSummaryDataCalled) {
            $scope.fetchReportSummaryData();
          }

          chartService.buildChart(gridData, $scope, '#chart_container');
        };

        var constructApiParams = function() {

          if (!$scope.table) {
            $scope.table = {'paging' :  { 'page' : 1, 'pageSize' : 10}};
          }
          var params = {
            'fields'      : $scope.processColumns($scope.currentReport.fields),
            'groups'      : [],
            'sort'        : {'Stat.datetime' : 'desc'},
            'filters'     : $scope.getDefaultFilter(),
            'data_start'  : $scope.getStartDate(),
            'data_end'    : $scope.getEndDate(),
            'hour_offset' : $scope.datePicker.getTimezoneOffset(),
            'page'        : $scope.table.paging.page,
            'limit'       : $scope.table.paging.pageSize
          };

          // We always want to have the offer and date available for mobile requests
          // so we can display the cards properly.
          if ($scope.isMobile) {
            if (reportType == 'log') {
              params.fields.push('Stat.datetime');
            }
            params.fields.push('Offer.name');
            params.fields.push('Stat.offer_id');
          }

          var contains = _($scope.currentReport.fields).filter(function(row) {
            return row.split('.').length === 1;
          });

          _(contains).each(function(field) {
            // The filters include table names instead of fields. This pulls out the table names and replaces them
            // with their preferred idenity field.
            var fields = _(params.fields).without(field);
            fields.push($scope.reportModel.getIdField(field));
            params.fields = fields;
          });

          params.fields = _(params.fields).unique();

          params.groups = $scope.determineGroups(params.fields, true);
          return params;
        };

        // Isolate data call that is used to form the data grid.
        var fetchReportData = function() {
          var params = constructApiParams();

          $scope.incrementLoading();
          $scope.reportModel.getReportData(params).success(function(data) {
            $scope.decrementLoading();
            $scope.onDataCallComplete(data, params);
          });
        };

        // has user chosen interval, if so leave it alone
        var userChartInterval = false;

        /**
         * sets userChartInterval to true when chartInterval clicked
         * @return {void}
         */
        $scope.userInterval = function() {
          userChartInterval = true;
        };

        /**
         * handles date change, updates chartInterval if necessary
         * @return {void}
         */
        $scope.dateChange = function() {
          if (userChartInterval === false) {
            if ($scope.getStartDate() == $scope.getEndDate()) {
              $scope.panelObj.panelOpen['chart-interval'] = 'Stat.hour';
              $scope.chartInterval = 'Stat.hour';
            } else if ($scope.chartInterval == 'Stat.hour') {
              $scope.panelObj.panelOpen['chart-interval'] = 'Stat.date';
              $scope.chartInterval = 'Stat.date';
            }
          }
          $scope.setReportTimeline();
          $scope.buildGrid();
        };

        var getExpectedRowCount = function() {
          if ($scope.getStartDate() == $scope.getEndDate()) {
            return 24;
          }

          return $scope.getEndDate(true).diff($scope.getStartDate(true), 'days');
        };

        // trigger API call to populate sparklines in report summary
        $scope.fetchReportSummaryData = function() {
          var params, singleDay, summaryParams, summaryPromise, byIntervalPromise, expectedRowCount;

          expectedRowCount = getExpectedRowCount();

          fetchReportSummaryDataCalled = true;

          params = {
            groups  : ['Stat.date'],
            fields  : [
              'Stat.conversions',
              'Stat.impressions',
              'Stat.payout',
              'Stat.clicks',
              'Stat.offer_id',
              'Stat.ctr',
              'Stat.ltr',
              'Stat.erpc'
            ],
            filters     : $scope.getDefaultFilter(),
            hour_offset : $scope.datePicker.getTimezoneOffset()
          };

          params.filters['Stat.date'] = {
            'conditional' : 'BETWEEN',
            'values'      : [
              $scope.getStartDate(),
              $scope.getEndDate()
            ]
          };

          if ($scope.getStartDate() == $scope.getEndDate()) {
            params.groups = ['Stat.hour'];
            singleDay = true;
          }

          summaryParams = root.angular.copy(params);
          summaryParams.groups = null;

          summaryPromise = api.get('Report/getStats', summaryParams);
          summaryPromise.success(function(data) {
            _.each($scope.reportSummaryFields, function(field) {
              $scope.reportSummary[field].total = parseFloat(data.data[0].Stat[field]);

              $timeout(function() {
                root.angular.element('.quickstats p').textfill({maxFontPixels : 28});
              });
            });
          });

          byIntervalPromise = api.get('Report/getStats', params);
          byIntervalPromise.success(function(data) {
            // zero-fill the data array for each expected point in sparkline
            _.each($scope.reportSummaryFields, function(field) {
              $scope.reportSummary[field].data = [];
              for (var i = 0; i <= expectedRowCount; i++) {
                $scope.reportSummary[field].data[i] = 0;
              }
            });

            _.each(data.data, function(row) {
              var index;

              if (singleDay) {
                index = row.Stat.hour;
              } else {
                index = moment(row.Stat.date, 'YYYY-MM-DD').diff($scope.getStartDate(true), 'days');
              }

              _.each($scope.reportSummaryFields, function(field) {
                $scope.reportSummary[field].data[index] = parseFloat(row.Stat[field]);
              });
            });
          });
        };

        // cancelGridLoad set to true will prevent jqGrid directive from firing buildGrid function
        $scope.cancelGridLoad = true;

        var gridBuilt = false;

        // ensuring directives are ready prior to options and generating table
        directiveRegistry.onDirectivesReady(['panelStates', 'dateRangePicker'], function() {
          if (path == 'savedReport') {
            getSavedReportData();
          } else {
            setupReport(path);
          }

          $scope.setReportTimeline();
        });
      }
    ]);

})(this, jQuery);
