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

(function() {
  "use strict";

  // Polyfill
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
  if (typeof Object.assign != "function") {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
      value: function assign(target, ...params) {
        // .length of function is 2
        // 'use strict';
        if (target == null) {
          // TypeError if undefined or null
          throw new TypeError("Cannot convert undefined or null to object");
        }
        let to = Object(target);
        for (let index = 0, length = params.length; index < length; index++) {
          let nextSource = params[index];
          if (nextSource != null) {
            // Skip over if undefined or null
            for (let nextKey in nextSource) {
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      },
      writable: true,
      configurable: true,
    });
  }

  // from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md

  (function (arr) {
    arr.forEach(function (item) {
      if (!item) return;
      if (item.hasOwnProperty("remove")) {
        return;
      }
      Object.defineProperty(item, "remove", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function remove() {
          if (this.parentNode !== null) {
            this.parentNode.removeChild(this);
          }
        },
      });
    });
  })([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

  // https://stackoverflow.com/questions/37588326/reliabilty-of-isconnected-field-in-dom-node
  (function (supported) {
    if (supported) return;
    Object.defineProperty(window.Node.prototype, "isConnected", {
      get: function () {
        return document.body.contains(this);
      },
    });
  })("isConnected" in window.Node.prototype);

  let root = this;
  let Bridge = (root.bridge = root.bridge || {});
  let tmplTool = (Bridge.tmplTool = Bridge.tmplTool || {});
  let showTime = tmplTool.showTime || false;
  let debug = tmplTool.debug != undefined ? tmplTool.debug : false;
  let requestCacheControl = tmplTool.requestCacheControl || true;
  let throwError =
    tmplTool.throwError != undefined ? tmplTool.throwError : true;
  let cachedTmpl = (Bridge.tmplCache = Bridge.tmplCache || new Map());
  if (!cachedTmpl.has("anonymous")) {
    cachedTmpl.set("anonymous", { elements: new Set() });
  }
  let isSupportTemplateTag = "content" in document.createElement("template");

  root.tmpl = {};

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  let noMatch = /(.)^/;
  let escapes = {
    "'": "\\'",
    "\\": "\\\\",
    "\r": "\\r",
    "\n": "\\n",
    "\t": "\\t",
    "\u2028": "\u2028",
    "\u2029": "\u2029",
    "><": "><",
    "<": "<",
    ">": ">",
    //'#': '#'
  };
  let escaper = /\>( |\n)+\<|\>( |\n)+|( |\n)+\<|\\|'|\r|\n|\t|\u2028|\u2029/g;
  //let escaper = /\>( |\n)+\<|\>( |\n)+|( |\n)+\<|#( |\n)+|( |\n)+#|\\|'|\r|\n|\t|\u2028|\u2029/g;

  let firstElementChild = function (ele) {
    if (ele.firstElementChild) return ele.firstElementChild;
    let children = ele.childNodes;
    for (let i = 0, size = children.length; i < size; i++) {
      if (children[i] instanceof Element) {
        return children[i];
      }
    }
    return null;
  };

  let childNodeCount = function (ele) {
    return (
      ele.childElementCount ||
      Array.prototype.filter.call(ele.childNodes, function (child) {
        return child instanceof Node;
      }).length
    );
  };
  let childElementCount = function (ele) {
    return (
      ele.childElementCount ||
      Array.prototype.filter.call(ele.childNodes, function (child) {
        return child instanceof Element;
      }).length
    );
  };
  let cleanNode = function (node) {
    for (let n = 0; n < node.childNodes.length; n++) {
      let child = node.childNodes[n];
      if (
        child.nodeType === 8 ||
        (child.nodeType === 3 && !/\S/.test(child.nodeValue))
      ) {
        node.removeChild(child);
        n--;
      } else if (child.nodeType === 1) {
        cleanNode(child);
      }
    }
  };

  Bridge.templateSettings = {
    firstElementChild: firstElementChild,
    childElementCount: childElementCount,
    style: {
      pattern: /(\<style id=[\s\S]+?\>[\s\S]+?\<\/style\>)/g,
      exec: function (style) {
        let dumy = document.createElement("template");
        dumy.innerHTML = style;
        let styleNode = (dumy.content || dumy).querySelector("style");
        let oldStyleNode = document.getElementById(styleNode.id);
        if (oldStyleNode) oldStyleNode.parentNode.removeChild(oldStyleNode);
        document.head.appendChild(styleNode);
        return "";
      },
    },
    commentArea: {
      pattern: /#\\#([\s\S]+?)#\\#/g,
      exec: function (commentArea) {
        return "'+\n'##" + commentArea + "##'+\n'";
      },
    },
    preEvaluate: {
      pattern: /##!([\s\S]+?)##/g,
      exec: function (preEvaluate, tmplId) {
        new Function("tmplId", preEvaluate)(tmplId);
        return "";
      },
    },
    interpolate: {
      //pattern: /(?:##=|\$\{)([\s\S]+?)(?:##|\})/g, // ##=##, ${}
      pattern: /##=([\s\S]+?)##/g, // ##=##, ${}
      exec: function (interpolate) {
        //interpolate = 'typeof (' + interpolate + ')==\'function\' ? (' + interpolate + ')() : (' + interpolate + ')';
        //return "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
        let interpolateSyntax =
          "typeof (interpolate)=='function' ? (interpolate)() : (interpolate)";
        return (
          "';\n(() => {let interpolate=" +
          interpolate +
          ";\n__p+=((__t=(" +
          interpolateSyntax +
          "))==null?'':__t);})()\n__p+='"
        );
      },
    },
    namedElement: {
      pattern: /data-bridge-named-element="##:([\s\S]+?)##"/g,
      exec: function (key) {
        let source =
          "';\nlet eventId = (lazyScope.namedElementArray.length);\n__p+='data-bridge-named-element=\"'+eventId+'\"';\n";
        source += "lazyScope.namedElementArray[eventId] = " + key + ";\n__p+='";
        return source;
      },
      lazyExec: function (data, lazyScope, tmplScope, wrapper) {
        lazyScope.namedElementArray.forEach(function (key, eventId) {
          let $elementTrigger = wrapper.querySelector(
            '[data-bridge-named-element="' + eventId + '"]'
          );
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.bridgeNamedElement;
          tmplScope[key] = $elementTrigger;
        });
      },
    },
    elementRef: {
      pattern: /data-bridge-element-ref="##:([\s\S]+?)##"/g,
      exec: function (key) {
        var source = "';\nvar eventId = (lazyScope.elementRefArray.length);\n__p+='data-bridge-element-ref=\"'+eventId+'\"';\n";
        source += "var " + key + " = null;\nlazyScope.elementRefArray[eventId] = function(target) {" + key + " = target;};\n__p+='";
        return source;
      },
      lazyExec: function (data, lazyScope, tmplScope, wrapper) {
        lazyScope.elementRefArray.forEach(function (func, eventId) {
          let $elementTrigger = wrapper.querySelector(
            '[data-bridge-element-ref="' + eventId + '"]'
          );
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.bridgeVar;
          func.call($elementTrigger, $elementTrigger);
        });
      },
    },
    elementLoad: {
      pattern: /data-bridge-load="##:([\s\S]+?)##"/g,
      exec: function (elementLoad) {
        let source =
          "';\nlet eventId = (lazyScope.elementLoadArray.length);\n__p+='data-bridge-load=\"'+eventId+'\"';\n";
        let elementLoadSplitArray = elementLoad.split("::");
        source +=
          "lazyScope.elementLoadArray[eventId] = {loadFunc: " +
          elementLoadSplitArray[0] +
          ", selectedData: " +
          elementLoadSplitArray[1] +
          "};\n__p+='";
        return source;
      },
      lazyExec: function (data, lazyScope, tmplScope, wrapper) {
        lazyScope.elementLoadArray.forEach(function (elementLoad, eventId) {
          let $elementTrigger = wrapper.querySelector(
            '[data-bridge-load="' + eventId + '"]'
          );
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.bridgeLoad;
          let parentElement = $elementTrigger.parentElement;
          elementLoad.loadFunc.call(
            $elementTrigger,
            $elementTrigger,
            elementLoad.selectedData || data,
            parentElement,
            tmplScope
          );
        });
      },
    },
    event: {
      pattern: /data-bridge-event="##:([\s\S]+?)##"/g,
      exec: function (event) {
        let source =
          "';\n(() => {let eventId = (lazyScope.eventArray.length);\n__p+='data-bridge-event=\"'+eventId+'\"';\n";
        let eventStrArray = event.split(":::");
        let eventArray = new Array();
        for (let i = 0, size = eventStrArray.length; i < size; i++) {
          let eventSplitArray = eventStrArray[i].split("::");
          eventArray.push(
            "{eventFunc: " +
              eventSplitArray[0] +
              ", $parent: this, selectedData: " +
              eventSplitArray[1] +
              "}"
          );
        }

        source +=
          "lazyScope.eventArray[eventId] = [" +
          eventArray.join(",") +
          "];})()\n__p+='";
        return source;
      },
      lazyExec: function (data, lazyScope, tmplScope, wrapper) {
        let self = this;
        let attacher = self.event.attacher;
        lazyScope.eventArray.forEach(function (selectedArray, eventId) {
          let $elementTrigger = wrapper.querySelector(
            '[data-bridge-event="' + eventId + '"]'
          );
          if (!$elementTrigger) return;
          delete $elementTrigger.dataset.bridgeEvent;
          for (let i = 0, size = selectedArray.length; i < size; i++) {
            let selected = selectedArray[i];
            if (selectedArray[i].eventFunc) {
              if (selected.eventFunc instanceof Array) {
                selected.eventFunc.forEach(function (func) {
                  attacher(
                    self,
                    data,
                    lazyScope,
                    tmplScope,
                    wrapper,
                    $elementTrigger,
                    func,
                    selected
                  );
                });
              } else {
                attacher(
                  self,
                  data,
                  lazyScope,
                  tmplScope,
                  wrapper,
                  $elementTrigger,
                  selected.eventFunc,
                  selected
                );
              }
            }
          }
        });
      },
      trigger: function (target, eventName) {
        let customEvent = document.createEvent("Event");
        customEvent.initEvent(eventName, true, true);
        target.dispatchEvent(customEvent);
      },
      attacher: function (
        self,
        data,
        lazyScope,
        tmplScope,
        wrapper,
        $elementTrigger,
        eventFunc,
        eventData
      ) {
        let trigger = self.event.trigger;
        let $childTarget = self.firstElementChild(wrapper);
        let $targetElement =
          self.childElementCount(wrapper) == 1 ? $childTarget : null;

        if (!eventFunc) {
          return;
        }

        let eventFuncParams = [
          $elementTrigger,
          null,
          {
            selectedData: eventData.selectedData,
            data: data,
            targetElement: $targetElement || $childTarget.parentElement,
            tmplScope: tmplScope,
          },
        ];

        if (eventFunc instanceof Function) {
          $elementTrigger.addEventListener("click", function (event) {
            event.stopPropagation();
            //let parentElement = $targetElement || $childTarget.parentElement;
            //eventFunc.call($elementTrigger, event, (eventData.selectedData == undefined ? data : eventData.selectedData), parentElement, tmplScope);
            eventFuncParams[1] = event;
            eventFunc.call(...eventFuncParams);
          });
          return;
        }
        let triggerKey = eventFunc.triggerKey;
        if (triggerKey) {
          tmplScope.trigger = tmplScope.trigger || {};
          tmplScope.trigger[triggerKey] = {};
        }
        Object.keys(eventFunc).forEach(function (eventType) {
          console.log(eventType);
          if (eventType == "load") {
            //let parentElement = $targetElement || $childTarget.parentElement;
            //eventFunc[eventType].call($elementTrigger, $elementTrigger, (eventData.selectedData == undefined ? data : eventData.selectedData), parentElement, tmplScope);
            eventFuncParams[1] = $elementTrigger;
            eventFunc[eventType].call(...eventFuncParams);
            return;
          } else if (eventType == "var") {
            tmplScope[eventFunc[eventType]] = $elementTrigger;
            return;
          } else if (eventType == "triggerKey") {
            return;
          }

          $elementTrigger.addEventListener(eventType, function (event) {
            event.stopPropagation();
            //let parentElement = $targetElement || $childTarget.parentElement;
            //eventFunc[eventType].call($elementTrigger, event, (eventData.selectedData == undefined ? data : eventData.selectedData), parentElement, tmplScope);
            eventFuncParams[1] = event;
            eventFunc[eventType].call(...eventFuncParams);
          });

          if (triggerKey) {
            tmplScope.trigger[triggerKey][eventType] = function () {
              trigger($elementTrigger, eventType);
            };
          }
        });
      },
    },
    element: {
      pattern: /##%([\s\S]+?)##/g,
      exec: function (target) {
        let elementSplitArray = target.split("::");
        let source =
          "';\n(() => {let elementId = (lazyScope.elementArray.length);\n__p+='<template data-bridge-tmpl-element-id=\"'+elementId+'\"></template>";
        source +=
          "';\nlazyScope.elementArray[elementId] = {target: " +
          elementSplitArray[0] +
          ", nonblocking: " +
          (elementSplitArray[1] || false) +
          "};})()\n__p+='";
        return source;
      },
      lazyExec: function (data, lazyScope, tmplScope, wrapper) {
        let self = this;
        lazyScope.elementArray.forEach(function (ele, elementId) {
          let childTarget = ele.target;
          let nonblocking = ele.nonblocking;
          let $tmplElement = wrapper.querySelector(
            'template[data-bridge-tmpl-element-id="' + elementId + '"]'
          );
          if (childTarget instanceof Array) {
            let docFragment = document.createDocumentFragment();
            childTarget.forEach(function (child) {
              if (!child) return;
              let childElement = child.element || child;
              if (typeof childElement === "string") {
                /*
                let interpolate = child;
                if (interpolate[0] == '@') {
                  interpolate = new Function('return ' + interpolate.slice(1) + ';')();
                }
                */
                docFragment.appendChild(
                  self.element.stringToElement(childElement)
                );
              } else if (typeof childElement === "number") {
                docFragment.appendChild(
                  self.element.stringToElement(childElement)
                );
              } else if (typeof childElement === "function") {
                docFragment.appendChild(
                  self.element.stringToElement(childElement())
                );
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
            childTarget.forEach(function (child) {
              if (child && child.afterAppendTo)
                setTimeout(function () {
                  child.afterAppendTo();
                });
            });
          } else if (typeof childTarget === "string") {
            $tmplElement.parentNode.replaceChild(
              self.element.stringToElement(childTarget),
              $tmplElement
            );
          } else if (typeof childTarget === "number") {
            $tmplElement.parentNode.replaceChild(
              self.element.stringToElement(childTarget),
              $tmplElement
            );
          } else if (typeof childTarget === "function") {
            $tmplElement.parentNode.replaceChild(
              self.element.stringToElement(childTarget()),
              $tmplElement
            );
          } else if (
            (childTarget && (childTarget.element || childTarget)) instanceof
            Element
          ) {
            let doFunc = function () {
              let childElement = childTarget.element || childTarget;
              let parentNode = $tmplElement.parentNode;
              let node1 = null;
              if (childElement instanceof DocumentFragment) {
                node1 = childElement.firstChild;
              }

              if (childTarget.beforeAppendTo) childTarget.beforeAppendTo();
              let replacedNode = parentNode.replaceChild(
                childElement,
                $tmplElement
              );
              if (childTarget.afterAppendTo)
                setTimeout(function () {
                  childTarget.afterAppendTo();
                });
              if (childTarget.tmplId) {
                if (node1) {
                  childTarget.this = node1.parentNode;
                }
                childTarget.parentScope = tmplScope;
              }
            };
            nonblocking == undefined || nonblocking === false
              ? doFunc()
              : setTimeout(doFunc, nonblocking);
          } else {
            $tmplElement.parentNode.removeChild($tmplElement);
          }
        });
      },
      stringToElement: function (str) {
        if (!isNaN(str)) {
          return document.createTextNode(str);
        } else if (str && str.startsWith("<>")) {
          let temp = document.createElement("template");
          temp.innerHTML = str.replace("<>", "");
          return temp.content;
        } else {
          return document.createTextNode(str);
        }
      },
    },
    lazyEvaluate: {
      pattern: /###([\s\S]+?)##/g,
      exec: function (lazyEvaluate) {
        let source =
          "';\nlazyScope.lazyEvaluateArray.push(function(data) {" +
          lazyEvaluate +
          "});\n__p+='";
        return source;
      },
      lazyExec: function (data, lazyScope, tmplScope, wrapper) {
        let $childTarget = this.firstElementChild(wrapper);
        let $targetElement =
          this.childElementCount(wrapper) == 1 ? $childTarget : null;
        lazyScope.lazyEvaluateArray.forEach(function (selectedFunc, idx) {
          selectedFunc.call($targetElement || $childTarget.parentElement, data);
        });
        return;
      },
    },
    /*
    include   : {
      pattern: /##@([\s\S]+?)##/g,
      exec: function(include) {
        return "';\n__p+='" + new Function('return ' + include).call(this);
      }
    },
    */
    escape: {
      pattern: /##-([\s\S]+?)##/g,
      exec: function (escape) {
        return (
          "'+\n((__t=(" +
          escape +
          "))==null?'':bridge.tmplTool.escapeHtml.escape(__t))+\n'"
        );
      },
    },
    evaluate: {
      pattern: /##([\s\S]+?)##/g,
      exec: (evaluate) => {
        return "';\n" + evaluate + "\n__p+='";
      },
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
    dataKeyName: "data",
    statusKeyName: "status",
  };

  let escapeHtml = (function () {
    let escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "`": "&#x60;",
      "\n": "&#10;",
    };
    let unescapeMap = (function () {
      let unescapeMap = {};
      Object.keys(escapeMap).forEach(function (ele) {
        unescapeMap[escapeMap[ele]] = ele;
      });
      return unescapeMap;
    })();

    // from underscore.js
    let createEscaper = function (map) {
      let escaper = function (match) {
        return map[match];
      };
      let source = "(?:" + Object.keys(map).join("|") + ")";
      let testRegexp = RegExp(source);
      let replaceRegexp = RegExp(source, "g");
      return function (string) {
        string = string == null ? "" : "" + string;
        return testRegexp.test(string)
          ? string.replace(replaceRegexp, escaper)
          : string;
      };
    };

    return {
      escape: createEscaper(escapeMap),
      unescape: createEscaper(unescapeMap),
    };
  })();
  tmplTool.escapeHtml = escapeHtml;

  let matcherFunc = function (settings) {
    let patternArray = new Array();
    let execArray = new Array();
    let lazyExecArray = {};
    let lazyScope = {};
    let setting = null;
    Object.keys(settings).forEach(function (key) {
      setting = settings[key];
      if (setting.pattern) {
        patternArray.push((setting.pattern || noMatch).source);
        execArray.push(setting.exec);
      }
      if (setting.lazyExec) {
        lazyExecArray[key + "Array"] = setting.lazyExec;
        lazyScope[key + "Array"] = new Array();
      }
    });
    return {
      settings: settings,
      pattern: new RegExp(patternArray.join("|"), "g"),
      exec: execArray,
      lazyExecKeys: Object.keys(lazyScope),
      lazyExec: lazyExecArray,
      lazyScopeSeed: JSON.stringify(lazyScope),
    };
  };

  let escapeFunc = function (match) {
    return escapes[match] || escapes[match.replace(/[ \n]/g, "")] || "";
  };

  let defaultMatcher = matcherFunc(Bridge.templateSettings);

  let templateParser = function (tmplId, text, matcher) {
    if (showTime) console.time("tmpl:" + tmplId);

    let index = 0;
    let source = "";

    text.replace(matcher.pattern, function (...params) {
      //let match = arguments[0];
      //let offset = arguments[arguments.length-2];
      let match = params[0];
      let offset = params[params.length - 2];
      source += text.slice(index, offset).replace(escaper, escapeFunc);
      let selected,
        i = null;
      //Array.prototype.slice.call(arguments, 1, -2).some(function(value, idx, arr) {
      params.slice(1, -2).some(function (value, idx, arr) {
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
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  let templateBuilder = (Bridge.template = function bridte_templateBuilder(
    tmplId,
    templateText,
    tmplSettings
  ) {
    let settings = Bridge.templateSettings;
    let matcher = defaultMatcher;
    if (tmplSettings) {
      settings = Object.assign({}, Bridge.templateSettings, tmplSettings);
      matcher = matcherFunc(settings);
    }
    let source =
      "/* tmplId: " +
      tmplId +
      " */\n//# sourceURL=http://tmpl//" +
      tmplId.split("-").join("//") +
      ".js\nlet __t,__p='';\n__p+='";
    source += templateParser(tmplId, templateText, matcher);
    source += "';\nreturn __p;";
    let render = null;
    try {
      render = new Function(
        settings.dataName || "data",
        settings.statusName || "status",
        "tmplScope",
        "lazyScope",
        "i18n",
        source
      );
    } catch (e) {
      let debugErrorLine = function (source, e) {
        console.log(tmplId, e.lineNumber, e.columnNumber);
        new Function(
          settings.dataName || "data",
          settings.statusName || "status",
          "tmplScope",
          "lazyScope",
          "i18n",
          source
        );
      };
      if (throwError) {
        debugErrorLine(source, e);
        throw e;
      } else {
        return;
      }
    }

    let tmpl = function bridge_tmpl(data, wrapperElement, callback, tmplScope) {
      if (wrapperElement instanceof Function) {
        callback = wrapperElement;
        wrapperElement = undefined;
      }

      let dataKeyName = settings.dataKeyName;
      let statusKeyName = settings.statusKeyName;
      let lazyScope = JSON.parse(matcher.lazyScopeSeed);
      tmplScope = Object.assign(tmplScope || {}, {
        tmplId: tmplId,
        //_id: tmplTool.genId(tmplId),
        //[statusKeyName]: {},
        replace: function (scope) {
          tmplScope.element.parentElement.replaceChild(
            scope.element || scope,
            tmplScope.element
          );
        },
        remove: function (spacer) {
          if (tmplScope.beforeRemove) tmplScope.beforeRemove();
          if (tmplScope.element.parentElement) {
            if (spacer) {
              let dumy = document.createElement("template");
              tmplScope.element.parentElement.replaceChild(
                dumy,
                tmplScope.element
              );
              tmplScope.element = dumy;
            } else {
              tmplScope.element.parentElement.removeChild(tmplScope.element);
            }
          }
          if (tmplScope.afterRemove) tmplScope.afterRemove();
          return tmplScope.element;
        },
        appendTo: function (parentElement) {
          if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
          if (parentElement) parentElement.appendChild(tmplScope.element);
          if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
          return tmplScope;
        },
      });
      if (!tmplScope._id) {
        tmplScope._id = tmplTool.genId(tmplId);
      }
      tmplScope[dataKeyName] = data;
      if (tmplScope[statusKeyName] == undefined) tmplScope[statusKeyName] = {};
      let hasParent = wrapperElement ? true : false;
      let temp = document.createElement("template");
      let returnTarget = null;

      if (showTime) console.time("render:" + tmplId);

      let html = null;
      try {
        html = !data
          ? "<template></template>"
          : render.call(
              wrapperElement,
              data,
              tmplScope[statusKeyName],
              tmplScope,
              lazyScope,
              Bridge.i18n[tmplId]
            );
      } catch (e) {
        let debugErrorLine = function (source) {
          console.log("Error: ", tmplId);
          render.call(
            wrapperElement,
            data,
            tmplScope[statusKeyName],
            tmplScope,
            lazyScope,
            Bridge.i18n[tmplId]
          );
        };
        if (throwError) {
          debugErrorLine(source, e);
          throw e;
        } else {
          return;
        }
      }
      if (showTime) console.timeEnd("render:" + tmplId);

      temp.innerHTML = html;

      let docFragment = temp.content || temp;
      if (docFragment.tagName == "TEMPLATE") {
        // for IE11
        let children = docFragment.children;
        docFragment = document.createDocumentFragment();
        Array.prototype.forEach.call(children, function (child) {
          docFragment.appendChild(child);
        });
      }
      let lazyExec = matcher.lazyExec;
      if (data)
        matcher.lazyExecKeys.forEach(function (key) {
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
        for (let prop in data.$props) {
          returnTarget[prop] = data.$props[prop];
        }
      }

      returnTarget.normalize();
      cleanNode(returnTarget);
      tmplScope.element = returnTarget;
      if (tmplTool.liveReloadSupport) tmplTool.liveReloadSupport(tmplScope);

      // style to shadow
      let style = returnTarget.querySelector
        ? returnTarget.querySelector("style[scoped], style[shadow]")
        : null;
      if (style && returnTarget.createShadowRoot) {
        let shadow = returnTarget.createShadowRoot();
        document.head.appendChild(style);
        let styles = "";
        let sheet = style.sheet;
        for (let i = 0, size = sheet.cssRules.length; i < size; i++) {
          styles +=
            "::content " + sheet.cssRules[i].cssText.replace("::content", "");
        }
        style.innerHTML = styles;
        shadow.appendChild(style);
        let content = document.createElement("content");
        content.setAttribute("select", "*");
        shadow.appendChild(content);
      }

      if (callback) {
        callback.call(wrapperElement, tmplScope);
      }

      tmplScope.release = function () {
        let props = Object.getOwnPropertyNames(tmplScope);
        props.splice(props.indexOf(statusKeyName), 1);
        for (let i = 0; i < props.length; i++) {
          delete tmplScope[props[i]];
        }
      };

      tmplScope.render = function (fdata) {
        let tmplScope = this.tmplScope || this;
        let target = tmplScope.element;
        let tmpl = bridge.tmpl(tmplScope.tmplId);
        let beforeRemove = tmplScope.beforeRemove;
        let afterRemove = tmplScope.afterRemove;
        tmplScope.element = void 0;
        tmplScope.data = void 0;
        tmplScope.render = void 0;
        tmplScope.beforeRemove = void 0;
        tmplScope.afterRemove = void 0;

        if (tmplScope.wrapperElement) {
          let wrapperElement = tmplScope.wrapperElement;
          if (beforeRemove) beforeRemove();
          tmplScope.release();
          tmplScope = tmpl(fdata, wrapperElement, null, tmplScope);
          if (afterRemove) afterRemove();
          return tmplScope;
        } else {
          tmplScope.release();
          tmplScope = tmpl(fdata, null, null, tmplScope);
          if (target.parentElement) {
            let newElement = tmplScope.element;
            if (beforeRemove) beforeRemove();
            if (tmplScope.beforeAppendTo) tmplScope.beforeAppendTo();
            let replacedNode = target.parentElement.replaceChild(
              newElement,
              target
            );
            while (target.firstChild) {
              target.removeChild(target.firstChild);
            }
            target = void 0;
            if (tmplScope.afterAppendTo) tmplScope.afterAppendTo();
            if (afterRemove) afterRemove();
          }
          return tmplScope;
        }
      };

      tmplScope.refresh = function (fdata) {
        let tmplScope = this.tmplScope || this;
        let target = tmplScope.element;
        let data = tmplScope.data;
        if (tmplScope.beforeRefresh) tmplScope.beforeRefresh();
        let scope = tmplScope.render(Object.assign(data || {}, fdata));
        if (tmplScope.afterRefresh) tmplScope.afterRefresh();
        return scope;
      };

      tmplScope.reflash = tmplScope.refresh;

      return tmplScope;
    };

    Object.defineProperty(tmpl, "name", { value: tmplId, writable: false });
    //tmpl.source = 'function ' + tmplId + '_source (' + (settings.variable || 'data') + '){\n' + source + '}';
    let tmpl_source =
      "function " +
      tmplId +
      "_source (" +
      (settings.variable || "data") +
      "){\n" +
      source +
      "}";

    if (tmplId) {
      let tmplMeta = {
        tmpl: tmpl,
        source: escapeHtml.escape(tmpl_source),
        templateText: escapeHtml.escape(templateText),
      };
      cachedTmpl.set(tmplId, tmplMeta);
      let tmplIdNames = tmplId.split("-");
      if (tmplIdNames.length > 1) {
        let group = tmplIdNames[0];
        let groupObj = root.tmpl[group];
        if (!groupObj) {
          root.tmpl[group] = groupObj = {};
        }
        let tmplIdSub = tmplIdNames
          .slice(1)
          .join("")
          .replace(/-([a-z])/g, function (g) {
            return g[1].toUpperCase();
          });
        groupObj[tmplIdSub] = tmplMeta.tmpl;
      }
    }
    return tmpl;
  });

  Bridge.remapTmpl = function (json) {
    Object.keys(json).forEach(function (key) {
      cachedTmpl.set(json[key], cachedTmpl.get(key));
    });
  };

  Bridge.tmpl = function (tmplId) {
    let tmplFunc = cachedTmpl.get(tmplId);
    return tmplFunc ? tmplFunc.tmpl : null;
  };

  let safeTemplate = function (source) {
    let template;
    if (source.querySelectorAll) {
      return source;
    } else if (isSupportTemplateTag) {
      template = document.createElement("template");
      //template.innerHTML = source.replace(/(?<=<template[^]*?)<(?=[^]*?<\/template>)/g, '&lt;');
      template.innerHTML = source.replace(
        /<(?!template|\/template|body|\/body|html|\/html|head|\/head|script|\/script|link|\/link|meta|\/meta|!--)/gi,
        "&lt;"
      );
      /*
      template.innerHTML = source.replace(/<template([\s\S]*?)<\/template>/gi, (match, p1)=>{
        return `<template${p1.replace(/</g, '&lt;')}</template>`;
      });
      */
    } else {
      template = document.createElement("template");
      template.innerHTML = source
        .replace(
          /<(?!template|\/template|body|\/body|html|\/html|head|\/head|script|\/script|link|\/link|meta|\/meta|!--)/gi,
          "&lt;"
        )
        .replace(/<template/g, '<script type="template"')
        .replace(/<\/template>/g, "</script>");
    }
    return template;
  };

  let addTmpl = (tmplTool.addTmpl = function (tmplId, element, tmplSettings) {
    let templateText = element instanceof Element ? element.innerHTML : element;
    templateText = escapeHtml.unescape(
      templateText.replace(/<!---|--->/gi, "")
    );
    return templateBuilder(tmplId, templateText, tmplSettings);
  });

  let addTmpls = (tmplTool.addTmpls = function (
    source,
    removeInnerTemplate,
    tmplSettings
  ) {
    if (typeof removeInnerTemplate !== "boolean" && tmplSettings == undefined)
      tmplSettings = removeInnerTemplate;
    let template = safeTemplate(source);
    let tmplNodes = (template.content || template).querySelectorAll(
      'template,script[type="template"]'
    );

    let node = null;
    for (let i = 0, size = tmplNodes.length; i < size; i++) {
      node = tmplNodes.item(i);
      node.dataset.bridgeLoadScript
        ? addTmpl(node.id, node, tmplSettings)({})
        : addTmpl(node.id, node, tmplSettings);
      if (removeInnerTemplate) node.parentNode.removeChild(node);
    }
    return template;
  });

  let addTmplByUrl = (tmplTool.addTmplByUrl = function bridge_addTmplByUrl(
    importData,
    option,
    callback
  ) {
    if (!callback && typeof option === "function") {
      callback = option;
      option = {};
    }
    option = Object.assign(
      { loadScript: true, loadStyle: true, loadLink: true },
      option
    );

    let importDataParser = function (obj) {
      if (typeof obj === "string") {
        return { url: obj, option: option };
      } else {
        obj.option = Object.assign({}, option, obj.option);
        return obj;
      }
    };
    let appendToHead = function (elements) {
      if (elements && elements.length > 0) {
        Array.prototype.forEach.call(elements, function (element) {
          if (element.id) {
            let oldElement = document.getElementById(element.id);
            if (oldElement) oldElement.parentNode.removeChild(oldElement);
          }
          document.body.appendChild(element);
        });
      }
    };
    let importFunc = function (source, option) {
      let template = safeTemplate(source);
      addTmpls(template, option.tmplSettings);
      let content = template.content || template;
      if (option.loadLink) {
        let links = content.querySelectorAll("link");
        appendToHead(links);
      }
      if (option.loadStyle) {
        let styles = content.querySelectorAll("style[id]");
        appendToHead(styles);
      }
      if (option.loadScript) {
        let scripts = content.querySelectorAll(
          'script[id]:not([type="template"])'
        );
        scripts = Array.prototype.filter
          .call(scripts, function (node) {
            return node.innerHTML;
          })
          .map(function (node) {
            let scriptText = node.innerHTML;
            let scriptElm = document.createElement("script");
            let inlineCode = document.createTextNode(scriptText);
            scriptElm.appendChild(inlineCode);
            return scriptElm;
          });
        appendToHead(scripts);
      }
    };

    if (Array.isArray(importData)) {
      let arraySize = importData.length;
      importData.forEach(function (data) {
        data = importDataParser(data);
        let src = data.url;
        if (src.indexOf(".js") > -1) {
          let script = tag("script", { async: true, src: src });
          script.addEventListener("load", function (event) {
            arraySize--;
            if (arraySize == 0 && callback) callback();
          });
          document.head.appendChild(script);
          if (arraySize == 0 && callback) callback();
        } else if (src.indexOf(".css") > -1) {
          let link = tag("link", {
            type: "text/css",
            rel: "stylesheet",
            href: src,
          });
          document.head.appendChild(link);
          arraySize--;
          if (arraySize == 0 && callback) callback();
        } else {
          requestFunc(data.url, null, function (source) {
            importFunc(source, data.option);
            arraySize--;
            if (arraySize == 0 && callback) callback();
          });
        }
      });
    } else {
      importData = importDataParser(importData);
      requestFunc(importData, null, function (source) {
        importFunc(source, importData.option);
        if (callback) callback();
      });
    }
  });

  let requestFunc = function (url, option, callback) {
    let xmlhttp = new XMLHttpRequest();
    /*
    let stroage = localStorage || sessionStorage;
    if (requestCacheControl && stroage) {
      let cacheStatus = JSON.stringify(stroage['bridge.requestCacheStatus'] || '{}');
      let urlCacheStatus = cacheStatus[url];
      if (urlCacheStatus) {
        let lastModified = urlCacheStatus['Last-Modified'];
        let eTag = urlCacheStatus['ETag'];

      }
    }
    */
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {
        if (xmlhttp.status == 200 || xmlhttp.status === 0) {
          callback(xmlhttp.responseText, xmlhttp.status, xmlhttp);
        } else if (xmlhttp.status == 400) {
          alert("There was an error 400");
        } else {
          console.log("!200", xmlhttp.status, url, option);
        }
      }
    };

    if (option) {
      xmlhttp.open(option.method || "GET", url, true);
      if (option.timeout) xmlhttp.timeout = option.timeout;
      if (option.headers)
        Object.keys(option.headers).forEach(function (key) {
          xmlhttp.setRequestHeader(key, option.headers[key]);
        });
      xmlhttp.send(option.body);
    } else {
      xmlhttp.open("GET", url, true);
      xmlhttp.send();
    }
  };

  Bridge.i18n = {};
  tmplTool.i18n = function (i18nObj, defaultText) {
    let label = i18nObj[document.documentElement.lang] || defaultText;
    if (!label) {
      if (debug)
        console.log(
          `Label not exist! (lang: ${document.documentElement.lang})`
        );
    }
    return label;
  };

  tmplTool.addI18n = function (fullKey, i18nObj) {
    let langKeyNames = fullKey.split(".");
    let target = Bridge.i18n;
    let keyLength = langKeyNames.length - 1;

    langKeyNames.forEach(function (key, i) {
      if (keyLength === i) {
        if (!target[key]) {
          target[key] = function (defaultText) {
            let label = i18nObj[document.documentElement.lang] || defaultText;
            if (!label) {
              if (debug) console.log("Label key [" + fullKey + "] is empty!");
            }
            return label;
          };
        }

        Object.keys(i18nObj)
          .filter((lang) => i18nObj[lang] instanceof Object)
          .forEach((subKey) => {
            tmplTool.addI18n(fullKey + "." + subKey, i18nObj[subKey]);
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
  };
  tmplTool.addI18ns = function (i18nObjs) {
    Object.keys(i18nObjs || {}).forEach(function (key) {
      tmplTool.addI18n(key, i18nObjs[key]);
    });
  };

  let elementCount = 0;
  tmplTool.genId = function (tmplId) {
    elementCount++;
    return tmplId + elementCount;
  };

  let tag = (tmplTool.tag = function (tagName, attrs) {
    attrs = attrs || [];
    let element = document.createElement(tagName);
    Object.keys(attrs).forEach(function (key) {
      //element.setAttribute(key, attrs[key]);
      element[key] = attrs[key];
    });
    return element;
  });

  tmplTool.props = function (...props) {
    if (!props) return;
    props = Object.assign(...props);
    let propStrArray = [];
    Object.keys(props).forEach(function (key) {
      if (props[key]) propStrArray.push(key + '="' + props[key] + '"');
    });
    return propStrArray.join(" ");
  };

  addTmpl("br-Tag", "##%bridge.tmplTool.tag(data[0], data[1])##");
  addTmpl(
    "br-Div",
    "&lt;div ##=data.id ? 'id=\"' + (data.data === true ? tmplScope._id : data.id) + '\"' : ''## ##=data.class ? 'class=\"' + data.class + '\"' : '' ## ##=data.style ? 'style=\"' + data.style + '\"' : '' ## data-bridge-event=\"##:data.event##\"&gt;" +
      '##if (typeof data.content === "string") {##' +
      "##=data.content##" +
      "##} else {##" +
      "  ##%data.content##" +
      "##}##"
  );

  addTmpl(
    "br-Input",
    "&lt;input name=\"##=data.name##\" type=\"##=data.type##\" value=\"##=data.value##\" ##=data.class ? 'class=\"' + data.class + '\"' : '' ## ##=data.style ? 'style=\"' + data.style + '\"' : '' ## data-bridge-event=\"##:data.event##\"/&gt;"
  );
  addTmpl(
    "br-Select",
    "&lt;select name=\"##=data.name##\" value=\"##=data.value##\" ##=data.class ? 'class=\"' + data.class + '\"' : '' ## ##=data.style ? 'style=\"' + data.style + '\"' : '' ## data-bridge-event=\"##:data.event##\"&gt;" +
      '&lt;option class="empty" value=""&gt;##=data.placeholder##&lt;/option&gt;' +
      "##%data.options.map(function(option) { '&lt;option value=\"' + option.value + '\"' + (data.value == option.value ? 'selected=\"\"' : '') + '&gt;' + option.label + '&lt;/option&gt;'})##" +
      "&lt;select/&gt;"
  );
  addTmpl(
    "br-Template-Viewer",
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
                  <div class="templateText hide" data-bridge-element-ref="##:templateText##">
                    <h2>Template source</h2>
                    <pre><code class="language-javascript">##=templateMeta.templateText##</code></pre>
                  </div>
                  <hr>
                  <div class="source hide" data-bridge-element-ref="##:source##">
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
          ##`
  );
  return { bridge: root.bridge, tmpl: root.tmpl };
}).call(this);