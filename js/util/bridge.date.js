/**
 * choish
 */
(function(){'use strict';
    var root = this;
    var Bridge = root.bridge = root.bridge || {};
    Bridge.date = Bridge.date || {};

    //var weekFormat = ['日', '月', '火', '水', '木', '金', '土'];

    var dateStr = Bridge.date.dateStr = {
        regexp: new RegExp('(y{1,4})|(MM)|(dd)|(HH)|(hh)|(mm)|(ss)|(S{1,3})|(E)', 'g'),
        format: function(format, date, weekNames) {
            if (!date) return null;
            return format.replace(dateStr.regexp, function(match, yyyy, MM, dd, HH, hh, mm, ss, SS, E, offset){
                if (yyyy) {
                    return date.getFullYear().toString().slice(-yyyy.length);
                } else if (MM) {
                    return ('0' + (date.getMonth() + 1)).slice(-2);
                } else if (dd) {
                    return ('0' + date.getDate()).slice(-2);
                } else if (HH) {
                    return ('0' + date.getHours()).slice(-2);
                } else if (hh) {
                    return ('0' + date.getHours()).slice(-2);
                } else if (mm) {
                    return ('0' + date.getMinutes()).slice(-2);
                } else if (ss) {
                    return ('0' + date.getSeconds()).slice(-2);
                } else if (SS) {
                    return date.getMilliseconds().toString().slice(0, SS.length);
                } else if (E) {
                    return weekNames ? weekNames[date.getDay()] : date.getDay();
                }
            });
        },
        getNowDate : function(format) {
            return dateStr.format(format || 'yyyy-MM-dd HH:mm:ss', new Date());
        }
    }

    Bridge.date.addSeconds = function(date, num) {
        return new Date(date.getTime() + (1000 * num));
    }

    Bridge.date.addMinutes = function(date, num) {
        return new Date(date.getTime() + (60000 * num));
    }

    Bridge.date.addHours = function(date, num) {
        return new Date(date.getTime() + (3600000 * num));
    }

    Bridge.date.addDates = function(date, num) {
        return new Date(date.getTime() + (86400000 * num));
    }

    Bridge.date.addMonths = function(date, num) {
        var value = new Date(date.getTime());
        var mo = date.getMonth();
        var yr = date.getFullYear();

        mo = (mo + num) % 12;
        if (0 > mo) {
            yr += (date.getMonth() + num - mo - 12) / 12;
            mo += 12;
        }
        else
            yr += ((date.getMonth() + num - mo) / 12);

        value.setDate(1);
        value.setMonth(mo);
        value.setFullYear(yr);
        return value;
    }

}).call(this);