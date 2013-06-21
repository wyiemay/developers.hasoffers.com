/**
 * HasCharts theme for Highcharts JS
 * @author Tronvig
 */
(function() {
  'use strict';

  var fontFamily = [
    'HelveticaNeue-Light',
    'Helvetica Neue Light',
    'Helvetica Neue',
    'Source Sans Pro',
    'Helvetica',
    'Arial',
    'Lucida Grande',
    'sans-serif'
  ].join(', ');

  window.Highcharts.theme = {
    colors : [
      '#2585c7',
      '#ed6400',
      '#66bc29',
      '#9900cc',
      '#003399',
      '#33cc99',
      '#990066',
      '#ffcc00',
      '#ff0099',
      '#66ccff'
    ],

    chart : {
      borderWidth         : 0,
      plotBackgroundColor : '#ffffff',
      plotShadow          : false,
      plotBorderWidth     : 0,
      backgroundColor     : 'transparent'
    },
    xAxis : {
      gridLineWidth      : 1,
      gridLineColor      : '#f0f0f0',
      alternateGridColor : '#f7f7f7',
      labels : {
        style : {
          color      : '#999999',
          fontSize   : '11px',
          fontFamily : fontFamily
        }
      },
      title : {
        title : '',
        style : {
          color      : '#333',
          fontWeight : 'bold',
          fontSize   : '12px',
          fontFamily : fontFamily

        }
      }
    },
    yAxis : {
      lineColor     : '#f0f0f0',
      gridLineColor : '#f0f0f0',
      lineWidth     : 1,
      tickWidth     : 1,
      tickColor     : '#f0f0f0',
      labels : {
        style: {
          color      : '#999999',
          fontSize   : '11px',
          fontFamily : fontFamily
        }
      },
      title: {
        text : '',
        margin : 10,
        style: {
          color      : '#999999',
          fontWeight : 'normal',
          fontSize   : '12px',
          fontFamily : fontFamily
        }
      }
    },
    legend : {
      enabled : false,
      itemStyle : {
        fontSize   : '9pt',
        fontFamily : fontFamily,
        color      : 'black'

      },
      itemHoverStyle : {
        color : '#039'
      },
      itemHiddenStyle : {
        color : 'gray'
      }
    },
    exporting : {
      enabled : false
    },
    title : {
      text : ''
    },
    tooltip : {
      shared : true,
      formatter : function() {
        return 'The value for <b>'+ this.x +'</b> is <b>'+ this.y +'</b>';
      },
      crosshairs   : true,
      borderRadius : 4,
      shadow : {
        color   : '#dedede',
        width   : 2,
        opacity : 0.4,
        offsetY : 0,
        offsetX : 0
      },
      borderWidth : 1,
      backgroundColor : {
        linearGradient : [0, 0, 0, 60],
        stops : [
          [0, '#ffffff'],
          [1, '#f0efef']
        ]
      },
      borderColor : '#dcdcdc',
      style : {
        color : '#333333'
      }
    },
    labels : {
      style : {
        color : '#99b'
      }
    },
    credits : {
      enabled : false
    },
    plotOptions : {
      line : {
        marker : {
          enabled : false
        },
        shadow : {
          color   : '#2585c7',
          width   : 4,
          opacity : 0.25,
          offsetY : 0,
          offsetX : 0
        },
        lineWidth : 2,
        states : {
          hover : {
            marker : {
              enabled : true
            }
          }
        }
      }
    }
  };

  // Apply the theme
  window.Highcharts.setOptions(Highcharts.theme);
})();