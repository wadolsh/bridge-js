/*
 * Copyright (c) 2016-present, Choi Sungho
 * Code released under the MIT license
 */
(function() {'use strict';
    var root = this;
    var Bridge = root.bridge = root.bridge || {};
    
    Bridge.ConnectorSettings = Object.assign({
        idName: '_id',
        url: '/bridge',
        beforeRequestFunc: null,
        requestFunc: null,
        completeFunc: null,
        closeFunc: null,
        statusError: function(responseText, status, response, url, option) {
            if (status == 200) {
                return false;
            } else if(status == 400) {
                alert('There was an error 400');
            } else {
                //alert('something else other than 200 was returned(' + xmlhttp.status + '): ' +  url + ', ' +  JSON.stringify(option));
                console.log('!200', status, url, option);
            }
            return true;
        },
        hasError: function(result, textStatus, response, url, option) {
            return false;
        }
    }, Bridge.ConnectorSettings || {});

    var extend = Object.assign;
    
    var parser = {
        text: function(str) {
            return str;
        },
        json: function(str) {
            return JSON.parse(str);
        }
    };
    var requestFunc = function(url, option, callback, getType) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == XMLHttpRequest.DONE) {
                if (xmlhttp.status == 200) {
                    callback(parser[getType || 'text'](xmlhttp.responseText), xmlhttp.status, xmlhttp, url, option);
                } else {
                    callback(xmlhttp.responseText, xmlhttp.status, xmlhttp, url, option);
                }
            }
        }
        
        if (option) {
            xmlhttp.open(option.method || 'GET', url, true);
            if (option.headers) Object.keys(option.headers).forEach(function(key) {
                xmlhttp.setRequestHeader(key, option.headers[key]);
            });
            xmlhttp.send(option.body);
        } else {
            xmlhttp.open('GET', url, true);
            xmlhttp.send();
        }

    };
    
        /** サーバーとの通信を担当 */
    var Connector = Bridge.Connector = function(config) {
        this.config = config = config || {};
        this.requestFunc = config.requestFunc || Bridge.ConnectorSettings.requestFunc || requestFunc;
        this.dataName = config.dataName || Bridge.ConnectorSettings.dataName;
        this.connectId = config.connectId;
        this.url = config.url || Bridge.ConnectorSettings.url;
        this.idName = config.idName || Bridge.ConnectorSettings.idName;
        this.baseParm = config.baseParm;
        this.statusError = config.statusError || Bridge.ConnectorSettings.statusError;
        this.hasError = config.hasError || Bridge.ConnectorSettings.hasError;
        
        this.beforeRequestFunc = config.beforeRequestFunc || Bridge.ConnectorSettings.beforeRequestFunc;
        this.completeFunc = config.completeFunc || Bridge.ConnectorSettings.completeFunc;
        this.closeFunc = config.closeFunc || Bridge.ConnectorSettings.closeFunc;
        
        this.queueData = [];
    };
    
    extend(Bridge.Connector.prototype, {
        
        addId : function (obj, id) {
            obj[this.idName] = id;
            return obj;
        },
        
        /** 既存作業を初期化 */
        reset : function() {
            this.queueData.length = 0;
            this.dataName = this.config.dataName || Bridge.dataName;
            return this;
        },
        hasError : function() {
          return false;  
        },
        request : function(callBack) {
            var conn = this;
            // (url, callback, getType, option)
            var url = this.url;
            var option = {
                //credentials: 'same-origin',
                method: 'POST',
                headers: {
            	    'Content-Type': 'application/json'
            	},
            	body: JSON.stringify({req : this.queueData})
                //body: JSON.stringify({req : this.queueData})
            };
            
            if (conn.beforeRequestFunc) {
                conn.beforeRequestFunc(conn, option);
            }
            
            conn.requestFunc(url, option, function(data, textStatus, response, url, option) {
                if (conn.completeFunc) {
                    conn.completeFunc(data, textStatus, response)
                }

                if (conn.statusError(data, textStatus, response, url, option)) {
                    return false;
                }

                if (conn.hasError(data, textStatus, response, url, option)) {
                    return false;
                }

                callBack(data, textStatus, response);

                if (conn.closeFunc) {
                    conn.closeFunc(data, textStatus, url);
                }
            }, 'json');
            /*
            $.post(this.url, {req : this.queueData}, function (data, textStatus, jqXHR) {

            }, "json");
            */
            
            this.reset();
        },
        setDataName :function(dataName) {
            this.dataName = dataName;
            return this; 
        },
        combine : function (data) {
            this.queueData.push(JSON.stringify(extend(data, {"dataName" : this.dataName, "connectId" : this.connectId}, this.baseParm)));
        },
        
        /** メタ情報要求 */
        reqMetaData : function(key) {
            this.combine({
                "key" : key,
                "method" : "reqMetaData"
            });
            return this;
        },
        /** 一つのデートのみ要求（あくまでインタペース的な意味） */
        reqData : function (key, query) {
            //query = query || {};
            if (!query) return null;
            var data = 
            query instanceof Object ? 
                {
                    "key" : key,
                    "method" : "reqData",
                    "parm" : query
                } : this.addId({
                    "key" : key,
                    "method" : "reqData",
                    "parm" : {},
                }, query);
            this.combine(data);
            return this;
        },
        reqList : function (key, query, option) {
            //query = query || {};
            if (!query) return null;
            this.combine({
                "key" : key,
                "method" : "reqList",
                "parm" : query,
                "option": option
            });
            return this;
        },
        reqCount : function (key, query) {
            //query = query || {};
            if (!query) return null;
            this.combine({
                "key" : key,
                "method" : "reqCount",
                "parm" : query
            });
            return this;
        },
        reqDistinct : function (key, field, query) {
            //query = query || {};
            if (!query) return null;
            this.combine({
                "key" : key,
                "method" : "reqDistinct",
                "field" : field,
                "parm" : query
            });
            return this;
        },
        reqAggregate : function (key, query) {
            //query = query || [];
            if (!query) return null;
            this.combine({
                "key" : key,
                "method" : "reqAggregate",
                "parm" : query
            });
            return this;
        },
        reqMovePage : function (key, query) {
            //query = query || {};
            if (!query) return null;
            this.combine({
                "key" : key,
                "method" : "reqMovePage",
                "parm" : query,
            });
            return this;
        },
        reqInsert : function (key, data) {
            this.combine({
                "key" : key,
                "method" : "reqInsert",
                "data" : data
            });
            return this;
        },
        /*
        reqInsertId : function (key, id, data) {
            this.combine({
                "key" : key,
                "method" : "reqInsertId",
                "data" : this.addId(data, id)
            });
            return this;
        },
        */
        reqBulkUpdate : function (key, data) {
            this.combine({
                "key" : key,
                "method" : "reqBulkUpdate",
                "data" : data
            });
            return this;
        },
        reqUpdate : function (key, id, data) {
            this.combine({
                "key" : key,
                "method" : "reqUpdate",
                "data" : this.addId(data, id)
            });
            return this;
        },
        reqUpdateOperator : function (key, query, operator) {
            this.combine({
                "key" : key,
                "method" : "reqUpdateOperator",
                "data" : {},
                "query" : query,
                "operator" : operator
            });
            return this;
        },
        reqSave : function (key, data) {
            if (data[this.idName] == "") {
                delete data[this.idName];
            }
            this.combine(extend({
                "key" : key,
                "method" : "reqSave",
                "data" : data
            }));
            return this;
        },
        reqDelete : function (key, id) {
            this.combine(this.addId({
                "key" : key,
                "method" : "reqDelete"
            }, id));
            return this;
        },
        reqExecMethod : function (key, method, data) {
            this.combine({
                "key" : key,
                "method" : method,
                "data" : data
            });
            return this;
        },
    });
        	
}).call(this);