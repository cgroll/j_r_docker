/*
 *  Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
/**
 * bkoChart
 * This is the output display component for displaying charts.
 */
(function() {
  'use strict';
  beaker.bkoDirective("Chart",
      ["flotr2ViewUtils",
        "bkCellMenuPluginManager",
        function(flotr2ViewUtils, bkCellMenuPluginManager) {
          var CELL_TYPE = "bko-chart";
          return {
            template: "<div class='tschartcontainer'></div>",
            controller: function($scope) {
              var model = $scope.model.getCellModel();
              $scope.options = {
                title: model.chart_title,
                selection: {mode: 'xy', fps: 30},
                xaxis: {
                  title: model.domain_axis_label,
                  mode: (model.type === "TimePlot") ? "time" : "normal"
                },
                yaxis: {
                  title: model.y_label,
                  scaling: model.rangeAxes[0]["use_log"] ? "logarithmic" : "linear"
                },
                shadowSize: 0
              };
              if (model.type === "TimePlot") {
                $scope.options.mouse = {
                  track: true,
                  relative: true,
                  trackFormatter: function(o) {
                    var n = parseFloat(o.x);
                    var d = new Date(n);
                    return "(" + d.toDateString() + "," + o.y + ")";
                  }
                };
              } else {
                $scope.options.mouse = {
                  track: true,
                  relative: true
                };
              }

              $scope.data = _.map(model.graphics_list, function(g) {
                return flotr2ViewUtils.fromGraphicsToData(g);
              });
              $scope.$watch('model.getCellModel()', function(model) {
                if (model) {
                  $scope.data = _.map(model.graphics_list, function(g) {
                    return flotr2ViewUtils.fromGraphicsToData(g);
                  });
                }
              }, true);

              $scope.$watch('data', function() {
                $scope.draw();
              });

              $scope.getShareMenuPlugin = function() {
                return bkCellMenuPluginManager.getPlugin(CELL_TYPE);
              };
              $scope.$watch("getShareMenuPlugin()", function() {
                var newItems = bkCellMenuPluginManager.getMenuItems(CELL_TYPE, $scope);
                $scope.model.resetShareMenuItems(newItems);
              });
            },
            link: function(scope, element, attrs) {
              var container = $(element).parent().find(".tschartcontainer")[0];
              scope.draw = function() {
                var options = _.extend({}, scope.options, scope.zoomOptions);
                Flotr.draw(container, scope.data, options);
              };

              var zoomMove = function(area) {
                if (area.xfirst < area.xsecond && area.yfirst > area.ysecond) {
                  scope.zoomOptions = {
                    xaxis: {min: area.x1, max: area.x2},
                    yaxis: {min: area.y1, max: area.y2}
                  };
                } else {
                  scope.zoomOptions = {};
                }
                scope.draw();
              };
              Flotr.EventAdapter.observe(container, 'flotr:select', zoomMove);
            }
          };
        }]);
  beaker.bkoFactory('flotr2ViewUtils', ["bkUtils", function(bkUtils) {
    return {
      argbToRgb: function(color) {
        if (typeof color === "string" && color.length === 9) {
          color = "#" + color.substr(3);
        }
        return color;
      },
      fromGraphicsToData: function(g) {
        var gData = {
          label: g.display_name,
          color: this.argbToRgb(g.color)
        };
        if (g.type === "Line") {
          gData.data = _.zip(g.x, g.y);
          gData.lines = {show: true};
        } else if (g.type === "Points") {
          gData.data = g.sizes ? _.zip(g.x, g.y, g.sizes) : _.zip(g.x, g.y);
          if (g.sizes) {
            gData.bubbles = {show: true, baseRadius: 0.5};
          } else {
            gData.points = {show: true, shadowSize: 0};
          }
        } else if (g.type === "Bars") {
          gData.data = _.zip(g.x, g.y);
          gData.bars = {
            show: true,
            horizontal: false,
            shadowSize: 0,
            barWidth: 0.5
          };
        }
        return gData;
      }
    };
  }]);
})();
