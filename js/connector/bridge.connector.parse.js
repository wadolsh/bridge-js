(function(window, bsn, undefined) {'use strict';

  var parseData = function() {
    var _parserUrl = 'https://api.parse.com/1';
    var _headers = {
        "X-Parse-Application-Id": "lwXv1vCe0RxxsXoGbne5AmqIzcnn0zh6a2tiIAwa",
        "X-Parse-REST-API-Key": "6GbmZJL5x2CevcQsOvysARM3EtAD50N6HE4v5t8y",
        "X-Parse-Session-Token" : bsn.data.ss.get('SessionToken'),
        //'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    var request = function(method, url, options, successFunc, errorFunc, hideLoading) {

      var config = {method: method, url: url, cache: false, headers: _headers};
      
      for (var key in options) {
        config[key] = bsn.angular.extend(config[key] || {}, options[key]);
      }
      
      bsn.http.xhr(method, url, config.data, config).
        success(function(data, xhr) {
          if (successFunc) {
            successFunc(data, xhr.statusText);
          } else {
            alert('success! ' + JSON.stringify(data));
          }
        }).
        error(function(data, xhr) {
          if (errorFunc) {
            errorFunc(data, xhr.statusText || "Request failed");
          } else {
            alert('error! ' + JSON.stringify(data));
          }
      });
    }
    
    return {
      //request: request,

      callFunc: function (functionName, data, successFunc, errorFunc){
        request('POST', _parserUrl + '/functions/' + functionName, {data: data || null, headers: {'Content-Type': 'application/json'}}, successFunc, errorFunc);
      },
      
      installations: {
        uploading: function(successFunc, errorFunc) {
          var os = null;
          if ((navigator.userAgent.indexOf('iPhone') > 0 
                || navigator.userAgent.indexOf('iPad') > 0)
                || navigator.userAgent.indexOf('iPod') > 0) {
            os = 'ios';
          } else if (navigator.userAgent.indexOf('Android') > 0) {
            os = 'android';
          } else {
            os = 'pc';
          }
          request('POST', _parserUrl + '/installations', {data: {deviceType: os, installationId: 'dummy'}, headers: {'Content-Type': 'application/json'}}, function(data, status) {
            bsn.data.ls.set('installation', data);
            successFunc(data, status);
          }, errorFunc, true);
        },
        
        retrieving: function(successFunc, errorFunc) {
          var installations = bsn.data.ls.get('installations');
          if (!installations || !installations.objectId) {
            errorFunc(null, 'デバイス記録情報なし');
            return;
          }
          request('GET', _parserUrl + '/installations/' + installations.objectId, null, successFunc, errorFunc);
        },

      },
      
      user: {
        signup: function(user, successFunc, errorFunc){
          request('POST', _parserUrl + '/users', {data: user, headers: {'Content-Type': 'application/json'}}, successFunc, errorFunc);
        },
        update: function(user, successFunc, errorFunc) {
          request('PUT', _parserUrl + '/users/' + user.objectId, {data: user, headers: {'Content-Type': 'application/json'}}, successFunc, errorFunc);
        },
        delete: function(customerOid, successFunc, errorFunc) {
          request('DELETE ', _parserUrl + '/users/' + customerOid, null, successFunc, errorFunc);
        },
        login: function(id, password, successFunc, errorFunc) {
          request('GET', _parserUrl + '/login', {params: {username: id, password: password}}, function(data, status) {
            _headers['X-Parse-Session-Token'] = data.sessionToken;
            bsn.data.ss.set('SessionToken', data.sessionToken);
            bsn.data.ss.set('loginUser', data);
            successFunc(data, status);
          }, errorFunc);
          //$http.get(_parserUrl + '/login', {username: id, password: password}, _headers);
        },
        logout: function(func) {
          bsn.data.ss.remove('SessionToken');
          delete _headers['X-Parse-Session-Token'];
          func();
        },
        
        sessionCheck: function(successFunc, errorFunc) {
          request('GET', _parserUrl + '/users/me', null, successFunc, errorFunc, true);
        }
      },
      
      reqList: function(className, query, successFunc, errorFunc) {
        //JSON.stringify(query)//
        if (query) {
          var value = null;
          for (var key in query) {
            value = query[key];
            query[key] = bsn.angular.isObject(value) ? JSON.stringify(value) : value;
          }
        }

        request('GET', _parserUrl + '/classes/' + className, {params: query || null}, successFunc, errorFunc);
      },
      
      reqData: function(className, oid, successFunc, errorFunc) {
        request('GET', _parserUrl + '/classes/' + className + '/' + oid, null, successFunc, errorFunc);
      },
      
      newData: function(className, data, successFunc, errorFunc) {
        request('POST', _parserUrl + '/classes/' + className, {data: data}, successFunc, errorFunc);
      },
      
      updateData: function(className, oid, data, successFunc, errorFunc) {
        request('PUT', _parserUrl + '/classes/' + className + '/' + oid, {data: data}, successFunc, errorFunc);
      },

      deleteData: function(className, oid, successFunc, errorFunc) {
          request('DELETE', _parserUrl + '/classes/' + className + '/' + oid, null, successFunc, errorFunc);
      },

      batchData: function(data, successFunc, errorFunc) {
        request('POST', _parserUrl + '/batch', {data: data}, successFunc, errorFunc);
      }
    };
  }




  var parseTool = {
    date: {
      /** 日付をUTCで処理 */
      addZeroArray: function(arr) {
        var val = null;
        for (var i in arr) {
          val = arr[i];
          if (($.isNumeric(val) && val < 10) || val.length < 2) {
            arr[i] = ('0' + val).slice(-2)
          }
        }
        return arr;
      },
      read: function(value) {
        return value ? {
          __type: 'Date',
          iso: (angular.isDate(value) ? value.toJSON() : new Date(value.replace('T', ' ')).toJSON())
        } : null;
      },
      write: function(dataObj) {
        if (dataObj && dataObj.__type == 'Date') {
          return parse.date.getDate(dataObj) + "T" + parse.date.getTime(dataObj);
        }
        return dataObj;
      },
      getDate: function(dataObj) {
        if (dataObj && dataObj.__type == 'Date') {
          var date = new Date(dataObj.iso);
          return parse.date.addZeroArray([date.getFullYear(), date.getMonth() + 1, date.getDate()]).join( '-' );
        }
        return dataObj;
      },
      getMMDD: function(dataObj) {
        if (dataObj && dataObj.__type == 'Date') {
          var date = new Date(dataObj.iso);
          return parse.date.addZeroArray([date.getMonth() + 1, date.getDate()]).join( '-' );
        }
        return dataObj;
      },
      getTime: function(dataObj) {
        if (dataObj && dataObj.__type == 'Date') {
          var date = new Date(dataObj.iso);
          return parse.date.addZeroArray([date.getHours(), date.getMinutes(), date.getSeconds()]).join( ':' );
        }
        return dataObj;
      },
      getHHMM: function(dataObj) {
        if (dataObj && dataObj.__type == 'Date') {
          var date = new Date(dataObj.iso);
          return parse.date.addZeroArray([date.getHours(), date.getMinutes()]).join( ':' );
        }
        return dataObj;
      },
      addDate: function(days, date) {
        var beforeOneWeek = date || new Date();
        beforeOneWeek.setDate(beforeOneWeek.getDate() + days);
        return beforeOneWeek;
      }
    },
  
    dateLocal: {
      /** 日付をあるままで処理する */
      read: function(value) {
        return value ? {
          __type: 'Date',
          iso: (angular.isDate(value) ? value.toJSON() : new Date(value).toJSON())
        } : null;
      },
      write: function(dataObj) {
        if (dataObj && dataObj.__type == 'Date') {
          return dataObj.iso.replace('.000Z', '');
        }
        return dataObj;
      },
      getDate: function(dataObj) {
        if (dataObj && dataObj.__type == 'Date') {
          return dataObj.iso.split('T')[0];
        }
        return dataObj;
      },
      getMMDD: function(dataObj) {
        if (dataObj && dataObj.__type == 'Date') {
          return dataObj.iso.split('T')[0].substr(5,8);
        }
        return dataObj;
      },
      getTime: function(dataObj) {
        if (dataObj && dataObj.__type == 'Date') {
          return dataObj.iso.split('T')[1].replace('.000Z', '');
        }
        return dataObj;
      },
      getHHMM: function(dataObj) {
        if (dataObj && dataObj.__type == 'Date') {
          return dataObj.iso.split('T')[1].replace('.000Z', '').replace(/:00$/, '');
        }
        return dataObj;
      },
      addDate: function(days, date) {
        var beforeOneWeek = date || new Date();
        beforeOneWeek.setDate(beforeOneWeek.getDate() + days);
        return beforeOneWeek;
      }
    },
    pointer: {
      write: function(dataObj) {
        if (dataObj && dataObj.__type == 'Pointer') {
          return dataObj.objectId;
        }
      },
      read: function(val, className){
        return val ? {"__type": "Pointer", "className": className, "objectId": val} : null;
      }
    }
  }
  bsn.data = bsn.data ? bsn.data : {};
  bsn.data.parse = {
    parseTool: parseTool,
    parseData: parseData()
  };
})(window, window.bsn);