/**
 * Primitive model building factory.
 *
 */

(function(root) {
  'use strict';

  root.Application.service('models', ['$injector', function($injector) {
    return {
      /**
       * Returns an instance of the requested model.
       * @param modelName    The name of the model as it's defined in root.Models.
       * @returns {object} The model requested.
       */
      'get' : function(modelName) {
        var model = this.getExtendable(modelName);
        return new model();
      },

      getExtendable : function(modelName) {
        var model = root.Models[modelName];
        if (!model) {
          throw new Error('No model found named ' + modelName);
        }
        return $injector.invoke(model);
      }
    };
  }]
  );
})(this);
