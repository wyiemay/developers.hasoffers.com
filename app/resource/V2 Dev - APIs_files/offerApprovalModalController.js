(function(root, $, undefined) {
  'use strict';

  root.Application.controller('Controllers.offerApprovalQuestionsModal',
    ['$scope', 'models', '$location', 'directiveRegistry',
      function($scope, models, $location, directiveRegistry) {

        var model = models.get('offerDetail');
        var offer_id;
        $scope._model = model;

        $scope.offerQuestions = [];
        $scope.approvalAnswers = [];
        $scope.questionsLoading = false;

        $scope.answersAreOk = function() {
          var badAnswers;
          badAnswers = _.chain($scope.approvalAnswers)
            .where({required : true})
            .find(function(piece) {
              return $.trim(piece.answer) === '';
            });
          return !badAnswers.value();
        };

        $scope.clearAnswers = function() {
          _.each($scope.approvalAnswers, function(piece) {
            piece.answer = '';
          });
        };

        var modal;
        directiveRegistry.onDirectivesReady(['offerApprovalModal'], function() {
          modal = directiveRegistry.get('offerApprovalModal');
        });


        $scope.$on('approvalRequired', function(event, id) {
          $scope.questionsLoading = true;
          offer_id = id;
          model.getOfferApprovalQuestions(id).success(function(questions) {

            $scope.questionsLoading = false;
            _.each(questions, function(val) {
              $scope.offerQuestions.push(val.SignupQuestion);
            });

            // Show required questions first.
            $scope.offerQuestions = _.sortBy($scope.offerQuestions, function(question) {
              return question.required == '1' ? -1 : 1;
            });
            _.each($scope.offerQuestions, function(question) {
              $scope.approvalAnswers.push({
                'question_id' : question.id,
                'answer'      : '',
                'required'    : question.required == '1'
              });
            });

            // In the event that we get an offer that requires approval but has no questions we should just
            // submit an empty answers array and be done with this process.
            if (!_(questions).size()) {
              modal.$on('modalShow', function() {
                $scope.saveAnswers();
              });
            }
          });
        });


        $scope.saveAnswers = function() {
          if ($scope.answersAreOk()) {
            var params = {'offer_id': offer_id};
            var answers = _.chain($scope.approvalAnswers)
              .reject(function(piece) { return $.trim(piece.answer) == ''; })
              .map(function(piece) {
                return {'question_id': piece.question_id, 'answer': piece.answer};
              });

            params.answers = answers.value();
            model.saveOfferApprovalAnswers(params);
            $location.path('/offer/' + offer_id);
          }
        };
  }]);
})(this, jQuery);
