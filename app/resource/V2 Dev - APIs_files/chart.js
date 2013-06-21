/**
* @TODO update this doc block to be accurate
* use the subclasses such as bigLineChart
*/

(function(root, $, undefined){
  'use strict';

  root.Highcharts.setOptions({
    global: {
      useUTC: false
    }
  });

  var chartScope = {};
  chartScope.appChart = Class.extend({
    init: function(target, type, tooltipFormat) {
      this.target = target;
      var container = $(target);
      this.nameMap = {};
      this.params = {
        colors        :  _.hasMembers(root, 'Highcharts', 'theme', 'colors') ? root.Highcharts.theme.colors : '',
        credits       : {enabled : false},
        chart         : {renderTo : container[0], height : 350, spacingLeft : 10, type : type},
        title         : {text : ''},
        exporting     : {enabled : false},
        series        : [],
        legend        : {enabled : true},
        tooltip       : {enabled : true, formatter : tooltipFormat, useHTML : true},
        marginBottom  : 0,
        spacingBottom : 5
      };
    },
    setLegendPos : function(_pos) {
      if (_pos) {
        this.params.legend.verticalAlign = _pos;
      }
    },
    render: function() {
      var $this = this;

      if (!this.checkActive()) {
        return;
      }

      this.params.chart.events = {'load' : $.proxy(this.triggerCallback, this)};

      if (this.params.yAxis) {
        this.params.yAxis.min = 0;
        if (this.params.yAxis[0]) {
          this.params.yAxis[0].min = 0;
        }

        if (this.params.yAxis[1]) {
          this.params.yAxis[1].min = 0;

        }
      }

      this.seriesEvent = this.seriesEvent || function() {};

      if (this.params.chart.type == 'pie') {
        _.each(this.params.series, function(serie) {
          _.each(serie.data, function(seg) {
            seg.events = {
              'mouseOver' : $this.seriesEvent,
              'mouseOut'  : $this.seriesEvent
            };
          });

        });
      } else if (this.params.chart.type == 'line' || this.params.chart.type == 'column') {
        _.each(this.params.series, function(serie) {
          if (serie.color) {
            var colorHex = serie.color.toUpperCase().replace('#', '');
            serie.marker = {
              symbol : 'url({0}img/markers/graphMarker_{1}.png)'.format(window.location.pathname, colorHex)
            };
          }

          serie.shadow = {color : serie.color};
          serie.events = {
            'mouseOver' : $this.seriesEvent,
            'mouseOut'  : $this.seriesEvent
          };

        });
      }

      var cont = true;
      if (_.isElement(this.target)) {
        if ($(this.target).length === 0) {
          cont = false;
        }
      }

      if (!cont) {
        return;
      }

      this.chart = new Highcharts.Chart(this.params);
    },

    setCallback : function(_callback, _context) {
      this.callback = _callback;
      this.callbackContext = _context;
    },

    triggerCallback : function(e) {
      var $this = this;
      if (!this.checkActive()) {
        return;
      }

      if (!this.chart) {
        //@TODO make this a proper observable
        setTimeout(function() { $this.triggerCallback(e); }, 10);
        return;
      }
      var fn = null;

      // assume we're coming from chartDisplay first
      if (_.isObject(this.callbackContext) && _.isString(this.callback)) {
        fn = $.proxy(this.callbackContext, this.callback);
      } else if (_.isObject(this.callbackContext && _.isFunction(this.callback))) {
        fn = $.proxy(this.callback, this.callbackContext);
      } else if (_.isFunction(this.callback)) {
        fn = this.callback;
      }

      if (fn) {
        fn(e);
      }

    },

    //name of series optional
    addSeries : function(data, name, obj) {
      if (_.indexOf(['line', 'column'], this.params.chart.type) > -1) {
        name = name.toString().split(',');
        var realNames = [];
        _.each(name, function(sec, k) {
          if (!sec) {
            name[k] = obj.metric || 'Unknown';
            realNames.push('null');
          } else {
            realNames.push(name[k]);
          }
        });
        name = name.join(',');
        obj.realName = realNames.join(',');
      }

      data = this.filterData(data, name, obj);
      obj = _.isObject(obj) ? obj : {};
      obj.data = data;
      obj.name = this.nameMap[name] ? this.nameMap[name] : name;
      obj.realName = obj.realName || name;
      obj.type = this.params.chart.type;
      this.params.series.push(obj);
    },

    //add a key / value store to the details stack
    addDetails : function(details) {
      this.details.push(details);
    },

    // convert Epoch time seconds to milliseconds
    filterData : function(data, name, obj) {
      var $this = this;

      if (_.isUndefined(this.params.xAxis)) return data; //no filtering of dates on non XY based charts
      for (var i = 0; i < data.length; i++) {
        for (var k = 0; k < data[i].length; k++) {
          // all values must be numeric!!
          if (k === 0 && this.params.xAxis.type === 'datetime') {
            data[i][k] = helperObj.mySqlDateTime(data[i][k]);
          }
          else if (data[i][k]) {
            if (data[i][k].replace) {
              data[i][k].replace(/[^0-9\.]+/g, '');
            }
            data[i][k] = Number(data[i][k]);
          }
          else {
            data[i][k] = 0;
          }
        }
      }

      // convert currency
      if (!_.isUndefined(obj.currency_index) && obj.currency_index !== false) {
        var currency = name.split(',')[obj.currency_index];
        // no need to convert USD
        if (currency !== 'USD') {
          _.each(data, function(val, k) {
            data[k] = val * $this.currencyRateMap[currency];
          });
        }
      }
      return data;
    },

    //add/replace multiple series at once that come php class Chart
    setSeries: function(series, seriesOptions) {
      _.each(series, $.proxy(function(v, k) {
        this.addSeries(v, k, _.clone(seriesOptions));
      }, this));

    },
    //replaces the xAxis labels
    setCategories: function(categories) {
      if (typeof(this.params.xAxis) == 'undefined') { return; }
      if (categories.length === 0) { return; }
      this.params.xAxis.categories = categories;
    },
    //replaces the series names pass {"series1":"newname1","series2":"newname2"} to remap names
    setSeriesNames: function(nameMap) {
      this.nameMap = nameMap;
    },

    /**
     * determines meta data necessary for chart data compliation
     * extends data object with metaData object including start & end points, start & end dates, interval, type
     * @return {void}
     */
    determineMetaData : function(data, params) {
      var startPoint = 0,
        endPoint = 0,
        type = 'string',
        interval = 0,
        startDate = params.data_start ? helperObj.parseDate(params.data_start) : new Date(),
        endDate = params.data_end ? helperObj.parseDate(params.data_end) : new Date(),
        timestamp = params.timestamp.split('.').pop();

      startDate.set({
        'minute' : -startDate.getMinutes(),
        'second' : -startDate.getSeconds(),
        'hour'   : -startDate.getHours()
      });

      switch (timestamp) {
        case 'hour':
          startPoint = 0;
          endPoint = 23;
          interval = 1;
          type = 'int';
          break;
        case 'datehour':
          endDate.setHours(24 - endDate.getHours());
          startPoint = startDate.getTime();
          endPoint = endDate.getTime();
          interval = 60 * 60 * 1000;
          type = 'datehour';
          break;
        case 'date':
          startPoint = startDate.getTime();
          endPoint = endDate.getTime();
          interval = 24 * 60 * 60 * 1000;
          type = 'date';
          break;
        case 'week':
          var st = moment(startDate).startOf('week'),
            ed = moment(endDate).startOf('week');
          startPoint = st.valueOf();
          endPoint = ed.valueOf();
          interval = 7 * 24 * 60 * 60 * 1000;
          type = 'week';
          break;
        case 'month':
          if (startDate.getFullYear() != endDate.getFullYear()) {
            startPoint = 1;
            endPoint = 12;
          } else {
            startPoint = startDate.getMonth() + 1;
            endPoint = endDate.getMonth() + 1;
          }
          interval = 1;
          type = 'int';
          break;
        case 'year':
          startPoint = startDate.getFullYear();
          endPoint = endDate.getFullYear();
          interval = 1;
          type = 'int';
          break;
      }

      var arrCount = (endPoint - startPoint) / interval, pointList = [];

      // initialize pointList with count of all interval points
      if (_.isNumber(arrCount)) {
        pointList = new Array(Math.ceil(arrCount));
      }

      data.metaData = {
        startPoint : startPoint,
        endPoint   : endPoint,
        interval   : interval,
        type       : type,
        pointList  : pointList,
        startDate  : startDate,
        endDate    : endDate,
        timestamp  : timestamp
      };

      // if we're looking at a single point, turn on series markers
      if (startPoint == endPoint) {
        $.extend(true, this.params, {'plotOptions' : {'series' : {'marker' : {'enabled' : true}}}});
      }
    },

    /**
     * processes stat data into format useful for charting
     * @param  {[type]} data   [description]
     * @param  {[type]} params [description]
     * @return {[type]}        [description]
     */
    processData : function(data, params, type) {
      if (data.processed) {
        return;
      }

      this.determineMetaData(data, params);

      var metrics = [];

      // setup containers
      data.seriesGroups = {};

      _.each(params.field, function(f) {
        f = f.split('.').pop();
        metrics[metrics.length] = f;
        data.seriesGroups[f] = {};
      });
      // pickme determines what id comprises
      var pickme = _.chain(params.groups)
          .reject(function(field) {
            return _.contains([
              'Stat.date',
              'Stat.hour',
              'Stat.datehour',
              'Stat.week',
              'Stat.month',
              'Stat.year'
            ], field);
          })
          .map(function(field) {
            return field.split('.').pop();
          })
          .value(),
        timestamp = data.metaData.timestamp;

      // loop through each row of data, and process into individual metric data lists
      _.each(data.data, function(row) {
        // id is used to link chart series to grid row
        var id = _.chain(row.Stat)
            .pick(pickme)
            .toArray()
            .value()
            .join(','),
          dateObj, timest;

        // no need to process date for pie chart types
        if (type !== 'pie') {
          switch (data.metaData.type) {
            case 'int':
              dateObj = timest = parseInt(row.Stat[timestamp], 10);
              break;
            case 'date':
              dateObj = helperObj.parseDate(row.Stat[timestamp]);
              timest = dateObj.getTime();
              break;
            case 'week' :
              dateObj = helperObj.parseWeek(row.Stat[timestamp]);
              timest = dateObj.getTime();
              break;
            case 'datehour' :
              dateObj = timest = helperObj.mySqlDateTime(row.Stat[timestamp]).getTime();
              break;
          }
        }
        _.each(metrics, function(metric) {
          var processed;
          if (_.isUndefined(data.seriesGroups[metric][id])) {
            data.seriesGroups[metric][id] = [];
          }

          // pie simply needs the value
          if (type == 'pie') {
            processed = row.Stat[metric];
            // line and bar require array of values : [date/time/hour value, metric, dateObj, timestamp]
          } else {
            processed = [
              row.Stat[timestamp],
              row.Stat[metric],
              dateObj,
              timest
            ];
          }

          data.seriesGroups[metric][id][data.seriesGroups[metric][id].length] = processed;

        });
      });
    },
    setLineSeriesData: function(data, params, yAxis, metaData) {
      var startPoint = metaData.startPoint,
        endPoint = metaData.endPoint,
        interval = metaData.interval,
        timestamp = metaData.timestamp,
        pointList;

      // loop through each series item, add to pointList
      _.each(data, function(series, key) {
        pointList = _.clone(metaData.pointList);

        _(series).chain()
          // reject dates not requested
          .reject(function(item) {
            return ( item[3] < startPoint || item[3] > endPoint );
          })
          // add to pointList
          .each(function(item) {

            var index = Math.ceil((item[3] - startPoint) / interval);
            pointList[index] = parseInt(item[1], 10);
          });

        // zerofill pointList
        data[key] = [];
        for (var i = 0, n = pointList.length; i < n; i++) {
          data[key][i] = pointList[i] || 0;
        }
      });

      var dateRange = endPoint - startPoint,
        tickInterval = interval,
        targetNum = $(this.target).width() < 800 ? 7 : 20;

      if (timestamp == 'datehour') {
        targetNum = $(this.target).width() < 800 ? 5 : 10;
        this.params.xAxis.min = startPoint;
        this.params.xAxis.max = endPoint;
      }

      if (dateRange === 0) {
        tickInterval = $(this.target).width() < 800 ? 4 : 2;
      }
      else if ((dateRange / targetNum) > interval) {
        tickInterval = Math.ceil(dateRange / targetNum);
      }
      this.params.xAxis.tickInterval = tickInterval;

      if (_.contains(root.Config.Enums.currencyFields, params.field)) {
        var currency_index = _.indexOf(params.group.split(','), 'currency_code');
        params.currency_index = (currency_index > -1) ? currency_index : false;
      }
      else {
        params.currency_index = false;
      }

      params = {pointStart : startPoint, pointInterval : interval, metric : params.metric, currency_index : params.currency_index};

      if (yAxis) {
        params.yAxis = yAxis.yAxis;
        /*_.each(data, function(v,k){
         data[k].color = '#FF0'; //$this.params.colors[k] ;
         });*/
      }

      this.setSeries(data, params);
    },

    // Leaving this tied to the graph output for now, but if we always use colors implemented in init, than this should point to this.params.colors
    getColors: function() {
      return $.proxy(helperObj.getColors, this)();
    },

    // Wraps load() so load can be used as a simple refresh with the same params
    fetchDataFromApi: function(apiUrl, apiArgs) {
      this.apiUrl = apiUrl;
      if (_.isUndefined(apiArgs) === false){
        this.apiArgs = apiArgs;
      }
      return this.load();
    },

    // Load Data From Api
    load: function() {
      var params = {};
      if (typeof(this.apiArgs) != 'undefined' && this.apiArgs) {
        $.extend(true,params,this.apiArgs);
      }
      return $(document).api(this.apiUrl,
        params,
        $.proxy(function(data){this.dataReturn(data,params);}, this)
      );
    },

    dataReturn:function (data,params) {
      if (!this.checkActive()){
        return ;
      }
      if(params.timestamp)
      {
        this.setLineSeriesData(data,params);
      }
      else
      {
        this.setSeries([data]);
      }

      this.render();

    },
    populateCurrencyRateMap : function(_data) {
      var $this = this;
      $this.currencyRateMap = {};
      _.each(_data.data, function(row)
      {
        if (row.currency_code !== 'USD' && row.currency_rate)
        $this.currencyRateMap[row.currency_code] = row.currency_rate;
      });
    },

    checkActive : function() {
      return true;

      /*
      @TODO check racecondition

      var $this = $(this.target),
        contData = $this.data('contData') ;
      if (!contData)
      {
        contData = $this.parents('.subcont') ;
        $this.data('contData', contData);
      }
      if (contData.length > 0)
      {
        if (contData.data('active'))
        {
          return true;
        }
      }
      return false;
      */
    }

  });

  //Base for line chart
  chartScope.LineChart = chartScope.appChart.extend({
    init: function(target, xAxisLabel, xAxisType, xAxisFormat, yAxisLabel, yAxisFormat, tooltipFormat) {
      this._super(target, 'line', tooltipFormat);
      this.params.xAxis = {title: {text: xAxisLabel}, labels: {formatter: xAxisFormat}};
      this.params.yAxis = {title: {text: yAxisLabel}, labels: {formatter: yAxisFormat}};
      if (xAxisType == 'datetime') {
        this.params.chart.zoomType = 'x';
        this.params.xAxis.maxZoom = 48 * 3600 * 1000;
        this.params.xAxis.type = 'datetime';
      } else {
        this.params.xAxis.allowDecimals = false;
      }
      this.params.yAxis.startOnTick = false;
    }
  });

  //Base for line chart
  chartScope.MultiLineChart = chartScope.appChart.extend({
    init: function(target, xAxisLabel, xAxisType, xAxisFormat, yAxisLabel, yAxisFormat, tooltipFormat, instructions) {
      var _this = this;
      this.lineStyles = instructions.lineStyles || ['solid', 'longdash', 'dot', 'dashdot'];
      this._super(target, 'line', tooltipFormat);
      this.params.xAxis = {title: {text: xAxisLabel}, labels: {formatter: xAxisFormat}};
      this.params.yAxis = [];

      _.each(yAxisLabel, function(yLab,k) {
        _this.params.yAxis.push({
          title : {text: yLab},
          labels : {formatter: yAxisFormat[k]},

          // Alternate the side for each y axis;
          opposite : (k + 1) % 2 == 0,
          lineWidth : k * 3 + 1,
          min : 0
        });
      });

      if (xAxisType == 'datetime') {
        this.params.chart.zoomType = 'x';
        this.params.xAxis.maxZoom = 48 * 3600 * 1000;
        this.params.xAxis.type = 'datetime';
      } else {
        this.params.xAxis.allowDecimals = false;
      }

      /*if(this.params.yAxis.length > 3) {
        _.each(this.params.yAxis, function(yx, i){

        });
        //this.params.chart.marginLeft = 90;
      }*/

      this.params.yAxis.startOnTick= false;
      this.instructions = instructions ;
    },
    render : function() {
      // add line width to each series and label
      var $this = this,
        axes = _.uniq(_.pluck($this.params.series, 'yAxis')),
        clrs = _.clone(this.params.colors),
        ids = _.uniq(_.pluck(this.params.series, 'realName')),
        colorSort = {},
        realName, ind ;

      // if available, determine color from grid data order
      if (_.hasMembers($this, 'callbackContext', 'data', 'data', 0, 'rowid')) {
        _.each($this.callbackContext.data.data, function(v,k) {
          ind = k;

          while (ind >= clrs.length) {
            ind -= clrs.length;
          }
          if (v.rowid) {
            realName = _.map(v.rowid.split('__'), function(spl) { return spl.split('--').pop();}).join(',');
          } else if (v.colorid) {
            realName = v.colorid;
          }

          if (!_.isUndefined(realName)) {
            colorSort[realName] = clrs[ind];
          }
        });
      }
      // populate based on internal color choices, assign in order
      else {
        _.each(this.params.series, function(v,k) {
          ind = k;
          while (ind >= clrs.length) {
            ind -= clrs.length ;
          }
          colorSort[v.realName] = clrs[ind];
        });
      }

      var cclr;

      $.each(this.params.series,function(k,v) {
        cclr = colorSort[v.realName];
        _.extend(v, {
          color : cclr,
          lineColor : cclr,
          dashStyle : $this.lineStyles[v.yAxis]
        });
      });
      this._super();
    }

  });

  //Base for column chart
  chartScope.ColumnChart = chartScope.appChart.extend({
    init: function(target, xAxisLabel, xAxisType, xAxisFormat, yAxisLabel, yAxisFormat, tooltipFormat)
    {
      this._super(target, 'column', tooltipFormat);
      this.params.xAxis = {title: {text: xAxisLabel}, labels: {formatter: xAxisFormat}};
      this.params.yAxis = {title: {text: yAxisLabel}, labels: {formatter: yAxisFormat}};
      if (xAxisType == 'datetime') this.params.xAxis.type = 'datetime';
      this.params.plotOptions = {series: {borderWidth: 0, marker: {enabled: false}}};
    } ,
    addSeries: function(data, name, obj) {
      data = _.map(data,$.proxy(function(serie)
      {
        if($.isArray(serie))
        {
          var name=this.nameMap[serie[0]]?this.nameMap[serie[0]]:serie[0];
          return {name:name===''?'No Name':name,y:serie[1],realName:serie[0]};
        }
        else return serie;
      },this));
      this._super(data, name, $.extend(obj,$.extend(true,{innerSize: '60%',size:'100%'},this.seriesOptions)));
    },
    dataReturn:function (data,params){
      if(params.timestamp)
      {
        this.setLineSeriesData(data,params);
      }
      else
      {
        var series = {};
        _.each(data,function(item)
        {
          series[item[0]+''] = [parseFloat(item[1])];
        });
        $(document).main.addError('series',dump(series),'debug');
        this.setSeries(series);
        this.params.xAxis.categories = [' '];
      }

      this.render();
    }

  });

  //Base for column chart
  chartScope.BarChart = chartScope.ColumnChart.extend({
    init: function(target, xAxisLabel, xAxisType, xAxisFormat, yAxisLabel, yAxisFormat, tooltipFormat) {
      this._super(target, xAxisLabel, xAxisType, xAxisFormat, yAxisLabel, yAxisFormat, tooltipFormat);
      this.params.chart.inverted = true;
    }
  });

  chartScope.PieChart = chartScope.appChart.extend({
    init: function(target, valueFormat, tooltipFormat) {
      this._super(target, 'pie', tooltipFormat);
      this.params.plotOptions = {pie: {
        showInLegend: true,
        dataLabels: {enabled: true, distance: -18, formatter: root.Formatter.formatValuePercent}}};
      this.params.chart.marginTop = 0;
      this.params.legend.align ='right';
      this.params.legend.verticalAlign = 'top';
      this.params.legend.borderColor = '#FFF';
      this.params.legend.layout = 'vertical';
      this.params.legend.x = -25;
      this.params.legend.floating = true;
      this.seriesOptions = {};
    },
    addSeries: function(data, name,obj) {
      var total = _.reduce(data,function(memo,serie){return memo + parseFloat(serie[1]);},0);
      data = _.map(data,$.proxy(function(serie)
      {
        var name=this.nameMap[serie[0]]?this.nameMap[serie[0]]:serie[0];
        return {name:name===''?'No Name':name,y:serie[1]/total,realName:serie[0],realY:serie[1]};
      },this));

      this._super(data, name, $.extend(obj,$.extend(true,{innerSize: '60%',size:'100%'},this.seriesOptions)));

    },
    getColors: function()
    {
      return $.proxy(helperObj.getColors, this)();
    },
    render: function() {
      this._super();
    }

  });

  chartScope.DualPieChart = chartScope.appChart.extend({
    init: function(target, valueFormat, tooltipFormat) {
      this._super(target, 'pie', tooltipFormat);
      this.params.plotOptions = {
        pie: {
          showInLegend: true,
          dataLabels: {enabled: true, distance: -18, formatter: root.Formatter.formatValuePercent}
        }
      };
      this.params.chart.marginTop = 0;
      this.params.legend.align ='right';
      this.params.legend.verticalAlign = 'top';
      this.params.legend.borderColor = '#FFF';
      this.params.legend.layout = 'vertical';
      this.params.legend.x = -25;
      this.params.legend.floating = true;
      this.params.legend.itemStyle = { 'font-size': '14px', 'line-height' : '18px' };
      this.params.legend.labelFormatter = function()
      {
        if (this.series.options.colorIndex === 0)
        {
          return this.config.name || this.field;
        }
        return null;
      };
      this.seriesOptions = {'id' : 'dualpie'};
    },
    addSeries: function(data, name, obj) {
      var sizeObj = (obj.sizeObj) ? obj.sizeObj : {size : '100%'};
      this._super(data, name, $.extend(obj,$.extend(true,sizeObj,this.seriesOptions)));
    },
    setSeries: function(series, seriesOptions, params) {
      var $this = this,
        data = [],
        opts = $.extend({}, seriesOptions,params),
        color,
        total,
        ck = 0,
        reduceFn = function(memo,serie)  {
          return memo + parseFloat(serie[0]);
        };

      // convert to currency if necessary
      if (_.indexOf(root.Config.Enums.currencyFields, seriesOptions.field) > -1) {
        var currency_index = _.indexOf(seriesOptions.group.split(','), 'currency_code'),
          currency;

        if (currency_index > -1) {
          _.each(series, function(serie, k) {
            currency = serie[0].split(',')[currency_index];
            // no need to convert USD
            if (currency !== 'USD')  {
              series[k][1] = series[k][1] * $this.currencyRateMap[currency];
            }
          });
        }
      }

      total = _.reduce(series,reduceFn, 0);

      _.each(series,function(v,k) {
        var dat = {
          'name' : $this.nameMap[k],
          'field' : opts.name,
          'y':v[0]/total,
          'realName':k,
          'realY' : v[0],
          'metric' : seriesOptions.field
        };

        if (ck > $this.params.colors.length) {
          ck -= $this.params.colors.length;
        }

        color = $this.params.colors[ck];

        if (opts.colorIndex > 0) {
          color = Highcharts.Color(color).brighten(0.15 * opts.colorIndex).get();
          opts.showInLegend = false;
        }

        if (color) {
          dat.color = color;
        }

        data.push(dat);
        ck++;
      });
      $this.addSeries(data, '', opts);
    },

    getColors: function() {
      return $.proxy(helperObj.getColors, this)();
    },

    render: function() {
      // resize container if legend is lengthy
      var increase, targ,
        maxlen = _.chain(this.params.series)
              .first()
              .find( function(v,k) { if (k == 'data') return true; } )
              .pluck('name')
              .map( function(val){ try { return val ? val.length : 0; }catch(e){ return 0; }} )
              .max()
              .value();

      if (maxlen > 30) {
        increase = (maxlen - 30) * 7;
        targ = $(this.target);
        this.params.chart.marginLeft -= increase;
        targ.width(targ.width() + increase);
      }

      var indent = -20;
      if (this.params.series.length === 1) {
        indent = -50;
      } else if (this.params.series.length ===2) {
        indent = -25;
      }

      var fmat = function() {
        var disp = parseInt(this.percentage,10);
        if (disp > 0) {
          return disp + '%';
        }
        return '' ;
      };

      this.params.plotOptions = _.extend(this.params.plotOptions || {}, {'pie': {'showInLegend': true, 'dataLabels': {'color':'#000', 'style':{ 'fontWeight' : 'bold'}, 'distance': indent, 'formatter' : fmat}}});
      this._super();
    }

  });

  /**
  * Usage:
  *
  * @param string   target      = the id of the DOM element to render to
  * @param string   xAxisLabel  = the name of the xaxis or null for no label
  * @param string   xAxisType   = 'datetime' for grouping by dates, anything else ignored http://www.highcharts.com/ref/#xAxis--type
  * @param function xAxisFormat = one of the callback functions below such as formatString, root.Formatter.formatCurrency, root.Formatter.formatInteger
  * @param string   yAxisLabel  = the name of the axis label, null for none
  * @param function yAxisFormat = one of the callback functions below
  *
  * var myChart = new bigLineChart(target, xAxisLabel, xAxisType, xAxisFormat, yAxisLabel, yAxisFormat);
  * myChart.addSeries();
  * myChart.render();
  *
  */
  chartScope.bigLineChart = chartScope.LineChart.extend({
    init: function(target, xAxisLabel, xAxisType, xAxisFormat, yAxisLabel, yAxisFormat, tooltipFormat) {
      this._super(target, xAxisLabel, xAxisType, xAxisFormat, yAxisLabel, yAxisFormat, tooltipFormat);
      this.params.chart.marginBottom = 80;
      this.params.plotOptions.series.lineWidth = 4;
      this.params.legend = {verticalAlign: 'bottom', align:'left', borderWidth: 0, symbolWidth:0, labelFormatter : function() { return ''; /*<span style="color:' + this.color + ';display:inline-block;width:20px;height:20px;">Text</span>';*/ }};
    }
  });

  // two axis line chart
  chartScope.bigMultiLineChart = chartScope.MultiLineChart.extend({
    init: function(target, xAxisLabel, xAxisType, xAxisFormat, yAxisLabel, yAxisFormat, tooltipFormat, instructions) {
      this._super(target, xAxisLabel, xAxisType, xAxisFormat, yAxisLabel, yAxisFormat, tooltipFormat, instructions);
      this.params.chart.marginBottom = 80;
      this.params.legend = {verticalAlign: 'bottom', align:'left', borderWidth: 0, symbolWidth:0, labelFormatter : function() { return ''; /*<span style="color:' + this.color + ';display:inline-block;width:20px;height:20px;">Text</span>';*/ }};
    }
  });

  chartScope.bigDualPieChart = chartScope.DualPieChart.extend({
    init: function(target, valueFormat, tooltipFormat, params){
      this._super(target, valueFormat, tooltipFormat);
      this.params.chart.height = 350;
      $.extend(true, this.params,params||{});
    }
  });

  var helperObj = {
    /**
     * determines x-axis label formatting
     * @param  {string} interval interval field
     * @return {object}          x-axis params
     */
    determineLabelFormat : function(interval) {
      var  xAxisType = 'integer', xAxisLabel,xAxisFormat ;
      switch(interval.split('.').pop()) {
        case 'hour':
          xAxisLabel = 'Hour of Day';
          xAxisFormat = root.Formatter.formatHour;
          break;
        case 'datehour':
          xAxisType = 'datetime';
          xAxisLabel = 'Hour';
          xAxisFormat = root.Formatter.formatDateHour;
          break;
        case 'date':
          xAxisType = 'datetime';
          xAxisLabel = 'Date';
          xAxisFormat = root.Formatter.formatDate;
          break;
        case 'week':
          xAxisLabel = 'Week of Year';
          xAxisFormat = root.Formatter.formatWeek;
          break;
        case 'month':
          xAxisLabel = 'Month of Year';
          xAxisFormat = root.Formatter.formatMonth;
          break;
        case 'year':
          xAxisLabel = 'Year';
          xAxisFormat = root.Formatter.formatString;
      }

      return {
        xAxisType : xAxisType,
        xAxisLabel : xAxisLabel,
        xAxisFormat : xAxisFormat
      };
    },

    /**
     * parses date from yyyy-MM-dd to javascript date object
     * @param  {string} dateStr yyyy-MM-dd formatted string
     * @return {object}         date object
     */
    parseDate : function(dateStr) {
      var m = dateStr.match(/([0-9]{4})\-([0-9]{2})\-([0-9]{2})/);
      return new Date(m[1], m[2] - 1, m[3], 0, 0, 0);
    },

    /**
     * parses individual week out of number
     * @param  {string} weekStr comes in the format yyyyww
     * @return {string}         returns ww
     */
    parseWeek : function(weekStr) {
      var m = weekStr.match(/([0-9]{4})([0-9]{2})/),
        d = new Date(m[1], 0, 1, 0, 0, 0).add(Number(m[2])).weeks();
      return d;
    },

    /**
     * converts mysql datetime string to js date object
     * @param  {string} _time Y-m-d H:i:s
     * @return {Date}       js date object
     */
    mySqlDateTime : function(_time) {
      var parts = _time.split(/[\- :]/),
        newDate;

      // could have been date or timestamp
      if (parts.length == 3) {
        newDate = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        newDate = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
      }
      return newDate;
    },

    getColors : function(chart) {
      // we can call this from a multitude of locations
      chart = chart || this.chart || this;
      var colors = {};

      _.each(chart.series, function(val) {
        colors[val.options.realName] = val.color;
      });

      return colors;
    }
  };

  var createTooltipHead = function(label, color) {
    if (label && label !== 'null') {
      var template = '<td class="rowLabel"><span style="background-color: {1};"></span> {0}</td>';
      label = (label == 'organic') ? label.titleCaps() : label;
      return template.format(label, color);
    }
    return '';
  };

  var tooltips = {
    CustomTitle : function() {
      var ret,
          rows = [],
          data = {},
          columns = [],
          maxSeriesCount = 15,
          headerTemplate = '<tr><td>{1}</td>{0}</tr>',
          xlabel = '',
          labelMap = {};

      labelMap = {
        conversions : 'conv',
        impressions : 'impr'
      };

      _.each(this.points, function(_this) {
        var xformat, yformat, header, label = '';

        xformat = _this.series.xAxis.tooltipFormatter ||
                  _this.series.xAxis.options.labels.formatter ||
                  root.Formatter.formatString;

        yformat = _this.series.yAxis.tooltipFormatter ||
                  _this.series.yAxis.options.labels.formatter ||
                  root.angular.noop;

        header = createTooltipHead(_this.series.name, _this.series.color, xformat(_this.x));
        data[_this.series.name] = data[_this.series.name] || {title : header, rows : {}};

        if (_.hasMembers(_this, 'series', 'yAxis', 'axisTitle', 'textStr')) {
          label = _this.series.yAxis.axisTitle.textStr.toLowerCase();
          if (labelMap[label]) {
            label = labelMap[label];
          }
        }

        // xlabel only needs to be calculate once for all of the points
        if (!xlabel) {
          xlabel = xformat(_this.x);
        }

        // columns will contain each unique label ie [clicks, payout, impr, conv]
        if (!_.contains(columns, label)) {
          columns.push(label);
        }

        data[_this.series.name].rows[label] = yformat(_this.y);
      });

      _.each(data, function(row) {
        var rowData = '',
            rowTemplate = '<tr>{0}{1}</tr>';

        _.each(columns, function(col) {
          rowData += '<td class="columnValue">{0}</td>'.format(row.rows[col] || '');
        });

        rows.push(rowTemplate.format(row.title, rowData));
      });

      columns = _.reduce(columns, function(memo, col) {
        return memo +'<td>' + col + '</td>';
      }, '');

      var header = headerTemplate.format(columns, xlabel);
      var footer = '';

      if (rows.length > maxSeriesCount) {
        footer = '<tr><td class="foot" colspan="5">and {0} more...</td></tr>'.format(rows.length - maxSeriesCount);
        rows = rows.slice(0, maxSeriesCount);
      }

      ret = '<table class="tooltip_content"><thead>{0}</thead><tbody>{1}</tbody><tfoot>{2}</tfoot></table>';
      return ret.format(header, rows.join(''), footer);
    },

    BarCustom : function(xformat, yformat) {
      //TODO: fix this so it works with shared tooltips on.
      return String(
        (this.series.name && this.series.name !== 'null' ? this.series.name + ':' : '') +
           ' <strong>' + yformat(this.y) + '</strong>');
    },

    PieCustom : function(yformat) {
      var field = this.point.field.toLowerCase();
      var isCurrencyField = _.contains(root.Config.Enums.currencyFields, this.point.field);
      yformat = isCurrencyField ? root.Formatter.formatCurrency : root.Formatter.formatNumber;
      var pointNameFormat = createTooltipHead(this.point.name);

      var ret = '<table class="tooltip_content">{0}<tr><td>{1}%</td><td>{2}: {3}</td></tr></table>';
      return ret.format(pointNameFormat, this.point.percentage.toFixed(2),
                        this.point.field, yformat(this.point.options.realY));
    }
  };

  // chart display processes data and renders charts based on various parameters

  chartScope.chartDisplay = Class.extend({
    nameMap : {},
    displayNum : 5,

    init : function(_location, _type, _api,
                    _data, _params, _dataCallback,
                    _chartCallback, _displayNum,
                    _seriesEvent, _parent) {
      // populate vars
      this.location = _location;
      this.api = _api;
      this.data = _data;
      this.chartParams = _params;
      this.type = _type;
      this.chart = null;
      this.dataCallback = _dataCallback;
      this.chartCallback = _chartCallback;
      this.parent = _parent;
      if (_displayNum) { this.displayNum = _displayNum; }
      if (_seriesEvent) { this.seriesEvent = _seriesEvent; }

      if (this.api) {
        // process into chart
        this.determineNameMap();
        this.determineLabelFormat();
      }

      //this.determineFilter();
      this.buildChart();
    },

    getChart : function() {
      return this.chart;
    },

    triggerChartCallback : function(_ret) {
      if (_.isFunction(this.chartCallback)) {
        this.chartCallback.apply(this, []);
      }
    },

    triggerDataCallback : function(_ret) {
      if (_.isFunction(this.dataCallback)) {
        this.dataCallback(_ret);
      }
    },

    determineLabelFormat : function() {
      if (this.chartParams.timestamp) {
        var xAxisFormats = helperObj.determineLabelFormat(this.chartParams.timestamp);
        this.xAxisType = xAxisFormats.xAxisType;
        this.xAxisLabel = xAxisFormats.xAxisLabel;
        this.xAxisFormat = xAxisFormats.xAxisFormat;
      }
    },

    determineNameMap : function() {
      var data = this.data,
        define = this.parent.$scope.getDefinition(),
        nameMap = {};

      // pickme determines what id comprises
      var pickIds = _.chain(this.chartParams.groups)
          .reject(function(field) {
            var rejectFields = ['Stat.date', 'Stat.hour', 'Stat.datehour', 'Stat.week', 'Stat.month', 'Stat.year'];
            return _.contains(rejectFields, field);
          })
          .map(function(field) {
            return field.split('.').pop();
          })
          .value();

      var pickVals = _.chain(pickIds)
          .clone()
          .map(function(field) {
            var entity = field.split('_');
            entity.pop();
            entity = root.Formatter.titleCaps(entity.join('_'));

            var replace = {
              'OfferFile.name' : 'OfferFile.display'
            };
            if (replace[entity + '.name']) {
              return replace[entity + '.name'];
            }
            return (define.related_entities[entity]) ? entity + '.name' : entity;
          })
          .value();
      // loop through each row of data, and process into individual metric data lists

      _.each(data.data, function(row) {
        // id is used to link chart series to grid row
        var id = _.chain(row.Stat)
            .pick(pickIds)
            .toArray()
            .value()
            .join(','),
          val = _.chain(row)
            .map(function(vals, entity) {

              var ret = [];
              _.each(pickVals, function(pkField) {
                pkField = pkField.split('.');
                if (pkField[0] == entity) {
                  ret.push(vals[pkField[1]]);
                }
              });
              return ret;
            })
            .flatten()
            .compact()
            .value();
        nameMap[id] = val.length > 0 ? val.join(' - ') : '';
        row.chartName = id;
      });

      this.nameMap = nameMap;
    },

    getColors : function() {
      return this.getChart().getColors();
    },
    formatSingleName : function(_field) {
      return (_field == 'ad_clicks_unique') ? 'Clicks' : _field.replace('_', ' ').ucFirst();
    },

    /**
     * gets api data and processes to useable form
     * @param  {Function} callback callback function when data processed
     * @return {void}
     */
    getAndProcessData : function(callback) {
      var $this = this;
      if ($this.api) {
        $this.api(this.chartParams).success(function(retData) {
          if (retData.response && retData.response.data) {
            retData = retData.response.data;
          }
          if (retData.errors) {
            throw new Error(retData.errors.toString());
          }
          $this.chart.processData(retData, $this.chartParams, $this.type);
          callback(retData);
        });
      } else if ($this.data) {

        $this.chart.processData($this.data, $this.chartParams, $this.type);
        callback($this.data);
      }
    },

    determineTooltipFormatters: function(series) {
      if (!this.chartParams || !series) {
        return;
      }

      if (series.xAxis && this.chartParams.xAxisTooltipFormatter) {
        series.xAxis.tooltipFormatter = this.chartParams.xAxisTooltipFormatter;
      }
      if (series.yAxis && this.chartParams.yAxisTooltipFormatter) {
        series.yAxis.tooltipFormatter = this.chartParams.yAxisTooltipFormatter;
      }
    },

    buildChart : function() {
      var $this = this,
        data = this.data,
        columns = this.columns,
        nameMap = this.nameMap;

      // add titles to override here
      var titles = {};
      var yAxisFormat = {}, parms;

      parms = _.clone(this.chartParams);
      this.determineLabelFormat();
      if (this.parent.$scope.getDefinition) {
        this.determineNameMap();
        nameMap = this.nameMap;
      }

      var xAxisType = this.xAxisType,
        xAxisLabel = this.xAxisLabel,
        xAxisFormat = this.xAxisFormat;

      var collByField = {}, i = 0, reqs;

      _.each(parms.field, function(fld) {
        var isCurrencyField = _.contains(root.Config.Enums.currencyFields, fld);
        fld = fld.split('.').pop();

        collByField[fld] = {
          parms   : _.clone($this.chartParams),
          yFormat : isCurrencyField ? root.Formatter.formatCurrency : root.Formatter.formatNumber,
          title   : titles[fld] ? titles[fld] : root.Formatter.titleCaps(fld),
          yax     : i
        };

        collByField[fld].parms.metric = fld;

        delete(collByField[fld].parms.options);
        i++;
      });

      switch (this.type) {
        case 'line':
          var instructions = {appendLabel : true};
          if (this.chartParams.lineStyles) {
            instructions.lineStyles = this.chartParams.lineStyles;
          }

          $this.chart = new chartScope.bigMultiLineChart(
            $this.location,
            '',
            xAxisType,
            xAxisFormat,
            _.pluck(collByField, 'title'),
            _.pluck(collByField, 'yFormat'),
            function() {
              return root.ChartFactory.getTooltip('CustomTitle').apply(this,
                $this.determineTooltipFormatters(this.series)
              );
            },
            instructions
          );

          $this.chart.populateCurrencyRateMap(data);
          if ($this.seriesEvent) { $this.chart.seriesEvent = $this.seriesEvent; }
          $this.chart.setCallback('triggerChartCallback', $this);
          $this.chart.setSeriesNames(nameMap);

          $this.getAndProcessData(function(retData) {
            _.each(retData.seriesGroups, function(seriesData, metric) {
              var name = collByField[metric] && collByField[metric].title ? collByField[metric].title : '';
              var lps = { name : name, yAxis : collByField[metric].yax };
              $this.chart.setLineSeriesData(seriesData, collByField[metric].parms, lps, retData.metaData);
            });

            try {
              $this.triggerDataCallback(retData);
              $this.chart.render();
            } catch (e) { console.log(e); }
          });

          break;

        case 'pie' :
          $this.chart = new chartScope.bigDualPieChart(
            this.location,
            _.first(_.pluck(collByField, 'yFormat')),
            function() {
              return root.ChartFactory.getTooltip('PieCustom')
                .apply(this, [_.first(_.pluck(collByField, 'yFormat'))]);
            },
            { chart : { marginLeft : collByField.length > 1 ? -350 : -250, marginTop : 10 } }
          );

          $this.chart.populateCurrencyRateMap(data);
          if ($this.seriesEvent) { $this.chart.seriesEvent = $this.seriesEvent; }
          $this.chart.setCallback('triggerChartCallback', $this);
          reqs = {};

          // remove timestamp grouping interval
          this.chartParams.groups = _.reject(this.chartParams.groups, this.parent.rejectGroups);
          this.chart.setSeriesNames(nameMap);

          var cbfLen = _.size(collByField),
            ratio = 100 / cbfLen,
            ind = 0;

          $this.getAndProcessData(function(retData) {
            _.each(retData.seriesGroups, function(seriesData, metric) {
              var sizeObj,
                indRev = cbfLen - (ind + 1);
              if (cbfLen == 1) {
                sizeObj = {size : '100%'};
              }
              else if (cbfLen == 2) {
                sizeObj = (indRev === 0) ? {'size' : '60%'} : {'size' : '100%', 'innerSize' : '61%'};
              }
              else {
                sizeObj = {size : '{0}%'.format(ratio * (indRev + 1))};
                if (indRev > 0) sizeObj.innerSize = '{0}%'.format(ratio * indRev + 1);
              }
              var lps = { name : collByField[metric].title, sizeObj : sizeObj, colorIndex : ind };
              $this.chart.setSeries(seriesData, collByField[metric].parms, lps);
              ind++;

            });
            try {
              $this.triggerDataCallback(retData);
              $this.chart.render();
            } catch (e) {console.log(e);}
          });

          break;

        case 'bar':
          yAxisFormat = _.first(_.pluck(collByField, 'yFormat'));

          $this.chart = new chartScope.ColumnChart(
            this.location,
            '',
            xAxisType,
            xAxisFormat,
            '',
            yAxisFormat,
            function() {
              return root.ChartFactory.getTooltip('CustomTitle')
                .apply(this, $this.determineTooltipFormatters([xAxisFormat, yAxisFormat]));
            }
          );

          $this.chart.populateCurrencyRateMap(data);

          if ($this.seriesEvent) {
            $this.chart.seriesEvent = $this.seriesEvent;
          }

          if (_.size(nameMap) == 1) {
            nameMap[_.first(_.keys(nameMap))] = _.first(_.pluck(collByField, 'title'));
          }

          this.chart.setSeriesNames(nameMap);
          this.chart.setCallback('triggerChartCallback', $this);

          $this.getAndProcessData(function(retData) {
            _.each(retData.seriesGroups, function(seriesData, metric) {
              var lps = {name : collByField[metric].title, yAxis : collByField[metric].yax};
              $this.chart.setLineSeriesData(seriesData, collByField[metric].parms, lps, retData.metaData);
            });

            try {
              $this.triggerDataCallback(retData);
              $this.chart.render();
            } catch (e) {
              console.log(e);
            }
          });
          break;
      }
    }
  });

  // create global namespace and access to create charts, chartDipslay from above
  root.ChartFactory = {
    // only allow the following charts
    types : [
      'BarChart',
      'PieChart',
      'DualPieChart',
      'bigLineChart',
      'bigMultiLineChart',
      'bigDualPieChart'
    ],

    /**
     * Allows us to pass in arbitrary arguments via apply
     * @param  {object} constructor   one of the chart objects listed
     * @param  {array} args        arguments needed to construct chart
     * @return {object}             chart object
     */
    construct : function(constructor, args) {
      var F = function() {
        return constructor.apply(this, args);
      };
      F.prototype = constructor.prototype;

      return new F();
    },

    /**
     * direct access to the allowed chart objects
     * @param {mixed arguments} pass in whatever arguments needed for requested chart
     * @return {object} chart type
     */
    getChart : function() {
      var args = _.toArray(arguments),
        type = args.shift();

      if (!_.contains(this.types, type)) {
        throw new Error('Chart type ' + type + ' not currently supported');
      }

      return this.construct(chartScope[type], args);
    },

    /**
     * access to chartDisplay object
     * @param {mixed arguments} pass in arguments needed by chartDisplay object
     * @return {object} chartDisplay object
     */
    chartDisplay : function() {
      var args = _.toArray(arguments);
      return this.construct(chartScope.chartDisplay, args);
    },

    /**
     * getter for tooltip functions
     * @param  {string} tipName name of funciton to grab
     * @return {function}         tooltip function requested
     */
    getTooltip : function(tipName) {
      if (!_.has(tooltips, tipName)) {
        throw new Error('Tooltip ' + tipName + ' does not exist');
      }
      return tooltips[tipName];
    },

    /**
     * returns helperObj
     * @return {object} chart helper methods
     */
    getHelper : function() {
      return helperObj;
    }
  };

})(this, jQuery);
