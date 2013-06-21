/**
 * displays pixel/postback grid
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.pixelPostback',
    ['$scope', 'models', '$routeParams', 'directiveRegistry',
      function($scope, models, $routeParams, directiveRegistry) {

        var offerPixelModel = models.get('offerPixel');

        var fetchTableData = function() {
          var params = {
            'fields' : [
              'id',
              'type',
              'code',
              'status',
              'offer_id',
              'Offer.name'
            ],
            'sort'    : {},
            'page'    : $scope.table.paging.page,
            'limit'   : $scope.table.paging.pageSize,
            'filters' : {},
            'contain' : ['Offer']
          };

          if (_($scope).hasMembers('table', 'sort', 'field')) {
            params.sort[$scope.table.sort.field] = $scope.table.sort.direction;
          } else {
            params.sort = {'Offer.name' : 'desc'};
          }

          if ($routeParams.offer_id) {
            params.filters['Offer.id'] = $routeParams.offer_id;
          }

          $scope.incrementLoading();
          offerPixelModel.getOfferPixelData(params).success(function(data) {
            $scope.decrementLoading();
            ($scope.table.drawTable || $scope.table.addItems)(data, params);
          });
        };

        var setupMobile = function() {
          directiveRegistry.onDirectivesReady(['pixelsTableMobile'], function() {
            $scope.table = directiveRegistry.get('pixelsTableMobile');

            fetchTableData();
            $scope.table.$on('moreItemsRequested', function() {
              fetchTableData();
            });

            $scope.table.$on('refresh', function() {
              fetchTableData();
            });

            $scope.table.$on('rowRendered', function(localScope, row) {
              row.find('.delete-button').click(function() {
                $scope.deletePixel(row.scope().OfferPixel.id);

                $scope.$on('pixelDeleted', function() {
                  row.slideUp();
                });

              });
            });
          });
        };

        var setupDesktop = function() {
          directiveRegistry.onDirectivesReady('pixelsTable', function() {
            $scope.table = directiveRegistry.get('pixelsTable');
            fetchTableData();

            $scope.sortDir = 'desc';
            $scope.sortField = 'Offer.name';
            $scope.table.sort.field = $scope.sortField;
            $scope.table.sort.direction = $scope.sortDir;

            $scope.table.$on('refresh', function() {
              fetchTableData();
            });

            $scope.table.$on('pagingChanged', function() {
              fetchTableData();
            });

            $scope.table.$on('sortRequested', function() {
              $scope.sortField = $scope.table.sort.field;
              $scope.sortDir = $scope.table.sort.direction;
              fetchTableData();
            });

            $scope.table.$on('tableRenderComplete', function() {
              $('div[name="pixelsTable"]').find('.delete-button').each(function() {
                var $this = $(this);
                $this.click(function() {
                  $scope.deletePixel($this.data('pixelId'));

                  $scope.$on('pixelDeleted', function() {
                    $this.parents('tr').slideUp();
                  });
                });
              });
            });
          });
        };

        if ($scope.isMobile) {
          setupMobile();
        } else {
          setupDesktop();
        }

        /**
         * handles on grid complete bindings
         * @return {void}
         */
        $scope.onGridComplete = function() {
          $('.offer-pixel-delete').unbind('click');

          $('.offer-pixel-delete').click(function(e) {
            e.stopPropagation();
            $scope.deletePixel($(e.currentTarget).data('id'));
          });
        };

        /**
         * handles delete click event
         * @param  {int} id OfferPixel id.
         * @return {void}
         */
        $scope.deletePixel = function(id) {
          offerPixelModel.deleteOfferPixel({'id' : id}).success(function() {
            $scope.addSuccess('offerPixelDeleteMsg', 'Offer pixel successfully deleted');
            ($scope.generateTable || angular.noop)();
            $scope.$broadcast('pixelDeleted', id);
          });
        };

        /**
         * adds success message for offer pixel creation
         * @return {void}
         */
        $scope.pixelAdded = function() {
          $scope.addSuccess('offerPixelDeleteMsg', 'Offer pixel successfully created');
        };
      }
  ]);

})(this, jQuery);
