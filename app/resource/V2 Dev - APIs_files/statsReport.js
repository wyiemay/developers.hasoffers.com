/*
* statReports model
*/

(function(root, $, undefined) {
  'use strict';

  var StatsReportService = ['api', 'models', function(api, models) {
    var StatsReportModel = models.getExtendable('reportsBase').extend({

      name: 'statsReport',

      // constructor function
      init: function() {
        this._super();
      },

      // cached filterList when requested
      filterList: [],

      /**
       * getter to return definition
       * @return {object} statsReport definition.
       */
      getDefinition: function() {
        return root.angular.copy(this.statReportDefinitions);
      },

      /**
       * getter to return options
       * @return {object} statsReports options.
       */
      getOptions: function() {
        return root.angular.copy(this.statsReportsOptions);
      },

      /**
       * getter to return column order
       * @return {array} order of statsReports columns.
       */
      getColumnOrder: function() {
        return root.angular.copy(this.statsReportsOrder);
      },

      getDownloadReportLink : function(params) {
        params = this.getFormattedApiParams(params);
        return this.generateReportDownload('getStats', params.data_start, params.data_end, params);
      },


      getFormattedApiParams : function(params) {
        params = root.angular.copy(params);
        // api doesn't support Stat.datehour, so if we're requesting this field,
        // we modify the params to adjust and mutate the data to provide it
        var dateHourIndex = _.indexOf(params.groups, 'Stat.datehour'),
          dateHourFieldIndex = _.indexOf(params.fields, 'Stat.datehour');

        if (dateHourIndex > -1) {
          params.groups[dateHourIndex] = 'Stat.hour';
          params.groups.push('Stat.date');
          params.groups = _.unique(params.groups);
          params.timestamp = 'Stat.hour';
          if (params.filters && params.filters['Stat.datehour']) {
            if (_.size(params.filters['Stat.datehour'].values) > 0) {
              params.filters['Stat.hour'] = params.filters['Stat.datehour'];
            }
            delete params.filters['Stat.datehour'];
          }
        }

        // remove from requested fields if necessary
        if (dateHourFieldIndex > -1) {
          params.fields[dateHourFieldIndex] = 'Stat.hour';
          params.fields.push('Stat.date');
          params.fields = _.unique(params.fields);
        }
        if (params.sort && _.isUndefined(params.sort['Stat.datehour']) === false) {
          params.sort['Stat.date'] = params.sort['Stat.hour'] = params.sort['Stat.datehour'];
          delete params.sort['Stat.datehour'];
        }

        params = this.addDateFilter(params);

        // Check if sort field is included in params.fields, delete sort if it's not
        _.each(_.keys(params.sort || {}), function(field) {
          if (!_.contains(params.fields, field)) {
            delete params.sort[field];
          }
        });

        return params;
      },

      /**
       * Gets Stats Report data for grids/charts
       * @params options required for report data
       * @return {angular promise object}
       */
      getReportData: function(params) {

        var dateHourIndex = _.indexOf(params.groups, 'Stat.datehour'),
          dateHourFieldIndex = _.indexOf(params.fields, 'Stat.datehour');

        params = this.getFormattedApiParams(params);

        var statsCall = api.get('Report/getStats', params);

        if (_.max([dateHourIndex, dateHourFieldIndex]) > -1) {
          return statsCall.success(function(statsData) {
            _.each(statsData.data, function(row) {
              try {
                var hour = root.Formatter.zeroPadNumber(row.Stat.hour);
                row.Stat.datehour = '{0} {1}:00:00'.format(row.Stat.date, hour);
              } catch (e) {
                console.error(e);
              }
            });
          });
        }
        return statsCall;
      },

      /**
       * Getter for current report's default options
       * @return {array} field list.
       */
      getDefaultReport: function() {
        return root.angular.copy(this.statsReportsDefaultReport);
      },

      /**
       * extends base method to add current rerport definition if not passed in
       * @param  {string} field      field to determine.
       * @param  {mixed} definition can pass in definition or leave undefined.
       * @return {string}            nicename for requested field.
       */
      determineNicename: function(field, definition) {
        definition = definition || this.getDefinition();
        return this._super(field, definition);
      },

      /**
       * returns stats report filter list
       * @return {array} list of filter options.
       */
      getFilterList: function() {
        var $this = this;
        if (_.size($this.filterList) === 0) {

          $this.filterList = [];
          _.each($this.reportFilterList, function(filter) {
            if (_.indexOf($this.statsReportFilterList, filter.value) > -1) {
              $this.filterList.push(filter);
            }
          });
        }
        return root.angular.copy($this.filterList);
      }

    });
    return StatsReportModel;
  }];

  root.Models.statsReport = StatsReportService;

})(this, jQuery);
