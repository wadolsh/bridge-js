(function(){'use strict';
  var root = this;
  var Bridge = root.bridge = root.bridge || {};
  Bridge.util = Bridge.util || {};
  
  Bridge.util.object = {
    isFunction: function(obj) {
      return typeof obj === "function";
    }
  }

  var objectConstructor = {}.constructor;
  Bridge.util.json = {
    flatJson: function(doc, separator) {
      separator = separator || '.';
      var result = {};
      var toFlat = function(doc, baseKeyName) {
        if (doc === null || doc === undefined) {
          result[baseKeyName] = doc;
        } else if (Array.isArray(doc)) {
          doc.forEach(function(aObj, index) {
            toFlat(aObj, (baseKeyName ? baseKeyName : '') + '[' + index + ']');
          });
        } else if (doc.constructor === objectConstructor) {
          Object.keys(doc).forEach(function(key, index) {
            toFlat(doc[key], (baseKeyName ? baseKeyName + separator : '') + key);
          });
        } else {
          result[baseKeyName] = doc;
        }
        return result;
      }
      
      if (Array.isArray(doc)) {
        var resultArray = [];
        doc.forEach(function(item) {
          result = {};
          resultArray.push(toFlat(item));
        });
        return resultArray;
      }
      
      return toFlat(doc);
    },
    
    revertFlatJson: function(doc, separator) {
      separator = separator || '.';
      if (doc.length == 0) return null;
  
      var parse = function(container, okey, nextKey, value) {
        if (okey.indexOf('[') > -1) {
          var akeys = okey.split('[');
          var akeysLength = akeys.length;
          akeys.forEach(function(akey, index) {
            if (!akey) return; 
            if (index == 0) {
              if (!container[akey]) container[akey] = [];
              container = container[akey];
            } else if (akeysLength == index + 1) {
              var akey = parseInt(akey);
              if (!nextKey) {
                container[akey] = value;
              } else {
                if (!container[akey]) container[akey] = {};
                container = container[akey];
              }
            } else {
              var akey = parseInt(akey);
              if (!container[akey]) container[akey] = [];
              container = container[akey];
            }
          });
          
        } else if (!nextKey) {
          container[okey] = value;
        } else {
          if (!container[okey]) container[okey] = {};
          container = container[okey];
        }
        return container;
      }
      
      var revert = function(key, value) {
        var container = result;
        var keys = key.split(separator);
        var keyLength = keys.length;
        keys.forEach(function(okey, index) {
          container = parse(container, okey, keys[index + 1], value);
        });
      }
      
      var keys = Object.keys(doc);
      var result = keys[0].charAt(0) == '[' ? [] : {};
      keys.forEach(function(key) {
        revert(key, doc[key]);
      });
      
      return result;
    }
  }
    
}).call(this);
