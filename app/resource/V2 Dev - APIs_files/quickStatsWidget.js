/* quick stats widget */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.Widgets.quickStats',
    ['$scope', '$q', 'chartService', '$timeout','models', function($scope,
                                                                   $q,
                                                                   chartService,
                                                                   $timeout,
                                                                   models) {

    // gather start and end dates for the api calls
    var today = moment(),
      oneWeekAgo = moment().startOf('day').subtract(1, 'week'),
      twoWeeksAgo = moment().startOf('day').subtract(2, 'weeks'),
      yearStart = moment().startOf('year'),
      lastYearStart = moment().subtract(1, 'year').startOf('year'),
      lastYearEnd = moment().startOf('day').subtract(1, 'year'),

      // api parameter objects
      weekParams = {
        'fields': [
          'Stat.impressions',
          'Stat.clicks',
          'Stat.conversions',
          'Stat.payout'
        ],
        'data_start': twoWeeksAgo.format('YYYY-MM-DD'),
        'data_end': today.format('YYYY-MM-DD'),
        'groups': ['Stat.date'],
        'sort': {'Stat.date' : 'asc'}
      },

      ytdParams = {
        'fields': ['Stat.payout'],
        'data_start': yearStart.format('YYYY-MM-DD'),
        'data_end': today.format('YYYY-MM-DD'),
        'groups': ['Stat.date'],
        'sort': {'Stat.date' : 'asc'}
      },

      lytdParams = {
        'fields': ['Stat.payout'],
        'data_start': lastYearStart.format('YYYY-MM-DD'),
        'data_end': lastYearEnd.format('YYYY-MM-DD')
      },

      // containers for data
      weekData,
      yearData,
      lastYearData,
      ytdTotal = 0,
      ytdData = [],
      model = models.get('statsReport');

    // scope variable to show/hide loading/display
    $scope.quickStatsLoaded = false;
    $scope.currentYear = today.format('YYYY');

    var weekDataPromise = model.getReportData(weekParams).then(function(_weekData) {
      weekData = _weekData;
    });
    var yearDataPromise = model.getReportData(ytdParams).then(function(_yearData) {
      yearData = _yearData;
    });
    var lastYearPromise = model.getReportData(lytdParams).then(function(_lastYearData) {
      lastYearData = _lastYearData;
    });
    // wait for all api requests
    $q.all([weekDataPromise, yearDataPromise, lastYearPromise]).then(function() {
      var tw = [], // this week
        lw = [], // last week
        reduceFn = function(memo, num) {
          return memo + Number(num);
        };

      // break out the week/week data into individual arrays
      _.each(weekData.data.data, function(day) {
        if (moment(day.Stat.date, 'YYYY-MM-DD').diff(oneWeekAgo) > 0) {
          tw.push(day.Stat);
        } else {
          lw.push(day.Stat);
        }
      });

      _.each(yearData.data.data, function(day) {
        var payout = parseFloat(day.Stat.payout);
        ytdTotal += payout;
        ytdData.push(payout);
      });

      var days = today.diff(oneWeekAgo, 'days'),
        ytdDays = today.diff(yearStart, 'days'),
        stats = ['impressions', 'clicks', 'payout', 'conversions', 'payoutytd'];

      // loop through each stat
      _.each(stats, function(wh) {
        /// treat payout ytd data differently
        if (wh == 'payoutytd') {
          $scope[wh] = {
            'count' : ytdTotal,
            'lastCount' : (lastYearData.data.data.length > 0) ? Number(lastYearData.data.data[0].Stat.payout) : 0,
            'direction' : 'positive',
            'data' : []
          };

          // Account for days with no stats, display a 0 for those days
          for (var i = 0; i <= ytdDays; i++) {
            $scope[wh].data[i] = 0;
          }
          _.each(yearData.data.data, function(day) {
            var index = moment(day.Stat.date, 'YYYY-MM-DD').diff(yearStart, 'days');
            $scope[wh].data[index] = parseFloat(day.Stat.payout);
          });
        } else {
          $scope[wh] = {
            'count' : _.chain(tw).pluck(wh).reduce(reduceFn, 0).value(),
            'lastCount' : _.chain(lw).pluck(wh).reduce(reduceFn, 0).value(),
            'direction' : 'positive',
            'data' : []
          };

          // Account for days with no stats, display a 0 for those days
          for (var j = 0; j <= days; j++) {
            $scope[wh].data[j] = 0;
          }

          _.each(tw, function(day) {
            var index = moment(day.date, 'YYYY-MM-DD').diff(oneWeekAgo, 'days');
            $scope[wh].data[index] = parseFloat(day[wh]);
          });
        }

        if (_.isNull($scope[wh].lastCount) || $scope[wh].lastCount === 0) {
          $scope[wh].difference = 'No Data';
          $scope[wh].direction = 'no-change';
        } else {
          var diff = $scope[wh].count - $scope[wh].lastCount;
          $scope[wh].difference =  ((diff / $scope[wh].lastCount) * 100).toFixed(2) + '% change';
          if ($scope[wh].lastCount >= $scope[wh].count) {
            $scope[wh].direction = $scope[wh].lastCount == $scope[wh].count ? 'no-change' : 'negative';
          }
        }
      });

      $timeout(function() {
        root.angular.element('.quickstats p').textfill({maxFontPixels: 28});
        $('.with-tooltip').tooltip({placement: 'right'});
      });

      // add decimal places for payout stats
      $scope.payoutytd.count = Number($scope.payoutytd.count).toFixed(2);
      $scope.payout.count = Number($scope.payout.count).toFixed(2);

      // show stats/hide loader
      $scope.quickStatsLoaded = true;
    });
  }]);
})(this, jQuery);
