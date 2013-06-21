/*
 * messages controller
 */

(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.messages',
    ['$scope', '$location', '$routeParams', 'models', 'directiveRegistry',
      function($scope, $location, $routeParams, models, directiveRegistry) {

    // Used when viewing a single message at /message/{id}
    $scope.message_id = $routeParams.message_id;
    $scope.message = {};
    $scope.$watch('message_id', function() {$scope.loadMessage();});

    var model = models.get('messages');

    $scope.loadMessage = function() {
      if ($scope.message_id) {
        model.getMessage($scope.message_id, $scope);
      }
    };

    $scope.deleteThisMessage = function() {
      if ($scope.message_id) {
        var promise = $scope.dismissMessage($scope.message_id, $('#message-single .message'));
        promise.success(function() {
          $location.url('/messages/');
        });
      }
    };

    /**
     * Helper function to delete an alert
     * Sends API request and then hides the element representing the
     * alert if the API request was successful
     *
     * @param {int} alert_id The alert id.
     * @param {Object} element jQuery object containing the alert.
     * @return {Object} $http promise.
     */
    $scope.dismissMessage = function(alert_id, element) {
      if (_(element).isString()) {
        element = angular.element('#'+element);
      }

      element.addClass('delete_in_progress');
      var promise = model.dismissMessage(
        {'alert_id': alert_id},
        $scope
      );

      promise.success(function(response) {
        if (response != 'false' && response) {
          element.slideUp('slow');
        } else {
          element.removeClass('delete_in_progress');
        }
      });
      return promise;
    };

    $scope.showDeleteConfirm = function($event, element) {
      if (_(element).isString()) {
        element = angular.element('#'+element);
      }

      element.find('.primary-delete').hide();
      element.find('.confirm-group').show();

      $event.stopPropagation();
    };

    $scope.hideDeleteConfirm = function($event, element) {
      if (_(element).isString()) {
        element = angular.element('#'+element);
      }

      element.find('.primary-delete').show();
      element.find('.confirm-group').hide();

      $event.stopPropagation();
    };

    var updateTable = function() {
      var params = {
        'sort'   : {},
        'fields' : [
          'id',
          'title',
          'description',
          'datetime'
        ]
      };

      if (_($scope).hasMembers('table', 'sort', 'field')) {
        params.sort[$scope.table.sort.field] = $scope.table.sort.direction;
      }

      var promise = model.getMessages(params);

      promise.then(function(data) {
          $scope.messages = data;
          ($scope.table.drawTable || $scope.table.addItems)(data, params);
        }, root.angular.noop);
    };

    var attachRowHandlers = function() {
      // Make the entire row clickable to view the message
      $('.hasTable').find('tbody > tr').each(function() {
        var $this = $(this);
        $this.css('cursor', 'pointer');
        $this.click(function(event) {
          if (event.target.nodeName.toLowerCase() !== 'input') {
            var href = $(this).find('a').attr('href').replace('#!', '');

            $scope.$apply(function() {
              $location.url(href);
            });
          }
        });
      });
    };

    // We don't display a table when we're in detail view so there's no need to wait or wire up the events.
    if (!$routeParams.message_id) {
      if (!$scope.isMobile) {
        directiveRegistry.onDirectivesReady('messages', function() {
          $scope.table = directiveRegistry.get('messages');
          updateTable();
          $scope.table.$on('tableRenderComplete', attachRowHandlers);
          $scope.table.$on('tableRenderComplete', function() {
            $('#checkAllBoxes').click(function() {
              var checked = $(this).is(':checked');
              $('.message-check').attr('checked', checked);
            });
          });
        });
      } else {
        directiveRegistry.onDirectivesReady(['messagesMobile'], function() {
          $scope.table = directiveRegistry.get('messagesMobile');
          updateTable();
        });
      }
    }


    /**
     * Trigger a bulk delete request
     */
    $scope.bulkDelete = function() {
      // Find the checked rows and send a delete for each
      $('.hasTable')
        .find('.message-check:checked')
        .each(function() {
          $scope.dismissMessage($(this).data('alert-id'), $(this).parents('tr'));
        });
    };
  }]);
})(this, jQuery);
