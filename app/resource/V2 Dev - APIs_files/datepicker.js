/**
 *
 * Date picker
 * Author: Stefan Petre www.eyecon.ro
 *
 * Dual licensed under the MIT and GPL licenses
 *
 */

/*jshint maxlen: 200*/
/*global tmpl*/

(function ($) {
  'use strict';

  var DatePicker = function () {
    var views = {
        years : 'datepickerViewYears',
        moths : 'datepickerViewMonths',
        days  : 'datepickerViewDays'
      },

      tpl = {
        wrapper: '<div class="datepicker"><div class="datepickerContainer"><table cellspacing="0" cellpadding="0"><tbody><tr></tr></tbody></table></div></div>',
        head: [
          '<td>',
          '<table cellspacing="0" cellpadding="0">',
          '<thead>',
          '<tr>',
          '<th class="datepickerGoPrev"><% if(position == 0){ %><a href="#"><span><%=prev%></span></a><% } %></th>',
          '<th colspan="5" class="datepickerMonth"><a href="#"><span></span></a></th>',
          '<th class="datepickerGoNext"><% if(position == maxPos){ %><a href="#"><span><%=next%></span></a><% } %></th>',
          '</tr>',
          '</thead>',
          '</table></td>'
        ],
        space : /*'<td class="datepickerSpace"><div></div></td>'*/ '',
        days: [
          '<tbody class="datepickerDays">',
          '<tr>',
          '<td class="<%=weeks[0].days[0].classname%>"><a href="#"><span><%=weeks[0].days[0].text%></span></a></td>',
          '<td class="<%=weeks[0].days[1].classname%>"><a href="#"><span><%=weeks[0].days[1].text%></span></a></td>',
          '<td class="<%=weeks[0].days[2].classname%>"><a href="#"><span><%=weeks[0].days[2].text%></span></a></td>',
          '<td class="<%=weeks[0].days[3].classname%>"><a href="#"><span><%=weeks[0].days[3].text%></span></a></td>',
          '<td class="<%=weeks[0].days[4].classname%>"><a href="#"><span><%=weeks[0].days[4].text%></span></a></td>',
          '<td class="<%=weeks[0].days[5].classname%>"><a href="#"><span><%=weeks[0].days[5].text%></span></a></td>',
          '<td class="<%=weeks[0].days[6].classname%>"><a href="#"><span><%=weeks[0].days[6].text%></span></a></td>',
          '</tr>',
          '<tr>',
          '<td class="<%=weeks[1].days[0].classname%>"><a href="#"><span><%=weeks[1].days[0].text%></span></a></td>',
          '<td class="<%=weeks[1].days[1].classname%>"><a href="#"><span><%=weeks[1].days[1].text%></span></a></td>',
          '<td class="<%=weeks[1].days[2].classname%>"><a href="#"><span><%=weeks[1].days[2].text%></span></a></td>',
          '<td class="<%=weeks[1].days[3].classname%>"><a href="#"><span><%=weeks[1].days[3].text%></span></a></td>',
          '<td class="<%=weeks[1].days[4].classname%>"><a href="#"><span><%=weeks[1].days[4].text%></span></a></td>',
          '<td class="<%=weeks[1].days[5].classname%>"><a href="#"><span><%=weeks[1].days[5].text%></span></a></td>',
          '<td class="<%=weeks[1].days[6].classname%>"><a href="#"><span><%=weeks[1].days[6].text%></span></a></td>',
          '</tr>',
          '<tr>',
          '<td class="<%=weeks[2].days[0].classname%>"><a href="#"><span><%=weeks[2].days[0].text%></span></a></td>',
          '<td class="<%=weeks[2].days[1].classname%>"><a href="#"><span><%=weeks[2].days[1].text%></span></a></td>',
          '<td class="<%=weeks[2].days[2].classname%>"><a href="#"><span><%=weeks[2].days[2].text%></span></a></td>',
          '<td class="<%=weeks[2].days[3].classname%>"><a href="#"><span><%=weeks[2].days[3].text%></span></a></td>',
          '<td class="<%=weeks[2].days[4].classname%>"><a href="#"><span><%=weeks[2].days[4].text%></span></a></td>',
          '<td class="<%=weeks[2].days[5].classname%>"><a href="#"><span><%=weeks[2].days[5].text%></span></a></td>',
          '<td class="<%=weeks[2].days[6].classname%>"><a href="#"><span><%=weeks[2].days[6].text%></span></a></td>',
          '</tr>',
          '<tr>',
          '<td class="<%=weeks[3].days[0].classname%>"><a href="#"><span><%=weeks[3].days[0].text%></span></a></td>',
          '<td class="<%=weeks[3].days[1].classname%>"><a href="#"><span><%=weeks[3].days[1].text%></span></a></td>',
          '<td class="<%=weeks[3].days[2].classname%>"><a href="#"><span><%=weeks[3].days[2].text%></span></a></td>',
          '<td class="<%=weeks[3].days[3].classname%>"><a href="#"><span><%=weeks[3].days[3].text%></span></a></td>',
          '<td class="<%=weeks[3].days[4].classname%>"><a href="#"><span><%=weeks[3].days[4].text%></span></a></td>',
          '<td class="<%=weeks[3].days[5].classname%>"><a href="#"><span><%=weeks[3].days[5].text%></span></a></td>',
          '<td class="<%=weeks[3].days[6].classname%>"><a href="#"><span><%=weeks[3].days[6].text%></span></a></td>',
          '</tr>',
          '<tr>',
          '<td class="<%=weeks[4].days[0].classname%>"><a href="#"><span><%=weeks[4].days[0].text%></span></a></td>',
          '<td class="<%=weeks[4].days[1].classname%>"><a href="#"><span><%=weeks[4].days[1].text%></span></a></td>',
          '<td class="<%=weeks[4].days[2].classname%>"><a href="#"><span><%=weeks[4].days[2].text%></span></a></td>',
          '<td class="<%=weeks[4].days[3].classname%>"><a href="#"><span><%=weeks[4].days[3].text%></span></a></td>',
          '<td class="<%=weeks[4].days[4].classname%>"><a href="#"><span><%=weeks[4].days[4].text%></span></a></td>',
          '<td class="<%=weeks[4].days[5].classname%>"><a href="#"><span><%=weeks[4].days[5].text%></span></a></td>',
          '<td class="<%=weeks[4].days[6].classname%>"><a href="#"><span><%=weeks[4].days[6].text%></span></a></td>',
          '</tr>',
          '<tr>',
          '<td class="<%=weeks[5].days[0].classname%>"><a href="#"><span><%=weeks[5].days[0].text%></span></a></td>',
          '<td class="<%=weeks[5].days[1].classname%>"><a href="#"><span><%=weeks[5].days[1].text%></span></a></td>',
          '<td class="<%=weeks[5].days[2].classname%>"><a href="#"><span><%=weeks[5].days[2].text%></span></a></td>',
          '<td class="<%=weeks[5].days[3].classname%>"><a href="#"><span><%=weeks[5].days[3].text%></span></a></td>',
          '<td class="<%=weeks[5].days[4].classname%>"><a href="#"><span><%=weeks[5].days[4].text%></span></a></td>',
          '<td class="<%=weeks[5].days[5].classname%>"><a href="#"><span><%=weeks[5].days[5].text%></span></a></td>',
          '<td class="<%=weeks[5].days[6].classname%>"><a href="#"><span><%=weeks[5].days[6].text%></span></a></td>',
          '</tr>',
          '</tbody>'
        ],
        months: [
          '<tbody class="<%=className%>">',
          '<tr>',
          '<td colspan="2"><a href="#"><span><%=data[0]%></span></a></td>',
          '<td colspan="2"><a href="#"><span><%=data[1]%></span></a></td>',
          '<td colspan="2"><a href="#"><span><%=data[2]%></span></a></td>',
          '<td colspan="2"><a href="#"><span><%=data[3]%></span></a></td>',
          '</tr>',
          '<tr>',
          '<td colspan="2"><a href="#"><span><%=data[4]%></span></a></td>',
          '<td colspan="2"><a href="#"><span><%=data[5]%></span></a></td>',
          '<td colspan="2"><a href="#"><span><%=data[6]%></span></a></td>',
          '<td colspan="2"><a href="#"><span><%=data[7]%></span></a></td>',
          '</tr>',
          '<tr>',
          '<td colspan="2"><a href="#"><span><%=data[8]%></span></a></td>',
          '<td colspan="2"><a href="#"><span><%=data[9]%></span></a></td>',
          '<td colspan="2"><a href="#"><span><%=data[10]%></span></a></td>',
          '<td colspan="2"><a href="#"><span><%=data[11]%></span></a></td>',
          '</tr>',
          '</tbody>'
        ]
      },

      defaults = {
        flat         : false,
        starts       : 1,
        prev         : '&#9664;',
        next         : '&#9654;',
        lastSel      : false,
        forceNextSel : '',
        mode         : 'single',
        view         : 'days',
        calendars    : 1,
        format       : 'Y-m-d',
        position     : 'bottom',
        eventName    : 'click',
        onRender     : function(){return {};},
        onChange     : function(){return true;},
        onShow       : function(){return true;},
        onBeforeShow : function(){return true;},
        onHide       : function(){return true;},
        onComplete   : function(){},
        locale: {
          days        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          daysShort   : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          daysMin     : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
          months      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          monthsShort : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          weekMin     : 'wk'
        }
      },

      fill = function(el) {
        var options    = $(el).data('datepicker');
        var cal        = $(el);
        var currentCal = Math.floor(options.calendars/2);
        var date, data, dow, month, cnt = 0, week, indic, indic2, html, tblCal;

        cal.find('td>table tbody').remove();
        for (var i = 0; i < options.calendars; i++) {
          date = new Date(options.current);
          date.addMonths(-currentCal + i);
          tblCal = cal.find('table').eq(i+1);
          switch (tblCal[0].className) {
            case 'datepickerViewDays':
              dow = formatDate(date, 'B, Y');
              break;
            case 'datepickerViewMonths':
              dow = date.getFullYear();
              break;
            case 'datepickerViewYears':
              dow = (date.getFullYear()-6) + ' - ' + (date.getFullYear()+5);
              break;
          }
          tblCal.find('thead tr:first th:eq(1) span').text(dow);
          dow = date.getFullYear()-6;
          data = {
            data: [],
            className: 'datepickerYears'
          };
          for ( var j = 0; j < 12; j++) {
            data.data.push(dow + j);
          }

          date.setDate(1);
          dow = (date.getDay() - options.starts) % 7;

          html  = tmpl(tpl.months.join(''), data);
          data  = {weeks:[], test: 10};
          month = date.getMonth();
          week  = -1;
          cnt   = 0;

          date.addDays(-(dow + (dow < 0 ? 7 : 0)));

          while (cnt < 42) {
            indic = parseInt(cnt/7,10);
            indic2 = cnt%7;
            if (!data.weeks[indic]) {
              week = date.getWeekOfYear();
              data.weeks[indic] = {
                week: week,
                days: []
              };
            }
            data.weeks[indic].days[indic2] = {
              text: date.getDate(),
              classname: []
            };
            if (month != date.getMonth()) {
              data.weeks[indic].days[indic2].classname.push('datepickerNotInMonth');
            }
            if (date.getDay() === 0) {
              data.weeks[indic].days[indic2].classname.push('datepickerSunday');
            }
            if (date.getDay() == 6) {
              data.weeks[indic].days[indic2].classname.push('datepickerSaturday');
            }
            var fromUser = options.onRender(date);
            var val = date.valueOf();
            if (fromUser.selected || options.date == val || $.inArray(val, options.date) > -1 || (options.mode == 'range' && val >= options.date[0] && val <= options.date[1])) {
              data.weeks[indic].days[indic2].classname.push('datepickerSelected');
            }
            if (fromUser.disabled) {
              data.weeks[indic].days[indic2].classname.push('datepickerDisabled');
            }
            if (fromUser.className) {
              data.weeks[indic].days[indic2].classname.push(fromUser.className);
            }
            data.weeks[indic].days[indic2].classname = data.weeks[indic].days[indic2].classname.join(' ');
            cnt++;
            date.addDays(1);
          }
          html = tmpl(tpl.days.join(''), data) + html;
          data = {
            data: options.locale.monthsShort,
            className: 'datepickerMonths'
          };
          html = tmpl(tpl.months.join(''), data) + html;
          tblCal.append(html);
        }
      },

      parseDate = function (date, format) {
        if (date.constructor == Date) {
          return new Date(date);
        }

        var parts = date.split(/\W+/);
        var against = format.split(/\W+/), d, m, y, h, min, now = new Date();

        for (var i = 0; i < parts.length; i++) {
          switch (against[i]) {
            case 'd':
            case 'e':
              d = parseInt(parts[i],10);
              break;
            case 'm':
              m = parseInt(parts[i], 10)-1;
              break;
            case 'Y':
            case 'y':
              y = parseInt(parts[i], 10);
              y += y > 100 ? 0 : (y < 29 ? 2000 : 1900);
              break;
            case 'H':
            case 'I':
            case 'k':
            case 'l':
              h = parseInt(parts[i], 10);
              break;
            case 'P':
            case 'p':
              if (/pm/i.test(parts[i]) && h < 12) {
                h += 12;
              } else if (/am/i.test(parts[i]) && h >= 12) {
                h -= 12;
              }
              break;
            case 'M':
              min = parseInt(parts[i], 10);
              break;
          }
        }
        return new Date(
          y   === undefined ? now.getFullYear() : y,
          m   === undefined ? now.getMonth() : m,
          d   === undefined ? now.getDate() : d,
          h   === undefined ? now.getHours() : h,
          min === undefined ? now.getMinutes() : min,
          0
        );
      },

      formatDate = function(date, format, useParse) {
        if (useParse){
          return date.toString(format);
        }

        var m     = date.getMonth();
        var d     = date.getDate();
        var y     = date.getFullYear();
        var w     = date.getDay();
        var hr    = date.getHours();
        var pm    = (hr >= 12);
        var ir    = (pm) ? (hr - 12) : hr;
        var dy    = date.getDayOfYear();
        var min   = date.getMinutes();
        var sec   = date.getSeconds();
        var parts = format.split('');
        var part;

        if (ir === 0) {
          ir = 12;
        }

        for ( var i = 0; i < parts.length; i++ ) {
          part = parts[i];
          switch (parts[i]) {
            case 'a':
              part = date.getDayName();
              break;
            case 'A':
              part = date.getDayName(true);
              break;
            case 'b':
              part = date.getMonthName();
              break;
            case 'B':
              part = date.getMonthName(true);
              break;
            case 'C':
              part = 1 + Math.floor(y / 100);
              break;
            case 'd':
              part = (d < 10) ? ('0' + d) : d;
              break;
            case 'e':
              part = d;
              break;
            case 'H':
              part = (hr < 10) ? ('0' + hr) : hr;
              break;
            case 'I':
              part = (ir < 10) ? ('0' + ir) : ir;
              break;
            case 'j':
              part = (dy < 100) ? ((dy < 10) ? ('00' + dy) : ('0' + dy)) : dy;
              break;
            case 'k':
              part = hr;
              break;
            case 'l':
              part = ir;
              break;
            case 'm':
              part = (m < 9) ? ('0' + (1+m)) : (1+m);
              break;
            case 'M':
              part = (min < 10) ? ('0' + min) : min;
              break;
            case 'p':
            case 'P':
              part = pm ? 'PM' : 'AM';
              break;
            case 's':
              part = Math.floor(date.getTime() / 1000);
              break;
            case 'S':
              part = (sec < 10) ? ('0' + sec) : sec;
              break;
            case 'u':
              part = w + 1;
              break;
            case 'w':
              part = w;
              break;
            case 'y':
              part = ('' + y).substr(2, 2);
              break;
            case 'Y':
              part = y;
              break;
          }
          parts[i] = part;
        }
        return parts.join('');
      },

      layout = function (el) {
        var options = $(el).data('datepicker');
        var cal     = $('#' + options.id);
        var tbl     = cal.find('table:first').get(0);
        var width   = tbl.offsetWidth;

        cal.css({
          width  : width + options.extraWidth + 'px',
          height : 'auto'
        }).find('div.datepickerContainer').css({
          width  : width + 'px',
          height : 'auto'
        });
      },

      click = function(ev) {
        if ($(ev.target).is('span')) {
          ev.target = ev.target.parentNode;
        }

        var el = $(ev.target);
        if (el.is('a')) {
          ev.target.blur();
          if (el.hasClass('datepickerDisabled')) {
            return false;
          }

          var options  = $(this).data('datepicker');
          var parentEl = el.parent();
          var tblEl    = parentEl.parent().parent().parent();
          var tblIndex = $('table', this).index(tblEl.get(0)) - 1;
          var tmp      = new Date(options.current);
          var changed  = false;
          var fillIt   = false;
          if (parentEl.is('th')) {
            if (parentEl.hasClass('datepickerWeek') && options.mode == 'range' && !parentEl.next().hasClass('datepickerDisabled')) {
              var val = parseInt(parentEl.next().text(), 10);
              tmp.addMonths(tblIndex - Math.floor(options.calendars/2));

              if (parentEl.next().hasClass('datepickerNotInMonth')) {
                tmp.addMonths(val > 15 ? -1 : 1);
              }

              tmp.setDate(val);
              options.date[0] = (tmp.setHours(0,0,0,0)).valueOf();

              tmp.setHours(23,59,59,0);
              tmp.addDays(6);
              options.date[1] = tmp.valueOf();

              fillIt          = true;
              changed         = true;
              options.lastSel = false;

            } else if (parentEl.hasClass('datepickerMonth')) {
              tmp.addMonths(tblIndex - Math.floor(options.calendars/2));

              switch (tblEl.get(0).className) {
                case 'datepickerViewDays':
                  tblEl.get(0).className = 'datepickerViewMonths';
                  el.find('span').text(tmp.getFullYear());
                  break;
                case 'datepickerViewMonths':
                  tblEl.get(0).className = 'datepickerViewYears';
                  el.find('span').text((tmp.getFullYear()-6) + ' - ' + (tmp.getFullYear()+5));
                  break;
                case 'datepickerViewYears':
                  tblEl.get(0).className = 'datepickerViewDays';
                  el.find('span').text(formatDate(tmp, 'B, Y'));
                  break;
              }
            } else if (parentEl.parent().parent().is('thead')) {
              switch (tblEl.get(0).className) {
                case 'datepickerViewDays':
                  options.current.addMonths(parentEl.hasClass('datepickerGoPrev') ? -1 : 1);
                  break;
                case 'datepickerViewMonths':
                  options.current.addYears(parentEl.hasClass('datepickerGoPrev') ? -1 : 1);
                  break;
                case 'datepickerViewYears':
                  options.current.addYears(parentEl.hasClass('datepickerGoPrev') ? -12 : 12);
                  break;
              }
              fillIt = true;
            }
          } else if (parentEl.is('td') && !parentEl.hasClass('datepickerDisabled')) {
            switch (tblEl.get(0).className) {
              case 'datepickerViewMonths':
                options.current.setMonth(tblEl.find('tbody.datepickerMonths td').index(parentEl));
                options.current.setFullYear(parseInt(tblEl.find('thead th.datepickerMonth span').text(), 10));
                options.current.addMonths(Math.floor(options.calendars/2) - tblIndex);
                tblEl.get(0).className = 'datepickerViewDays';
                break;

              case 'datepickerViewYears':
                options.current.setFullYear(parseInt(el.text(), 10));
                tblEl.get(0).className = 'datepickerViewMonths';
                break;

              default:
                var value = parseInt(el.text(), 10);
                tmp.addMonths(tblIndex - Math.floor(options.calendars/2));
                if (parentEl.hasClass('datepickerNotInMonth')) {
                  tmp.addMonths(value > 15 ? -1 : 1);
                }
                tmp.setDate(value);

                switch (options.mode) {
                  case 'multiple':
                    value = (tmp.setHours(0,0,0,0)).valueOf();

                    if ($.inArray(value, options.date) > -1) {
                      $.each(options.date, function(nr, dat){
                        if (dat == value) {
                          options.date.splice(nr,1);
                          return false;
                        }
                      });
                    } else {
                      options.date.push(value);
                    }
                    break;

                  case 'range':
                    var valueAsStart = (tmp.setHours(0,0,0,0)).valueOf();
                    var valueAsEnd = (tmp.setHours(23,59,59,0)).valueOf();

                    if (options.forceNextSel !== '') {
                      if (options.forceNextSel == 'second') {
                        options.date[1] = valueAsEnd;
                        if (options.date[0] > valueAsStart) {
                          options.date[0] = valueAsStart;
                        }
                      } else {
                        options.lastSel = true;
                        options.date[0] = valueAsStart;
                        if (options.date[1] < valueAsEnd) {
                          options.date[1] = valueAsEnd;
                        }
                      }

                      options.forceNextSel = '';
                    } else {
                      if (!options.lastSel) {
                        options.date[0] = valueAsStart;
                      }

                      if (valueAsEnd < options.date[0]) {
                        options.date[1] = options.date[0] + 86399000;
                        options.date[0] = valueAsStart;
                      } else {
                        options.date[1] = valueAsEnd;
                      }

                      options.lastSel = !options.lastSel;
                    }
                    break;

                  default:
                    options.date = tmp.valueOf();
                    break;
                }
                break;
            }
            fillIt = true;
            changed = true;
          }

          if (fillIt) {
            fill(this);
          }

          if (changed) {
            options.onChange.apply(this, prepareDate(options));
          }
        }
        return false;
      },

      prepareDate = function (options) {
        var tmp;
        if (options.mode == 'single') {
          tmp = new Date(options.date);
          return [formatDate(tmp, options.format, true), tmp, options.el];
        } else {
          tmp = [[],[], options.el];
          $.each(options.date, function(nr, val){
            var date = new Date(val);
            tmp[0].push(formatDate(date, options.format, true));
            tmp[1].push(date);
          });
          return tmp;
        }
      },

      getViewport = function () {
        var m = document.compatMode == 'CSS1Compat';
        return {
          l : window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
          t : window.pageYOffset || (m ? document.documentElement.scrollTop : document.body.scrollTop),
          w : window.innerWidth  || (m ? document.documentElement.clientWidth : document.body.clientWidth),
          h : window.innerHeight || (m ? document.documentElement.clientHeight : document.body.clientHeight)
        };
      },

      isChildOf = function(parentEl, el, container) {
        if (parentEl == el) {
          return true;
        }
        if (parentEl.contains) {
          return parentEl.contains(el);
        }
        if ( parentEl.compareDocumentPosition ) {
          return !!(parentEl.compareDocumentPosition(el) & 16);
        }
        var prEl = el.parentNode;
        while(prEl && prEl != container) {
          if (prEl == parentEl) {
            return true;
          }
          prEl = prEl.parentNode;
        }
        return false;
      },

      show = function () {
        var cal = $('#' + $(this).data('datepickerId'));
        if (!cal.is(':visible')) {
          var calEl = cal.get(0);
          fill(calEl);
          var options = cal.data('datepicker');
          options.onBeforeShow.apply(this, [cal.get(0)]);
          var pos        = $(this).offset();
          var viewPort   = getViewport();
          var top        = pos.top;
          var left       = pos.left;
          cal.css({
            visibility : 'hidden',
            display    : 'block'
          });
          layout(calEl);
          switch (options.position){
            case 'top':
              top -= calEl.offsetHeight;
              break;
            case 'left':
              left -= calEl.offsetWidth;
              break;
            case 'right':
              left += this.offsetWidth;
              break;
            case 'bottom':
              top += this.offsetHeight;
              break;
          }
          if (top + calEl.offsetHeight > viewPort.t + viewPort.h) {
            top = pos.top  - calEl.offsetHeight;
          }
          if (top < viewPort.t) {
            top = pos.top + this.offsetHeight + calEl.offsetHeight;
          }
          if (left + calEl.offsetWidth > viewPort.l + viewPort.w) {
            left = pos.left - calEl.offsetWidth;
          }
          if (left < viewPort.l) {
            left = pos.left + this.offsetWidth;
          }
          cal.css({
            visibility : 'visible',
            display    : 'block',
            top        : top + 'px',
            left       : left + 'px'
          });
          if (options.onShow.apply(this, [cal.get(0)]) !== false) {
            cal.show();
          }
        }
        return false;
      },

      hide = function (ev) {
        if (ev.target != ev.data.trigger && !isChildOf(ev.data.cal.get(0), ev.target, ev.data.cal.get(0))) {
          if (ev.data.cal.data('datepicker').onHide.apply(this, [ev.data.cal.get(0)]) !== false) {
            ev.data.cal.hide();
          }
        }
      };

    // End of var statements

    return {
      init: function(options){
        options = $.extend({
          id : 'datepicker_' + parseInt(Math.random() * 1000, 10)
        }, defaults, options || {});

        options.calendars = Math.max(1, parseInt(options.calendars,10)||1);
        options.mode = /single|multiple|range/.test(options.mode) ? options.mode : 'single';

        return this.each(function() {
          if (!$(this).data('datepicker')) {
            options.el = this;

            if (options.date.constructor == String) {
              options.date = parseDate(options.date, options.format);
              options.date.setHours(0,0,0,0);
            }

            if (options.mode != 'single') {
              if (options.date.constructor != Array) {
                options.date = [options.date.valueOf()];
                if (options.mode == 'range') {
                  options.date.push(((new Date(options.date[0])).setHours(23,59,59,0)).valueOf());
                }
              } else {
                for (var i = 0; i < options.date.length; i++) {
                  options.date[i] = (parseDate(options.date[i], options.format).setHours(0,0,0,0)).valueOf();
                }

                if (options.mode == 'range') {
                  options.date[1] = ((new Date(options.date[1])).setHours(23,59,59,0)).valueOf();
                  options.lastSel = false;
                }
              }
            } else {
              options.date = options.date.valueOf();
            }

            if (!options.current) {
              options.current = new Date();
            } else {
              options.current = parseDate(options.current, options.format);
            }

            options.current.setDate(1);
            options.current.setHours(0,0,0,0);
            $(this).data('datepickerId', options.id);

            var cal, cnt, html;
            cal = $(tpl.wrapper).attr('id', options.id).bind('click', click).data('datepicker', options);
            html = '';

            if (options.className) {
              cal.addClass(options.className);
            }

            for (var j = 0; j < options.calendars; j++) {
              cnt = options.starts;

              if (j > 0) {
                html += tpl.space;
              }

              html += tmpl(tpl.head.join(''), {
                week     : options.locale.weekMin,
                prev     : options.prev,
                next     : options.next,
                day1     : options.locale.daysMin[(cnt++)%7],
                day2     : options.locale.daysMin[(cnt++)%7],
                day3     : options.locale.daysMin[(cnt++)%7],
                day4     : options.locale.daysMin[(cnt++)%7],
                day5     : options.locale.daysMin[(cnt++)%7],
                day6     : options.locale.daysMin[(cnt++)%7],
                day7     : options.locale.daysMin[(cnt++)%7],
                position : j,
                maxPos   : options.calendars - 1
              });
            }

            cal
              .find('tr:first').append(html)
              .find('table').addClass(views[options.view]);

            fill(cal.get(0));

            if (options.flat) {
              var fullDatePicker = $('#datepicker-controls').tmpl();
              fullDatePicker.find('.datepicker-datepicker').append(cal);

              if (options.parentContainer){
                fullDatePicker.appendTo($(options.parentContainer));
              } else {
                fullDatePicker.appendTo(this).show().css('position', 'relative');
              }
            } else {
              cal.appendTo(document.body);
              $(this).bind(options.eventName, show);
            }

            options.onComplete();
          }
        });
      },

      showPicker: function() {
        return this.each( function () {
          if ($(this).data('datepickerId')) {
            show.apply(this);
          }
        });
      },

      hidePicker: function() {
        return this.each(function () {
          if ($(this).data('datepickerId')) {
            var cal = $('#' + $(this).data('datepickerId')).hide();

            cal.data('datepicker').onHide();
          }
        });
      },

      setActiveInput : function(input) {
        return this.each(function() {
          if ($(this).data('datepickerId')) {
            var cal = $('#' + $(this).data('datepickerId'));
            var options = cal.data('datepicker');
            options.forceNextSel = input;
          }
        });
      },

      setDate: function(date, shiftTo){
        return this.each(function(){
          if ($(this).data('datepickerId')) {
            var cal = $('#' + $(this).data('datepickerId'));
            var options = cal.data('datepicker');
            options.date = date;
            if (options.date.constructor == String) {
              options.date = parseDate(options.date, options.format);
              options.date.setHours(0,0,0,0);
            }
            if (options.mode != 'single') {
              if (options.date.constructor != Array) {
                options.date = [options.date.valueOf()];
                if (options.mode == 'range') {
                  options.date.push(((new Date(options.date[0])).setHours(23,59,59,0)).valueOf());
                }
              } else {
                for (var i = 0; i < options.date.length; i++) {
                  options.date[i] = (parseDate(options.date[i], options.format).setHours(0,0,0,0)).valueOf();
                }
                if (options.mode == 'range') {
                  options.date[1] = ((new Date(options.date[1])).setHours(23,59,59,0)).valueOf();
                  options.lastSel = false;
                }
              }
            } else {
              options.date = options.date.valueOf();
            }
            if (shiftTo) {
              options.current = new Date (options.mode != 'single' ? options.date[0] : options.date);
            }
            fill(cal.get(0));
          }
        });
      },

      getDate: function(formated) {
        if (this.size() > 0) {
          return prepareDate($('#' + $(this).data('datepickerId')).data('datepicker'))[formated ? 0 : 1];
        }
      },

      clear: function(){
        return this.each(function(){
          if ($(this).data('datepickerId')) {
            var cal = $('#' + $(this).data('datepickerId'));
            var options = cal.data('datepicker');
            if (options.mode != 'single') {
              options.date = [];
              fill(cal.get(0));
            }
          }
        });
      },

      fixLayout: function(){
        return this.each(function(){
          if ($(this).data('datepickerId')) {
            var cal = $('#' + $(this).data('datepickerId'));
            var options = cal.data('datepicker');
            if (options.flat) {
              layout(cal.get(0));
            }
          }
        });
      }
    };
  }();

  $.fn.extend({
    DatePicker               : DatePicker.init,
    DatePickerHide           : DatePicker.hidePicker,
    DatePickerShow           : DatePicker.showPicker,
    DatePickerSetDate        : DatePicker.setDate,
    DatePickerGetDate        : DatePicker.getDate,
    DatePickerClear          : DatePicker.clear,
    DatePickerLayout         : DatePicker.fixLayout,
    DatePickerSetActiveInput : DatePicker.setActiveInput
  });
})(jQuery);

(function() {
  var cache = {};

  this.tmpl = function tmpl(str, data) {
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] || tmpl(document.getElementById(str).innerHTML) :

      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +

        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +

        // Convert the template into pure JavaScript
        str
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      + "');}return p.join('');");

    // Provide some basic currying to the user
    return data ? fn(data) : fn;
  };
})();