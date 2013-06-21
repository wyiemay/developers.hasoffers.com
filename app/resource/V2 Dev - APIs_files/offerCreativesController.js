/**
 * displays offer creatives
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.offerCreatives',
    ['$scope', '$routeParams', 'models', 'directiveRegistry', function($scope, $routeParams, models, directiveRegistry) {


    // define private vars
    var model = models.get('offerFile'),
      define = model.getOfferFileDefinition(),
      allowedTypes = {}, // allowed creative file types
      gridElement, // grid element
      cbInstances = {}; // copy button instances

    $scope.offerCreatives = [];

    // determine allowed types
    _.each(define.fields.type.values, function(name, key) {
      if (_.indexOf(['image banner', 'flash banner', 'email creative', 'text ad', 'html ad', 'file'], key) > -1) {
        allowedTypes[key] = name;
      }
    });

    // formatters for grid
    var formatStatColumn = function(cellvalue, options, rowObject) {
      if (rowObject.Stat && (rowObject.Stat.ctr || rowObject.Stat.erpc || rowObject.Stat.cr)) {
        return '<span>{0}</span>'.format([
            rowObject.Stat.ctr ? '{0}%'.format(rowObject.Stat.ctr) : '<em>N/A</em>',
            rowObject.Stat.erpc ? root.currency.formatCurrency(rowObject.Stat.erpc, 'USD') : '<em>N/A</em>',
            rowObject.Stat.conversion_revenue ? '{0}%'.format(rowObject.Stat.conversion_revenue) : '<em>N/A</em>'
          ].join('</span><span>')
        );
      } else {
        return '<em>[ no stats available ]</em>';
      }
    };

    var formatDisplayColumn = function(cellvalue, options, rowObject) {
      if (_.indexOf(['image banner', 'flash banner'], rowObject.type) > -1) {
        return '<a class="offerfile-launch-modal" data-id="{0}">{1}</a>'.format(rowObject.id, cellvalue);
      } else {
        return cellvalue;
      }
    };

    var formatTypeColumn = function(cellvalue, options, rowObject) {
      var ret = [allowedTypes[cellvalue]];
      if (rowObject.width && rowObject.height) {
        ret.push('<div>{0}x{1}</div>'.format(rowObject.width, rowObject.height));
      }
      return _.compact(ret).join(',');
    };

    var formatPlacementColumn = function(cellvalue, options, rowObject) {
      var getCode = '<a class="btn offerfile-get-code" data-id="{0}">Get Code</a>',
        download = '<a class="btn offerfile-download" href="download/offer_file/{0}" target="_blank">Download</a>',
        adgroup = '<a class="btn offerfile-adgroup" data-id="{0}">Ad Group</a>',
        codeInput = '<input type="text" class="offerfile-code-input" id="offerfile-code-{0}" value="{1}" />',
        codeCopy = '<div style="position:relative" id="offerfile-code-copy-container-{0}">' +
          '<a class="offerfile-code-copy btn btn-copy" data-id="{0}"' +
          'id="offerfile-code-copy-{0}"><i class="icon-copy"></i></a></div>',
        codeCancel = '<a class="offerfile-code-cancel btn btn-cancel"><i class="icon-remove"></i></a>',
        ret = ['<div class="offerfile-codecell"><span class="offerfile-buttons">'];

      if(rowObject.code || rowObject.CreativeCode) {
        ret.push(getCode.format(rowObject.id));
      }

      if (rowObject.type !== 'text creative') {
        ret.push(download.format(rowObject.id));
      }

      if (_.indexOf(['image banner', 'flash banner'], rowObject.type) > -1) {
        ret.push(adgroup.format(rowObject.id));
      }
      ret.push('</span><span class="offerfile-code">');
      ret.push('<table class="offerfile-code-container" id="offerfile-code-container-{0}"><tr><td>'.format(rowObject.id));
      ret.push(codeInput.format(rowObject.id, ''));
      ret.push('</td><td>{0}</td><td>{1}</td></tr></table></span></div>'.format(
        codeCopy.format(rowObject.id),
        codeCancel
      ));
      return ret.join('');
    };

    /**
     * gets private definition var
     * @return {object} offerFile entity defintion.
     */
    $scope.getDefinition = function() {
      return define;
    };

    /**
     * determines column model for grid
     * @return {object} columns for grid.
     */
    $scope.getColumnModel = function() {
      var colModel = {
        'type' : {
          'formatter' : formatTypeColumn
        },
        'display' : {
          'name' : 'Name / Preview',
          'formatter' : formatDisplayColumn
        },
        'Stat.ctr' : {
          'name'      : 'CTR / EPC / CR',
          'formatter' : formatStatColumn,
          'cssClass'  : 'offerfile-stat-column'
        },
        'placement' : {
          'name'      : 'Placement Options',
          'formatter' : formatPlacementColumn,
          'cssClass'  : 'offerfile-placement-column',
          'width'     : '330px'
        }
      };

      _.each(colModel, function(obj, key) {
        if (!obj.name) {
          obj.name = model.determineNicename(key, define);
        }
      });
      return colModel;
    };

    // Isolate data call used to generate the creatives data table.
    var fetchTableData = function() {
      var params = {
        'fields' : [
          'id',
          'width',
          'height',
          'url',
          'code',
          'CreativeCode.id',
          'Stat.erpc',
          'Stat.ctr',
          'type',
          'placement',
          'display'
        ],
        'page'    : 1,
        'limit'   : 10,
        'filters' : $scope.processUserFilters(),
        'sort'    : {'id' : 'desc'},
        'contain' : {0 : 'Stat', 1 : 'CreativeCode'}
      };


      model.getCreatives(params).success(function(data) {
        if ($scope.isMobile) {
          $scope.table.addItems(data);
        }
      });
    };

    /**
     * returns additional fields to request
     * @return {object} field list.
     */
    $scope.getExtraFields = function() {
      return {
        'id'              : 'id',
        'Stat.erpc'       : 'Stat.erpc',
        'width'           : 'width',
        'height'          : 'height',
        'CreativeCode.id' : 'CreativeCode.id',
        'url'             : 'url',
        'code'            : 'code'
      };
    };

    /**
     * callback for grid data change
     * @param  {object} event jquery event object.
     * @param  {object} data  api data return.
     * @return {void}
     */
    $scope.gridDataChange = function(event, data) {
      $scope.creativeData = data;
    };

    /**
     * callback to store local var with table element
     * @param {object} element jquery selector object.
     */
    $scope.setGridElement = function(element) {
      gridElement = element;
    };

    /**
     * callback for grid complete
     * @return {void}
     */
    $scope.onGridComplete = function() {
      // bind functions to grid markup
      $('.offerfile-code-copy, .offerfile-launch-modal, ' +
        '.offerfile-get-code, .offerfile-code-cancel, .offerfile-adgroup').unbind('click');
      $('.offerfile-code-input').unbind('focus');
      gridElement.find('.offerfile-launch-modal').click($scope.launchModal);
      gridElement.find('.offerfile-code-input').focus($scope.getCode);
      gridElement.find('.offerfile-get-code').click($scope.getCode);
      gridElement.find('.offerfile-code-cancel').click($scope.hideCode);
      gridElement.find('.offerfile-adgroup').click($scope.launchAdgroup);

      _.each($scope.creativeData.data, function(row) {
        $('#offerfile-code-{0}'.format(row.id)).val(row.code || row.CreativeCode);
      });

      // clean old instances
      _.each(cbInstances, function(inst) {
        inst.destroy();
      });

      // need to delay because the copy entities are not visible yet, making the clipboard elements height=0,width=0
      _.delay(function() {
        _.each($('.offerfile-code-copy'), function(me) {
          var clip = new root.ZeroClipboard.Client(),
              id = $(me).data('id'),
              el = $('#offerfile-code-{0}'.format(id));

          // sets text from user selection or full value
          clip.addEventListener('onMouseOver', function() {
            var selected = el.caret().text;
            if (selected === '') {
              selected = el.val();
            }
            clip.setText(selected);
            $(me).tooltip('show');
          });

          clip.addEventListener('onMouseOut', function() {
            /**
             * @TODO - can probably revert once angular-ui bootstrap is upgraded
             *
             * removed
             *  $(me).tooltip('hide');
             * /removed
             *
             * hacky fix follows
             */
            // HACKY FIX for .tooltip('hide') not working correctly
            var $tooltip = $(me).siblings('.tooltip');

            // remove bootstrap .in to fade out
            $tooltip.removeClass('in');

            // wait a bit then hide so doesn't obscure button below
            _.delay(function() {
              $tooltip.hide();
            }, 200);

            // /HACKY FIX
          });

          clip.addEventListener('onComplete', function() {
            // set new tooltip text
            $(me).attr('title', 'Copied!').tooltip('fixTitle').tooltip('show');

            // revert after 2 second delay
            _.delay(function() {
              $(me).attr('title', 'Copy to Clipboard').tooltip('fixTitle');
            }, 2000);

            // add copied class, then immediately remove, triggering css transition
            el.addClass('copied');
            _.defer(function() { el.removeClass('copied');});

          });

          clip.glue('offerfile-code-copy-{0}'.format(id), 'offerfile-code-copy-container-{0}'.format(id));

          $(me).bind('hover', function() {
            clip.reposition();
          }).tooltip({
            'placement' : 'right',
            'title'     : 'Copy to Clipboard',
            'trigger'   : 'manual'
          });

        });
      }, 2000);
    };

    /**
     * returns api readable "contain" params
     * @return {object} api contain params.
     */
    $scope.getDefaultContainParams = function() {
      return {0 : 'Stat', 1: 'CreativeCode'};
    };

    /**
     * returns default sort for column
     * @return {string} field and dir.
     */
    $scope.getDefaultSort = function() {
      return 'id desc';
    };

    /**
     * returns reference to model method used to get data
     * @return {function} data retriever.
     */
    $scope.getDataCall = function() {
      return function() {
        var promise = model.getCreatives.apply(model, arguments);

        promise.success(function(data) {
          $scope.offerCreatives = [];
          _.each(data.data, function(value) {
            $scope.offerCreatives.push(value);
          });
        });
        return promise;
      };
    };

    /**
     * processes chosen filters into api understandable object
     * @return {object}
     */
    $scope.processUserFilters = function() {
      var filter = {
        'OfferFile.type' : _.keys(allowedTypes)
      };

      if ($routeParams.offer_id) {
        filter['OfferFile.offer_id'] = [$routeParams.offer_id];
      }
        /*"file",
        "image banner",
        "flash banner",
        "email creative",
        "offer thumbnail",
        "text ad",
        "html ad",
        "xml feed"*/
      return filter;
    };

    /**
     * returns api readable filters from selectedFilters
     * @return {object} api filters.
     */
    $scope.getDefaultFilter = function() {
      return $scope.processUserFilters();
    };

    /**
     * returns start date
     * @return {string} date in format YYYY-mm-dd.
     */
    $scope.getStartDate = function() {
      return '2007-01-01';
    };

    /**
     * returns end date
     * @return {string} date in format yyyy-MM-dd.
     */
    $scope.getEndDate = function() {
      return Date.today().toString('yyyy-MM-dd');
    };

    /**
     * handle launching of modal
     * @param  {object} e jquery event object.
     * @return {void}
     */
    $scope.launchModal = function(e) {
      var id = $(e.currentTarget).data('id');

      var offers = [],
          offer = {},
          current_index = 0,
          max_index = 0;

      // Reduce down to a list of offers that have an attached image or flash banner
      offers = _.filter($scope.offerCreatives, function(o) {
        return (_.indexOf(['image banner', 'flash banner'], o.OfferFile.type) > -1);
      });

      max_index = offers.length - 1;
      _.each(offers, function(o, key) {
        if (o.OfferFile.id == id) {
          offer = o;
          current_index = key;
        }
      });
      $scope.$parent.offerCreativeModal.scope.offers = offers;
      $scope.$parent.offerCreativeModal.scope.offer = offer;
      $scope.$parent.offerCreativeModal.scope.current_index = current_index;
      $scope.$parent.offerCreativeModal.scope.max_index = max_index;
      $scope.$parent.offerCreativeModal.scope.$digest();
      $scope.$parent.offerCreativeModal.show();
    };

    /**
     * displays selectable code for creative file
     * @param  {object} e jquery event object.
     * @return {void}
     */
    $scope.getCode = function(e) {
      var elm = $(e.currentTarget);
      var creativeId = elm.data('id');

      var params = _({
        'id' : creativeId,
        'offer_id' : $scope.offerId,
        'tracking_url' : $scope.trackingLink
      }).extend($scope.trackingLinkParams);


      model.getCreativeCode(params).then(function(data) {
        $('#offerfile-code-' + creativeId).val(data.data.CreativeCode);
      });
      elm.parents('div').addClass('code').scrollTop(0);
    };

    $scope.hideCode = function(e) {
      var elm = $(e.currentTarget);
      elm.parents('div').removeClass('code');
    };

    /**
     * triggers adgroup display for creative file
     * @param  {object} e jquery event object or an id.
     * @return {void}
     */
    $scope.launchAdgroup = function(e) {
      var id = e;

      if (e && e.currentTarget) {
        id = $(e.currentTarget).data('id');
      }

      var offerFile = _.find($scope.creativeData.data, function(row) {
        return row.id == id;
      });

      $scope.$parent.adgroupSelectModal.scope.offerFile = offerFile;
      $scope.$parent.adgroupSelectModal.scope.generateTable();
      $scope.$parent.adgroupSelectModal.show();
    };

    // Add method reference to my parent so my sibiling (offerCreativeModal) can call
    $scope.$parent.launchAdgroup = $scope.launchAdgroup;

    $scope.cancelGridLoad = true;

    $scope.$parent.$watch('offerLoaded', function(_new, _old) {
      if (_new && _new !== _old) {
        _.defer(function() {
          $scope.generateTable();
        });
      }
    });

    var setupMobile = function() {
      directiveRegistry.onDirectivesReady(['creativesTableMobile'], function() {
        $scope.table = directiveRegistry.get('creativesTableMobile');

        fetchTableData();

        $scope.table.$on('moreItemsRequested', function() {
          fetchTableData();
        });
      });
    }

    if ($scope.isMobile) {
      setupMobile();
    }

  }]);

})(this, jQuery);
