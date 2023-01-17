
(function() {'use strict';
  var root = this;
  var Bridge = root.bridge = root.bridge || {};
  Bridge.data = Bridge.data || {};
  var idb = Bridge.data.idb = {};
  idb.cache = {};
    
  idb.onerror = function(event) {
    console.trace(event);
  };
  
  idb.deleteDatabase = function(dbName, successCallback, failCallback, blockedCallback) {

    if (idb.cache[dbName] && idb.cache[dbName].db) {
      const cache = idb.cache[dbName];
      for (const objectStoreName of cache.db.objectStoreNames) {
        console.log(objectStoreName)
      }
      cache.close();
    }

    var dbDeleteRequest = window.indexedDB.deleteDatabase(dbName);

    dbDeleteRequest.onblocked = function(event) {
      console.log("Database blocked.");
      if (blockedCallback) blockedCallback();
    }
    dbDeleteRequest.onerror = function(event) {
      console.log("Error deleting database.");
      if (failCallback) failCallback();
    };

    dbDeleteRequest.onsuccess = function(event) {
      console.log("Database deleted successfully.");
      if (idb.cache[dbName]) {
        delete idb.cache[dbName];
      }
      if (successCallback) successCallback();
    };
  }
  

  idb.open = function(dbName, funcs, version) {
    /*
    if (idb.cache[dbName] && idb.cache[dbName].isOpen) {
      return idb.cache[dbName];
    }
    */
    funcs = funcs || {};
    version = version || 1;
    var request = window.indexedDB.open(dbName, version);
    request.onerror = funcs.dbOpenOnerror || idb.onerror;
    if (funcs.onupgradeneeded) {
      request.onupgradeneeded = funcs.onupgradeneeded;
    }
    //request.onblocked = funcs.dbOpenOnerror || idb.onerror;
    
    var index = null;
    var storeCallback = null;
    var callbackStoreStr = null;
    var dbObj = idb.cache[dbName] = {
      db: null,
      isOpen: false,
      queueArray: [],
      request: request,
      storeFunc: function(storeStr, objectStore, option) {
        try {
          var trans = this.db.transaction(objectStore || [storeStr], "readwrite");
          return trans.objectStore(storeStr, option);
        } catch (e) {
          this.db.close();
          throw e;
        }
      },
      store: function(storeStr, callback) {
        storeCallback = callback;
        callbackStoreStr = storeStr;
      },
      index: function(idx) {
        index = idx;
        return dbObj;
      },
      count: function(storeStr, onsuccess, onerror) {
        this.queueArray.push({func: "count", storeStr: storeStr, onsuccess: onsuccess, onerror: onerror});
      },
      put: function(...dataArray) {
        this.queueArray.push({func: "put", dataArray: dataArray});
      },
      putByKey: function(...dataArray) {
        this.queueArray.push({func: "putByKey", dataArray: dataArray});
      },
      delete: function(storeStr, searchKey, onsuccess, onerror) {
        this.queueArray.push({func: "delete", storeStr: storeStr, searchKey: searchKey, onsuccess: onsuccess, onerror: onerror});
      },
      get: function(storeStr, searchKey, onsuccess, onerror) {
        this.queueArray.push({func: "get", storeStr: storeStr, index:index, searchKey: searchKey, onsuccess: onsuccess, onerror: onerror});
      },
      cursor: function(storeStr, filter, onsuccess, onerror) {
        this.queueArray.push({func: "cursor", storeStr: storeStr, filter: filter, onsuccess: onsuccess, onerror: onerror});
      },
      getAll: function(...dataArray) {
        this.queueArray.push({func: "getAll", dataArray: dataArray});
      },
      close: function() {
        this.queueArray.push({func: "close"});
      }
    };
    
    dbObj.isOpen = true;
    request.onsuccess = function(event) {
        dbObj.db = event.target ? event.target.result : request.result;
        var data = null;
        
        dbObj.count = function(storeStr, onsuccess, onerror) {
          var store = this.storeFunc(storeStr);
          var count = store.count();
          count.onsuccess = function() {
            if (onsuccess) {
              onsuccess(count.result);
            }
          }
          request.onerror = onerror || funcs.putOnerror || idb.onerror;
        }
        dbObj.put = function(storeStr, data, onsuccess, onerror) {
          var store = this.storeFunc(storeStr);
          var request = store.put(data);
          if (onsuccess || funcs.putOnsuccess) {
            request.onsuccess = onsuccess || funcs.putOnsuccess;
          }
          request.onerror = onerror || funcs.putOnerror || idb.onerror;
        }
        dbObj.putByKey = function(storeStr, key, data, onsuccess, onerror) {
          var store = this.storeFunc(storeStr);
          var request = store.put(data, key);
          if (onsuccess || funcs.putOnsuccess) {
            request.onsuccess = onsuccess || funcs.putOnsuccess;
          }
          request.onerror = onerror || funcs.putOnerror || idb.onerror;
        }
        dbObj.delete = function(storeStr, searchKey, onsuccess, onerror) {
          var store = this.storeFunc(storeStr);
          var request = store.delete(searchKey);
          if (onsuccess || funcs.deleteOnsuccess) {
            request.onsuccess = onsuccess || funcs.deleteOnsuccess;
          }
          request.onerror = onerror || funcs.deleteOnerror || idb.onerror;
        }
        dbObj.get = function(storeStr, searchKey, onsuccess, onerror) {
          var store = this.storeFunc(storeStr);
          var request = store.get(searchKey);
          request.onsuccess = function(event) {
            onsuccess(event.target.result, event);
          };
          request.onerror = onerror || funcs.getOnerror || idb.onerror;
        }
        dbObj.cursor = function(storeStr, filter, onsuccess, onerror) {
          var store = this.storeFunc(storeStr);
          var cursorRequest = store.openCursor();
          //cursorRequest.transaction.oncompletde = oncomplete;
          var returnArray = new Array();
          cursorRequest.onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
              if (filter(cursor.value)) {
                returnArray.push(cursor.value);
              }
              cursor.continue();
            } else {
              onsuccess(returnArray);
            }
          }
        
          cursorRequest.onerror = onerror || funcs.cursorOnerror || idb.onerror;
          return cursorRequest;
        }
        dbObj.getAll = function(storeStr, onsuccess, onerror) {
          var store = this.storeFunc(storeStr);
          //var index = store.index("tags");
          var request = store.getAll();
          request.onsuccess = function(event) {
            onsuccess(event.target.result, event);
          };
          
          request.onerror = onerror || funcs.getOnerror || idb.onerror;
        }
        dbObj.store = function(storeStr) {
          var store = this.storeFunc(storeStr);
          return store;
        }
        dbObj.storeObj = function(storeStr) {
          return {
            index: function(idx) {
              // TODO
            },
            put: function(data, onsuccess, onerror) {
              return dbObj.put(storeStr, data, onsuccess, onerror);
            },
            putByKey: function(key, data, onsuccess, onerror) {
              return dbObj.putByKey(storeStr, key, data, onsuccess, onerror);
            },
            delete: function(searchKey, onsuccess, onerror) {
              return dbObj.delete(storeStr, searchKey, onsuccess, onerror);
            },
            get: function(searchKey, onsuccess, onerror) {
              return dbObj.get(storeStr, searchKey, onsuccess, onerror);
            },
            cursor: function(filter, onsuccess, onerror) {
              return dbObj.cursor(storeStr, filter, onsuccess, onerror);
            },
            getAll: function(oncomplete) {
              return dbObj.getAll(storeStr, oncomplete);
            }
          }
        }
        
        dbObj.close = function() {
          dbObj.isOpen = false;
          dbObj.db.close();
          //console.log('DB close.');
        }

        //console.log('do forEach');
        var queueArray = dbObj.queueArray;
        var data = null;
        for (var i=0, size=queueArray.length; i < size; i++) {
        //dbObj.queueArray.forEach(function(data, i) {
          //console.log(queueArray);
          data = queueArray[i];
          try {
            /*
            dbObj[data.func](data.storeStr //data.index ? data.storeStr.index(data.index) : data.storeStr
                            , data.data||data.searchKey||data.filter||data.onsuccess||data.oncomplete
                            , data.onsuccess||data.onerror
                            , data.onerror);
            */

            dbObj[data.func](...data.dataArray);
          } catch (e) {
            if (funcs.dbErrorCallback) funcs.dbErrorCallback(e, dbObj, data); 
            throw e;
          }
        };
        
        if (storeCallback) {
          var store = dbObj.storeFunc(callbackStoreStr);
          storeCallback(store);
        }
    };
    return dbObj;
  };
  //return idb;
}).call(this);
