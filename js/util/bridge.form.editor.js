(function() {'use strict';
    var root = this;
    var Bridge = root.bridge = root.bridge || {};
    var form = Bridge.form = Bridge.form || {};

    var validateTool = Bridge.validateTool = {
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
        Array.prototype.forEach.call($html.querySelectorAll('input[name], textarea[name], select[name]'), function(input, ind) {
            inputConfig = config[input.name] || {};
            if (input.type == "radio" && !input.checked) {
                return;
            }
            inputObj = {
                inputConfig: inputConfig,
                target: input,
                name: input.name,
                validateTool: inputConfig.validateTool || config.validateTool || Bridge.validateTool,
                rule: inputConfig.rule,
                
                val: inputConfig.val || config.val || function () {
                    var target = this.target;
                    if (target.type == "checkbox") {
                        return target.checked ? (target.value || true) : (target.value ? '' : false);
                    } else if (target.type == "radio") {
                        return target.checked ? (target.value || true) : null;
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
            if (Array.isArray(values[inputObj.name])) {
                values[inputObj.name].push(inputObj.val());
            } else if (values[inputObj.name]) {
                values[inputObj.name] = [values[inputObj.name], inputObj.val()];
            } else {
                values[inputObj.name] = inputObj.val();
            }
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
                    if (Array.isArray(values[inputObj.name])) {
                        values[inputObj.name].push(inputObj.val());
                    } else if (values[inputObj.name]) {
                        values[inputObj.name] = [values[inputObj.name], inputObj.val()];
                    } else {
                        values[inputObj.name] = inputObj.val();
                    }
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
