(function() {'use strict';
  var root = this;
  var Bridge = root.bridge = root.bridge || {};
  var form = Bridge.form = Bridge.form || {};

  var validateTool = Bridge.validateTool = {
    required : function(messageObj, value, sw) {
      if (sw && (!value || value.length == 0)) {
        // messageObj.message.push("必須項目です。");
        return "必須項目です。";
      }
      return; 
    },
    isNullAble : function(messageObj, value, sw) {
      if (!sw && !value) {
        // messageObj.message.push("必須項目です。");
        return "必須項目です。";
      }
      return; 
    },
    patterns : {
      Digits: {patten : /^\d+$/, message : "数字のみ入力してください。"},
      Email: {patten : /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i,
              message : "メールアドレスを入力してください。"},
      Number: {patten : /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/,
               message : "数字のみ入力してください。"},
      // Date :
    },
    typeName : function(messageObj, value, type) {
      if (!value || this.type != 'text' || type == "String") {
        return;
      }
      
      if (type == "isDate") {
        if (isNaN(new Date(value))) {
            return  "日付の入力が正しくありません。";
        }
        return;
      }
      
      if (!value.toString().match(this.validateTool.patterns[type].patten)) {
        return this.validateTool.patterns[type].message;
      }
      return;
    },
    size : function(messageObj, value, size) {
      if (!size || size < 1 || !value) {
        return;
      } else if (value.toString().length > size) {
        // messageObj.message.push("サイズを超えました。");
        return "サイズを超えました。";
      }
      return;
    }
  };
  var createStruts = function(idx, nameArr, obj) {
    var name = nameArr[idx];
    var nextName = nameArr[idx + 1];
    if (!name) {
      return;
    }

    var key = nameArr.slice(0, idx + 1).join('.');
    var beforeKey = nameArr.slice(0, idx).join('.');
    var arrIdx = name.indexOf('[');
    if (arrIdx > -1) {
      var nameOnly = name.slice(0, arrIdx);
      if (!eval('obj.' + key.replace(/\[.*\]$/, ''))) {
        eval('obj.' + key.replace(/\[.*\]$/, '') + ' = [];');
      }
      if (!eval('obj.' + key) && nameArr[idx + 1]) {
        eval('obj.' + key + ' = {};');
      }
    } else if (!eval('obj.' + key)) {
      eval('obj.' + key + ' = {};');
    }
    createStruts(++idx, nameArr, obj);
  }

  var setValue = function (values, inputObj) {
    if (!inputObj.multiple) {
      values[inputObj.name] = inputObj.val();
      return;
    }
    var nameArr = inputObj.name.split('.');
    if (nameArr.length > 1) {
      createStruts(0, nameArr, values);
      var v = inputObj.val();
      eval('values.' + inputObj.name + ' = "' + v + '";' );
    } else {
      if (Array.isArray(values[inputObj.name])) {
        var value = values[inputObj.name]
        var v = inputObj.val();
        var before = value[value.length - 1];
        if (v != '' && v != undefined && v != null) {
          //if (before == '' || before == undefined || before == null) {
          //if (before != '' || before != undefined || before != null) {
          //     value[value.length - 1] = v;
          //} else {
            value.push(v);
          //}
        }
      } else if (values[inputObj.name]) {
        values[inputObj.name] = [values[inputObj.name], inputObj.val()];
      } else {
        values[inputObj.name] = inputObj.val();
      }
    }
  }
  
  form.diffObject = function(before, after) {
    var result = {keys: new Array(), before: {}, after: {}};
    var values = this.values;
    var keySet = new Set();
    Object.keys(after).forEach(function (key) {
      keySet.add(key);
    });
    Object.keys(before).forEach(function (key) {
      keySet.add(key);
    });
    keySet.forEach(function (keyName) {
      if (JSON.stringify(after[keyName]) !== JSON.stringify(before[keyName])) {
        result.keys.push(keyName);
        result.before[keyName] = before[keyName];
        result.after[keyName] = after[keyName];
      }
    });
    return result;
  }
  
  form.editor = function($html, config) {
    config = config || {};
    var inputObjList = [];
    var values = {};
    var inputConfig = null;
    var inputObj = null;
    
    if (Array.isArray(config)) {
      var configObj = {};
      if (!config[0].name) return;
      config.forEach(function(obj) {
        configObj[obj.name] = obj;
      });
      config = configObj;
    }

    var inputArray = $html.querySelectorAll('input[name], textarea[name], select[name]');
    var nameArray = Array.prototype.map.call(inputArray, function(target) {
      return target.name;
    }).filter(function(val, i, self){
    	return val && i === self.indexOf(val);
    });

    nameArray.forEach(function(name, ind) {
      var target = Array.prototype.filter.call(inputArray, function(input) {
        return input.name == name;
      });
      inputConfig = config[name] || {};
      inputObj = {
        inputConfig: inputConfig,
        target: target.length == 1 ? target[0] : target,
        name: name,
        validateTool: inputConfig.validateTool || config.validateTool || Bridge.validateTool,
        rule: inputConfig.rule,
        multiple: inputConfig.multiple != undefined ? inputConfig.multiple : true,
        
        val: inputConfig.val || config.val || function () {
          var target = this.target;
          if (target.type == "checkbox" || target.type == "radio") {
            //return target.checked ? (target.value || true) : (target.value ? '' : false);
            return target.checked ? (target.value || true) : null;
          } else if (Array.isArray(target) && target[0].type == "checkbox") {
            return target.filter(function(ele) {
              return ele.checked;
            }).map(function(ele) {
              return ele.value || true;
            });
          } else if (Array.isArray(target) && target[0].type == "radio") {
            var selected = target.filter(function(ele) {
              return ele.checked;
            })[0];
            return selected ? (selected.value || true) : null;
          }
          return this.inputConfig.returnValue ? this.inputConfig.returnValue(target.value) : target.value;
        },
        clearError: inputConfig.clearError || config.clearError || Bridge.form.clearError || function() {
            
        },
        renderMessage: inputConfig.renderMessage || config.renderMessage || Bridge.form.renderMessage || function(strArray) {
          alert(strArray.join('\n'));
        },
        validate: inputConfig.validate || config.validate || function() {
          if (!this.validateTool || !this.rule) {
              return true;
          }
          this.clearError();

          var messages = [];
          var message = null;
          //var result
          var validateRule = this.rule;
          var validateTool = this.validateTool;
          for (var ruleName in validateRule) {
            if (!validateTool[ruleName]) {
              continue;
            }
            message = validateTool[ruleName].call(this, {label : validateRule.label || this.label}, this.val(), validateRule[ruleName]);
            if (message) {
              messages.push(message);
            }
          }
          
          if (messages.length !== 0) {
            this.renderMessage(messages);
            return false;
          }
          return true;
        }
      };
      inputObjList.push(inputObj);
      setValue(values, inputObj);
    });
    
    return {
      $obj: $html,
      inputObjList: inputObjList,
      values: values,
      startValues: values,
      beforeFlashValues: {},
      get: function(name) {
        return this.inputObjList.find(function(element) {
          return element.name === name;
        });
      },
      clearAll: function() {
        this.inputObjList.forEach(function(element) {
          element.target.value = "";
        });
      },
      restore: function() {
        var startValues = this.startValues;
        var inputObjList = this.inputObjList;
        var inputObj = null;
        for (var ind=0, size=inputObjList.length; ind < size; ind++) {
          inputObj = inputObjList[ind];
          inputObj.target.value = (startValues[inputObj.name]);
        }
      },
      flash: function() {
        this.beforeFlashValues = this.values;
        var values = this.values = {};
        var inputObjList = this.inputObjList;
        var inputObj = null;
        //for (var ind in this.inputObjList) {
        for (var ind=0, size=inputObjList.length; ind < size; ind++) {
          inputObj = inputObjList[ind];
          //values[inputObj.name] = inputObj.val();
          setValue(values, inputObj);
        }
        Object.keys(values).forEach(function(key) {
          var names = key.split('.');
          var value = values[key];
          if (names.length == 1) return;
          var container = values[names[0]];
          if (!container) container = values[names[0]] = Array.isArray(value) ? [] : {};
          if (Array.isArray(value)) {
            for (var ind=0, size=value.length; ind < size; ind++) {
              if (!container[ind]) container[ind] = {};
              container[ind][names[1]] = value[ind];
            }
          } else {
            container[names[1]] = value;
          }
          delete values[key];
        });
      },
      validate: function() {
        var result = true;
        var inputObj = null;
        var inputObjList = this.inputObjList;
        //for (var ind in this.inputObjList) {
        for (var ind=0, size=inputObjList.length; ind < size; ind++) {
          inputObj = inputObjList[ind];
          if (inputObj.validate) {
            result = inputObj.validate() && result;
          }
        }
        return result;
      },
      diffValues: function(before, after) {
        this.flash();
        var result = {keys: new Array(), before: {}, after: {}};
        var values = this.values;
        var startValues = this.startValues;
        var inputObjList = this.inputObjList;
        var inputObjName = null;
        for (var ind=0, size=inputObjList.length; ind < size; ind++) {
          inputObjName = inputObjList[ind].name;
          if (values[inputObjName] !== startValues[inputObjName]) {
            result.keys.push(inputObjName);
            result.before[inputObjName] = startValues[inputObjName];
            result.after[inputObjName] = values[inputObjName];
          }
        }
        return result;
      }
    };
  }
}).call(this);
