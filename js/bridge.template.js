/*
 * Copyright (c) 2016-present, Choi Sungho
 * Code released under the MIT license
*/
/*
if (typeof window === 'undefined') {
  // server mode
  window = { Node: { prototype: {}} };
  Element = {};
  CharacterData = {};
  DocumentType = {};
}
*/

(function() {"use strict";

  // Polyfill
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
  if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
      value: function assign(target, ...params) { // .length of function is 2
        // 'use strict';
        if (target == null) { // TypeError if undefined or null
          throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 0, length = params.length; index < length; index++) {
          var nextSource = params[index];
          if (nextSource != null) { // Skip over if undefined or null
            for (var nextKey in nextSource) {
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      },
      writable: true,
      configurable: true
    });
  }

  // from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md
  
  (function (arr) {
    arr.forEach(function (item) {
      if (!item) return;
      if (item.hasOwnProperty('remove')) {
        return;
      }
      Object.defineProperty(item, 'remove', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function remove() {
          if (this.parentNode !== null) {
            this.parentNode.removeChild(this);
          }
        }
      });
    });
  })([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

  // https://stackoverflow.com/questions/37588326/reliabilty-of-isconnected-field-in-dom-node
  (function (supported){
    if (supported) return;
    Object.defineProperty(window.Node.prototype, 'isConnected', {
      get: function() {
        return document.body.contains(this);
      }
    });
  })('isConnected' in window.Node.prototype);

  var root = this;
  var Bridge = root.bridge = root.bridge || {};
  var tmplTool = Bridge.tmplTool = Bridge.tmplTool || {};
  var showTime = tmplTool.showTime || false;
  var debug = tmplTool.debug != undefined ? tmplTool.debug : false;
  var requestCacheControl = tmplTool.requestCacheControl || true;
  var throwError = tmplTool.throwError != undefined ? tmplTool.throwError : true;
  var cachedTmpl = Bridge.tmplCache = Bridge.tmplCache || new Map();
  if (!cachedTmpl.has('anonymous')) {
    cachedTmpl.set('anonymous', {elements: new Set()})
  }
  var isSupportTemplateTag = 'content' in document.createElement('template');

  root.tmpl = {};

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;
  var escapes = {
    "'":    "\\'",
    '\\':   '\\\\',
    '\r':   '\\r',
    '\n':   '\\n',
    '\t':   '\\t',
    '\u2028': '\u2028',
    '\u2029': '\u2029',
    '><': '><',
    '<': '<',
    '>': '>',
    //'#': '#'
  };
  var escaper = /\>( |\n)+\<|\>( |\n)+|( |\n)+\<|\\|'|\r|\n|\t|\u2028|\u2029/g;
  //var escaper = /\>( |\n)+\<|\>( |\n)+|( |\n)+\<|#( |\n)+|( |\n)+#|\\|'|\r|\n|\t|\u2028|\u2029/g;

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

  var childNodeCount = function(ele) {
    return ele.childElementCount || Array.prototype.filter.call(ele.childNodes, function(child) {return child instanceof Node}).length;
  }
  var childElementCount = function(ele) {
    return ele.childElementCount || Array.prototype.filter.call(ele.childNodes, function(child) {return child instanceof Element}).length;
  }
  var cleanNode = function(node) {
    for(var n = 0; n < node.childNodes.length; n ++) {
      var child = node.childNodes[n];
      if (child.nodeType === 8 || (child.nodeType === 3 && !/\S/.test(child.nodeValue))) {
        node.removeChild(child);
        n --;
      } else if(child.nodeType === 1) {
        cleanNode(child);
      }
    }
  }

  Bridge.templateSettings = {
    firstElementChild: firstElementChild,
    childElementCount: childElementCount,
    style: {
      pattern: /(\<style id=[\s\S]+?\>[\s\S]+?\<\/style\>)/g,
      exec: function(style) {
        var dumy = document.createElement('template');
        dumy.innerHTML = style;
        var styleNode = (dumy.content || dumy).querySelector('style');
        var oldStyleNode = document.getElementById(styleNode.id);
        if (oldStyleNode) oldStyleNode.parentNode.removeChild(oldStyleNode);
        document.head.appendChild(styleNode);
        return '';
      }
    },
    commentArea : {
      pattern: /#\\#([\s\S]+?)#\\#/g,
      exec: function(commentArea) {
        return "'+\n'##" + commentArea + "##'+\n'";
      }
    },
    preEvaluate : {
      pattern: /##!([\s\S]+?)##/g,
      exec: function(preEvaluate, tmplId) {
        new Function('tmplId', preEvaluate)(tmplId);
        return '';
      }
    },
    interpolate : {
      //pattern: /(?:##=|\$\{)([\s\S]+?)(?:##|\})/g, // ##=##, ${}
      pattern: /##=([\s\S]+?)##/g, // ##=##, ${}
      exec: function(interpolate) {
        //interpolate = 'typeof (' + interpolate + ')==\'function\' ? (' + interpolate + ')() : (' + interpolate + ')';
        //return "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
        var interpolateSyntax = 'typeof (interpolate)==\'function\' ? (interpolate)() : (interpolate)';
        return "';\nvar interpolate=" + interpolate + ";\n__p+=((__t=(" + interpolateSyntax + "))==null?'':__t);\n__p+='";
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
        source += "var " + key + " = null;\nlazyScope.scopeVarArray[eventId] = function(target) {" + key + " = target;};\n__p+='";
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

        var eventFuncParams = [$elementTrigger, null, (eventData.selectedData == undefined ? data : eventData.selectedData), $targetElement || $childTarget.parentElement, tmplScope];

        if (eventFunc instanceof Function) {
          $elementTrigger.addEventListener('click', function(event){
            event.stopPropagation();
            //var parentElement = $targetElement || $childTarget.parentElement;
            //eventFunc.call($elementTrigger, event, (eventData.selectedData == undefined ? data : eventData.selectedData), parentElement, tmplScope);
            eventFuncParams[1] = event;
            eventFunc.call(...eventFuncParams);
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
            //var parentElement = $targetElement || $childTarget.parentElement;
            //eventFunc[eventType].call($elementTrigger, $elementTrigger, (eventData.selectedData == undefined ? data : eventData.selectedData), parentElement, tmplScope);
            eventFuncParams[1] = $elementTrigger;
            eventFunc[eventType].call(...eventFuncParams);
            return;
          } else if (eventType == 'var') {
            tmplScope[eventFunc[eventType]] = $elementTrigger;
            return;
          } else if (eventType == 'triggerKey') {
            return;
          }

          $elementTrigger.addEventListener(eventType, function(event){
            event.stopPropagation();
            //var parentElement = $targetElement || $childTarget.parentElement;
            //eventFunc[eventType].call($elementTrigger, event, (eventData.selectedData == undefined ? data : eventData.selectedData), parentElement, tmplScope);
            eventFuncParams[1] = event;
            eventFunc[eventType].call(...eventFuncParams);
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
      exec: function(target) {
        var elementSplitArray = target.split('::');
        var source = "';\nvar elementId = (lazyScope.elementArray.length);\n__p+='<template data-bridge-tmpl-element-id=\"'+elementId+'\"></template>";
        source += "';\nlazyScope.elementArray[elementId] = {target: " + elementSplitArray[0] + ", nonblocking: " + (elementSplitArray[1] || false) + "};\n__p+='";
        return source;
      },
      lazyExec: function(data, lazyScope, tmplScope, wrapper) {
        var self = this;
        lazyScope.elementArray.forEach(function(ele, elementId) {
          var childTarget = ele.target;
          var nonblocking = ele.nonblocking;
          var $tmplElement = wrapper.querySelector('template[data-bridge-tmpl-element-id="' + elementId + '"]');
          if (childTarget instanceof Array) {
            var docFragment = document.createDocumentFragment();
            childTarget.forEach(function(child) {
              if (!child) return;
              var childElement = child.element || child;
              if (typeof childElement === 'string') {
                /*
                var interpolate = child;
                if (interpolate[0] == '@') {
                  interpolate = new Function('return ' + interpolate.slice(1) + ';')();
                }
                */
                docFragment.appendChild(self.element.stringToElement(childElement));
              } else if (typeof childElement === 'number') {
                docFragment.appendChild(self.element.stringToElement(childElement));
              } else if (typeof childElement === 'function') {
                docFragment.appendChild(self.element.stringToElement(childElement()));
              } else {
                docFragment.appendChild(childElement);
              }
              if (child.beforeAppendTo) {
                child.parent = child.parentNode;
                child.parentScope = tmplScope;
                if (child.beforeAppendTo) child.beforeAppendTo();
              }
            });

            $tmplElement.parentNode.replaceChild(docFragment, $tmplElement);
            childTarget.forEach(function(child) {
              if (child && child.afterAppendTo) setTimeout(function() {
                child.afterAppendTo();
              });
            });
          } else if (typeof childTarget === 'string') {
            $tmplElement.parentNode.replaceChild(self.element.stringToElement(childTarget), $tmplElement);
          } else if (typeof childTarget === 'number') {
            $tmplElement.parentNode.replaceChild(self.element.stringToElement(childTarget), $tmplElement);
          } else if (typeof childTarget === 'function') {
            $tmplElement.parentNode.replaceChild(self.element.stringToElement(childTarget()), $tmplElement);
          } else if ((childTarget && (childTarget.element || childTarget)) instanceof Element) {
            var doFunc = function() {
              var childElement = childTarget.element || childTarget;
              var parentNode = $tmplElement.parentNode;
              var node1 = null;
              if (childElement instanceof DocumentFragment) {
                node1 = childElement.firstChild;
              }

              if (childTarget.beforeAppendTo) childTarget.beforeAppendTo();
              var replacedNode = parentNode.replaceChild(childElement, $tmplElement);
              if (childTarget.afterAppendTo) setTimeout(function() {
                childTarget.afterAppendTo();
              });
              if (childTarget.tmplId) {
                if (node1) {
                  childTarget.this = node1.parentNode;
                }
                childTarget.parentScope = tmplScope;
              }
            };
            nonblocking == undefined || nonblocking === false ? doFunc() : setTimeout(doFunc, nonblocking);
          } else {
            $tmplElement.parentNode.removeChild($tmplElement);
          }
        });
      },
      stringToElement: function(str) {
        if (!isNaN(str)) {
          return document.createTextNode(str);
        } else if (str && str.startsWith('<>')) {
          var temp = document.createElement('template');
          temp.innerHTML = str.replace('<>', '');
          return temp.content;
        } else {
          return document.createTextNode(str);
        }
      }
    },
    lazyEvaluate : {
      pattern: /###([\s\S]+?)##/g,
      exec: function(lazyEvaluate) {
        var source = "';\nlazyScope.lazyEvaluateArray.push(function(data) {" + lazyEvaluate + "});\n__p+='";
        return source;
      },
      lazyExec: function(data, lazyScope, tmplScope, wrapper) {
        var $childTarget = this.firstElementChild(wrapper);
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
        return "'+\n((__t=(" + escape + "))==null?'':bridge.tmplTool.escapeHtml.escape(__t))+\n'";
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

    // from underscore.js
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
      pattern: new RegExp(patternArray.join('|'), 'g'),
      exec: execArray,
      lazyExecKeys: Object.keys(lazyScope),
      lazyExec: lazyExecArray,
      lazyScopeSeed: JSON.stringify(lazyScope)
    };
  }

  var escapeFunc = function(match) {
    return escapes[match] || escapes[match.replace(/[ \n]/g, '')] || '';
  };

  var defaultMatcher = matcherFunc(Bridge.templateSettings);

  var templateParser = function(tmplId, text, matcher) {
    if (showTime) console.time("tmpl:" + tmplId);

    var index = 0;
    var source = "";

    text.replace(matcher.pattern, function(...params) {
      //var match = arguments[0];
      //var offset = arguments[arguments.length-2];
      var match = params[0];
      var offset = params[params.length-2];
      source += text.slice(index, offset).replace(escaper, escapeFunc);
      var selected, i = null;
      //Array.prototype.slice.call(arguments, 1, -2).some(function(value, idx, arr) {
      params.slice(1, -2).some(function(value, idx, arr) {
        if (!!value) {
          selected = value;
          i = idx;
          return true;
        }
        return false;
      });

      if (!selected) return match;
      source += matcher.exec[i].call(matcher.settings, selected, tmplId);
      index = offset + match.length;
      return match;
    });

    if (showTime) console.timeEnd("tmpl:" + tmplId);
    return source + text.slice(index).replace(escaper, escapeFunc);
  }

  // JavaScript micro-templating, similar to John Resig's implementation.
  var templateBuilder = Bridge.template = function bridte_templateBuilder (tmplId, templateText, tmplSettings) {
    var settings = Bridge.templateSettings;
    var matcher = defaultMatcher;
    if (tmplSettings) {
      settings = Object.assign({}, Bridge.templateSettings, tmplSettings);
      matcher = matcherFunc(settings);
    }
    var source = "/* tmplId: " + tmplId +  " */\n//# sourceURL=http://tmpl//" + tmplId.split('-').join('//') + ".js\nvar __t,__p='';\n__p+='";
    source += templateParser(tmplId, templateText, matcher);
    source += "';\nreturn __p;";
    var render = null;
    try {
      render = new Function(settings.dataName || 'data',  settings.statusName || 'status', 'tmplScope', 'lazyScope', 'i18n', source);
    } catch(e) {
    	var debugErrorLine = function(source, e) {
        console.error(tmplId, e.lineNumber, e.columnNumber);
        new Function(settings.dataName || 'data',  settings.statusName || 'status', 'tmplScope', 'lazyScope', 'i18n', source);
      }
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
      var tmplScope = Object.assign(tmplScope || {}, {
        tmplId: tmplId,
        //_id: tmplTool.genId(tmplId),
        //[statusKeyName]: {},
        replace: function(scope) {
          tmplScope.element.parentElement.replaceChild(scope.element || scope, tmplScope.element);
        },
        remove: function(spacer) {
          if (tmplScope.beforeRemove) tmplScope.beforeRemove();
          if (tmplScope.element.parentElement) {
            if (spacer) {
              var dumy = document.createElement('template');
              tmplScope.element.parentElement.replaceChild(dumy, tmplScope.element);
              tmplScope.element = dumy;
            }  else {
              tmplScope.element.parentElement.removeChild(tmplScope.element);
            }
          }
          if (tmplScope.afterRemove) tmplScope.afterRemove();
          return tmplScope.element;
        },
        appendTo: function(parentElement) {
          if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
          if (parentElement) parentElement.appendChild(tmplScope.element);
          if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
          return tmplScope;
        }
      });
      if (!tmplScope._id) {
        tmplScope._id = tmplTool.genId(tmplId);
      }
      tmplScope[dataKeyName] = data;
      if (tmplScope[statusKeyName] == undefined) tmplScope[statusKeyName] = {};
      var hasParent = wrapperElement ? true : false;
      var temp = document.createElement('template');
      var returnTarget = null;

      if (showTime) console.time("render:" + tmplId);

      var html = null;
      try {
        html = !data ? '<template></template>' : render.call(wrapperElement, data, tmplScope[statusKeyName], tmplScope, lazyScope, Bridge.i18n[tmplId]);
      } catch(e) {
        var debugErrorLine = function(source) {
      	  console.log('Error: ', tmplId);
          render.call(wrapperElement, data, tmplScope[statusKeyName], tmplScope, lazyScope, Bridge.i18n[tmplId]);
        }
        if (throwError) {
          debugErrorLine(source, e);
          throw e;
        } else {
          return;
        }
      }
      if (showTime) console.timeEnd("render:" + tmplId);

      temp.innerHTML = html;

      var docFragment = temp.content || temp;
      if (docFragment.tagName == 'TEMPLATE') {
        // for IE11
        var children = docFragment.children;
        docFragment = document.createDocumentFragment();
        Array.prototype.forEach.call(children, function(child) {
          docFragment.appendChild(child);
        });
      }
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

      if (docFragment.firstChild && docFragment.firstChild.nodeType == 8) {
        returnTarget = docFragment.firstChild;
      } else if (childElementCount(docFragment) == 1) {
        returnTarget = firstElementChild(docFragment);
        if (hasParent) {
          if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
          wrapperElement.appendChild(returnTarget);
          if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
        }
      } else {
        if (hasParent) {
          if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
          wrapperElement.appendChild(docFragment);
          if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
          returnTarget = wrapperElement;
        } else {
          returnTarget = docFragment;
        }
      }

      if (data && data.$props) {
        for (var prop in data.$props) {
          returnTarget[prop] = data.$props[prop];
        }
      }

      returnTarget.normalize();
      cleanNode(returnTarget);
      tmplScope.element = returnTarget;
      if (tmplTool.liveReloadSupport) tmplTool.liveReloadSupport(tmplScope);

      // style to shadow
      var style = returnTarget.querySelector ? returnTarget.querySelector('style[scoped], style[shadow]') : null;
      if (style && returnTarget.createShadowRoot) {
        var shadow = returnTarget.createShadowRoot();
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

      tmplScope.release = function() {
        var props = Object.getOwnPropertyNames(tmplScope);
        props.splice(props.indexOf(statusKeyName), 1);
        for (var i = 0; i < props.length; i++) {
          delete tmplScope[props[i]];
        }
      }

      tmplScope.render = function(fdata) {
        var tmplScope = this.tmplScope || this;
        var target = tmplScope.element;
        var tmpl = bridge.tmpl(tmplScope.tmplId);
        var beforeRemove = tmplScope.beforeRemove;
        var afterRemove = tmplScope.afterRemove;
        tmplScope.element = void 0;
        tmplScope.data = void 0;
        tmplScope.render = void 0;
        tmplScope.beforeRemove = void 0;
        tmplScope.afterRemove = void 0;

        if (tmplScope.wrapperElement) {
          var wrapperElement = tmplScope.wrapperElement;
          if (beforeRemove) beforeRemove();
          tmplScope.release();
          tmplScope = tmpl(fdata, wrapperElement, null, tmplScope);
          if (afterRemove) afterRemove();
          return tmplScope;
        } else {
          tmplScope.release();
          tmplScope = tmpl(fdata, null, null, tmplScope);
          if (target.parentElement) {
            var newElement = tmplScope.element;
            if (beforeRemove) beforeRemove();
            if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
            var replacedNode = target.parentElement.replaceChild(newElement, target);
            while (target.firstChild) { target.removeChild(target.firstChild); }
            target = void 0;
            if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
            if (afterRemove) afterRemove();
          }
          return tmplScope;
        }
      };

      tmplScope.refresh = function(fdata) {
        var tmplScope = this.tmplScope || this;
        var target = tmplScope.element;
        var data = tmplScope.data;
        if (tmplScope.beforeRefresh) tmplScope.beforeRefresh();
        var scope = tmplScope.render(Object.assign(data || {}, fdata));
        if (tmplScope.afterRefresh) tmplScope.afterRefresh();
        return scope;
      };

      tmplScope.reflash = tmplScope.refresh;

      return tmplScope;
    };

    Object.defineProperty(tmpl, 'name', {value: tmplId, writable: false});
    //tmpl.source = 'function ' + tmplId + '_source (' + (settings.variable || 'data') + '){\n' + source + '}';
    var tmpl_source = 'function ' + tmplId + '_source (' + (settings.variable || 'data') + '){\n' + source + '}';

    if (tmplId) {
      var tmplMeta = {
        tmpl: tmpl,
        source: escapeHtml.escape(tmpl_source),
        templateText: escapeHtml.escape(templateText),
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

  var safeTemplate = function(source) {
    if (source.querySelectorAll) {
      return source;
    } else if (isSupportTemplateTag) {
      var template = document.createElement('template');
      //template.innerHTML = source.replace(/(?<=<template[^]*?)<(?=[^]*?<\/template>)/g, '&lt;');
      template.innerHTML = source.replace(/<(?!template|\/template|body|\/body|html|\/html|head|\/head|script|\/script|link|\/link|meta|\/meta|!--)/gi, '&lt;');
      /*
      template.innerHTML = source.replace(/<template([\s\S]*?)<\/template>/gi, (match, p1)=>{
        return `<template${p1.replace(/</g, '&lt;')}</template>`;
      });
      */
    } else {
      var template = document.createElement('template');
      template.innerHTML = 
        source.replace(/<(?!template|\/template|body|\/body|html|\/html|head|\/head|script|\/script|link|\/link|meta|\/meta|!--)/gi, '&lt;')
          .replace(/<template/g, '<script type="template"').replace(/<\/template>/g, '</script>');
    }
    return template;
  }

  var addTmpl = tmplTool.addTmpl = function(tmplId, element, tmplSettings) {
    var templateText = element instanceof Element ? element.innerHTML : element;
    templateText = escapeHtml.unescape(templateText.replace(/<!---|--->/gi, ''));
    return templateBuilder(tmplId, templateText, tmplSettings);
  }

  var addTmpls = tmplTool.addTmpls = function(source, removeInnerTemplate, tmplSettings) {
    if(typeof(removeInnerTemplate) !== "boolean" && tmplSettings == undefined) tmplSettings = removeInnerTemplate;
    var template = safeTemplate(source);
    var tmplNodes = (template.content || template).querySelectorAll('template,script[type="template"]');

    var node = null;
    for (var i=0, size=tmplNodes.length; i < size; i++) {
      node = tmplNodes.item(i);
      node.dataset.bridgeLoadScript ? addTmpl(node.id, node, tmplSettings)({}) : addTmpl(node.id, node, tmplSettings);
      if (removeInnerTemplate) node.parentNode.removeChild(node);
    }
    return template;
  }

  var addTmplByUrl = tmplTool.addTmplByUrl = function bridge_addTmplByUrl (importData, option, callback) {
    if (!callback && typeof option === 'function') {
      callback = option;
      option = {};
    }
    option = Object.assign({loadScript: true, loadStyle: true, loadLink: true}, option);

    var importDataParser = function(obj) {
      if (typeof obj === 'string') {
        return {url: obj, option: option};
      } else {
        obj.option = Object.assign({}, option, obj.option);
        return obj;
      }
    }
    var appendToHead = function(elements) {
      if (elements && elements.length > 0) {
        Array.prototype.forEach.call(elements, function(element) {
          if (element.id) {
            var oldElement = document.getElementById(element.id);
            if (oldElement) oldElement.parentNode.removeChild(oldElement);
          }
          document.body.appendChild(element);
        });
      }
    }
    var importFunc = function(source, option) {
      var template = safeTemplate(source);
      addTmpls(template, option.tmplSettings);
      var content = (template.content || template);
      if (option.loadLink) {
        var links = content.querySelectorAll('link');
        appendToHead(links);
      }
      if (option.loadStyle) {
        var styles = content.querySelectorAll('style[id]');
        appendToHead(styles);
      }
      if (option.loadScript) {
        var scripts = content.querySelectorAll('script[id]:not([type="template"])');
        scripts = Array.prototype.filter.call(scripts, function(node) {
          return node.innerHTML;
        }).map(function(node) {
          var scriptText = node.innerHTML;
          var scriptElm = document.createElement('script');
          var inlineCode = document.createTextNode(scriptText);
          scriptElm.appendChild(inlineCode);
          return scriptElm;
        });
        appendToHead(scripts);
      }
    }

    if (Array.isArray(importData)) {
      var arraySize = importData.length;
      importData.forEach(function(data) {
        data = importDataParser(data);
        var src = data.url;
        if (src.indexOf('.js') > -1) {
          var script = tag('script', {'async': true, 'src': src});
          script.addEventListener("load", function(event) {
            arraySize--;
            if (arraySize == 0 && callback) callback();
          });
          document.head.appendChild(script);
          if (arraySize == 0 && callback) callback();
        } else if (src.indexOf('.css') > -1) {
          var link = tag('link', {'type': 'text/css', 'rel': 'stylesheet', 'href': src});
          document.head.appendChild(link);
          arraySize--;
          if (arraySize == 0 && callback) callback();
        } else {
          requestFunc(data.url, null, function(source) {
            importFunc(source, data.option);
            arraySize--;
            if (arraySize == 0 && callback) callback();
          });
        }
      });
    } else {
      importData = importDataParser(importData);
      requestFunc(importData, null, function(source) {
        importFunc(source, importData.option);
        if (callback) callback();
      });
    }
  }

  var requestFunc = function(url, option, callback) {
    var xmlhttp = new XMLHttpRequest();
    /*
    var stroage = localStorage || sessionStorage;
    if (requestCacheControl && stroage) {
      var cacheStatus = JSON.stringify(stroage['bridge.requestCacheStatus'] || '{}');
      var urlCacheStatus = cacheStatus[url];
      if (urlCacheStatus) {
        var lastModified = urlCacheStatus['Last-Modified'];
        var eTag = urlCacheStatus['ETag'];

      }
    }
    */
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {
        if (xmlhttp.status == 200 || xmlhttp.status === 0) {
          callback(xmlhttp.responseText, xmlhttp.status, xmlhttp);
        } else if(xmlhttp.status == 400) {
          alert('There was an error 400');
        } else {
          console.log('!200', xmlhttp.status, url, option);
        }
      }
    }

    if (option) {
      xmlhttp.open(option.method || 'GET', url, true);
      if (option.timeout) xmlhttp.timeout = option.timeout;
      if (option.headers) Object.keys(option.headers).forEach(function(key) {
        xmlhttp.setRequestHeader(key, option.headers[key]);
      });
      xmlhttp.send(option.body);
    } else {
      xmlhttp.open('GET', url, true);
      xmlhttp.send();
    }
  };

  Bridge.i18n = {};
  tmplTool.i18n = function(i18nObj, defaultText) {
    var label = i18nObj[document.documentElement.lang] || defaultText;
    if (!label) {
      if (debug) console.log('label key [' + fullKey + '] is empty!');
    }
    return label;
  };

  tmplTool.addI18n = function(fullKey, i18nObj) {
    var langKeyNames = fullKey.split('.');
    var target = Bridge.i18n;
    var keyLength = langKeyNames.length - 1;

    langKeyNames.forEach(function(key, i) {
      if (keyLength === i) {
        if (!target[key]) {
          target[key] = function(defaultText) {
            var label = i18nObj[document.documentElement.lang] || defaultText;
            if (!label) {
              if (debug) console.log('label key [' + fullKey + '] is empty!');
            }
            return label;
          }
        }

        Object.keys(i18nObj).filter(lang => i18nObj[lang] instanceof Object).forEach(subKey => {
          tmplTool.addI18n(fullKey + '.' + subKey, i18nObj[subKey]);
          delete i18nObj[subKey];
          return;
        });
      } else {
        if (!target[key]) {
          target[key] = {};
        }
        target = target[key];
      }
    });
  }
  tmplTool.addI18ns = function(i18nObjs) {
    Object.keys(i18nObjs || {}).forEach(function(key) {
      tmplTool.addI18n(key, i18nObjs[key]);
    });
  }

  var elementCount = 0;
  tmplTool.genId = function(tmplId) {
    elementCount++;
    return tmplId + elementCount;
  }

  var tag = tmplTool.tag = function(tagName, attrs) {
      attrs = attrs || [];
      var element = document.createElement(tagName);
      Object.keys(attrs).forEach(function(key) {
          //element.setAttribute(key, attrs[key]);
          element[key] = attrs[key];
      });
      return element;
  };

  tmplTool.props = function(...props) {
    if (!props) return;
    props = Object.assign(...props);
    var propStrArray = [];
    Object.keys(props).forEach(function(key) {
      if (props[key]) propStrArray.push(key + '="' + props[key] + '"');
    });
    return propStrArray.join(' ');
  };



  addTmpl('br-Tag', '##%bridge.tmplTool.tag(data[0], data[1])##');
  addTmpl('br-Div',
          '&lt;div ##=data.id ? \'id="\' + (data.data === true ? tmplScope._id : data.id) + \'"\' : \'\'## ##=data.class ? \'class="\' + data.class + \'"\' : \'\' ## ##=data.style ? \'style="\' + data.style + \'"\' : \'\' ## data-bridge-event="##:data.event##"&gt;'
          + '##if (typeof data.content === "string") {##'
          + '##=data.content##'
          + '##} else {##'
          + '  ##%data.content##'
          + '##}##');

  addTmpl('br-Input', '&lt;input name="##=data.name##" type="##=data.type##" value="##=data.value##" ##=data.class ? \'class="\' + data.class + \'"\' : \'\' ## ##=data.style ? \'style="\' + data.style + \'"\' : \'\' ## data-bridge-event="##:data.event##"/&gt;');
  addTmpl('br-Select', '&lt;select name="##=data.name##" value="##=data.value##" ##=data.class ? \'class="\' + data.class + \'"\' : \'\' ## ##=data.style ? \'style="\' + data.style + \'"\' : \'\' ## data-bridge-event="##:data.event##"&gt;'
          + '&lt;option class="empty" value=""&gt;##=data.placeholder##&lt;/option&gt;'
          + '##%data.options.map(function(option) { \'&lt;option value="\' + option.value + \'"\' + (data.value == option.value ? \'selected=""\' : \'\') + \'&gt;\' + option.label + \'&lt;/option&gt;\'})##'
          + '&lt;select/&gt;');
  addTmpl('br-Template-Viewer', 
          `<style id="style-ct-Base">
            .ct-Base h1 {
              font-size: 24px;
              font-weight: bold;
            }
            .ct-Base h2 {
              font-size: large;
              font-weight: bold;
            }
            .ct-Base .header {
              padding: 20px;
              padding-bottom: 0px;
              margin-top: 10px;
            }
            .ct-Base .menu {
              margin: 10px;
              margin-top: 50px;
              border: 1px solid #cccccc;
            }
            .ct-Base .menu li {
              padding: 10px 14px;
            }
            .ct-Base .templateArea {
              margin: 10px;
              margin-top: 50px;
              padding: 10px;
              border: 1px solid #cccccc
            }
            .ct-Base .componentView {
              margin: 10px;
            }
            .ct-Base button {
              padding: 4px 10px;
              margin: 4px;
              border-radius: 0.5rem;
              border: 1px solid #cccccc;
            }
            .ct-Base .hide {
              display: none;
            }
            .ct-Base .templateText :not(pre)>code[class*=language-],
            .ct-Base .templateText pre[class*=language-] {
              background: #66990015;
            }
            .ct-Base .source :not(pre)>code[class*=language-],
            .ct-Base .source  pre[class*=language-] {
              background: #0077aa15;
            }
          </style>
          ##
          let components = data.components;
          ##
          <div class="ct-Base">
            <div class="header">
              <h1>##=data.label##</h1>
              <span>##=data.description##</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <ul class="menu" style="">
                ##Object.keys(components).forEach(key => {##
                  <li class=""><a href="##='#'+key##">##=key##</a></li>
                ##})##
              </ul>
              <div class="content">
                ##Object.keys(components).forEach(key => {
                  let componentScopes = components[key];
                  let templateMeta = bridge.tmplCache.get(key);
                ##
                <div class="templateArea" id="##=key##" style="##=location.hash == '' || location.hash == ('#' + key) ? '' : 'display: none'##;">
                  <h2><a href="##='#'+key##">##=key##</a></h2>
                  ##if (templateMeta) {##
                  <div style="display: flex; gap: 8px;">
                    <button data-bridge-event="##:() => templateText.classList.toggle('hide')##">Template source</button>
                    <button data-bridge-event="##:() => source.classList.toggle('hide')##">Compiled source</button>
                  </div>
                  <hr>
                  <div class="templateText hide" data-bridge-var="##:templateText##">
                    <h2>Template source</h2>
                    <pre><code class="language-javascript">##=templateMeta.templateText##</code></pre>
                  </div>
                  <hr>
                  <div class="source hide" data-bridge-var="##:source##">
                    <h2>Compiled source</h2>
                    <pre><code class="language-javascript">##=templateMeta.source##</code></pre>
                  </div>
                  ##}##

                  ##componentScopes.forEach(scope => {##
                  <hr>
                  <div class="componentView">
                    <pre><code class="language-javascript">##%scope##</code></pre>
                    ##%new Function('return '+scope+';')()##
                  </div>
                  <hr>
                  ##})##
                </div>
                ##})##
              </div>

            </div>
          </div>
          ###
          setTimeout(() => {
            const anchor = document.getElementById(location.hash.replace('#', ''));
            if (anchor) {
              window.scrollTo({
                top: anchor.getBoundingClientRect().top + window.scrollY,
              })
            }
          });
          window.onhashchange = () => location.reload();
          ##`);

}).call(this);
