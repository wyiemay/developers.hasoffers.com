/**
 * Adapted from https://github.com/grevory/angular-local-storage
 *
 */

(function(root, $, undefined) {

  // Lets set the name of your app before we start.
  // We can use this for prefixing the names of Local Storage variables
  var settings = {
      appName: 'hasApp'
    },
    services = {};

  /**
   * localStorage service to access localStorage api
   */
  services['localStorageService'] = function() {
    return {

      // We will prepend the name of the app to the front of each value stored in local storage.
      // This way we prevent any conflicts with any other data stored in the Local Storage
      prefix: settings.appName + '.',

      // Checks the browser to see if local storage is supported
      isSupported: function() {
        try {
            return ('localStorage' in window && window['localStorage'] !== null);
        } catch (e) {
            return false;
        }
      },

      // Directly adds a value to local storage
      // If local storage is not available in the browser use cookies
      // Example use: localStorageService.add('library','angular');
      add: function(key, value) {

        // convert value to json if neccessary
        value = root.angular.toJson(value);

        // If this browser does not support local storage use cookies
        if (!this.isSupported()) {
          console.log('Cannot add to local storage. Get from cookies');
          return false;
        }

        try {
          localStorage.setItem(this.prefix + key, value);
          //or localStorage[key] = value; //like associative arrays
        } catch (e) {
          console.error(e.Description);
          return -1;
        }
      },

      // Directly get a value from local storage
      // Example use: localStorageService.get('library'); // returns 'angular'
      get: function(key) {
        if (!this.isSupported()) {
          console.log('Cannot get from local storage. Use cookies');
          return false;
        }

        var value = localStorage.getItem(this.prefix + key);

        return root.angular.fromJson(value);
        //or sessionStorage[key];
      },

      // Remove an item from local storage
      // Example use: localStorageService.remove('library'); // removes the key/value pair of library='angular'
      remove: function(key) {
        if (!this.isSupported()) {
          console.log('Cannot remove item from local storage. Remove from cookies');
          return false;
        }

        return localStorage.removeItem(this.prefix + key);
      },

      // Remove all data for this app from local storage
      // Example use: localStorageService.clearAll();
      // Should be used mostly for development purposes
      clearAll: function() {
        if (!this.isSupported()) {
          console.log('Cannot remove all items from local storage. Remove all app cookies');
          return false;
        }

        var prefixLength = this.prefix.length;

        for (var i in localStorage) {
          // Only remove items that are for this app
          if (i.substr(0, prefixLength) === this.prefix)
            localStorage.removeItem(i);
        }
      }

    };

  };

  /**
   * sessionStorage service to access sessionStorage api
   *
   */

  services['sessionStorageService'] = function() {

    return {

      // We will prepend the name of the app to the front of each value stored in session storage.
      // This way we prevent any conflicts with any other data stored in the Local Storage
      prefix: settings.appName + '.',

      // Checks the browser to see if session storage is supported
      isSupported: function() {
        try {
          return ('sessionStorage' in root && root['sessionStorage'] !== null);
        } catch (e) {
          return false;
        }
      },

      // Directly adds a value to session storage
      // If session storage is not available in the browser use cookies
      // Example use: sessionStorageService.add('library','angular');
      add: function(key, value) {

        // convert value to json if neccessary
        value = root.angular.toJson(value);

        // If this browser does not support session storage use cookies
        if (!this.isSupported()) {
          console.log('Cannot add to session storage. Get from cookies');
          return false;
        }

        try {
          sessionStorage.setItem(this.prefix + key, value);
          //or sessionStorage[key] = value; //like associative arrays
        } catch (e) {
          console.error(e.Description);
          return -1;
        }
      },

      // Directly get a value from session storage
      // Example use: sessionStorageService.get('library'); // returns 'angular'
      get: function(key) {
        if (!this.isSupported()) {
          console.log('Cannot get from session storage. Use cookies');
          return false;
        }
        var value = sessionStorage.getItem(this.prefix + key);

        return root.angular.fromJson(value);
        //or sessionStorage[key];
      },

      // Remove an item from session storage
      // Example use: sessionStorageService.remove('library'); // removes the key/value pair of library='angular'
      remove: function(key) {
        if (!this.isSupported()) {
          console.log('Cannot remove item from session storage. Remove from cookies');
          return false;
        }

        return sessionStorage.removeItem(this.prefix + key);
      },

      // Remove all data for this app from session storage
      // Example use: sessionStorageService.clearAll();
      // Should be used mostly for development purposes
      clearAll: function() {
        if (!this.isSupported()) {
          console.log('Cannot remove all items from session storage. Remove all app cookies');
          return false;
        }

        var prefixLength = this.prefix.length;

        for (var i in sessionStorage) {
          // Only remove items that are for this app
          if (i.substr(0, prefixLength) === this.prefix)
            sessionStorage.removeItem(i);
        }
      }

    };

  };

  /**
   * cookieStorageService service to access cookies
   * not using angular-cookies as it does not address the needs we have for EU Compliance and working with the
   * existing api/hasOffers platform
   *
   * modified from git://gist.github.com/992303.git
   */

  services['cookieStorageService'] = function() {

    return {

      // We will prepend the name of the app to the front of each value stored in session storage.
      // This way we prevent any conflicts with any other data stored in the Local Storage
      prefix: settings.appName + '.',

      findAll: function() {
        var cookies = {};
        _(document.cookie.split(';'))
        .chain()
        .map(function(m) {
          return m.replace(/^\s+/, '').replace(/\s+$/, '');
        })
        .each(function(c) {
          var arr = c.split('='),
          key = arr[0],
          value = null;
          var size = _.size(arr);
          if (size > 1) {
            value = arr.slice(1).join('');
          }
          cookies[key] = value;
        });
        return cookies;
      },

      get: function(name) {
        var cookie = null,
          list = this.findAll();

        _.each(list, function(value, key) {
          if (key === name) cookie = root.angular.fromJson(value);
        });
        return cookie;
      },

      add: function(name, value, time) {
        var today = new Date(),
          offset = (typeof time == 'undefined') ? (1000 * 60 * 60 * 24) : (time * 1000),
          expires_at = new Date(today.getTime() + offset),
          cookie_data = {};

        cookie_data[name] = root.angular.toJson(value);
        cookie_data.path = '/';
        if (time !== null) {
          cookie_data.expires = expires_at.toGMTString();
        }

        var cookie = _.map(
          cookie_data,
          function(value, key) {
            return [(key == 'name') ? name : key, value].join('=');
          }
        ).join(';');

        document.cookie = cookie;
        return this;
      },

      remove: function(name, cookie) {
        if (cookie == this.find(name)) {
          this.create(name, null, -1000000);
        }
        return this;
      }
    };

  };

  _.each(services, function(resource, name) {
      root.Application.service(name, resource);
  });
})(this, jQuery);
