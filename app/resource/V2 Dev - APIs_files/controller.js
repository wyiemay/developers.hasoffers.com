/**
 * HasTable
 * A minimalist data driven grid element.
 *
 * Events:
 *  'tableRenderComplete'
 *    :(name) - The name of the hasTable element.
 *    Broadcasts after the table has been rendered and events have been attached to the DOM.
 *
 *  'pagingChanged'
 *    :(paging object)
 *    Broadcasts when any paging information changes.
 *
 *  'sortRequested'
 *    :(sortField) - The data-sort attribute value of the sort header.
 *    Broadcasts after a field with the data-sort attribute has been clicked.
 *
 *  'rowClicked'
 *   :(rowScope) - The scope used to generate the row.
 *   Broadcasts when any tr element in the table is clicked.
 */


(function(root, $, undefined) {
  'use strict';

  var app = root.angular.module('hasOffers.hasTable');

  app.controller('hasTable', [
    '$scope',
    '$element',
    '$attrs',
    'directiveRegistry',
    '$compile',
    '$q',
    '$http',
    '$templateCache',
    'dataRenderer',
    function($scope, $element, $attrs, directiveRegistry, $compile, $q, $http, $templateCache, dataRenderer) {

      var templates,
        setTemplate,
        getSortField,
        applySortFieldsToRow,
        notifySortClick,
        notifyRowClick,
        applyShowFilters;

      /*
       * Setup functionality.
       */
      templates = {};
      setTemplate = function(type, url) {
        $q.when($templateCache.get(url) || $http.get(url, {'cache' : true})).then(function(result) {
          templates[type] = result.data || result;
        }, function() {
          throw new Error('template for ' + url + ' not found in cache or on the server.');
        });
      };

      if (!$attrs.name) {
        throw new Error('No name specified for table.');
      }

      // Set header template if it exists.
      if (!$attrs.headerTemplate) {
        setTemplate('header', $attrs.name + 'HeaderTemplate.tpl');
      } else {
        setTemplate('header', $attrs.headerTemplate);
      }

      // Set row template, if it exists.
      if (!$attrs.rowTemplate) {
        setTemplate('row', $attrs.name + 'RowTemplate.tpl');
      } else {
        setTemplate('row', $attrs.rowTemplate);
      }

      // Don't expose the table until the templates are loaded.
      $scope.$watch(function() {
        return templates.row && templates.header;
      }, function(res) {
        if (res) {
          directiveRegistry.register($scope, $attrs.name);
        }
      });

      if ($attrs.paging) {
        $scope.pagingEnabled = $scope.$eval($attrs.paging);
      } else {
        $scope.pagingEnabled = true;
      }

      $scope.paging = $scope.paging || {
        'count'     : 0,
        'page'      : 1,
        'pageCount' : 1,
        'pageSize'  : 10
      };

      // Sort field is set by the consumer or when a sort click is registered.
      $scope.sort = {
        'field': '',
        'direction': ''
      };

      /**
       * drawTable method
       * Handles the data returned from a successful dataCall. Renders the table and sets paging data.
       *
       * @param data Object or array of data to be rendered.
       * @param params Additional information stored with the scope as the 'params' member.
       */
      $scope.drawTable = function(data, params) {
        var template, tbody, header, outRows;

        header = $element.find('.hasTableHeaderRow').first().html(templates.header);

        var tableData = data.data || data;

        dataRenderer.renderSingleTemplate($scope, header, params);

        var sortField = getSortField(header, header.scope());

        template = templates.row;
        tbody = $element.find('tbody').first();
        tbody.html(' ');
        if (_.isArray(tableData) && !tableData.length) {
          $scope.paging.page = 1;
          $scope.paging.pageCount = 1;
          $scope.paging.count = 0;
          $scope.noData = true;
          $scope.tableDataNumRows = 0;
          return;
        } else {
          $scope.noData = false;
          $scope.tableDataNumRows = tableData.length;
        }

        var compiledRows = dataRenderer.renderTemplateItems(tableData, $scope, template, params);
        outRows = [];

        _(compiledRows).each(function(row) {
          var rowScope = row.scope();

          row.find('[data-show]').each(function(index, element) {
            applyShowFilters(element, rowScope);
          });
          applySortFieldsToRow(sortField, row, rowScope);
          outRows.push(row);
        });

        tbody.append(outRows);

        _(outRows).each(function(row) {
          $scope.$broadcast('rowRendered', row);
        });

        tbody.find('> tr').click(notifyRowClick);
        $scope.$broadcast('tableRenderComplete', $attrs.name);

        if ($scope.pagingEnabled) {
          $scope.paging.page = data.page;
          $scope.currentPage = data.page;
          $scope.paging.count = data.count;
          $scope.paging.pageCount = data.pageCount;
        }
      };

      getSortField = function(head, scope) {
        var field = null;
        $(head).find('> th').each(function(index) {
          var $this = $(this);

          if (applyShowFilters($this, scope)) {
            // We hid the field, nothing left to do.
            return;
          }

          var sort = $this.data('sort') ? true : false;
          if (sort) {
            var fieldInfo = {
              'index'     : index,
              'sortField' : $this.data('sort')
            };

            $this.addClass('sortable');

            var sortIcon = 'icon-sort';
            if ($scope.sort.field === fieldInfo.sortField) {
              $this.addClass('sorted-column');
              field = fieldInfo;
              if ($scope.sort.direction) {
                sortIcon += $scope.sort.direction === 'asc' ? '-up' : '-down';
              }
            }

            $this.append('<i class="{0} table-sort-icon"></i>'.format(sortIcon));

            $this.click(notifySortClick);
          }
        });
        return field;
      };

      notifySortClick = function() {
        var requestedSort = $(this).data('sort');
        if ($scope.sort.field === requestedSort) {
          $scope.sort.direction = $scope.sort.direction === 'desc' ? 'asc' : 'desc';
        }
        $scope.sort.field = requestedSort;
        $scope.$broadcast('sortRequested');
      };

      notifyRowClick = function() {
        $scope.$broadcast('rowClick', angular.element(this).scope());
      };

      applySortFieldsToRow = function(sortField, row) {
        if (!sortField) {
          return;
        }
        var cell = $(row).find('td')[sortField.index];
        $(cell).addClass('sorted-column');
      };

      /**
       * Evaluates the data-show attribute on an element and removes the element from the DOM
       * if the eval statement fails.
       *
       * @param element A jquery object representing a dom element.
       * @param scope  The angular scope used as an eval context.
       * @returns {boolean} Whether or not the element was removed.
       */
      applyShowFilters = function(element, scope) {
        var element = angular.element(element),
            show = element.data('show');

        if (show && !scope.$eval(show)) {
          element.remove();
          return true;
        }
        return false;
      };
    }
  ]);

})(this, jQuery);
