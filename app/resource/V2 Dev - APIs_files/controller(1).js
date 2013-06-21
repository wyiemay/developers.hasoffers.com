(function(root, $, undefined) {
  'use strict';

  var app = root.angular.module('hasOffers.hasTable');

  app.controller('hasTableMobile',
    [
      '$scope',
      '$element',
      '$attrs',
      'directiveRegistry',
      '$compile',
      '$q',
      '$http',
      '$templateCache',
      'dataRenderer',
      '$timeout',
      function($scope,
               $element,
               $attrs,
               directiveRegistry,
               $compile,
               $q,
               $http,
               $templateCache,
               dataRenderer,
               $timeout) {

        var items = [], templates, setTemplate;

        /*
         * Setup functionality.
         */
        templates = {};
        setTemplate = function(type, url) {
          $q.when($templateCache.get(url) || $http.get(url, {'cache' : true})).then(function(result) {
            templates[type] = result.data || result;
          }, function() {
            throw new Error('Template for ' + url + ' not found in cache or on the server.');
          });
        };

        if (!$attrs.name) {
          throw new Error('No name specified for table.');
        }

        // Don't expose the table until the templates are loaded.
        $scope.$watch(function() {
          return templates.main;
        }, function(res) {
          if (res) {
            var el = $(res);

            // We have to have the correct dom structure in our template to continue.
            if (!el.children('.card-header').length) {
              throw new Error('Template for ' + $attrs.name + ' does not have a .card-header section.');
            }

            if (!el.children('.card-body').length) {
              throw new Error('Template for ' + $attrs.name + ' does not have a .card-body section.');
            }

            directiveRegistry.register($scope, $attrs.name);
          }
        });

        setTemplate('main', $attrs.template);

        // Leaving this here for now so we can do easier testing. It may eventually control the actual paging info
        // on the infinite scroll.
        $scope.paging = $scope.paging || {
          'count'     : 0,
          'page'      : 1,
          'pageSize'  : 50
        };

        $scope.clearItems = function() {
          $element.find('.mobile-table-data').html(' ');
          items = [];
          $scope.paging.page = 1;
        };


        /**
         * Renders each element in an array of data with the initialized template
         * and appends the completed set to the table body. Each template rendered receives the parent scope
         * as well as each member of the data element. Any params passed are added as the _params member of the
         * template scope.
         *
         * @param data {Object | Array} - The data to be rendered.
         * @param params {Any} - Any additional parameters to be used when rendering each row.
         */
        $scope.addItems = function(data, params) {
          var el = $element.find('.mobile-table-data').first();

          $scope.noData = false;
          $scope.paging.count = data.count || data.length;

          if (!$scope.paging.count) {
            $scope.noData = true;
            return;
          }

          data = data.data || data;

          // We defer the rendering here to ease up the cpu power needed on mobile devices. The number of bindings
          // in some templates will cause the table to choke for a moment when rendering large payloads. We'll
          // section out the data and render it in chunks so the user can see some results almost immediately.
          var renderStep = 25;
          var chunks = _.range(Math.ceil(data.length / renderStep));

          _(chunks).each(function(i) {
            var start = i * renderStep;
            var end = start + renderStep;
            $timeout(function() {
              renderData(el, data.slice(start, end), params);
            }, 60);
          });
        };

        $scope.requestMoreItems = function() {
          $scope.paging.page++;
          $scope.$broadcast('moreItemsRequested');
        };

        $scope.getItemsRemaining = function() {
          return Math.max($scope.paging.count - items.length, 0);
        };

        var renderData = function(el, data, params) {
          var outRows = dataRenderer.renderTemplateItems(data, $scope, templates.main, params);
          el.append(outRows);

          _(outRows).each(function(row) {
            // We need a way to conditionally remove elements from the template.
            // ui-if creates an isolate scope when used which creates lots of issues with click handling
            // later. As a result, we need to use the data-show attribute on a given element instead.
            // These 4 lines evaluate that attribute against the row scope.
            var $row = angular.element(row);
            var rowScope = row.scope();
            $row.find('[data-show]').each(function(index, item) {
              applyShowFilter(angular.element(item), rowScope);
            });

            // This simply toggles the card body when the header is clicked.
            if (!row.data('noToggle')) {
              row.find('.card-header').click(function() {
                var $this = $(this).toggleClass('on'),
                    cardBody = $(this).siblings('.card-body').toggleClass('on');
                    
                notifyItemExpansion(this, cardBody.hasClass('on'));
              });
            } else {
              el.find('.card-header').addClass('on');
              el.find('.card-body').addClass('on');
            }

            items.push(row);
            $scope.$broadcast('rowRendered', row);
          });
        };

        var notifyItemExpansion = function(el, isOpen) {
          $scope.$broadcast('itemExpansion', angular.element(el).scope(), isOpen);
        };

        var applyShowFilter = function(el, scope) {
          var show = el.data('show');
          if (!scope.$eval(show)) {
            el.remove();
          }
        };
      }
    ]);
})(this, jQuery);
