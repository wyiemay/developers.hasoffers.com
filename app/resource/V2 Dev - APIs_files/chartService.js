/**
 * Provides chart services to performance reports
 *
 */
(function(root, $, undefined) {
  'use strict';

  /**
   * chartService returns object that processes data into HighCharts display
   * and inputs into highCharts display
   * @return {object} chartService object.
   */
  root.Application.service('chartService', function() {
    return {
      // current angular scope
      $scope: null,

      // DOM element target
      location: '#chart_container',

      // contains last returned grid data
      gridData: {},

      // contains api parameters for chart
      chartParams: {},

      // list of charted items' states
      colorState: {},

      // list of current charted items
      currentSet: [],

      // chart object
      chart: null,

      /**
       * buildChart performs the necessary processes to build the chart
       * @param  {object} gridData Contains information from the grid call, optional.
       * @param  {[type]} $scope   angular scope optional.
       * @param  {mixed} location   dom element selector or falsy.
       * @return {void}
       */
      buildChart : function(gridData, $scope, location) {
        var $this = this;

        // TODO: remove this hack when the api is fixed to allow null member searches.
        $('#chart_container').show();
        $('#no-graph-possible').hide();

        // these are optional as the chart can be rebuilt from the values already passed
        if ($scope) {
          this.$scope = $scope;
        }

        this.currentSet = [];
        // if new grid data is passed, we reset our current set
        if (gridData) {
          this.gridData = gridData;

          // otherwise we set our current set from selected rows
        } else {
          _.each(this.colorState, function(row, id) {
            if (row.active) {
              $this.currentSet.push(id);
            }
          });
        }

        if (location) {
          this.location = location;
        }

        // if gridData is empty ,there is nothing to chart, present that and exit
        if (this.gridData.data.length === 0) {
          $(this.location).html(
            '<div class="no-data">' +
              '<div class="no-data-available"><div>' +
              '<em>No Data</em><p class="msg"></p>' +
              '<a href="#!/offers" class="btn"><i class="sprite-arrowright"></i><span>Browse Offers</span></a>' +
              '</div></div></div>');
          if (this.$scope) {
            this.$scope.$broadcast('chart-loaded', this.location);
          }
          return;
        }

        // underscore doesn't support deep copies so we're losing the 'field' parameter when it's passed in.
        // Changing this to JQ.
        this.chartParams = $.extend(true, {}, this.gridData.params);

        this.currentReport = this.$scope.currentReport || {
          selectedMetrics  : null,
          selectedInterval : null,
          selectedFilters  : null,
          chartType        : this.chartParams.type,
          rowCount         : null
        };

        if (this.chartParams.fields && this.currentReport) {
          // add rowIds to gridData
          this.addRowIds();

          // add selected metric and selected groupby interval
          this.chartParams.field = this.currentReport.selectedMetrics;
          this.chartParams.timestamp = this.$scope.chartInterval;
          this.chartParams.groups = this.determineGroups();
          this.chartParams.fields = this.determineFields();
          this.chartParams.filters = this.determineFilter();
        }

        // clean unneeded params
        delete(this.chartParams.page);
        delete(this.chartParams.sort);

        // force api to return all results
        this.chartParams.limit = 0;

        // resize container if necessary
        $(this.location).css('width', this.currentReport.chartType == 'pie' ? '750px' : 'auto');

        var _api = this.$scope.reportModel ?
          $.proxy(this.$scope.reportModel.getReportData, this.$scope.reportModel) : null;

        this.chart = root.ChartFactory.chartDisplay(
          this.location,
          this.currentReport.chartType,
          _api,
          this.gridData,
          this.chartParams,
          this.chartDataCallback,
          this.chartCompleteCallback,
          this.currentReport.rowCount,
          $.proxy(this.seriesHover, this),
          this
        );
        return this.chart.chart.chart;
      },

      /**
       * clears current set of selected rows to chart
       * @return {void}
       */
      clearCurrentSet : function() {
        this.currentSet = [];
      },

      /**
       * removes unwanted fields from groups param
       * used in _.reject
       * @param  {field} field field name.
       * @return {boolean}       Is field within list of unwanted fields.
       */
      rejectGroups : function(field) {
        var fields = [
          'Stat.hour',
          'Stat.date',
          'Stat.datehour',
          'Stat.week',
          'Stat.month',
          'Stat.year'
        ];

        return _.contains(fields, field);
      },

      /**
       * processes grouped fields into row id from specific row of data
       * @param  {array} groups list of groups.
       * @param  {mixed} row    list of values, can be array or object of field:val.
       * @return {string}        string in the format of field1--val1__field2--val2__...
       */
      determineId : function(groups, row) {
        var $this = this,
          tpl = '{0}--{1}';

        return _.chain(groups)
          .reject($this.rejectGroups)
          .map(function(field, k) {
            var fieldSplit = field.split('.');

            // if row is an array, grab the value via key
            if (_.isArray(row)) {
              return tpl.format(field, row[k] || 'null');

              // otherwise row is an object, use the field to determine value
            } else {
              if (fieldSplit.length > 1) {
                return tpl.format(field, row[fieldSplit[0]][fieldSplit[1]]);
              } else {
                return tpl.format(field, row[field]);
              }
            }
          })
          .value().join('__');
      },

      /**
       * reverses the process from determineId
       * @param  {string} id formatted string in the format of field1--val1__field2--val2__...
       * @return {object}    key/value pairs {field1:val1,field2:val2...}.
       */
      determineFromId : function(id) {
        var ret = {};
        _.each(id.split('__'), function(pair) {
          pair = pair.split('--');
          ret[pair[0]] = pair[1];
        });

        return ret;
      },

      /**
       * mutates gridData to add rowid and first flag
       * used in grid to display colored swatch, overrides tr#id in grid to match
       * @param {object} gridData returned grid data.
       */
      addRowIds : function() {
        var $this = this,
          gridData = this.gridData,
          firstCol = _.first(this.chartParams.fields).split('.').shift(),
          firstField = _.first(this.chartParams.fields).split('.').pop();

        if(firstCol === 'Stat' && firstField === 'offer_id') {
          firstCol = 'Offer';
        }
        _.each(gridData.data, function(row) {
          // process first column, this determines presence of colored field in grid
          if (!row[firstCol]) {
            row[firstCol] = {};
          }
          row[firstCol].first = true;

          // add rowid, used to link grid to chart
          row.rowid = $this.determineId($this.chartParams.groups, row);
        });
      },

      determineGroups : function() {
        if (this.$scope.determineGroups) {
          var groups = this.$scope.determineGroups(this.gridData.params.fields, true);
          groups.push(this.$scope.chartInterval);
          return _.unique(groups);
        }
      },

      /**
       * determines which fields to request from the api
       * @return {array} list of fields.
       */
      determineFields : function() {

        var fields = _.chain(this.gridData.params.groups)
          .clone()
          .union(this.chartParams.field)
          .unique()
          .value();

        return fields;
      },

      /**
       * determines filter from user defined inputs and returned data
       * @param  {object} data    gridData.
       * @param  {array} columns list of columns.
       * @param  {[type]} useIds  [description].
       * @return {[type]}         [description].
       */
      determineFilter: function() {
        var $this, gridData, groups, userFilters, orFilter, filter, picks;

        $this = this;
        gridData = this.gridData;
        groups = this.chartParams.groups;
        userFilters = this.$scope.processUserFilters(this.currentReport.selectedFilters || {});
        filter = {};
        picks = {};
        orFilter = {};

        if (this.currentSet.length > 0) {
          _.each(this.currentSet, function(id) {

            var params = $this.determineFromId(id);
            _.each(params, function(val, field) {
              if (_.isUndefined(filter[field])) {
                filter[field] = {'conditional' : 'EQUAL_TO', 'values' : []};
              }
              filter[field].values.push(val);
            });
          });
        } else {
          _.chain(groups)
            .reject($this.rejectGroups)
            .each(function(field) {
              filter[field] = {'conditional' : 'EQUAL_TO', 'values' : []};
              var fieldSplit = field.split('.');
              if (!picks[fieldSplit[0]]){
                picks[fieldSplit[0]] = [];
              }
              picks[fieldSplit[0]].push(fieldSplit[1]);
            });

          // If we haven't chosen a number to display then we should not filter by offer id.
          if ($this.$scope.rowCount !== '0') {
            _.chain(gridData.data)
              .take(Number($this.$scope.rowCount))
              .each(function(row) {

                _.each(picks, function(pickFields, entity) {
                  var vals = _.pick(row[entity], pickFields);
                  _.each(vals, function(val, field) {
                    var fullField = '{0}.{1}'.format(entity,field);

                    // to handle case where value is null, we use entity.id as null conditional
                    if (_.indexOf([null, ''], val) > -1) {
                      var idField = entity == 'Country' ? 'name' : 'id';
                      switch (entity) {
                        case 'Stat':
                          idField = field;
                          break;
                        case 'Country':
                          idField = 'name';
                          break;
                        default:
                          idField = 'id';
                          break;
                      }
                      orFilter['{0}.{1}'.format(entity, idField)] = {'conditional' : 'NULL'};

                    // otherwise treat normally
                    } else if (_.has(filter, fullField) && !_.contains(filter[fullField].values, val)) {
                      filter[fullField].values.push(val);
                    }
                  });
                });
              });
          }
        }

        if (_.size(orFilter) > 0) {
          filter.OR = orFilter;
        }

        // strip out empty filters
        _.each(filter, function(filterObj, key){
          if (key !== 'OR' && _.size(filterObj.values) === 0){
            delete(filter[key]);
          }
        });
        // add in userFilters, with above logic taking precidence over user filters
        filter = _.extend(userFilters, filter);
        return filter;
      },

      /**
       * data callback event translates returned data into currentSet - a list of selected chartable items
       * @param  {object} _data returned data.
       * @return {void}
       */
      chartDataCallback : function(_data) {
        this.parent.currentSet = _.keys(_data);
      },

      /**
       * processes returned chart data and sets up interaction between grid and chart
       * this is triggered when the chart is finally rendered
       * keyword `this` is chart object
       * @return {void}
       */
      chartCompleteCallback : function() {
        var $this = this,
          colorState = {};

        if ($this.parent && $this.parent.$scope) {
          $this.parent.$scope.$broadcast('chart-loaded', this.location);
        }

        var columns = _($this.parent.determineGroups()).reject($this.parent.rejectGroups);

        // lets move offer_id to the front of the columns if it's a stat report. This clears up most
        // cases where the color state fails.
        if (_.contains(columns, 'Stat.offer_id')) {
          var idx = _.indexOf(columns, 'Stat.offer_id');
          columns.splice(idx, 1);
          columns.unshift('Stat.offer_id');
        }

        var consume = function(line) {
          var metrics = ['conversions', 'metrics', 'impressions', 'payout'];

          // No line name means no triangle to display in the grid.
          // Also, there's only one line in the set so we don't need to worry about this running each time.
          var realName = line.options.realName;
          if (realName === 'null' || _(metrics).contains(realName)) {
            this.parent.colorState = colorState = {};
            return;
          }

          var ident = (realName === 0) ? [0] : realName.split(','),
            rowid = $this.parent.determineId(columns, ident).replace('undefined', 'null'),
            rowidSelect = rowid.split('.').join('\\.') || 'null',
            triangleSelect = $('#{0} .triangle'.format(rowidSelect));


          if (!colorState[rowid]) {
            triangleSelect.css({
              'border-color' : '{0} transparent transparent {1}'.format(line.color, line.color),
              color : line.color
            });
            colorState[rowid] = {
              'active' : true,
              'color' : line.color,
              'chartElm' : [],
              'gridElm' : triangleSelect
            };
          } else {
            triangleSelect.css({'border-color' : 'transparent', 'color' : 'transparent'});
          }

          colorState[rowid].chartElm.push(line);

          if (line.legendItem) {
            $(line.legendItem.element).click(function() {
              $this.parent.changeColorState(rowid);
            });
          }
        };

        // Lets reset triangles then redraw what's left.
        // This allows a graceful hide when we reduce our chart lines.
        $('.triangle').css({'border-color' : 'transparent', 'color' : 'transparent'});

        var set = this.chart.chart.series;
        set = set.data || set;

        /* The api doesn't handle null members searches very well since it just runs IN searches for delineated
         * values. As a work around, we're checking to see if the returned data exists and displaying an error
         * message if it doesn't.
        */
        if (set.length) {
          _(set).each(consume, this);
          this.parent.colorState = colorState;
        } else {
          $('#chart_container').hide();
          $('#no-graph-possible').show();
        }
      },

      /**
       * handles color state change events
       * @param  {string} id row id.
       * @return {null}
       */
      changeColorState : function(id) {

        var $this = this;
        if (id == 'null') {
          id = '';
        }

        if (this.colorState[id]) {
          this.colorState[id].active = !this.colorState[id].active;
          _.each($this.colorState[id].chartElm, function(line) {
            try {
              // need to defer to next js callstack due to issues with highcharts event precidence
              _.defer(function() {
                line.setVisible($this.colorState[id].active);
              });
            } catch (e) {}
          });

          if (this.colorState[id].gridElm) {
            var color = this.colorState[id].active ? this.colorState[id].color : '#EEEEEE',
              colorRule = '{0} transparent transparent {0}'.format(color);

            this.colorState[id].gridElm.css('border-color', colorRule);
          }
        } else {
          this.colorState[id] = {active : true};
          this.buildChart();
        }
      },

      /**
       * highlights chosen metrics
       * @return {void}
       */
      highlightMetrics : function() {
        if (this.$scope) {
          var gridElement = this.$scope.getGridElement();
          _.each(this.chartParams.field, function(metric) {
            gridElement.jqGrid('highlightMetric', metric);
          });
        }
      },

      /**
       * handles chart hover events
       * @param  {object} e  event object.
       * @param  {string} id row id.
       * @return {void}
       */
      seriesHover : function(e) {
        // tack entity to metric
        /*var metric = 'Stat.{0}'.format(e.currentTarget.options.metric),
         ident = e.currentTarget.options.realName === 0 ? [0] : e.currentTarget.options.realName.split(','),
         rowid = this.determineId(this.chartParams.groups, ident);

         if (this.$scope && this.$scope.getGridElement) {
         if (e.type == 'mouseOver') {
         this.$scope.getGridElement().jqGrid('highlightCell', rowid, metric, true);
         } else if (e.type == 'mouseOut') {
         this.$scope.getGridElement().jqGrid('clearHighlightCell', rowid, metric, true);
         }
         }*/
      }
    };
  });

})(this, jQuery);
