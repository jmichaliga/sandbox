require.define({'helloworld': function(require, exports, module) {
__DEV__ = 0;
/* From: js/helloworld.js */
var core  = require('javelin/core');
var View  = require('view').View;

var HelloView = core.createClass({
  extend: View,

  declare: function(options) {
    return{
      content: "Hello World!"
    }
  }
})

exports.init = function() {
  require('builder').build({
    view: HelloView
  }).placeIn(document.body);
}

}});
