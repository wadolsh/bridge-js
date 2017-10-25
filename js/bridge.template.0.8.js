/*
 * Copyright (c) 2016-present, Choi Sungho
 * Code released under the MIT license
 */
(function() {'use strict';
  var root = this;
  var Bridge = root.bridge = root.bridge || {};
  var tmplTool = Bridge.tmplTool = Bridge.tmplTool || {};
  var showTime = tmplTool.showTime || false;
  var debugError = tmplTool.debugError != undefined ? tmplTool.debugError : false;
  var throwError = tmplTool.throwError != undefined ? tmplTool.throwError : true;
  var cachedTmpl = Bridge.tmplCache = Bridge.tmplCache || new Map();
  if (!cachedTmpl.has('anonymous')) {
    cachedTmpl.set('anonymous', {elements: new Set()})
  }

  root.tmpl = {};

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;
  var escapes = {
    "'":    "'",
    '\\':   '\\',
    '\r':   'r',
    '\n':   'n',
    '\t':   't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };
  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  var firstElementChild = function(ele) {
    if (ele.firstElementChild) return ele.firstElementChild;
    var children = ele.childNodes;
    for (var i=0, size=children.length; i < size; i++) {
      if (children[i] instanceof Element) {
        return children[i];
      }
    }
    return null;
  }

  var childElementCount = function(ele) {
    return ele.childElementCount || Array.prototype.filter.call(ele.childNodes, function(child) {return child instanceof Element}).length;
  }

  Bridge.templateSettings = {
    firstElementChild: firstElementChild,
    childElementCount: childElementCount,
    style: {
      pattern: /(\<style id=[\s\S]+?\>[\s\S]+?\<\/style\>)/g,
      exec: function(style) {
        var dumy = document.createElement('template');
        dumy.innerHTML = style;
        var styleNode = dumy.content.querySelector('style');
        var oldStyleNode = document.getElementById(styleNode.id);
        if (oldStyleNode) oldStyleNode.parentNode.removeChild(oldStyleNode);
        document.head.appendChild(styleNode);
      }
    },
    preEvaluate  : {
      pattern: /##!([\s\S]+?)##/g,
      exec: function(preEvaluate) {
        new Function(preEvaluate)();
        return '';
      }
    },
    interpolate : {
      pattern: /##=([\s\S]+?)##/g,
      exec: function(interpolate) {
        return  "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
    },
    scopeKey: {
      pattern: /data-bridge-scope-key="##:([\s\S]+?)##"/g,
      exec: function(key) {
        var source = "';\nvar eventId = (lazyScope.scopeKeyArray.length);\n__p+='data-bridge-scope-key=\"'+eventId+'\"';\n";
        source += "lazyScope.scopeKeyArray[eventId] = " + key + ";\n__p+='";
        return source;
      },
      lazyExec: function(data, lazyScope, tmplScope, wrapper) {
        lazyScope.scopeKeyArray.forEach(function(key, eventId) {
          var $elementTrigger = wrapper.querySelector('[data-bridge-scope-key="' + eventId + '"]');
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.bridgeScopeKey;
          tmplScope[key] = $elementTrigger;
        });
      }
    },
    scopeVar: {
      pattern: /data-bridge-var="##:([\s\S]+?)##"/g,
      exec: function(key) {
        var source = "';\nvar eventId = (lazyScope.scopeVarArray.length);\n__p+='data-bridge-var=\"'+eventId+'\"';\n";
        source += "var " + key + " = null; lazyScope.scopeVarArray[eventId] = function(target) {" + key + " = target;};\n__p+='";
        return source;
      },
      lazyExec: function(data, lazyScope, tmplScope, wrapper) {
        lazyScope.scopeVarArray.forEach(function(func, eventId) {
          var $elementTrigger = wrapper.querySelector('[data-bridge-var="' + eventId + '"]');
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.bridgeVar;
          func.call($elementTrigger, $elementTrigger);
        });
      }
    },
    elementLoad: {
      pattern: /data-bridge-load="##:([\s\S]+?)##"/g,
      exec: function(elementLoad) {
        var source = "';\nvar eventId = (lazyScope.elementLoadArray.length);\n__p+='data-bridge-load=\"'+eventId+'\"';\n";
        var elementLoadSplitArray = elementLoad.split('::');
        //source += "lazyScope.elementLoadArray[eventId] = " + elementLoad + ";\n__p+='";
        source += "lazyScope.elementLoadArray[eventId] = {loadFunc: " + elementLoadSplitArray[0] + ", selectedData: " + elementLoadSplitArray[1] + "};\n__p+='";
        return source;
      },
      lazyExec: function(data, lazyScope, tmplScope, wrapper) {
        lazyScope.elementLoadArray.forEach(function(elementLoad, eventId) {
          var $elementTrigger = wrapper.querySelector('[data-bridge-load="' + eventId + '"]');
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.bridgeLoad;
          var parentElement = $elementTrigger.parentElement;
          elementLoad.loadFunc.call($elementTrigger, $elementTrigger, elementLoad.selectedData || data, parentElement, tmplScope);
        });
      }
    },
    event : {
      pattern: /data-bridge-event="##:([\s\S]+?)##"/g,
      exec: function(event) {
        var source = "';\nvar eventId = (lazyScope.eventArray.length);\n__p+='data-bridge-event=\"'+eventId+'\"';\n";
        var eventStrArray = event.split(':::');
        var eventArray = new Array();
        for (var i=0, size=eventStrArray.length; i < size; i++) {
          var eventSplitArray = eventStrArray[i].split('::');
          eventArray.push("{eventFunc: " + eventSplitArray[0] + ", $parent: this, selectedData: " + (eventSplitArray[1]) + "}");
        }

        source += "lazyScope.eventArray[eventId] = [" + eventArray.join(',') + "];\n__p+='";
        return source;
      },
      lazyExec: function(data, lazyScope, tmplScope, wrapper) {
        var self = this;
        var attacher = self.event.attacher;
        lazyScope.eventArray.forEach(function(selectedArray, eventId) {
          var $elementTrigger = wrapper.querySelector('[data-bridge-event="' + eventId + '"]');
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.bridgeEvent;
          for (var i=0, size=selectedArray.length; i < size; i++) {
            var selected = selectedArray[i];
            if (selectedArray[i].eventFunc) {
              if (selected.eventFunc instanceof Array) {
                selected.eventFunc.forEach(function(func) {
                  attacher(self, data, lazyScope, tmplScope, wrapper, $elementTrigger, func, selected);
                });
              } else {
                attacher(self, data, lazyScope, tmplScope, wrapper, $elementTrigger, selected.eventFunc, selected);
              }
            }
          }
        });
      },
      trigger: function(target, eventName) {
        var customEvent = document.createEvent("Event");
        customEvent.initEvent(eventName, true, true);
        target.dispatchEvent(customEvent);
      },
      attacher: function(self, data, lazyScope, tmplScope, wrapper, $elementTrigger, eventFunc, eventData) {
        var trigger = self.event.trigger;
        var $childTarget = self.firstElementChild(wrapper);
        var $targetElement = self.childElementCount(wrapper) == 1 ? $childTarget : null;

        if (!eventFunc) {
          return;
        }

        if (eventFunc instanceof Function) {
          $elementTrigger.addEventListener('click', function(event){
            event.stopPropagation();
            var parentElement = $targetElement || $childTarget.parentElement;
            eventFunc.call($elementTrigger, event, (eventData.selectedData == undefined ? data : eventData.selectedData), parentElement, tmplScope);
          });
          return;
        }
        var triggerKey = eventFunc.triggerKey;
        if (triggerKey) {
          tmplScope.trigger = tmplScope.trigger || {};
          tmplScope.trigger[triggerKey] = {};
        }
        Object.keys(eventFunc).forEach(function(eventType) {
          if (eventType == 'load') {
            var parentElement = $targetElement || $childTarget.parentElement;
            eventFunc[eventType].call($elementTrigger, $elementTrigger, (eventData.selectedData == undefined ? data : eventData.selectedData), parentElement, tmplScope);
            return;
          } else if (eventType == 'var') {
            tmplScope[eventFunc[eventType]] = $elementTrigger;
            return;
          } else if (eventType == 'triggerKey') {
            return;
          }
          /*
          if (eventType == 'triggerKey') {
            return;
          }
          */

          $elementTrigger.addEventListener(eventType, function(event){
            var parentElement = $targetElement || $childTarget.parentElement;
            event.stopPropagation();
            eventFunc[eventType].call($elementTrigger, event, (eventData.selectedData == undefined ? data : eventData.selectedData), parentElement, tmplScope);
          });

          if (triggerKey) {
            tmplScope.trigger[triggerKey][eventType] = function() {
              trigger($elementTrigger, eventType);
            };
          }
        });
      }
    },
    element : {
      pattern: /##%([\s\S]+?)##/g,
      exec: function(element) {
        var elementSplitArray = element.split('::');
        var source = "';\nvar elementId = (lazyScope.elementArray.length);\n__p+='<template data-bridge-tmpl-element-id=\"'+elementId+'\"></template>";
        source += "';\nlazyScope.elementArray[elementId] = {element: " + elementSplitArray[0] + ", nonblocking: " + (elementSplitArray[1] || false) + "};\n__p+='";
        return source;
      },
      lazyExec: function(data, lazyScope, tmplScope, wrapper) {
        var self = this;
        lazyScope.elementArray.forEach(function(ele, elementId) {
          var childElement = ele.element;
          var nonblocking = ele.nonblocking;
          var $tmplElement = wrapper.querySelector('template[data-bridge-tmpl-element-id="' + elementId + '"]');
          if (childElement instanceof Array) {
            var docFragment = document.createDocumentFragment();
            childElement.forEach(function(child) {
              if (!child) return;
              child = child.element || child;
              docFragment.appendChild(
                (typeof child === 'string' || typeof child === 'number')
                  ? self.element.stringToElement(child) : child);
              tmplScope.childScope.push(child.tmplScope || child);
              if (child.tmplScope) {
                child.tmplScope.parent = child.parentNode;
                child.tmplScope.parentScope = tmplScope;
                if (child.tmplScope.beforeAppendTo) child.tmplScope.beforeAppendTo();
              }
            });

            $tmplElement.parentNode.replaceChild(docFragment, $tmplElement);
            childElement.forEach(function(child) {
              if (child && (child.tmplScope || child).afterAppendTo) (child.tmplScope || child).afterAppendTo();
            });

          } else if (typeof childElement === 'string' || typeof childElement === 'number') {
            $tmplElement.parentNode.replaceChild(self.element.stringToElement(childElement), $tmplElement);

          } else if ((childElement && (childElement.element || childElement)) instanceof Element) {
            var doFunc = function() {
              childElement = childElement.element || childElement;
              var parentNode = $tmplElement.parentNode;
              var node1 = null;
              if (childElement instanceof DocumentFragment) {
                node1 = childElement.firstChild;
              }

              var childScope = (childElement.tmplScope || childElement);
              if (childScope.beforeAppendTo) childScope.beforeAppendTo();
              var replacedNode = parentNode.replaceChild(childElement, $tmplElement);
              setTimeout(function() {
                if (childScope.afterAppendTo) childScope.afterAppendTo();
              });
              tmplScope.childScope.push(childElement.tmplScope);
              if (childElement.tmplScope) {
                var childScope = childElement.tmplScope;
                if (node1) {
                  childScope.this = node1.parentNode;
                }
                childScope.parentScope = tmplScope;
              }
            }
            nonblocking == undefined || nonblocking === false ? doFunc() : setTimeout(doFunc, nonblocking);
          } else {
            $tmplElement.parentNode.removeChild($tmplElement);
          }

        });
      },
      stringToElement: function(str) {
        //if (str && str.trim && str.trim()[0] == '<') {
        if (str && str[0] == '<' ) {
          /*
          if (DOMParser) {
            return (new DOMParser()).parseFromString(str, 'text/html').body;
          } else {
            var temp = document.createElement('template');
            temp.innerHTML = str;
            return temp.content;
          }
          */
          var temp = document.createElement('template');
          temp.innerHTML = str.replace('<>', '');
          return temp.content;
        } else {
          return document.createTextNode(str);
        }
      }
    },
    lazyEvaluate : {
      evalFunction: false,
      pattern: /###([\s\S]+?)##/g,
      exec: function(lazyEvaluate) {
        var source = "';\nlazyScope.lazyEvaluateArray.push(function(data) {" + lazyEvaluate + "});\n__p+='";
        return source;
      },
      lazyExec: function(data, lazyScope, tmplScope, wrapper) {
        //var $childTarget = wrapper.firstElementChild || wrapper.firstChild;
        var $childTarget = this.firstElementChild(wrapper);
        //var $targetElement = wrapper.childElementCount == 1 ? $childTarget : null;
        var $targetElement = this.childElementCount(wrapper) == 1 ? $childTarget : null;
        lazyScope.lazyEvaluateArray.forEach(function(selectedFunc, idx) {
          selectedFunc.call($targetElement || $childTarget.parentElement, data);
        });
        return;
      }
    },
    /*
    include   : {
      pattern: /##@([\s\S]+?)##/g,
      exec: function(include) {
        return "';\n__p+='" + new Function('return ' + include).call(this);
      }
    },
    */
    escape    : {
      pattern: /##-([\s\S]+?)##/g,
      exec: function(escape) {
        return "'+\n((__t=(" + escape + "))==null?'':escapeHtml.escape(__t))+\n'";
      },
    },
    evaluate  : {
      pattern: /##([\s\S]+?)##/g,
      exec: function(evaluate) {
        return "';\n" + evaluate + "\n__p+='";
      }
    },
    /*
    normal  : {
      pattern: /([\s\S]+?)/g,
      exec: function(normal) {
        //console.log(normal);
        return normal.replace(escaper, escapeFunc);
      }
    },
    */
    dataKeyName: 'data',
    statusKeyName: 'status'
  };

  var escapeHtml = function() {
    var escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;',
      '\n': '&#10;'
    }
    var unescapeMap = function() {
      var unescapeMap = {};
      Object.keys(escapeMap).forEach(function(ele) {
        unescapeMap[escapeMap[ele]] = ele;
      });
      return unescapeMap;
    }();

    // underscore.js
    var createEscaper = function(map) {
      var escaper = function(match) {
        return map[match];
      };
      var source = '(?:' + Object.keys(map).join('|') + ')';
      var testRegexp = RegExp(source);
      var replaceRegexp = RegExp(source, 'g');
      return function(string) {
        string = string == null ? '' : '' + string;
        return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
      };
    };

    return {
      escape: createEscaper(escapeMap),
      unescape: createEscaper(unescapeMap)
    }
  }();
  tmplTool.escapeHtml = escapeHtml;

  var matcherFunc = function(settings) {
    var patternArray = new Array();
    var execArray = new Array();
    var lazyExecArray = {};
    var lazyScope = {};
    var setting = null;
    Object.keys(settings).forEach(function(key) {
      setting = settings[key];
      if (setting.pattern) {
        patternArray.push((setting.pattern || noMatch).source);
        execArray.push(setting.exec);
      }
      if (setting.lazyExec) {
        lazyExecArray[key + 'Array'] = setting.lazyExec;
        lazyScope[key + 'Array'] = new Array();
      }
    });
    return {
      settings: settings,
      //pattern: new RegExp(patternArray.join('|') + '|$', 'g'),
      pattern: new RegExp(patternArray.join('|'), 'g'),
      exec: execArray,
      lazyExecKeys: Object.keys(lazyScope),
      lazyExec: lazyExecArray,
      lazyScopeSeed: JSON.stringify(lazyScope)
    };
  }

  var escapeFunc = function(match) {
    return '\\' + escapes[match];
  };

  var defaultMatcher = matcherFunc(Bridge.templateSettings);

  var templateParser = function(tmplId, text, matcher) {
    if (showTime) console.time("tmpl:" + tmplId);

    var index = 0;
    var source = "";

    text.replace(matcher.pattern, function() {
      var match = arguments[0];
      var offset = arguments[arguments.length-2];
      source += text.slice(index, offset).replace(escaper, escapeFunc);

      var selected, i = null;
      Array.prototype.slice.call(arguments, 1, -2).some(function(value, idx, arr) {
        if (!!value) {
          selected = value;
          i = idx;
          return true;
        }
        return false;
      });

      if (!selected) return match;
      source += matcher.exec[i].call(matcher.settings, selected);
      index = offset + match.length;
      return match;
    });

    if (showTime) console.timeEnd("tmpl:" + tmplId);
    return source + text.slice(index).replace(escaper, escapeFunc);
  }

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  var template = Bridge.template = function(tmplId, templateText, tmplSettings) {
    var settings = Bridge.templateSettings;
    var matcher = defaultMatcher;
    if (tmplSettings) {
      settings = Object.assign({}, Bridge.templateSettings, tmplSettings);
      matcher = matcherFunc(settings);
    }

    var source = "__p+='";
    source += templateParser(tmplId, templateText, matcher);
    source += "';\n";

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    var render = null;
    try {
      render = new Function(settings.dataName || 'data',  settings.statusName || 'status', 'tmplScope', 'lazyScope', source);
    } catch(e) {
    	var debugErrorLine = function(source, e) {
    	  console.log(tmplId, e.lineNumber, e.columnNumber);
        new Function(settings.dataName || 'data',  settings.statusName || 'status', 'tmplScope', 'lazyScope', source);
      }
      if (debugError) tmplConsole({template: templateText, source: source, tmplId: tmplId, errorMsg: e});
      if (throwError) {
        debugErrorLine(source, e);
        throw e;
      } else {
        return;
      }
    }

    var tmpl = function bridge_tmpl (data, wrapperElement, callback, tmplScope) {
      if (wrapperElement instanceof Function) {
        callback = wrapperElement;
        wrapperElement = undefined;
      }

      var dataKeyName = settings.dataKeyName;
      var statusKeyName = settings.statusKeyName;
      var lazyScope = JSON.parse(matcher.lazyScopeSeed);
      var tmplScope = tmplScope || {
        tmplId: tmplId,
        _id: tmplTool.genId(tmplId),
        //[statusKeyName]: {},
        replace: function(scope) {
          tmplScope.element.parentElement.replaceChild(scope.element || scope, tmplScope.element);
        },
        remove: function() {
          if (tmplScope.beforeRemove) tmplScope.beforeRemove();
          if (tmplScope.element.parentElement) {
            var dumy = document.createElement('template');
            tmplScope.element.parentElement.replaceChild(dumy, tmplScope.element);
            tmplScope.element = dumy;
          }
          if (tmplScope.afterRemove) tmplScope.afterRemove();
        },
        appendTo: function(parentElement) {
          if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
          if (parentElement) parentElement.appendChild(tmplScope.element);
          if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
          return tmplScope;
        }
      };
      tmplScope.childScope = [];
      tmplScope[dataKeyName] = data;
      if (tmplScope[statusKeyName] == undefined) tmplScope[statusKeyName] = {};
      var hasParent = wrapperElement ? true : false;
      var $temp = document.createElement('template');
      var $returnTarget = null;

      if (showTime) console.time("render:" + tmplId);

      var html = null;
      try {
        html = !data ? '<template></template>' : render.call(wrapperElement, data, tmplScope[statusKeyName], tmplScope, lazyScope);
      } catch(e) {
        var debugErrorLine = function(source) {
      	  console.log('Error: ', tmplId);
          render.call(wrapperElement, data, tmplScope[statusKeyName], tmplScope, lazyScope);
        }
        if (debugError) tmplConsole({template: templateText, source: source, tmplId: tmplId, errorMsg: e});
        if (throwError) {
          debugErrorLine(source, e);
          throw e;
        } else {
          return;
        }
      }
      if (showTime) console.timeEnd("render:" + tmplId);

      $temp.innerHTML = html;
      var docFragment = $temp.content || $temp;
      var lazyExec = matcher.lazyExec;
      if (data) matcher.lazyExecKeys.forEach(function (key){
        if (lazyScope[key].length == 0) return;
        lazyExec[key].call(settings, data, lazyScope, tmplScope, docFragment);
      });

      if (hasParent) {
        while (wrapperElement.firstElementChild) {
          wrapperElement.removeChild(wrapperElement.firstElementChild);
        }
        tmplScope.wrapperElement = wrapperElement;
      }

      if (childElementCount(docFragment) == 1) {
        $returnTarget = firstElementChild(docFragment);
        if (hasParent) {
          if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
          wrapperElement.appendChild($returnTarget);
          if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
        }
      } else {
        if (hasParent) {
          if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
          wrapperElement.appendChild(docFragment);
          if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
          $returnTarget = wrapperElement;
        } else {
          $returnTarget = docFragment;
        }
      }

      tmplScope.element = $returnTarget;
      $returnTarget.tmplScope = tmplScope;

      // style to shadow
      var style = $returnTarget.querySelector('style[scoped], style[shadow]');
      if (style && $returnTarget.createShadowRoot) {
        var shadow = $returnTarget.createShadowRoot();
        document.head.appendChild(style);
        var styles = '';
        var sheet = style.sheet;
        for (var i=0, size=sheet.cssRules.length; i < size; i++) {
          styles += '::content ' + sheet.cssRules[i].cssText.replace('::content', '');
        }
        style.innerHTML = styles;
        shadow.appendChild(style);
        var content = document.createElement('content');
        content.setAttribute('select', '*');
        shadow.appendChild(content);
      }

      if (callback) {
        callback.call(wrapperElement, tmplScope);
      }

      $returnTarget.render = docFragment.render = tmplScope.render = function(fdata) {
        var tmplScope = this.tmplScope || this;
        var target = tmplScope.element;
        var tmpl = bridge.tmpl(tmplScope.tmplId);
        var beforeRemove = tmplScope.beforeRemove;
        var afterRemove = tmplScope.afterRemove;
        if (tmplScope.wrapperElement) {
          if (beforeRemove) tmplScope.beforeRemove();
          tmplScope = tmpl(fdata, tmplScope.wrapperElement, null, null, tmplScope);
          if (afterRemove) tmplScope.afterRemove();
          return tmplScope;
        } else {
          tmplScope = tmpl(fdata, null, null, tmplScope);
          if (target.parentElement) {
            var newElement = tmplScope.element;
            if (beforeRemove) tmplScope.beforeRemove();
            if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
            var replacedNode = target.parentElement.replaceChild(newElement, target);
            if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
            if (afterRemove) tmplScope.afterRemove();
          }
          return tmplScope;
        }
      };

      $returnTarget.reflash = docFragment.reflash = tmplScope.reflash = function(fdata) {
        var tmplScope = this.tmplScope || this;
        var target = tmplScope.element;
        var data = tmplScope.data;
        var beforeReflash = tmplScope.beforeReflash;
        var afterReflash = tmplScope.afterReflash;
        if (beforeReflash) tmplScope.beforeReflash();
        var scope = tmplScope.render(Object.assign(data || {}, fdata));
        if (afterReflash) tmplScope.afterReflash();
        return scope;
      };

      return tmplScope;
    };

    tmpl.source = 'function(' + (settings.variable || 'data') + '){\n' + source + '}';

    if (tmplId) {
      var tmplMeta = {
        tmpl: tmpl,
        source: escapeHtml.escape(tmpl.source),
        templateText: escapeHtml.escape(templateText),
        elements: new Array()
      };
      cachedTmpl.set(tmplId, tmplMeta);
      var tmplIdNames = tmplId.split('-');
      if (tmplIdNames.length > 1) {
        var group = tmplIdNames[0];
        var groupObj = root.tmpl[group];
        if (!groupObj) {
          root.tmpl[group] = groupObj = {};
        }
        var tmplIdSub = tmplIdNames.slice(1).join('').replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
        groupObj[tmplIdSub] = tmplMeta.tmpl;
      }
    }
    return tmpl;
  };

  Bridge.remapTmpl = function(json) {
    Object.keys(json).forEach(function(key) {
      cachedTmpl.set(json[key], cachedTmpl.get(key));
    });
  }

  Bridge.tmpl = function(tmplId) {
    var tmplFunc = cachedTmpl.get(tmplId);
    return tmplFunc ? tmplFunc.tmpl : null;
  }

  var addTmpl = tmplTool.addTmpl = function(tmplId, element, tmplSettings) {
    var templateText = element instanceof Element ? element.innerHTML : element;
    templateText = escapeHtml.unescape(templateText.replace(/<!---|--->/gi, ''));
    return template(tmplId, templateText, tmplSettings);
  }

  var addTmpls = tmplTool.addTmpls = function(source, removeInnerTemplate, tmplSettings) {
    if(typeof(removeInnerTemplate) !== "boolean" && tmplSettings == undefined) tmplSettings = removeInnerTemplate;
    var $template = null;
    if (source instanceof Element) {
      $template = source;
    } else {
      var $template = document.createElement('template');
      $template.innerHTML = source;
    }
    var tmplNodes = ($template.content || $template).querySelectorAll('template');

    var node = null;
    for (var i=0, size=tmplNodes.length; i < size; i++) {
      node = tmplNodes.item(i);
      node.dataset.bridgeLoadScript ? addTmpl(node.id, node, tmplSettings)({}) : addTmpl(node.id, node, tmplSettings);
      if (removeInnerTemplate) node.parentNode.removeChild(node);
    }
    return $template;
  }

  root.i18n = {};
  tmplTool.addI18n = function(fullKey, i18nObj) {
    var langKeyNames = fullKey.split('.');
    var target = root.i18n;
    var keyLength = langKeyNames.length - 1;
    langKeyNames.forEach(function(key, i) {
      if (!target[key]) target[key] = {};
      if (keyLength === i) {
        target[key] = function(defaultText) {
          var label = i18nObj[document.documentElement.lang] || defaultText;
          if (!label) {
            if (debugError) console.log('label key [' + fullKey + '] is empty!');
          }
          return label;
        }
      } else {
        target = target[key];
      }
    });
  }
  tmplTool.addI18ns = function(i18nObjs) {
    Object.keys(i18nObjs || {}).forEach(function(key) {
      tmplTool.addI18n(key, i18nObjs[key]);
    });
  }

  var count = 0;
  tmplTool.genId = function(tmplId) {
    count++;
    return tmplId + count;
  }

  var tmplConsoleCount = 0;
  var tmplConsole = function(data) {
    if (typeof data == "string") {
      var cache = cachedTmpl.get(data);
      data = {template: cache.templateText, source: cache.source, tmplId: data, count: tmplConsoleCount++};
    } else {
      data.count = tmplConsoleCount++;
    }
    var TmplCodeConsole = Bridge.tmpl('tmpl-code-console');
    if (!TmplCodeConsole) {
      var appendScript = function (pathToScript) {
        var js = document.createElement("script");
        js.type = "text/javascript";
        js.src = pathToScript;
        js.async = false;
        document.head.appendChild(js);
      }
      appendScript("//cdnjs.cloudflare.com/ajax/libs/ace/1.2.3/ace.js");
      var consolHtml =
        '<div class="tmpl-code-console">'
          + '<div id="tmpl-code-console-wrapper">'
            + '<style>'
              + '#tmpl-code-console##=data.count## {'
                + 'position:absolute; top:10px; left:100px; height: 400px;'
              + '}'
              + '#tmpl-code-console-wrapper##=data.count## {'
                + 'background-color:white; border: 1px solid #000;'
              + '}'
              + '#tmpl-code-template##=data.count## {'
                + 'width:700px; height: 300px;'
              + '}'
              + '#tmpl-code-source##=data.count## {'
                + 'width:700px; height: 300px;'
              + '}'
            + '</style>'
            + '<div class="header">tmplId: ##=data.tmplId##  Error: ##=data.errorMsg##</div>'
            + '<div id="tmpl-code-template##=data.count##">##=data.template##</div>'
            + '<div id="tmpl-code-source##=data.count##">##=data.source##</div>'
            + '###setTimeout(function() {'
            + 'var tmplCodeTemplate = ace.edit("tmpl-code-template" + data.count);'
            + 'tmplCodeTemplate.setTheme("ace/theme/chrome");'
            + 'tmplCodeTemplate.getSession().setMode("ace/mode/javascript");'
            + 'var tmplCodeSource = ace.edit("tmpl-code-source" + data.count);'
            + 'tmplCodeSource.setTheme("ace/theme/monokai");'
            + 'tmplCodeSource.getSession().setMode("ace/mode/javascript");'
            + '}, 0)##'
            + '<button type="button" data-bridge-event="##:function(e, edata, tmplElem) {tmplElem.remove();}##">Close</button>'
          +'</div>'
        +'</div>';

      addTmpl('tmpl-code-console', consolHtml);
      TmplCodeConsole = Bridge.tmpl('tmpl-code-console');
    }
    setTimeout(function() {
      var consoleElem = TmplCodeConsole(data);
      document.body.appendChild(consoleElem.element);
    }, 1000);
  }

}).call(this);
