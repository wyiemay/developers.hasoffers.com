/* controls date range picker */

(function(root, $, undefined) {
  'use strict';

  var fillTimezoneOptions = function(geographic, tzElement) {
    var tpl = '<option value="{0}">{1} {2}</option>';
    var options = [];

    _(geographic.getTimezones()).each(function(tz) {
      var formatted = tpl.format(tz.keyword, tz.gmt, tz.location);
      options.push(formatted);
    });

    tzElement.empty()
      .append(options.join(''))
      .val(geographic.getTimezone())
      .prop('disabled', false);
  };

  root.Application.directive('dateRangePicker',
    [
      'sessionStorageService',
      'garbageCollection',
      '$q',
      'directiveRegistry',
      'models',
      'geographic',
      '$rootScope',
      function(sessionStorageService, garbageCollection, $q, directiveRegistry, models, geographic, $rootScope) {

      // set up our dateranger object
      var DateRanger = Class.extend({
        rangeSplit    : 'to',
        format        : 'yyyy-MM-dd',
        displayFormat : 'MMM d, yyyy',
        namespace     : 'default',
        nsSettings: {
          'default' : {
            'defaultRange' : ['today-7days', 'today'],
            'defaultType'  : 'last_week'
          },
          'performance' : {
            'defaultRange' : ['today-7days', 'today'],
            'defaultType'  : 'last_week'
          },
          'conversion' : {
            'defaultRange' : ['today', 'today'],
            'defaultType'  : 'today'
          },
          'savedReport' : {
            'defaultRange' : ['today-7days', 'today'],
            'defaultType'  : 'last_week'
          },
          'logs' : {
            'defaultRange' : ['today', 'today'],
            'defaultType'  : 'today'
          }
        },
        settings: {
          'change' : root.angular.noop,
          'close'  : root.angular.noop,
          'target' : '#date-range',
          'onOpen' : null
        },
        current    : null,
        last       : null,
        el         : null,
        elDisplay  : null,
        open       : false,
        rangeType  : 'last_week',
        rangeTypes : models.get('savedReports').timePresetFunctionMap,

        populateTimezones: function() {
          var $this = this,
              tzElement;

          tzElement = $('#' + $this.settings.containerId)
            .parents('.datepicker-wrapper')
            .find('.datepicker-timezone-select');

          this.tzElement = tzElement;

          if (geographic.loaded) {
            fillTimezoneOptions(geographic, tzElement);
          }

          $rootScope.$on('geoInfoLoaded', function() {
            fillTimezoneOptions(geographic, tzElement);
          });

        },

        cancel: function() {
          this.el.parent().DatePickerHide();
        },

        show: function() {
          this.el.parent().DatePickerShow();
        },

        init: function(_obj, namespace) {
          var $this, rangeType, dateStart, dateEnd, dateRange;

          $this = this;
          _obj = _obj || {};
          namespace = namespace || 'default';

          if ($this.namespace != namespace) {
            $this.current = null;
          }

          $this.namespace = namespace;
          $this.settings.target = '#date-range';
          $this.settings.defaultRange = _.clone($this.nsSettings[namespace].defaultRange);
          $this.settings.defaultType = _.clone($this.nsSettings[namespace].defaultType);
          $this.toolTipPref = [];
          $.extend($this.settings, {'currentDate' : this.current}, _obj);

          if ($this.settings.currentDate == $this.current) {
            $this.settings.rangeType = $this.rangeType;
          } else {
            $this.settings.rangeType = 'date_range';
          }

          $this.el = $($this.settings.target);
          $this.elDisplay = $($this.settings.target + '-display');

          // if no valid target, no need to continue
          if ($this.el.length === 0) {
            return;
          }

          $this.el.blur(function() {
            if (!$this.open) {
              $this.triggerChange();
            }
          });

          if (this.settings.timeframe) {
            if (!this.settings.timeframe.type) {
              this.settings.timeframe.type = 'last_week';
            }
            rangeType = this.settings.timeframe.type;

            if (rangeType == 'date_range') {
              dateStart = Date.parse($this.settings.timeframe.start_date);
              dateEnd = Date.parse($this.settings.timeframe.end_date);
            } else {
              dateStart = $this.rangeTypes[rangeType].dateStart();
              dateEnd = $this.rangeTypes[rangeType].dateEnd();
            }

            dateRange = dateStart.toString($this.format) + ' ' +
              $this.rangeSplit + ' ' + dateEnd.toString($this.format);

          } else {
            if ($this.settings.currentDate) {
              dateRange = $this.settings.currentDate;
              rangeType = 'date_range';
            } else {
              var dateRangeObj = sessionStorageService.get('hasDateRangeObj.{0}'.format($this.namespace));

              if (!dateRangeObj) {
                rangeType = 'last_week';
                dateRange = Date.parse(
                  $this.settings.defaultRange[0]).toString($this.format) +
                  ' ' + $this.rangeSplit + ' ' +
                  Date.parse($this.settings.defaultRange[1]).toString($this.format);
              } else {
                dateRangeObj = JSON.parse(dateRangeObj);
                dateRange = dateRangeObj.dateRange;
                rangeType = dateRangeObj.rangeType;
              }
            }
          }

          $this.current = $this.last = dateRange;
          $this.rangeType = rangeType;
          sessionStorageService.add(
            'hasDateRangeObj.{0}'.format($this.namespace),
            JSON.stringify({
              'dateRange': $this.current,
              'rangeType': $this.rangeType
            })
          );

          $this.el.val($this.current);
          $this.setDisplay();
          _.each($this.el, function(myel, index) {
            var parent = $(myel).parent(),
                pickerElements = {},
                currentPreset = $this.getType(),
                getStartEnd;

            getStartEnd = function() {
              var start, end;

              // datepicker end date uses last hour
              end = new Date(Date.parse(pickerElements.endInput.val(), $this.format).setHours(23, 59, 59, 0));
              start = Date.parse(pickerElements.startInput.val(), $this.format);

              if (start > end) {
                var rev = [end, start];

                start = rev[0];
                end = rev[1];
              }
              return {'start' : start, 'end' : end};
            };

            var updatePicker = function(e) {
              if (e) {
                e.preventDefault();
              }
              var current = parent.DatePickerGetDate();

              if (pickerElements.startInput && pickerElements.endInput) {
                // we want to avoid unnecessary set dates
                var dates = getStartEnd();
                if (current[0] != dates.start || current[1] != dates.end) {
                  parent.DatePickerSetDate([dates.start, dates.end], true);
                }
              }

            };

            var applyClick = function(e) {
              var dates = getStartEnd();
              $this.setStartDate(dates.start.toString($this.format));
              $this.setEndDate(dates.end.toString($this.format));
              $this.setType(currentPreset);
              $this.triggerChange();
              cancelClick(e);
            };

            var cancelClick = function(e) {
              if (e) {
                e.preventDefault();
              }
              parent.DatePickerHide();
              $this.settings.close(e, $this.settings);
            };

            var presetClick = function(e) {
              if (e) {
                e.preventDefault();
              }
              var preset = $(e.currentTarget).data('preset'),
                  presetVals = $this.rangeTypes[preset];

              currentPreset = preset;
              // Set inputs to preset equivalent date
              pickerElements.startInput.val(presetVals.dateStart().format('YYYY-MM-DD'));
              pickerElements.endInput.val(presetVals.dateEnd().format('YYYY-MM-DD')).trigger('change');
            };

            myel = $(myel);

            parent.DatePicker({
              id              : $this.settings.containerId,
              flat            : true,
              date            : [$this.getStartDate(), $this.getEndDate()],
              current         : root.Date.today().toString($this.format),
              format          : $this.format,
              calendars       : 3,
              mode            : 'range',
              starts          : 1,
              position        : index,
              parentContainer : $this.settings.parentContainer || null,

              onChange : function(formatted) {
                if (pickerElements.startInput.val() != formatted[0]) {
                  pickerElements.startInput.val(formatted[0]);
                }

                if (pickerElements.endInput.val() != formatted[1]) {
                  pickerElements.endInput.val(formatted[1]);
                }
                currentPreset = 'custom';
              },

              onHide: function() {
                pickerElements.wrapper.removeClass('on');
              },

              onShow: function() {
                $this.open = false;
                pickerElements.startInput.val($this.getStartDate());
                pickerElements.endInput.val($this.getEndDate()).trigger('change');
                pickerElements.wrapper.addClass('on');

                if (_.isFunction($this.settings.onOpen)) {
                  $this.settings.onOpen();
                }
              },

              // onComplete is triggered when datepicker is appended to DOM
              onComplete: function() {
                $this.populateTimezones();
                pickerElements.picker = $('#{0}'.format($this.settings.containerId));
                pickerElements.wrapper = pickerElements.picker.parents('.datepicker-wrapper');
                pickerElements.startInput = pickerElements.wrapper.find('.datepicker-input-start');
                pickerElements.endInput = pickerElements.wrapper.find('.datepicker-input-end');
                pickerElements.startInput.bind('change', updatePicker);
                pickerElements.endInput.bind('change', updatePicker);
                pickerElements.wrapper.find('a.apply').click(applyClick);
                pickerElements.wrapper.find('a.cancel').click(cancelClick);
                pickerElements.wrapper.find('.datepicker-preset').click(presetClick);
                pickerElements.wrapper.find('.panel-container').hover(function(e) {
                  $this.settings.scope.hoverPanel(e, 'panel-display');
                });

                pickerElements.startInput.bind('click', function setFirstActive() {
                  parent.DatePickerSetActiveInput('first');
                });

                pickerElements.endInput.bind('click', function setSecondActive() {
                  parent.DatePickerSetActiveInput('second');
                });
              }
            });
          });

          $this.setDateTooltip($this.current);
          $('.preset_0').trigger('click', true);
        },

        setDateTooltip: function(toolDate) {
          var $this = this;

          if ($this.el.length > 0) {
            _.each($this.el, function(myel, k) {
              if ($(myel).hasClass('btn-date')) {
                if (!$this.toolTipPref[k]) {
                  $this.toolTipPref[k] = $(myel).hasTooltip({
                      message : toolDate,
                      parent  : $(myel).parent(),
                      padding : {'left' : 17, 'top': 10}
                    });
                } else {
                  $this.toolTipPref[k].message = toolDate;
                }
              }
            });
          }
        },

        triggerChange: function() {
          var $this, payload;

          $this = this;
          $this.open = false;
          $this.current = $this.el.val();

          if ($this.current == $this.last) {
            return;
          } else {
            $this.last = $this.current;
          }

          $this.setDate();
          $this.el.val($this.current);

          payload = JSON.stringify({
            'dateRange': $this.current,
            'rangeType': $this.rangeType
          });

          sessionStorageService.add('hasDateRangeObj.{0}'.format($this.namespace), payload);
          $this.settings.change();
          $this.setDateTooltip($this.current);
          $this.setDisplay();
        },

        setDisplay: function() {
          this.elDisplay.text('{0} - {1}'.format(
            this.parseDate(this.getStartDate()).toString(this.displayFormat),
            this.parseDate(this.getEndDate()).toString(this.displayFormat)
          ));
        },

        getStartDate: function() {
          return $.trim(this.current.split(this.rangeSplit)[0]);
        },

        getEndDate: function() {
          var _date = this.current.split(this.rangeSplit);
          if (_date.length > 1) {
            return $.trim(_date[1]);
          }

          return $.trim(_date[0]);
        },

        getTimezoneOffset : function() {
          var tz = this.tzElement.val() || geographic.getTimezone();

          if (geographic.loaded) {
            return geographic.getTimezones()[tz].hour_offset;
          } else {
            return '+0';
          }
        },

        setStartDate: function(_date) {
          this.setDate(Date.parse(_date), null);
          this.el.val(this.current);
        },

        setEndDate: function(_date) {
          this.setDate(null, Date.parse(_date));
          this.el.val(this.current);
        },

        setDate: function(start, end, triggerDisplay) {
          var hasNull = (_.isNull(start) || _.isNull(end));
          start = start || Date.parse(this.getStartDate());
          end = end || Date.parse(this.getEndDate());

          if (!hasNull && end < start) {
            var sstart = start;
            start = end;
            end = sstart;
          }

          this.current = start.toString(this.format) + ' ' + this.rangeSplit + ' ' + end.toString(this.format);

          if (triggerDisplay) {
            this.setDisplay();
          }
        },

        parseDate: function(_date) {
          return Date.parse(_date, this.format);
        },

        setType: function(_type) {
          var payload = JSON.stringify({
            dateRange : this.current,
            rangeType : _type
          });
          this.rangeType = _type;
          sessionStorageService.add('hasDateRangeObj.{0}'.format(this.namespace), payload);
        },

        getType: function() {
          return this.rangeType;
        }
      });

      // creates a unique id for input template
      return {
        restrict : 'E',
        template : '<input  id="{{dateRangeId}}" type="hidden" value="" /><a>' +
                   '<span class="daterange-display" id="{{dateRangeId}}-display">' +
                   '</span><i class="icon-chevron-down"></i></a>',
        transclude : true,
        link : function postLink($scope, element, attrs) {
          var ns, doChange, doClose;

          $scope.dateRangeId = _.uniqueId('date-range-');

          // determines change function and namespace from attributes
          ns = attrs.namespace || 'default';

          // override namespace if scope has getDatepickerNamespace function
          if (_.isFunction($scope.getDatepickerNamespace)) {
            ns = $scope.getDatepickerNamespace();
          }
          // need to wrap in function in case this changeFn does not exist
          // until after this directive is initialized
          doChange = function() {
            var changeFn = $scope[attrs.changefn] || root.angular.noop;
            $.proxy(changeFn, $scope)();
          };

          doClose = function(event, settings) {
            $scope.$apply(function() {
              $scope.$parent.applyPanel(event, settings.ns);
            });
          };

          // wait for next stack and initialize datePicker
          _.defer(function() {
            var containerId, datePickerOptions;

            containerId = $scope.dateRangeId + '-container';
            datePickerOptions = {
              'scope'       : $scope,
              'target'      : '#' + $scope.dateRangeId,
              'change'      : doChange,
              'close'       : doClose,
              'containerId' : containerId,
              'ns'          : ns
            };

            if (attrs.parentContainer) {
              datePickerOptions.parentContainer = attrs.parentContainer;
            }

            if (attrs.onOpen && _.isFunction($scope.$parent[attrs.onOpen])) {
              datePickerOptions.onOpen = $scope.$parent[attrs.onOpen];
            }

            element.find('.datepicker-controls .apply').click(function(e) {
              $scope.$parent.applyPanel(e, ns);
            });

            $scope.$parent.datePicker = new DateRanger(datePickerOptions, ns);
            garbageCollection.add('#' + containerId);

            $scope.$apply(function() {
              // populates parent controller scope directivesReady with directive name
              $scope.directivesReady = $scope.directivesReady || [];
              $scope.directivesReady.push('dateRangePicker');
              directiveRegistry.register($scope, attrs.name || 'dateRangePicker');
            });
          });
        }
      };
    }]
  );
})(this, jQuery);
