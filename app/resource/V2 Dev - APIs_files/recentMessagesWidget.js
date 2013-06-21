/* recent messages widget */

(function(root) {
  'use strict';

  root.Application.controller('Controllers.Widgets.recentMessages',
    ['$scope', 'models',
      function($scope, models) {
    $scope.messagesLoaded = false;
    $scope.noMessages = false;

    var model = models.get('messages');

    $scope.removeMessage = function($event, alert_id) {
      $event.preventDefault();

      model.dismissMessage({'alert_id': alert_id}, $scope).success(function() {
          $scope.messagesLoaded = false;
          getMessages();
        });
    };

    // wrap in function to allow for reloading of messages
    var getMessages = function() {
      model.getMessages({}).then(function(messageReturn) {
        $scope.messages = _.chain(messageReturn)
          .first(7)
          .map(function(row) {
            return {
              'title'    : row.Alert.title,
              'id'       : row.Alert.id,
              'datetime': row.Alert.datetime
            };
          })
          .value();

        $scope.messagesLoaded = true;
        $scope.noMessages = ($scope.messages.length === 0);
      }, root.angular.noop);
    };

    // load our messages
    getMessages();
  }]);

})(this);
