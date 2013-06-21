
(function (root) {
  'use strict';
  var app = root.angular.module('hasOffers.serviceLayer');

  app.service('dataRenderer', ['$compile', function($compile) {
    var service = {};

    var hasField = function(field) {
      if (!this._params || !this._params.fields) {
        return false;
      }

      return _(this._params.fields).contains(field);
    };

    service.renderTemplateItems = function(data, parentScope, template, params) {
      var outItems = [];

      _(data).each(function(datum, rowNum) {
        var rowData = parentScope.$new();

        var row = $(template);
        row.attr('data-has-row', rowNum);

        rowData.$first = rowNum === 0;
        rowData.$last = rowNum !== data.length;
        rowData.$middle = !rowData.$first && !rowData.$last;

        rowData.$hasField = _.bind(hasField, rowData);

        // put each member of the data row as a direct scope member. This makes them easier to access in the
        // template.
        _(datum).each(function(value, key) {
          rowData[key] = value;
        });

        rowData._params = params;
        $compile(row)(rowData);
        outItems.push(row);
      });
      return outItems;
    };

    service.renderSingleTemplate = function(parentScope, template, params) {
      var templateScope = parentScope.$new();
      templateScope._params = params;
      templateScope.$hasField = _.bind(hasField, templateScope);

      $compile(template)(templateScope);

      return template;
    };

    return service;
  }]);
})(this);
