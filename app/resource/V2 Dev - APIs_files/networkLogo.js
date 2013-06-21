(function(root, $, undefined) {
  'use strict';

  root.Application.directive('networkLogo', function() {

      return {
        'restrict'    : 'A',
        'link'        : function(scope, element) {

          var networkName = root.Config.network_name;
          var networkLogo = root.Config.network_logo;

          if (networkLogo) {
            element.attr({'src': networkLogo, 'alt': networkName});
          } else {
            element.hide();
          }
        }
      };
    });

})(this, jQuery);
