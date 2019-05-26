cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-sqlite-2.sqlitePlugin",
      "file": "plugins/cordova-plugin-sqlite-2/dist/sqlite-plugin.js",
      "pluginId": "cordova-plugin-sqlite-2",
      "clobbers": [
        "sqlitePlugin"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-sqlite-2": "1.0.6",
    "cordova-plugin-whitelist": "1.3.3"
  };
});