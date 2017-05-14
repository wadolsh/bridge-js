(function() {'use strict';
  var root = this;
  var Bridge = root.bridge = root.bridge || {};
  
  // Author choish
  var ws = {
    //storage: null,
    push: function(key, data) {
        this.storage[key] = JSON.stringify(data);
    },
    get: function(key) {
      try {
        return JSON.parse(this.storage[key] || null);
      } catch (e) {
        return this.storage[key];
      }
    },
    remove: function(key) {
        delete this.storage[key];
    },
    clear: function () {
      this.storage.clear();
    },
    openObj: function(key) {
      var self = this;
      var obj = this.get(key);
      return {
        push: function(pkey, pval) {
          if (!obj) {
            obj = {};
          }
          obj[pkey] = pval;
          self.push(key, obj);
          return obj; 
        },
        get: function(pkey) {
          return obj ? obj[pkey] : null;
        },
        remove: function(pkey) {
          if (!obj) {
            return null;
          }
          delete obj[pkey];
          return obj;
        }
      }
    },
    openArry: function(key) {
      var self = this;
      var obj = this.get(key);
      return {
        push: function(val) {
          if (!obj) {
            obj = [];
            self.push(key, obj);
          }
          obj.push(val);
          return obj; 
        },
        get: function(ind) {
          return obj ? obj[ind] : null;
        },
        remove: function(ind) {
          if (obj) {
            obj.splice(ind, 1);
          }
          return obj;
        },
        move: function(old_index, new_index) {
          if (!obj) {
            return null;
          }
          if (new_index >= obj.length) {
              var k = new_index - obj.length;
              while ((k--) + 1) {
                  obj.push(undefined);
              }
          }
          obj.splice(new_index, 0, obj.splice(old_index, 1)[0]);
          return obj; // for testing purposes
        }
      }
    }
  };
  var ls = Object.create(ws);
  //var ls = ws.cloneNode(true);
  ls.storage = localStorage;
  var ss = Object.create(ws);
  //var ss = ws.cloneNode(true);
  ss.storage = sessionStorage;
  Bridge.data = Bridge.data ? Bridge.data : {};
  Bridge.data.ls = ls;
  Bridge.data.ss = ss;
}).call(this);
