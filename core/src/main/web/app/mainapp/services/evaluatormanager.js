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
 * Module bk.evaluatorPluginManager
 */
(function() {
  'use strict';
  var module = angular.module('bk.evaluatorManager', ['bk.utils', 'bk.evaluatePluginManager']);

  module.factory('bkEvaluatorManager', function (bkUtils, bkEvaluatePluginManager) {
    var evaluators = {};
    var loadingInProgressEvaluators = [];
    return {
      reset: function() {
        evaluators = {};
      },
      removeEvaluator: function(plugin) {
        for (var key in evaluators) {
          var e = evaluators[key];
          if (e.pluginName === plugin) {
            if (_.isFunction(e.exit)) {
              e.exit();
            }
            delete evaluators[key];
          }
        }
      },
      newEvaluator: function(evaluatorSettings) {
	    if(loadingInProgressEvaluators.indexOf(evaluatorSettings)>0)
	      return; // already loading...
	    loadingInProgressEvaluators.push(evaluatorSettings);
        return bkEvaluatePluginManager.getEvaluatorFactory(evaluatorSettings.plugin)
            .then(function(factory) {
              if(factory !== undefined && factory.create !== undefined)
                return factory.create(evaluatorSettings);
              else
                return undefined;
            }, function(err) {
              return undefined;
            })
            .then(function(evaluator) {
              if(evaluator === undefined)
                return undefined;
              if (_.isEmpty(evaluatorSettings.name)) {
                if (!evaluators[evaluator.pluginName]) {
                  evaluatorSettings.name = evaluator.pluginName;
                } else {
                  evaluatorSettings.name = evaluator.pluginName + "_" + bkUtils.generateId(6);
                }
              }

              if (!evaluatorSettings.view) {
                evaluatorSettings.view = {};
              }
              if (!evaluatorSettings.view.cm) {
                evaluatorSettings.view.cm = {};
              }
              evaluatorSettings.view.cm.mode = evaluator.cmMode;

              evaluators[evaluatorSettings.name] = evaluator;
              return evaluator;
            })
            .finally(function() {
              var index = loadingInProgressEvaluators.indexOf(evaluatorSettings);
              loadingInProgressEvaluators.splice(index, 1);
            });
      },
      getEvaluator: function(evaluatorId) {
        return evaluators[evaluatorId];
      },
      getVisualParams: function(name) {
        if (evaluators[name] === undefined)
          return bkEvaluatePluginManager.getVisualParams(name);
        var v = { };
        var e = evaluators[name];
        var f = bkEvaluatePluginManager.getVisualParams(name);
        if(e.bgColor !== undefined)
          v.bgColor = e.bgColor;
        else if (f !== undefined && f.bgColor !== undefined)
          v.bgColor = f.bgColor;
        else
          v.bgColor = "";
      
        if(e.fgColor !== undefined)
          v.fgColor = e.fgColor;
        else if (f !== undefined && f.fgColor !== undefined)
          v.fgColor = f.fgColor;
        else
          v.fgColor = "";
      
        if(e.borderColor !== undefined)
          v.borderColor = e.borderColor;
        else if (f !== undefined && f.borderColor !== undefined)
          v.borderColor = f.borderColor;
        else
          v.borderColor = "";

        if(e.shortName !== undefined)
          v.shortName = e.shortName;
        else if (f !== undefined && f.shortName !== undefined)
          v.shortName = f.shortName;
        else
          v.shortName = "";

        return v;
      },
      getAllEvaluators: function() {
        return evaluators;
      },
      getLoadingEvaluators: function() {
        return loadingInProgressEvaluators;
      },
      exitAndRemoveAllEvaluators: function() {
        _.each(evaluators, function(ev) {
          if (ev && _.isFunction(ev.exit)) {
            ev.exit();
          }
        });
        evaluators = {};
      }
    };
  });
})();
