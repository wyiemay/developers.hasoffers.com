/* adgroup performance widget */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.Widgets.adgroupPerformance',
    ['$scope', '$q', 'chartService', '$rootScope', '$timeout', 'models',
      function($scope, $q, chartService, $rootScope, $timeout, models) {

    var dateFormat = 'YYYY-MM-DD',
      compareStart = moment().subtract(7, 'days').format(dateFormat),
      compareEnd = moment().format(dateFormat),
      againstStart = moment().subtract(14, 'days').format(dateFormat),
      model = models.get('adGroups');

    var params = {
        'fields': ['Stat.ad_campaign_id', 'Stat.conversions', 'Stat.clicks', 'Stat.payout'],
        'groups': ['Stat.ad_campaign_id'],
        'data_start': compareStart,
        'data_end': compareEnd,
        'sort': {'Stat.conversions' : 'desc'},
        'limit': 3
      },
      metaParams = {
        'fields': ['id', 'name', 'type', 'width', 'height']
      },
      compareData,
      againstData,
      metaData;

    $scope.list = [];
    $scope.noDataAvailable = false;
    $scope.adgroupPerformanceLoaded = false;

    // gather data

    // step one, determine the top three ad groups from the comparison group
    model.getAdGroupsPerformance(params).success(function(_compareData) {
        compareData = _compareData;

        // if no data exists, display default message
        if (_.isUndefined(compareData.data) || _.size(compareData.data) === 0) {
          $scope.noDataAvailable = true;
          $scope.adgroupPerformanceLoaded = true;
          return;
        }

        // determine ids for previous week's filter and meta Data filter
        var filterIds = _.chain(compareData.data)
                  .map(function(row) {
                    return row.Stat.ad_campaign_id;
                  }).unique().value();

        // update params for call to compare against
        params.data_start = againstStart;
        params.data_end = compareStart;
        params.filter = {
          'Stat.ad_campaign_id': {
            'conditional': 'EQUAL_TO',
            'values' : filterIds
          }
        };
        params.fields = ['Stat.ad_campaign_id', 'Stat.conversions'];

        // create filter for metaParams
        metaParams.filters = {
          'OR' : _.map(filterIds, function(id) {
            return {'AdCampaign.id' : {'EQUAL_TO' : id}};
          })
        };

        // When these two calls are complete,
        // set local var and trigger populateList
        $q.all([
          model.getAdGroupData(metaParams),
          model.getAdGroupsPerformance(params)
        ]).then(function(returnedData) {
          $scope.adgroupPerformanceLoaded = true;
          metaData = returnedData[0];
          againstData = returnedData[1];
          populateList();
        });
      });

    /**
     * processes data into angular consumable list
     */
    var populateList = function() {
      var list = [];

      // loop through compareData
      _.each(compareData.data, function(row) {
        // determine againstRow
        var againstRow = $.extend(true,
            // default values when againstRow not found
            {'Stat' : {'id' : 0, 'conversions' : 0}},
            _.find(againstData.data.data, function(agRow) {
                return agRow.Stat.ad_campaign_id === row.Stat.ad_campaign_id;
              }) || {}
          ),
          //determine metaRow
        // sets up default values when AdCampaign doesn't exist
          metaRow = $.extend({'AdCampaign': {'id': 0, 'name': '', 'type': '', 'width': '', 'height': ''}},
            _.find(metaData.data, function(metRow) {
              return metRow.AdCampaign.id === row.Stat.ad_campaign_id;
            }) || {}
          ),
          // only need to append size information for banner type
          typeTpl = metaRow.AdCampaign.type === 'banner' ? '{0} [{1}x{2}]' : '{0}',
          perfTpl = '{0}%',
          perfDir = 'positive',
          perfChange;

        if (!_.isUndefined(againstRow.Stat) && Number(againstRow.Stat.conversions) !== 0) {
          // determine percentage of change
          var convDiff = (row.Stat.conversions - againstRow.Stat.conversions);
          perfChange = ((convDiff/ againstRow.Stat.conversions) * 100).toFixed(2);

          if (againstRow.Stat.conversions > row.Stat.conversions) {
            perfDir = 'negative';
          } else if (againstRow.Stat.conversions === row.Stat.conversions) {
            perfDir = 'no-change';
          }
        } else {
          perfChange = 'No Change';
          perfTpl = '{0}';
          perfDir = 'no-change';
        }

        // populate to our array
        list.push({
          'id' : row.Stat.ad_campaign_id,
          'name' : metaRow.AdCampaign.name,
          'type' : typeTpl.format(root.Formatter.titleCaps(metaRow.AdCampaign.type, true),
              metaRow.AdCampaign.width,
              metaRow.AdCampaign.height
          ),
          'conversions' : row.Stat.conversions || 0,
          'clicks' : row.Stat.clicks || 0,
          'payouts' : row.Stat.payout || 0,
          'direction' : perfDir,
          'difference' : perfTpl.format(perfChange)
        });

        var spark_params = {
          'type': 'spark',
          'color': '#444444',
          'fillColor': '#e9e9e9',
          'width': '140',
          'height': '30'
        };

        if (perfDir === 'positive') {
          params.color = '#2585c7';
          params.fillColor = '#d9ecf5';
        }

        var dummyData = [199, 455, 25, 92, 42, 109, 438];
        $timeout(function() {
          chartService.buildChart({'data': dummyData, 'params': spark_params},
                                  $rootScope.$new(),
                                  'spark-adgroup-performance');
        });

      });

      // set to scope
      $scope.list = list;
    };
  }]);

})(this, jQuery);
