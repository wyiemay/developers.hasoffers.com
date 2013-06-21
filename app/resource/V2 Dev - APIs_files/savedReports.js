/**
 * saved reports model
 */

(function(root, $, undefined) {
  'use strict';

  var SavedReportsService = ['api', 'models', 'digestService', function(api, models, digestService) {

    var statsReportModel = models.get('statsReport');

    // create models class
    var SavedReportsModel = models.getExtendable('base').extend({

      name: 'savedReports',

      timePresetConversion: {
        'today'            : 'today',
        'yesterday'        : 'yesterday',
        'last_seven_days'  : 'last_week',
        'last_thirty_days' : 'last_thirty',
        'this_month'       : 'this_month',
        'last_month'       : 'last_month',
        'last_six_months'  : 'last_six_months',
        'all_time'         : 'all_time',
        'other'            : 'custom'
      },

      timePresetTitles: {
        'today'           : 'Today',
        'yesterday'       : 'Yesterday',
        'last_week'       : 'Last 7 Days',
        'last_thirty'     : 'Last 30 days',
        'this_month'      : 'This month',
        'last_month'      : 'Last month',
        'last_six_months' : 'Last six months',
        'all_time'        : 'All time',
        'custom'          : 'Custom Date Range'
      },

      /**
       * gets title from preset
       * @param  {string} preset preset string
       * @return {string}        title
       */
      getPresetTitle : function(preset) {
        var presetConversion = this.timePresetConversion[preset] || preset;
        return this.timePresetTitles[presetConversion];
      },

      timePresetFunctionMap: {
        'today' : {
          dateStart: function() {
            return root.moment();
          },
          dateEnd: function() {
            return root.moment();
          }
        },
        'yesterday': {
          dateStart: function() {
            return root.moment().subtract(1, 'days');
          },
          dateEnd: function() {
            return root.moment().subtract(1, 'days');
          }
        },
        'last_week': {
          dateStart: function() {
            return root.moment().subtract(7, 'days');
          },
          dateEnd: function() {
            return root.moment();
          }
        },
        'last_thirty': {
          dateStart: function() {
            return root.moment().subtract(30, 'days');
          },
          dateEnd: function() {
            return root.moment();
          }
        },
        'this_month': {
          dateStart: function() {
            return root.moment().startOf('month');
          },
          dateEnd: function() {
            return root.moment();
          }
        },
        'last_month': {
          dateStart: function() {
            return root.moment().subtract(1, 'month').startOf('month');
          },
          dateEnd: function() {
            return root.moment().subtract(1, 'month').endOf('month');
          }
        },
        'last_six_months': {
          dateStart: function() {
            return root.moment().subtract(6, 'month').startOf('month');
          },
          dateEnd: function() {
            return root.moment();
          }
        },
        'this_year': {
          dateStart: function() {
            return root.moment().startOf('year');
          },
          dateEnd: function() {
            return root.moment();
          }
        },
        'last_year': {
          dateStart: function() {
            return root.moment().subtract(1, 'year').startOf('year');
          },
          dateEnd: function() {
            return root.moment().subtract(1, 'year').endOf('year');
          }
        },
        'all_time': {
          dateStart: function() {
            return root.moment('2007-01-01', 'YYYY-MM-DDT');
          },
          dateEnd: function() {
            return root.moment();
          }
        }
      },

      // constructor
      init: function() {
        this._super();
      },

      /**
       * gets all saved reports
       * @return {object} angular promise object.
       */
      getSavedReports: function() {
        var savedReportsCall, $this;

        $this = this;
        savedReportsCall = api.get('SavedReports/findAll');

        savedReportsCall.success(function(savedReportsData) {
          _.each(savedReportsData, $.proxy($this.convertFromApiReport, $this));
        });

        return savedReportsCall;
      },

      /**
       * gets saved report by id
       * @param  {int} $id saved report id
       * @return {object}     angular promise object.
       */
      getSavedReport : function(id) {
        var savedReportCall, $this;

        $this = this;
        savedReportCall = api.get('SavedReports/findAll', {'filters': {'SavedReport.id' : id}});
        savedReportCall.success(function(savedReportData) {
          _.each(savedReportData, $.proxy($this.convertFromApiReport, $this));
        });
        return savedReportCall;
      },

      /**
       * saves report to api
       * @param  {object} reportData all report data
       * @return {object}     angular promise object
       */
      saveReport : function(reportData) {
        var params,method;

        params = {
          'data' : {
            'interface' : 'affiliate',
            'user_id'   : root.Config.affiliate_user_id,
            'type'      : reportData.type,
            'name'      : reportData.name,
            'data'      : this.convertToApiReport(reportData)
          }
        };

        if (reportData.id){
          params.id = reportData.id;
          method = 'SavedReports/update';
        } else {
          // original infrastructure hash:
          // $hash = md5( __FUNCTION__ . serialize($params) . microtime(true) . rand(1, 10000) );
          params.data.hash = digestService.md5('AffiliateSaveReport{0}{1}{2}'.format(
            root.angular.toJson(params),
            new Date().getTime(),
            Math.floor(Math.random()*10000)
          ));
          method = 'SavedReports/create';
        }

        return api.get(method, params);

      },

      /**
       * converts/mutates existing saved report to new interface format
       * @param  {object} report
       * @return {object} report.
       */
      convertFromApiReport: function(report) {

        var intervalOptions, reportData, defaultReport, presetConversion, presetDateFn;

        reportData = {};

        // determine dates based on preset if not custom
        if (!_(['', 'other']).contains(report.SavedReport.data.DateRange.preset)) {
          presetConversion = this.timePresetConversion[report.SavedReport.data.DateRange.preset];
          presetDateFn = this.timePresetFunctionMap[presetConversion];
          reportData.start_date = presetDateFn.dateStart().format('YYYY-MM-DD');
          reportData.end_date = presetDateFn.dateEnd().format('YYYY-MM-DD');
        } else {
          reportData.start_date = report.SavedReport.data.DateRange.start_date;
          reportData.end_date = report.SavedReport.data.DateRange.end_date;
        }

        // populate necessary fields from saved report
        reportData.fields = _.chain(report.SavedReport.data.Report.fields)
                              .union(report.SavedReport.data.Report.grouping)
                              .map(function(field) {
                                var fieldSplit;
                                if (field.indexOf('.') > -1){
                                  fieldSplit = field.split('.');
                                  if (fieldSplit[0] != 'Stat'){
                                    field = fieldSplit[0];
                                  }
                                }
                                return field;
                              }).value();

        reportData.groups = report.SavedReport.data.Report.grouping;
        reportData.selectedFilters = report.SavedReport.data.Report.filters || [];

        if (report.SavedReport.type == 'stats') {

          // if report saved from new interface, simply include saved options
          if (report.SavedReport.data.ChartOptions) {
            _.extend(reportData, report.SavedReport.data.ChartOptions);
            _.extend(reportData, report.SavedReport.data.GridOptions);

          //otherwise we have to infer settings from groupings
          //selected and use defaults to fill in the missing pieces
          } else {
            // determine chart and grid interval
            intervalOptions = statsReportModel.getIntervalOptions();

            reportData.intervalType = _.chain(intervalOptions)
              .pluck('field')
              .find(function(field) {
                return _.indexOf(report.SavedReport.data.Report.grouping, field) > -1;
              })
              .value();

            // same interval for chart
            reportData.chartInterval = reportData.intervalType;

            // get chart defaults and fill in the missing options
            defaultReport = _.clone(statsReportModel.statsReportsDefaultReport);
            reportData = $.extend(defaultReport, reportData);

          }

        }
        report.reportData = reportData;
        return report;

      },

      /**
       * converts report data to backwards-compatible saved report
       * @param  {obejct} reportData report meta data
       * @return {object}     formatted data
       */
      convertToApiReport : function(reportData) {
        var returnData, grouping, fields, model, presetMap;

        presetMap = _.invert(this.timePresetConversion);
        switch(reportData.type) {
          case 'stats' :
            model = models.get('statsReport');
            break;
          case 'conversions' :
            model = models.get('conversionReport');
            break;
          case 'referral' :
            model = models.get('referralReport');
            break;
        }

        grouping = [];
        fields = [];

        // separate normal fields from groupings for backwards compatibility
        _.each(reportData.currentReport.fields, function(field) {
          if (field.indexOf('.') > -1){
            fields.push(field);
          } else {
            grouping.push(model.getNameField(field));
          }
        });

        // populate returned object
        returnData = {
          'DateRange': {
            'timezone'          : '_DEFAULT_',
            'preset_date_range' : presetMap[reportData.dateRange.preset],
            'start_date'        : reportData.dateRange.start_date,
            'end_date'          : reportData.dateRange.end_date,
            'preset'            : presetMap[reportData.dateRange.preset]
          },
          'Report': {
            'page'     : '',
            'grouping' : grouping,
            'fields'   : fields,
            'filters'  : reportData.filters
          },
          'GridOptions' : {
            'defaultSort'      : reportData.currentReport.defaultSort,
            'selectedInterval' : reportData.currentReport.selectedInterval
          }
        };

        // if we're a performance report, add in the additional chart
        if (reportData.type == 'stats'){
          returnData.ChartOptions = {};
          _.each(['intervalType', 'rowCount', 'chartType', 'selectedMetrics'], function(option) {
            returnData.ChartOptions[option] = reportData.currentReport[option];
          });
        }

        return returnData;

      }

    });
    return SavedReportsModel;
  }];

  // scope to root
  root.Models.savedReports = SavedReportsService;

})(this, jQuery);
