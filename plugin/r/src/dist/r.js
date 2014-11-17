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
 * R eval plugin
 * For creating and config evaluators that evaluate R code and update code cell results.
 */
define(function(require, exports, module) {
  'use strict';
  var PLUGIN_NAME = "R";
  var COMMAND = "r/rPlugin";

  var serviceBase = null;
  var subscriptions = {};

  var cometd = new $.Cometd();
  var initialized = false;
  var cometdUtil = {
    init: function() {
      if (!initialized) {
        cometd.unregisterTransport("websocket");
        cometd.init(serviceBase + "/cometd");
        initialized = true;
      }
    },
    subscribe: function(update_id, callback) {
      if (!update_id) {
        return;
      }
      if (subscriptions[update_id]) {
        cometd.unsubscribe(subscriptions[update_id]);
        subscriptions[update_id] = null;
      }
      var cb = function(ret) {
        callback(ret.data);
      };
      var s = cometd.subscribe('/object_update/' + update_id, cb);
      subscriptions[update_id] = s;
    },
    unsubscribe: function(update_id) {
      if (!update_id) {
        return;
      }
      if (subscriptions[update_id]) {
        cometd.unsubscribe(subscriptions[update_id]);
        subscriptions[update_id] = null;
      }
    },
    addStatusListener: function(cb) {
      cometd.addListener("/meta/connect", cb);
    }
  };
  var R = {
    pluginName: PLUGIN_NAME,
    cmMode: "r",
    background: "#C0CFF0",
    bgColor: "#8495BB",
    fgColor: "#FFFFFF",
    borderColor: "",
    shortName: "R",
    newShell: function(shellID, cb) {
      if (!shellID) {
        shellID = "";
      }
      bkHelper.httpPost(serviceBase + "/rest/rsh/getShell", { shellid: shellID })
        .success(cb)
        .error(function() {
          console.log("failed to create shell", arguments);
        });
    },
    evaluate: function(code, modelOutput, init) {
      var deferred = Q.defer();
      var self = this;
      var progressObj = {
        type: "BeakerDisplay",
        innertype: "Progress",
        object: {
          message: "submitting ...",
          startTime: new Date().getTime()
        }
      };
      modelOutput.result = progressObj;
      $.ajax({
        type: "POST",
        datatype: "json",
        url: serviceBase + "/rest/rsh/evaluate",
        data: {shellID: self.settings.shellID, code: code, init: !!init}
      }).done(function(ret) {
            var onUpdatableResultUpdate = function(update) {
              modelOutput.result = update;
              bkHelper.refreshRootScope();
            };
            var onEvalStatusUpdate = function(evaluation) {
              modelOutput.result.status = evaluation.status;
              if (evaluation.status === "FINISHED") {
                cometdUtil.unsubscribe(evaluation.update_id);
                modelOutput.result = evaluation.result;
                if (evaluation.result.update_id) {
                  cometdUtil.subscribe(evaluation.result.update_id, onUpdatableResultUpdate);
                }
                modelOutput.elapsedTime = new Date().getTime() - progressObj.object.startTime;
                deferred.resolve();
              } else if (evaluation.status === "ERROR") {
                cometdUtil.unsubscribe(evaluation.update_id);
                modelOutput.result = {
                  type: "BeakerDisplay",
                  innertype: "Error",
                  object: evaluation.result
                };
                modelOutput.elapsedTime = new Date().getTime() - progressObj.object.startTime;
                deferred.resolve();
              } else if (evaluation.status === "RUNNING") {
                progressObj.object.message = "evaluating ...";
                modelOutput.result = progressObj;
              }
              bkHelper.refreshRootScope();
            };
            onEvalStatusUpdate(ret);
            if (ret.update_id) {
              cometdUtil.subscribe(ret.update_id, onEvalStatusUpdate);
            }
          });
      return deferred.promise;
    },
    autocomplete: function(code, cpos, cb) {
      var self = this;
      $.ajax({
        type: "POST",
        datatype: "json",
        url: serviceBase + "/rest/rsh/autocomplete",
        data: {shellID: self.settings.shellID, code: code, caretPosition: cpos}
      }).done(function(x) {
            cb(x);
          });
    },
    exit: function(cb) {

      var self = this;
      $.ajax({
        type: "POST",
        datatype: "json",
        url: serviceBase + "/rest/rsh/exit",
        data: { shellID: self.settings.shellID }
      }).done(cb);
    },
    interrupt: function() {
      this.cancelExecution();
    },
    cancelExecution: function() {
      bkHelper.httpPost(serviceBase + "/rest/rsh/interrupt", {shellID: this.settings.shellID});
    },
    spec: {
      interrupt: {type: "action", action: "interrupt", name: "Interrupt"}
    },
    cometdUtil: cometdUtil
  };
  var shellReadyDeferred = bkHelper.newDeferred();
  var init = function() {
    bkHelper.locatePluginService(PLUGIN_NAME, {
        command: COMMAND,
        startedIndicator: "Server started",
        waitfor: "Started SelectChannelConnector",
        recordOutput: "true"
    }).success(function(ret) {
      serviceBase = ret;
      cometdUtil.init();
      var RShell = function(settings, doneCB) {
        var self = this;
        var setShellIdCB = function(id) {
          if (id !== settings.shellID) {
            // console.log("A new R shell was created.");
          }
          settings.shellID = id;
          self.settings = settings;
          if (bkHelper.hasSessionId()) {
            var initCode = "devtools::load_all(Sys.getenv('beaker_r_init'), " +
              "quiet=TRUE, export_all=FALSE)\n" +
              "beaker:::set_session('" + bkHelper.getSessionId() + "')\n";
            self.evaluate(initCode, {}, true).then(function () {
              if (doneCB) {
                doneCB(self);
              }});
          } else {
            if (doneCB) {
              doneCB(self);
            }
          }
        };
        if (!settings.shellID) {
          settings.shellID = "";
        }
        this.newShell(settings.shellID, setShellIdCB);
        this.perform = function(what) {
          var action = this.spec[what].action;
          this[action]();
        };
      };
      RShell.prototype = R;
      shellReadyDeferred.resolve(RShell);
    }).error(function() {
      console.log("failed to locate plugin service", PLUGIN_NAME, arguments);
      shellReadyDeferred.reject("failed to locate plugin service");
    });
  };
  init();

  exports.getEvaluatorFactory = function() {
    return shellReadyDeferred.promise.then(function(Shell) {
      return {
        create: function(settings) {
          var deferred = bkHelper.newDeferred();
          new Shell(settings, function(shell) {
            deferred.resolve(shell);
          });
          return deferred.promise;
        }
      };
    },
    function(err) { return err; });
  };

  exports.name = PLUGIN_NAME;
});
