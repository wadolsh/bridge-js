/*
 * Copyright (c) 2016-present, Choi Sungho
 * Code released under the MIT license
 */
(function () {
  'use strict';

  // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function (predicate) {
      if (this === null) {
        throw new TypeError('Array.prototype.findIndex called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return i;
        }
      }
      return -1;
    };
  }

  var root = this;
  var Bridge = root.bridge = root.bridge || {};
  var loader = Bridge.loader = Bridge.loader || {};
  var loadedResource = Bridge.loadedResource = {};
  var liveReload = Bridge.liveReload = Bridge.liveReload || {};
  var tmplTool = Bridge.tmplTool;

  var parser = {
    text: function (str) {
      return str;
    },
    json: function (str) {
      return JSON.parse(str);
    }
  };

  var requestFunc = function (url, option, callback, getType) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {
        if (xmlhttp.status == 200) {
          //html.id("myDiv").innerHTML = xmlhttp.responseText;
          //callback.call(self, xmlhttp.responseText, url);
          callback(parser[getType || 'text'](xmlhttp.responseText), xmlhttp.status, xmlhttp);
        }
        else if (xmlhttp.status == 400) {
          alert('There was an error 400');
        }
        else {
          //alert('something else other than 200 was returned(' + xmlhttp.status + '): ' +  url + ', ' +  JSON.stringify(option));
          console.log('!200', xmlhttp.status, url, option);
        }
      }
    }
    if (option) {
      xmlhttp.open(option.method || 'GET', url, true);
      if (option.headers) Object.keys(option.headers).forEach(function (key) {
        xmlhttp.setRequestHeader(key, option.headers[key]);
      });
      xmlhttp.send(option.body);
    }
    else {
      xmlhttp.open('GET', url, true);
      xmlhttp.send();
    }
  };

  var log = {
    debug: function (str, args) {
      //console.log("%c" + str, 'color: green', args);
      //console.trace();
    },
    info: function (str, args) {
      console.info("%c" + str, 'color: blue', args);
      console.trace();
    },
    error: function (str, args) {
      console.error("%c" + str, 'color: red', args);
      console.trace();
    }
  }

  var htmlObj = {
    doc: document,
    head: document.head,
    body: document.body,
    query: function (selector) {
      return this.doc.querySelector(selector);
    },
    element: function (tagName) {
      return this.doc.createElement(tagName);
    },
    id: function (id) {
      this.doc.getElementById(id);
    },
    tag: function (tagName, attrs) {
      var element = htmlObj.element(tagName);
      Object.keys(attrs).forEach(function (key) {
        element.setAttribute(key, attrs[key]);
      });
      return element;
    },
    event: function (obj, eventName, func) {
      obj.addEventListener(eventName, func);
    }
  }

  loader.load = function (src, callback, cache) {
    if (Array.isArray(src)) {
      var load = this.load;
      var length = src.length - 1;
      src.forEach(function (srcStr, i) {
        load(srcStr, (length == i ? callback : null), cache);
      });
      return;
    }

    log.debug(src);
    if (!src) {
      log.error("url is not exist.");
      return;
    }
    loader[src.split('.').pop()](src + (cache ? '?hash=' + new Date().getTime() : ''), callback);
  }

  loader.js = function (src, callback) {
    log.debug(src);
    var script = htmlObj.tag('script', {
      'async': '',
      'src': src
    });
    htmlObj.head.appendChild(script);
    htmlObj.event(script, 'load', function () {
      script.removeAttribute('async');
      if (callback) {
        callback();
      }
    });
  }

  loader.css = function (src, callback) {
    log.debug(src);
    var link = htmlObj.tag('link', {
      'type': 'text/css',
      'rel': 'stylesheet',
      'href': src
    });
    htmlObj.head.appendChild(link);
    htmlObj.event(link, 'load', function () {
      //link.removeAttribute('async');
      if (callback) {
        callback();
      }
    });
  }

  loader.html = function (src, callback) {
    log.debug(src);
    requestFunc(src, null, callback);
  }

  loader['bridge.tmpls'] = function (src, callback) {
    log.debug(src);
    var templateLoader = function (text, url) {
      tmplTool.addTmpls(text);
    }
    requestFunc(src, null, function (text, url) {
      //callback ? callback(text, url, templateLoader) : templateLoader(text, url);
      templateLoader(text, url);
      if (callback) {
        callback(text, url);
      }
    });
  }

  liveReload.liveReloadIntervId = null;
  liveReload.socket = null;
  liveReload.start = function (url) {
    /*
    tmplTool.liveReloadSupport = function(tmplScope) {
      tmplScope.element.tmplScope = tmplScope;
    }
    //if (!config.repository.use) return;
    if (this.socket) {
        this.stop();
    }
    var socket = io(url || '//' + window.document.location.host + '/');
    this.socket = socket;
    socket.on('liveReload', function (data) {
console.log('liveReload', data);
      if (data.path) {
        var path = data.path;
        if (path && path[0] != '/') {
          path = '/' + path;
        }
        if (data.path.indexOf('components.html') > -1) {

          requestFunc(path, null, function(text) {
console.log('addTmpls: ' + path);

            var $template = document.createElement('template');
            $template.innerHTML = text;
            var $templateContent = ($template.content || $template);
            var importedTarget = document.querySelector('link[rel="import"][href="' + path + '"]');
            if (importedTarget) {
              var importedContent = importedTarget.import;

              // reload style
              var importedStyleNodes = importedContent.querySelectorAll('style');
              Array.prototype.forEach.call(importedStyleNodes, function(styleNode) {
                styleNode.parentNode.removeChild(styleNode);
              });
              var styleNodes = $templateContent.querySelectorAll('style');
              Array.prototype.forEach.call(styleNodes, function(styleNode) {
                importedContent.head.appendChild(styleNode);
              });
            }

            // reload template
            var tmplNodes = $templateContent.querySelectorAll('template');
            var tmplIds = Array.prototype.presetObjomap.call(tmplNodes, function(ele) {
              return ele.id ;
            });

            var escapeHtml = tmplTool.escapeHtml;
            var refreshIds = [];
            var removeElements = Array.prototype.filter.call(tmplNodes, function(ele) {
              var tmplCache = Bridge.tmplCache.get(ele.id);
              if (!tmplCache || (tmplCache.templateText != escapeHtml.escape(escapeHtml.unescape(ele.innerHTML)))) {
console.log('Changed template : ', ele.id);
                refreshIds.push(ele.id);
                return false;
              }
              return true;
            });

            for (var i=0, size=removeElements.length; i < size; i++) {
              $templateContent.removeChild(removeElements[i]);
            }

            tmplTool.addTmpls($template.innerHTML);

            var refreshNodeList = Array.prototype.filter.call(document.querySelectorAll('*'), function(ele) {
              if (ele.tmplScope) {
                return refreshIds.includes(ele.tmplScope.tmplId);
              }
              return false;
            });
            for (var i=0, size=refreshNodeList.length; i < size; i++) {
              refreshNodeList[i].tmplScope.refresh();
            }
          });
        } else if (path.indexOf('.js') > -1) {
            loader.js(path);
        } else if (path.indexOf('.css') > -1) {
            loader.css(path);
        } else if (path.indexOf('.html') > -1) {
            window.location.reload();
        }
      }
    });
    */


    var tmplScopeArray = [];
    tmplTool.liveReloadSupport = function(tmplScope) {
      //console.log('----------------add : ' + tmplScope._id);
      var index = tmplScopeArray.findIndex(function (scope) {
        return scope._id == tmplScope._id;
      });
      if (index > -1) {
        tmplScopeArray.splice(index, 1);
      }
      tmplScopeArray.push(tmplScope);
    }

    liveReload.liveReloadIntervId = setInterval(function () {
      console.log('setInterval 1 : ' + tmplScopeArray.length);
      /*
      for (var i=0,length=tmplScopeArray.length; i < length; i++) {
        if (tmplScopeArray[i] && !tmplScopeArray[i].element.isConnected) {
          tmplScopeArray.splice(i, 1);
        } else {

        }
      }
      */
      var index = tmplScopeArray.length;
      while (index--) {
        if (!tmplScopeArray[index].element.isConnected) {
          tmplScopeArray.splice(index, 1);
        }
        else {

        }
      }
      console.log('setInterval 2 : ' + tmplScopeArray.length, new Date());
    }, 100000);

    //if (!config.repository.use) return;
    if (this.socket) {
      this.stop();
    }
    //console.log('socket: ', url, '//' + window.document.location.host + '/')
    var socket = io(url || '//' + window.document.location.host + '/liveReload');
    this.socket = socket;
    socket.on('liveReload', function (data) {
      console.log('liveReload', data);
      if (data.path) {
        var path = data.path;
        if (path && path[0] != '/') {
          path = '/' + path;
        }
        if (data.path.indexOf('components.html') > -1) {

          requestFunc(path, null, function (text) {
            console.log('addTmpls: ' + path);

            var $template = document.createElement('template');
            $template.innerHTML = text.replace(/<(?!template|\/template|body|\/body|html|\/html|head|\/head|script|\/script|link|\/link|meta|\/meta|!--)/gi, '&lt;');
            var $templateContent = ($template.content || $template);
            var importedTarget = document.querySelector('link[rel="import"][href="' + path + '"]');
            if (importedTarget) {
              var importedContent = importedTarget.import;

              // reload style
              var importedStyleNodes = importedContent.querySelectorAll('style');
              Array.prototype.forEach.call(importedStyleNodes, function (styleNode) {
                styleNode.parentNode.removeChild(styleNode);
              });
              var styleNodes = $templateContent.querySelectorAll('style');
              Array.prototype.forEach.call(styleNodes, function (styleNode) {
                importedContent.head.appendChild(styleNode);
              });
            }

            // reload template
            var tmplNodes = $templateContent.querySelectorAll('template');
            var tmplIds = Array.prototype.map.call(tmplNodes, function (ele) {
              return ele.id;
            });

            var escapeHtml = tmplTool.escapeHtml;
            var refreshIds = [];
            var removeElements = Array.prototype.filter.call(tmplNodes, function (ele) {
              var tmplCache = Bridge.tmplCache.get(ele.id);
              if (!tmplCache || (tmplCache.templateText != escapeHtml.escape(escapeHtml.unescape(ele.innerHTML)))) {
                console.log('Changed template : ', ele.id);
                refreshIds.push(ele.id);
                return false;
              }
              return true;
            });

            for (var i = 0, size = removeElements.length; i < size; i++) {
              $templateContent.removeChild(removeElements[i]);
            }

            tmplTool.addTmpls($template.innerHTML);

            var refreshTargetList = tmplScopeArray.filter(function (scope) {
              if (scope.element && scope.element.isConnected) {
                return refreshIds.includes(scope.tmplId);
              }
              return false;
            });

            for (var i = 0, size = tmplScopeArray.length; i < size; i++) {
              if (tmplScopeArray[i].element.isConnected && refreshIds.includes(tmplScopeArray[i].tmplId)) {
                tmplScopeArray[i].refresh();
                console.log(tmplScopeArray[i]._id, tmplScopeArray[i].element.isConnected);
              }
            }
          });
        }
        else if (path.indexOf('.js') > -1) {
          loader.js(path);
        }
        else if (path.indexOf('.css') > -1) {
          loader.css(path);
        }
        else if (path.indexOf('.html') > -1) {
          window.location.reload();
        }
      }
    });

  };

  liveReload.stop = function () {
    if (liveReload.liveReloadIntervId) clearInterval(liveReload.liveReloadIntervId);
    delete tmplTool.liveReloadSupport;
    this.socket.disconnect();
    this.scoket = null;
  }

}).call(this);
