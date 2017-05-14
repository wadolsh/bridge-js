(function(window, bsn, undefined) {'use strict';
  var webdb = {
      database: null,
      
      dbInfo : {
          name: 'address_selector',
          size: 4 * 1024 * 1024,
          version: '1.0',
          description: '住所データ格納'
      },
      
      table: 'ad_address',
      insertColumn: ["_id", "ken_id", "city_id", "town_id", "zip", "office_flg", "delete_flg", "ken_name", "ken_furi", "city_name", "city_furi", "town_name", "town_furi", "town_memo", "kyoto_street", "block_name", "block_furi", "memo", "office_name", "office_furi", "office_address", "new_id"],
      createSQL: "CREATE TABLE IF NOT EXISTS ad_address (_id unique, ken_id, city_id, town_id, zip, office_flg, delete_flg, ken_name, ken_furi, city_name, city_furi, town_name, town_furi,town_memo, kyoto_street, block_name, block_furi, memo, office_name, office_furi, office_address, new_id)",
      selectSQL: "SELECT %s1 FROM ad_address WHERE %s2",
      
      open: function() {
          this.database = openDatabase(this.dbInfo.name, this.dbInfo.version, this.dbInfo.description, this.dbInfo.size);
          return this;
      },
      init: function() {
          if (!openDatabase) {
              alert("正常に起動しないブラウザです。");
          }
          this.database.transaction(function (tx) {
             tx.executeSql(webdb.createSQL);
          });
          return this;
      },
      dropTable: function() {
          this.database.transaction(function (tx) {
              tx.executeSql('DROP TABLE IF EXISTS ' + webdb.table);
          });
      },
      insert: function(list) {
          var wild = [];
          for (var i in this.insertColumn) {
              wild.push('?');
          }
          var wildString = wild.join(',');
          var dataArray = null;
          var insertSQL = 'INSERT INTO ' + this.table + ' VALUES(' + wildString + ')';
          
          var total = list.length;
          
          this.database.transaction(function (tx) {
              dataArray = [];
              $.each(list, function(key, data) {
                  $.each(webdb.insertColumn, function(keyColumn, column) {
                      dataArray.push(data[column]);
                  });
                  tx.executeSql(insertSQL, dataArray, webdb.success, webdb.error);
                  dataArray.length = 0;
                 modal.progress(total, key);
              });
              
              modal.hide();
          });
          
          return this;
      },
      selectBySQL: function(sql, dataArray, func) {
          this.database.transaction(function (tx) {
              tx.executeSql(sql, dataArray, func, webdb.error);
          });
      },
      select: function(column, where, dataArray, func) {
          this.database.transaction(function (tx) {
              tx.executeSql(db.selectSQL.replace('%s1', column).replace('%s2', where), dataArray, func, db.error);
          });
      },
      success: function(obj) {
          //console.log('success');
      },
      error: function(obj) {
          console.log('error');
      }
      
  }.open().init();
  
  /*
          db.select('DISTINCT city_id, city_name, city_furi', 'ken_id = ' + (ken.num || ken.ken_id), null, function(rt, rs) {
              var ele = tmpl.render('main-city', rs.rows);
              $(ele).find('button').each(function(ind, obj) {
                  $(obj).click(function(event) {
                      var city = rs.rows.item(parseInt(obj.dataset.ind));
                      menu_func.refresh_town(city);
                      $('#select-city').html(city.city_name);
                  });
              });
          });
  */
  bsn.data = bsn.data ? bsn.data : {};
  bsn.data.webdb = webdb;
})(window, window.bsn);