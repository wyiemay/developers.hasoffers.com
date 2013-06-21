/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.5-vsdoc.js"/>
//Function names cannot be the same as api controller names
//Requires jquery.blockUI.js
//options conform to
//{
//  api: <element which api has been initialized on>, <defaults to document
//  pager:<id of pager div>,
//  type: <string for model type in api ex:"Site">, <- optional only used if you are selecting all from one object
//  controller:<controller on api which has findAll function for the object>, <- optional defaults to Global
//  columns :{
//    <model field name>:{ <- field name is id if type is set otherwise it
//                should conform to "<tablename>.<fieldname>"
//                This enables us to order columns from different
//                tables to the same
//      name:<display name>,
//      editable:<true,false>,
//      cssClass:<string for column class>,
//      title: <true,false,string,function>
//    }
//  },
//  caption:<grid caption>,
//  defaultSort:<default column to sort by>",
//  enabledelete: <true,false>,
//  columnTitles: <true,false>, // turns cell titles off/on, takes deference to column model.title option.
//}
(function ($) {

  var methods = {
    init: function (options) {

      return this.each(function()
      {
        var $this = $(this),
          data = $this.data('grid');

        // If the plugin hasn't been initialized yet
        if (!data) { // setup grid

          var _defaults = {
              target: $this,
              enabledelete: false,
              pager: '',
              type: '',
              caption: '',
              defaultSort: 'id'
            },
            session = options.sessionStorageService.get('hasGridSession') || {},
            sessionDefaults = session[options.$location.$$path],
            propDefaults = {};

          // setup simple search if necessary
          if (options.simpleSearch)
          {
            var cont = $(options.simpleSearch.container);

            cont.empty().append($('#grid-simple-search').tmpl([{}]));
            var btn = cont.find('a'),
              inp = cont.find('input'),
              clr = cont.find('.search-clear span'),
              inpCont = cont.find('.search-inputs');

            btn.unbind('click');
            inp.unbind('keypress').unbind('keyup');
            clr.unbind('click');

            inp.keypress( function(e)
            {
              if (e.keyCode == $.ui.keyCode.ENTER)
              {
                $this.grid('simpleSearch');
              }
            });

            inp.keyup( function()
            {
              clr.fadeIn();
              if ($.trim($(this).val()) === "") {
                clr.fadeOut();
              }
            });

            clr.click(function() {
              inp.val("");
              $this.grid('simpleSearch');
              $(this).hide();
            });

            btn.click(function()
            {
              inpCont.animate( { width: 'toggle' }, 200, function(){
                inp.show().focus();
              });
            });
          }

          var bindWatch = false ;
          // process hash watch vars
          if (options.filterOnHashChange)
          {
            var hcFilter = {},
              current = options.$location.$$path || {},
              filter = [];
            _.each(options.filterOnHashChange, function(fNfo,k)
            {
              hcFilter[k] = current[k] || '' ;
              if (hcFilter[k] !== "")
              {
                filter[filter.length] = fNfo.tpl.format(fNfo.field, hcFilter[k]);
              }
            });
            if (filter.length > 0)
            {
              if (options.defaultFilter && options.defaultFilter.length > 0)
              {
                options.defaultFilter += ' AND ' ;
              }
              else if (!options.defaultFilter)
              {
                options.defaultFilter = '' ;
              }
              options.defaultFilter += filter.join(' AND ');
            }
            $this.data('hcCurrent', hcFilter);
            bindWatch = true ;
          }

          if (!options.noPageHistory)
          {
            /* @TODO determine how to implement
            bindWatch = true ;
            // determine what page is being requested, if any
            if($.main.hash.properties && $.main.hash.properties.page)
            {
              propDefaults.gridOptions = {"page" : $.main.hash.properties.page};
            }
            */
          }

          if (bindWatch)
          {
            gridWatch.register($this);
          }

          var ext = $.extend(true, _defaults, options, sessionDefaults, propDefaults);

          $this.data('grid', ext);
          $this.grid("getGrid");
        }
      });
    },
    setDefaultFilter:function(filter, pageData)
    {
      var data = $(this).data('grid');
      if(data.defaultFilter)
      {
        data.defaultFilter = filter;
        $(this).data('grid',data);
        $(this).trigger("reloadGrid", pageData);
      }
    },

    destroy: function () {

      return this.each(function()
      {
        var $this = $(this),
          data = $this.data('grid');

        // Namespacing FTW
        if(data && data.page)
        {
          data.page.remove();
        }
        $this.removeData('grid');
      });

    },
    getGrid: function () {
      return this.each(function () {
        var $this = $(this),
        dataInstance = $this.data('grid'),
        pager = dataInstance.pager,
        type = dataInstance.type,
        columns = dataInstance.columns,
        caption = dataInstance.caption,
        defaultSort = dataInstance.defaultSort,
        buildGrid = function (data) {
          var fields = {},
          columnModel = [],
          fieldDefinitions = data.fields,
          enums = data.enums,
          primary_key = data.primary_key,
          editing = false;
          dataInstance.classDefinition = data;
          // process into valid fields
          dataInstance.validFields = _.keys(data.fields);

          $this.data('grid', dataInstance);

          // declare functions
          var colsettingLinkFn = function (cellvalue, options, rowObject) {
            var formatOptions = options.colModel.formatoptions;
            return '<a href="' + (formatOptions.linkUrl ? formatOptions.linkUrl.replace("{value}", cellvalue) : cellvalue) + '">' + (formatOptions.linkText ? formatOptions.linkText : cellvalue) + '</a>';
          };

          var colsettingTemplateFn = function (cellvalue, options, rowObject) {
            var formatOptions = options.colModel.formatoptions,
              ret = $('<div>').append($(formatOptions.template).tmpl([rowObject])).html();

            return $.trim(ret);
          };

          var choiceTypeFn = function (cellvalue, options, rowObject) {
            var searchoptions = options.colModel.searchoptions;
            return searchoptions.value[cellvalue] ? searchoptions.value[cellvalue] : cellvalue;
          };

          var datetimeDataInitFn = function(el) {
            $(el).datetimepicker({
              changeMonth: true,
              changeYear: true
            });
          };

          var numberTypeFormatterFn = function(cellvalue, options, rowObject) {
            returnVal = '';
            if (options.colModel.type == 'percent') {
              cellvalue = parseFloat(cellvalue).toFixed(2);
            }

            if (cellvalue > 999) {
              var parts = cellvalue.toString().split(".");
              // Add a comma after every group of 3 numbers
              parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              returnVal = parts.join(".");
            } else {
              returnVal = cellvalue;
            }

            if (options.colModel.type == 'percent') {
              returnVal += "%";
            }
            return returnVal;
          };

          var currencyTypeFormatterFn = window.currency.jgFmt;

          for (var _column in columns) {
            var colSetting = columns[_column],
            col = {
              label: colSetting.name,
              name: _column,
              index: _column,
              width: colSetting.width,
              search: _column,
              formatoptions: colSetting.formatoptions
            };

            // determines if title passed through colSetting or grid columnTitles
            // and applies it to column with preference toward colSetting

            if (!_.isUndefined(colSetting.title) || !_.isUndefined(dataInstance.columnTitles))
            {
              col.title = colSetting.title || dataInstance.columnTitles;
            }

            if (colSetting.search) {
              col.search = colSetting.search;
            }

            if(colSetting.cssClass) {
              col.classes = colSetting.cssClass;
            }

            if(colSetting.hidden) {
              col.hidden = colSetting.hidden;
            }

            if (!_.isUndefined(colSetting.sortable)) {
              col.sortable = colSetting.sortable;
            }

            if (!_.isUndefined(colSetting.resizable)) {
              col.resizable = colSetting.resizable ;
            }

            if (!_.isUndefined(colSetting.firstsortorder)) {
              col.firstsortorder = colSetting.firstsortorder;
            }

            var fieldDefinition = null,
              col_parts = _column.split("."),
              col_entity,
              col_field;

            if (col_parts.length == 2) {
              col_entity = col_parts[0];
              col_field = col_parts[1];

              if ( data.related_entities && data.related_entities[col_entity] && data.related_entities[col_entity].fields && data.related_entities[col_entity].fields[col_field]) {
                fieldDefinition = data.related_entities[col_entity].fields[col_field];
              }
            }

            if (!fieldDefinition ) {
              if (fieldDefinitions[_column]) {
                fieldDefinition = fieldDefinitions[_column];
              }
            }

            fields[_column] = _column;

            col.editoptions = {};
            col.searchoptions = {searchhidden:true};
            if(!fieldDefinition) {
              fieldDefinition = colSetting.definition || {type:"string"};
            }

            if (_.indexOf(['currency','float','integer','datetime','timestamp'], fieldDefinition.type) > -1) {
              if (!col.firstsortorder) {
                col.firstsortorder = 'desc';
              }
            }

            switch (fieldDefinition.type) {
              case 'string':
                col.stype = 'text'; col.searchoptions.sopt = ['eq', 'ne', 'bw', 'bn', 'ew', 'en', 'cn', 'nc'];
                if (colSetting.editable) {
                  editing = true;
                  if(col.classes && col.classes.length >0) {
                    col.classes = col.classes + " grid-editable";
                  } else {
                    col.classes = "grid-editable";
                  }
                  col.editable = true;
                  if (fieldDefinition.length) {

                    if (fieldDefinition.length > 500) {
                      col.edittype = 'textarea';
                      col.editoptions = { rows: "5", cols: "20" };
                    }
                    else
                    {
                      col.edittype = 'text';
                      col.editoptions = { maxlength: fieldDefinition.length };
                    }
                  }
                }
                break;
              case 'integer':
              case 'float':
              case "percent":
                col.stype = 'string';
                col.searchoptions.sopt = ['eq', 'ne', 'lt', 'le', 'gt', 'ge'];
                col.type = fieldDefinition.type;
                if (colSetting.editable) {
                  editing = true;
                  col.classes = "grid-editable";
                  col.editable = true;
                  col.edittype = 'text';
                }
                if (!colSetting.template) {
                  col.formatter = numberTypeFormatterFn;
                }
                break;
              case 'choice':
                col.stype = 'select';
                col.formatter = choiceTypeFn ;

                col.searchoptions.sopt = ['eq', 'ne'];
                var values;
                if(fieldDefinition.enumName) {
                  values = enums[fieldDefinition.enumName];
                } else {
                  values = {};
                  for(var value in fieldDefinition.values) {
                    values[value] = fieldDefinition.values[value].display;
                  }
                }
                col.searchoptions.value = values;

                if (colSetting.editable) {
                  editing = true;
                  col.classes = "grid-editable";
                  col.editable = true;
                  col.edittype = 'select';
                  col.editoptions.value = values;
                }
                break;

              case 'date':
              case 'datetime':
              case 'timestamp':
              case 'daterelative':
                if (fieldDefinition.type == "daterelative") {
                  col.formatter = window.Formatter.formatDateRelative;
                  col.stype = 'string';
                } else {
                  col.searchoptions.dataInit = datetimeDataInitFn;
                  col.stype = 'date';
                }

                col.searchoptions.sopt = ['eq', 'ne', 'lt', 'le', 'gt', 'ge'];
                if (colSetting.editable) {
                  editing = true;
                  col.classes = "grid-editable";
                  col.editable = true;
                  col.edittype = 'text';
                }
                break;

              case "currency" :
                col.stype = "text";
                col.searchoptions.sopt = ['eq', 'ne', 'bw', 'bn', 'ew', 'en', 'cn', 'nc'];
                if (colSetting.editable) {
                  editing = true;
                  col.classes = "grid-editable";
                  col.editable = true;
                  //col.edittype  = 'text';
                }
                var formatCur = true ;

                if (!colSetting.template && formatCur) {
                  col.formatter = currencyTypeFormatterFn;
                }
                break;

              case "enum" :
                col.enumValues = fieldDefinition.values;
                col.formatter = function(cellvalue, options, rowObject) {
                  if (!_.isUndefined(options.colModel.enumValues[cellvalue])) {
                    return options.colModel.enumValues[cellvalue];
                  } else {
                    return cellvalue;
                  }
                };
                break;

              default:
                col.stype = "text";
                col.searchoptions.sopt = ['eq', 'ne', 'bw', 'bn', 'ew', 'en', 'cn', 'nc'];
                if (colSetting.editable) {
                  editing = true;
                  col.classes = "grid-editable";
                  col.editable = true;
                  //col.edittype  = 'text';
                }
                break;
            }

            if (colSetting.link) {
              col.formatoptions = $.extend(col.formatoptions, {linkUrl: colSetting.linkUrl, linkText: colSetting.linkText});
              col.formatter = colsettingLinkFn;
            } else if(colSetting.template) {
              col.formatoptions = $.extend(col.formatoptions, {template:colSetting.template});
              col.formatter = colsettingTemplateFn;
            }

            if (colSetting.formatter) col.formatter = colSetting.formatter;
            if (colSetting.fixed) col.fixed = colSetting.fixed ;
            columnModel.push(col);
          }

          dataInstance.fields = fields;
          dataInstance.primary_key = primary_key;
          $this.data('grid', dataInstance);
          if (editing) {
            columnModel.push({
              "name"      : "actions",
              "index"     : primary_key,
              "label"     : "Actions",
              "formatter" : methods.gridButtons,
              "editable"  : false,
              "sortable"  : false,
              "resizable" : false,
              "cellEdit"  : false,
              "width"     : 60
            });
          }
          var sort = defaultSort.match(/(\w+[\.]?\w*)[ ]?(asc|desc)?/),
            gridoptions = {
              datatype: methods.getData,
              jsonReader: {
                root: "rows",
                page: "page",
                total: "totalPages",
                records: "records",
                repeatitems: false,
                id: "0"
              },

              cellEdit: true,
              cellsubmit: "clientArray",
              afterSaveCell: function (rowid, cellname, value, iRow, iCol) {
                $this.grid("showGridSaveButton", rowid);
              },
              colModel: columnModel,
              sortname: sort[1],
              sortorder: sort[2]?sort[2]:"asc",
              pager: pager,
              toppager:false,
              pginput: true,
              height: "100%",
              width: "100%",
              altRows: true,
              altclass: "alt-row",
              hidegrid: false,
              rowList: [10, 20, 50, 100, 150, 200],
              search: {
                caption: "Filter"
              },
              rowNum: 20,
              viewrecords: true,
              caption: (caption ? caption : ""),
              autowidth: true,
              resizeStart : function(e,idx) { $this.grid('resizeStart', e, idx); },
              resizeStop : function(nWidth,idx) { $this.grid('resizeStop', nWidth, idx); },
              onPaging : function(btn) {
                $this.grid('pageChange', btn);
              },
              onSortCol : function(idx, iCol, sortOrd){ $this.grid('sortChange', this, idx, iCol, sortOrd);},
              gridComplete : function() {
                $this.trigger('gridComplete', $($this[0]).data('currentDataSet'));
              }
            };
          if(dataInstance.gridOptions)
            $.extend(true,gridoptions,dataInstance.gridOptions);

          $this.jqGrid(gridoptions).navGrid(pager, {
            "edit": false,
            "cloneToTop":true,
            "add": false,
            "del": false,
            "search": true,
            "refresh": true,
            "view": false,
            "excel": false,
            "pdf": false,
            "csv": false,
            "columns": true
          }, {}, {}, {}, { "drag": true, "closeAfterSearch": true, multipleSearch: true });
          $this.jqGrid('setShrinkToFit', false);
          $this.jqGrid('updateSortClass');
          if (editing) {
            $saveButton = $('<a title="Submit" class="saveGrid" style="display:none"><div style="float: left; " class="ui-pg-div ui-inline-save">' +
                    '<span class="ui-icon ui-icon-disk" onclick=""></span>' +
                  '</div>save changes</a>');

            $(pager + " td#pager_right").prepend($saveButton.clone().click(function () { $this.grid('saveRows'); }));
            $("#gbox_" + $this.attr("id") + " div.ui-jqgrid-titlebar").append($saveButton.clone().click(function () { $this.grid('saveRows'); }));
          }
          //$(document).main.resizeFrame(true);
          //$(".ui-pg-selbox option").append(" per page");
        };

        buildGrid(dataInstance.definition);

      });
    },
    gridButtons: function (cellvalue, options, cellobject) {
      var $this = $('#' + options.gid),
      data = $this.data('grid'),
      buttons = '<div class="buttons" style="margin-left:8px;">';

      if (data.enabledelete) {
        buttons += '<div title="Delete selected row" style="float: left; margin-left: 5px;  " class="ui-pg-div ui-inline-del" ' +
        'onclick="jQuery(\'#' + options.gid + '\').jqGrid(\'delGridRow\',\'' + options.rowID + '\');">' +
        '<span class="ui-icon ui-icon-trash"></span>' +
      '</div>';
      }
      buttons += '<div title="Submit" style="float: left; display: none; " class="ui-pg-div ui-inline-save">' +
      '<span class="ui-icon ui-icon-disk" onclick="$(\'#' + options.gid + '\').grid(\'saveRows\',\'' + options.rowId + '\');"></span>' +
    '</div>' +
    '<div title="Cancel" onclick="$(\'#' + options.gid + '\').grid(\'replaceRow\',\'' + options.rowId + '\',\'' + options.gid + '\');" style="float: left; margin-left: 5px; display: none; " class="ui-pg-div ui-inline-cancel">' +
      '<span class="ui-icon ui-icon-cancel" onclick=""></span>' +
    '</div></div>';

      return buttons;
    },
    showGridSaveButton: function (rowid) {

      var $this = $(this),
        data = $this.data('grid'),
        editingRows = data.editingRows,
        pager = data.pager;
      if (!editingRows) {
        editingRows = [];
      }
      editingRows[rowid] = [rowid];

      $(pager + " td#pager_right a.saveGrid").show();
      $("#gbox_" + $this.attr("id") + " div.ui-jqgrid-titlebar a.saveGrid").show();
      $($this.jqGrid("getInd", rowid, true)).find(".ui-inline-cancel").show();
      $($this.jqGrid("getInd", rowid, true)).find(".ui-inline-save").show();

      data.editingRows = editingRows;
      $this.data('grid', data);
    },
    hideGridSaveButton: function (rowid) {
      var $this = $(this),
        data = $this.data('grid'),
        editingRows = data.editingRows,
        pager = data.pager;

      editingRows.splice(rowid, 1);

      if (editingRows.length === 0) {
        $(pager + " td#pager_right a.saveGrid").hide();
        $("#gbox_" + $this.attr("id") + " div.ui-jqgrid-titlebar a.saveGrid").hide();
      }
      $($this.jqGrid("getInd", rowid, true)).find(".ui-inline-cancel").hide();
      $($this.jqGrid("getInd", rowid, true)).find(".ui-inline-save").hide();

      data.editingRows = editingRows;
      $this.data('grid', data);
    },
    replaceRow: function (rowId) {
      var $this = $(this),
        data = $this.data('grid');

      $this.grid('getData', {
        searchField: data.classDefinition.primary_key,
        searchString: rowId,
        searchOper: "eq",
        page: 1,
        rows: 20,
        sidx: data.classDefinition.primary_key,
        sord: "asc"
      }, function (data) {
        $this.setRowData(rowId, data.rows[0]);
        $this.grid("hideGridSaveButton", rowId);
      });

    },
    resizeStart : function(e,idx)
    {

    },
    resizeStop : function(nWidth, idx)
    {
      var $this = $(this),
        internals = $this.jqGrid('getInternals'),
        $t = internals[0],
        $p = internals[1],
        nwidth = $($t).width(),
        container = $($this).parents('.data-grid');

      $("#gbox_"+$.jgrid.jqID($p.id)).css("width",nwidth+"px");
      $("#gview_"+$.jgrid.jqID($p.id)).css("width",nwidth+"px");
      if ($p.pager)
      {
        $($p.pager).css("width",nwidth+"px");
      }
      /*if ($p.toppager)
      {
        $($p.toppager).css("width",nwidth+"px");
      }*/
      if ($p.toolbar[0] === true)
      {
        $($t.grid.uDiv).css("width",nwidth+"px");
        if($p.toolbar[1]=="both") {$($t.grid.ubDiv).css("width",nwidth+"px");}
      }
      if ($p.footerrow)
      {
        $($t.grid.sDiv).css("width",nwidth+"px");
      }

      $($t.grid.bDiv).css("width",nwidth+"px");
      $($t.grid.hDiv).css("width",nwidth+"px");

      if (nwidth < container.width())
      {
        container.css('overflow-y', 'hidden');
      }
      else
      {
        container.css('overflow-y', 'auto');
        if (idx === _.size($p.colModel) -1)
        {
          container.scrollLeft($($t.grid.hDiv).width());
        }
      }
    },
    sortChange : function($grid, idx, iCol, sortOrd)
    {
      // add sorted-column class to header and cells in that column
      $(this).jqGrid('updateSortClass', iCol);

      // run page change to force page number update
      $(this).grid('pageChange', 'default');
    },
    pageChange : function(btn, page)
    {

      var $this = $(this),
        data = $this.data('grid'),
        sess = JSON.parse(sessionStorage.getItem('hasGridSession') || "{}");
      if (data.noPageHistory) return ;
      if (!sess[data.$location.$$path])
      {
        sess[data.$location.$$path] = {};
      }

      // deal with number of rows change
      if (btn == "records")
      {
        if (!sess[data.$location.$$path].gridOptions)
        {
          sess[data.$location.$$path].gridOptions = {};
        }
        sess[data.$location.$$path].gridOptions.rowNum = $(this).getGridParam('rowNum');
        sessionStorage.setItem('hasGridSession', JSON.stringify(sess));
      }

      /*
      @TODO implement properties

      if (!$.main.hash.properties)
      {
        $.main.hash.properties = {};
      }
      $.main.hash.properties.page = page || $(this).getGridParam('page') ;
      */
      // set current hash change value to prevent page trigger
      var hcCurrent = $this.data('hcCurrent') || {} ;
      // @TODO // hcCurrent.page = $.main.hash.properties.page ;
      $this.data('hcCurrent', hcCurrent);
      // update hash
      // @TODO // window.location.hash = "#!"+$.main.hash.location+"+"+$.main.getHashPropertiesString();

    },
    hashChanged : function()
    {
      var $this = $(this),
        data = $this.data('grid');

      if (!data)
      {
        // grid is no longer available in the dom, destroy, return false to remove from hash watch
        $this.grid('destroy');
        return "remove" ;
      }
      else
      {

        var hcCurrent = $this.data('hcCurrent') || {},
          current = {},// @TODO // $.main.hash.properties || {},
          hcFilter = {},
          filter = [],
          options = data.filterOnHashChange || {},
          triggerChange = false;

        // handle filter-on-hash-change options
        _.each(options, function(fNfo,k)
        {
          hcFilter[k] = current[k] || '' ;
          if (hcFilter[k] !== "")
          {
            filter[filter.length] = fNfo.tpl.format(fNfo.field, hcFilter[k]);
          }
          else
          {
            filter[filter.length] = '';
          }

          if (hcFilter[k] != hcCurrent[k])
          {
            triggerChange = true ;
          }
        });

        // handle pagination

        if (hcCurrent.page != current.page)
        {
          hcFilter.page = current.page > 1 ? current.page : 1 ;
          triggerChange = true ;
        }
        $this.data('hcCurrent', hcFilter);

        if (!triggerChange) return;

        if (filter.length > 0)
        {
          filter = _.compact(filter);
          data.defaultFilter = filter.join(" AND ");
          $this.data('grid', data);
          $this.trigger("reloadGrid", [{page:hcFilter.page}]);
        }
        else
        {
          $this.trigger("reloadGrid", [{page:hcFilter.page}]);
        }

      }
      return true ;
    },
    simpleSearch : function()
    {
      var $this = $(this),
        data = $this.data('grid'),
        simpleOpts = data.simpleSearch,
        searchQuery = $(simpleOpts.container).find('input').val(),
        filters = _.extend(simpleOpts.filters||{}, {"groupOp":"OR","rules":[],"groups":[]}),
        searchFilter = {"simpleSearch" : false, "filters" : "", "page" : 1};

      if (searchQuery !== "")
      {
        _.each(simpleOpts.searchFields, function(field){
          filters.rules[filters.rules.length] = {"field" : field, "op" : "cn", "data" : searchQuery};
        });
        searchFilter.simpleSearch = true ;
        searchFilter.filters = filters ;
      }

      // trigger page back to 1
      $this.grid('pageChange', 'default', 1);
      data.searchFilter = searchFilter ;
      $(this).data('grid', data);
      $(this).trigger("reloadGrid");

    },

    updateDateRange : function(ranger)
    {
      var $this = $(this),
        data = $this.data('grid');

      if (data && ranger)
      {
        data.startDate = ranger.getStartDate();
        data.endDate = ranger.getEndDate();
        $this.trigger('reloadGrid');
      }
    },
    getData: function (postdata, callback) {
      var $this = $(this),
        data = $this.data('grid'),
        entity = data.classDefinition.entity,
        dataCall = data.dataCall,
        contData = $this.data('contData'),
        type = data.type,
        fields = data.fields,
        containParams = "",
        sort = {},
        filter = "",
        ops = ['eq', 'ne', 'lt', 'le', 'gt', 'ge', 'bw', 'bn', 'in', 'ni', 'ew', 'en', 'cn', 'nc'],
        opTranslate = ["{0} = '{1}'", "{0} <> '{1}'", "{0} < '{1}'", "{0} <= '{1}'", "{0} > '{1}'", ">=", "{0} like '{1}%'", "{0} not like '{1}%' ", '{0} in ({1})', '{0} not in ({1})', "{0} like '%{1}'", "{0} not like '%{1}'", "{0} like '%{1}%'", "{0} not like '%{1}%'"],
        rowKey = data.rowKey || null;

      // if no data, grid no longer exists in DOM
      if (!data) return;

      // if contData is present, but inactive, stop processing
      if (contData && contData.length > 0 && !contData.data('active')) {
        return;
      }

      var thisGrid = $this.parents(".data-grid");
      var findView = thisGrid.find(".ui-jqgrid .ui-jqgrid-view");

      //show spinner when grid is about to load
      thisGrid.addClass("loadingwindow");

      //check to see if no data message is there if it is remove it.
      var getNodata = thisGrid.find('h4.nodata');
      if (getNodata.length) {
          getNodata.remove();
      }

      if (data.searchFilter) {
        $.extend(true, postdata, data.searchFilter);
        if (data.searchFilter.page)
        {
          delete(data.searchFilter.page);
          $this.data('grid',data);
        }
      }

      if (postdata.searchField) {
        var sOpIndex = ops.indexOf(postdata.searchOper),
          svalue = postdata.searchString,
          sfield = type !== "" ? type + "." + postdata.searchField : postdata.searchField;

        if (postdata.searchOper == "ni" || postdata.searchOper == "in") {
          svalue = "'" + svalue.split(",").join(',') + "'";
        }

        filter += opTranslate[sOpIndex].format(sfield,svalue);
      }

      if (postdata.filters) {
        var filterData = _.isObject(postdata.filters) ? postdata.filters : $.parseJSON(postdata.filters),
                 filterDataItems = filterData.rules,
                 filterDataItem,
                 field = filterDataItem.field,
                 value = filterDataItem.data,
                 opIndex;

        _.each(filterDataItems, function(filterDataItem,field) {
          opIndex = ops.indexOf(filterDataItem.op);

          if (postdata.searchField) {
            field = postdata.searchField;
          }

          if(postdata.searchOper == "ni" || postdata.searchOper == "in") {
            value = "'" + value.split(",").join("','") + "'";
          }

          if(filter.length > 0) {
            filter += " " + filterData.groupOp + " ";
          }
          filter += opTranslate[opIndex].format(filterDataItem.field, filterDataItem.data);
        });
      }

      if (_.isObject(data.defaultFilter) && _.size(data.defaultFilter) > 0) {
        filter = data.defaultFilter;
      }

      if (postdata.containParams) {
        var containData = _.isObject(postdata.containParams) ? postdata.containParams : $.parseJSON(postdata.containParams),
                  containDataItems = containData.rules,
                  containDataItem,
                  opIndex;

        _.each(containDataItems, function(containDataItem,field) {
          opIndex = ops.indexOf(containDataItem.op);

          if(containParams.length > 0) {
            containParams += " " + containData.groupOp + " ";
          }
          containParams += opTranslate[opIndex].format(containDataItem.field, containDataItem.data);
        });
      }

      // defaultContainParams populates the "contain" parameter sent to the dataCall(params)
      if (_.isObject(data.defaultContainParams) && _.size(data.defaultContainParams) > 0) {
        containParams = data.defaultContainParams;
      }

      sort[postdata.sidx] = postdata.sord;

      $.extend(fields,data.extraFields,data.groups);

      // @TODO refactor fields object to fields array with this if/else, it can probably be done better
      if (data.ignoreUndefined) {
        fields = _(fields).chain()
          .reject( function(val) { return _.indexOf(data.validFields,val) == -1; } )
          .toArray()
          .value();
      } else {
        fields = _(fields).chain()
          .toArray()
          .value();
      }

      if (data.defaultLimit) {
        postdata.rows = data.defaultLimit;
      }

      var params = {
        page       : postdata.page,
        limit      : postdata.rows,
        fields     : fields,
        sort       : sort,
        filters    : filter,
        contain    : containParams,
        groups     : data.groupBy,
        timeframe  : data.timeframe === "" ? undefined : data.timeframe,
        timestamp  : data.timestamp === "" ? undefined : data.timestamp,
        data_start : data.startDate === "" ? undefined : data.startDate,
        data_end   : data.endDate === "" ? undefined : data.endDate
      };

      if (data.hour_offset) {
        params.hour_offset = data.hour_offset;
      }

      $this.data('downloadParams', {"params":_.clone(params),"dataCall":dataCall});

      var onSuccess = function(jsDataReturn, status, headers, config) {
        // See gridComplete method where we add a thead. This needs to be removed before displaying new data or jqGrid freaks out
        $this.find('thead').remove();

        var jsData = [],
          page = jsDataReturn.page,
          count = jsDataReturn.count,
          totalPages = jsDataReturn.pageCount || 1,
          thegrid = $this[0];

        if (!_.isObject(jsDataReturn)) {
          jsDataReturn = {};
        }

        // Some API methods don't return a .data and instead their data is in the root
        if (!_.isObject(jsDataReturn.data)) {
          page = 1;
          count = _.size(jsDataReturn);
          jsDataReturn = {data:jsDataReturn};
        }

        //strip entity from return if necessary
        _.each(jsDataReturn.data, function(rec, id) {
          if (entity && rec[entity]){
            var recRow = rec[entity];
            // I don't believe this delete is necessary, commenting out
            // If this causes issues, we'll add it back
            // This delete causes issues if you attempt to intercept the data from the response.
            // See: offerCreatives::getDataCall() for an example
            //  - Josh Schumacher (1/10/13)
            //delete(rec[entity]);
            jsData[jsData.length] = $.extend(recRow, rec);
          } else {
            jsData[jsData.length] = rec;
          }
        });

        $($this[0]).trigger("gridDataChange",{data:jsData,params:params,count:count,totalPages:totalPages,currentPage:page});
        $($this[0]).data('currentDataSet', {data:jsData,params:params,count:count,totalPages:totalPages,currentPage:page});

        if ($.isFunction(callback)) {
          callback();
        }

        gridData =  {
          rows:jsData,
          records: count,
          page: postdata.page,
          totalPages: totalPages > 0 ? totalPages : 1
        };

        thegrid.addJSONData(gridData);
        thisGrid.removeClass("loadingwindow");

        // No data found so we notify user
        if (gridData.rows.length === 0){
          if (thisGrid.find('.nodata').length === 0  ) {
            var noResultsMsg = '<h4>No results found</h4>',
              noResultsReturn, noResultsCallback;
            if (_.isFunction(data.noResultsFn))
            {
              noResultsReturn = data.noResultsFn();
              if (_.isString(noResultsReturn)) {
                noResultsMsg = noResultsReturn;
              } else if (_.isObject(noResultsReturn)) {
                noResultsMsg = noResultsReturn.message;
                noResultsCallback = noResultsReturn.callback;
              }
            }
            findView.after(['<div class="no-data"><div class="no-data-available">', noResultsMsg, '</div></div>'].join(''));
            if (_.isFunction(noResultsCallback)){
              noResultsCallback();
            }
          }
        }
      };

      var onError = function() {
        // stops loading graphic
        data.$rootScope.decrementLoading();
      };

      var promise = dataCall(params);

      if (promise.success) {
        promise.success(onSuccess);
        promise.error(onError);
      } else {
        promise.then(onSuccess, onError);
      }
    },

    saveRows: function (rowId)
    {
      var $this = $(this),
      data = $this.data('grid'),
      rows = [],
      editingRows = data.editingRows,
      changedCells = $this.jqGrid("getChangedCells", "dirty");

      for (var row = 0; row < changedCells.length; row++) {
        if (!rowId) {
          rows.push(changedCells[row]);
        }
        else if (changedCells[row][data.primary_key] == rowId) {
          rows.push(changedCells[row]);
        }
      }

      $this.grid('updateData', rows, function (response) {
        $this.find('.grid-validate').removeClass('grid-validate');
        for (var row in response) {
          if (response[row].error) {
            //TODO: Tweak validation to be more useful
            var errors = response[row].error;
            for (var i = 0; i < errors.length; i++) {
              var field = errors[i].attribute_name;
              $cell = $this.setCell(row, field, "", 'grid-validate');
            }
          }
          else {
            $this.grid("hideGridSaveButton", row);
          }
        }
      });
    },

    highlightRow : function(_id)
    {
      var $this = this;
      $this.jqGrid('highlightRow', _id);
    },
    updateData: function (postdata, callback) {
      var $this = $(this),
        data  = $this.data('grid');
    },
    setController: function(controller)
    {
      var $this = $(this);
      var data = $this.data('grid');
      data.controller = controller;
      $this.data('grid', data);
      $this.grid.trigger('refresh');
    },
    downloadCSV : function(ranger, title)
    {
      var $this = $(this),
        data = $this.data('grid'),
        downloadData = this.data('downloadParams'),
        url = downloadData.controller + 'ExportQueue',
        params = _.clone(downloadData.params);

      title = title || $("#page-title").text();

      // add to title if necessary
      if (ranger)
      {
        var st = ranger.getStartDate(),
          ed = ranger.getEndDate();
        if (st == ed)
        {
          title += ': <span class="date-display">{0}</span>'.format(st);
        }
        else
        {
          title += ': <span class="date-display">{0} - {1}</span>'.format(st, ed);
        }

      }
      else
      {
        title += " Report" ;
      }

      _.each(params, function(v,k)
      {
        if (_.indexOf(['limit','page'],k) > -1 || _.isUndefined(v) || _.isEmpty(v))
        {
          delete(params[k]);
        }
      });

      params.limit = parseInt($this.jqGrid('getGridParam', 'records'), 10) + 1000;
      params.format = 'csv';
      // url += '?' + $.param(params);

      window.downloadQueue.add(url, params, title);
      /*
      var d = new Date(),
        exportWindow = window.open("", "export_targ"+d.getTime(), "location=0,status=1,scrollbars=1,width=400,height=300");

      $.when(
        apiInstance.api(url, params)
      ).done( function (exportJobId) {
      //  blocked by popup blocker due to slight delay, open window and change location
      //  window.open("/Export/download/"+exportJobId, 'download_targ');

        exportWindow.location = "/Export/download/"+exportJobId;
      });
      */
    },

    /**
     * resizes grid to arg width or parents('.data-grid') width
     * @param  {mixed} newWidth width size or undefined
     * @return {void}
     */
    resizeGrid : function(newWidth) {
      if (_.isUndefined(newWidth)) {
        var gParent = $(this).parents('.data-grid');
        if (gParent.length > 0){
          newWidth = gParent.width();
        }
      }
      if (newWidth) {
        $(this).jqGrid('setGridWidth', newWidth, true);
      }
    }
  };
  $.fn.grid = function (method) {
    // clear call if parent element .subcont not active
    // @TODO, implement race condition prevention
    /*
    var $this = $(this),
      contData = $this.data('contData') ;
    if (!contData)
    {
      contData = $this.parents('.subcont') ;
      $this.data('contData', contData);
    }
    if (contData.length > 0)
    {
      if (!contData.data('active'))
      {
        return ;
      }
    }
     */
    var $this = $(this);

    if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    }
    else if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    }
    else {
      alert('no such function on grid.js');
    }

  };
  var gridWatch = {
    isInit : false,
    grids : [],
    register : function(_el)
    {
      // bind hash event to this.trigger
      // added this inside register to allow main to initialize first, and we only use it when needed.
      if (!this.isInit)
      {
        this.isInit = true ;
        $(document).main('bindHashWatch', null, $.proxy(this.trigger, this));
      }
      this.grids[this.grids.length] = _el ;
    },
    trigger : function(e)
    {

      var del = [], $this = this, triggerChange;
      _.each($this.grids, function($grid, k)
      {
        triggerChange = $grid.grid('hashChanged', e);
        if (triggerChange == "remove")
        {
          del[del.length] = k ;
        }

      });
      if (del.length > 0)
      {
        _.each(del, function(rm)
        {
          delete($this.grids[rm]);
        });
      }
    }
  };
  window.gridWatch = gridWatch;
})(jQuery);

var converted_currencies_and_rates = [];

function displayCurrencyConversionCell(column_obj, from_currency_code, exchange_rate, reverse_values ) {
  if (typeof(reverse_values)==='undefined') {
    reverse_values = false;
  }

  var needsTooltip = from_currency_code.toUpperCase() != 'USD' && !reverse_values && column_obj > 0,
    currency_display_local = currency.formatCurrency(column_obj, from_currency_code),
    currency_display_usd   = currency.formatCurrency(column_obj * exchange_rate, 'USD'),
    tooltip_tpl   = '* <span class="tooltip">'+currency_display_local+'</span>',
    tooltip_class = needsTooltip ? 'class="has-tooltip"' : '',
    main_value = reverse_values ? currency_display_local : currency_display_usd,
    return_string = '<span ' + tooltip_class + '>' + main_value
  ;
  if(needsTooltip) {
    return_string += tooltip_tpl;
    converted_currencies_and_rates[from_currency_code] = exchange_rate;
  }
  return_string += "</span>";
  return return_string;
}
