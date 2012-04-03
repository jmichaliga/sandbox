var core  = require('javelin/core');
var View  = require('view').View;
var ButtonView  = require('views/button').Button;

var ButtonExample = core.createClass({
  extend: View,

  properties: {
    secondButtonValue: null
  },

  construct: function(options) {
    this.firstButtonValue = "First Button";
    this.setSecondButtonValue("Second Button");
    View.call(this, options);
  },

  declare: function(options) {
    return{
      childViews: [
        {
          view: ButtonView,
          value: 'Example Button',
          onclick: 'doActionOne',
          ref: 'buttonone'
        },
        {
          view: ButtonView,
          value: 'Example Button',
          onclick: 'doActionTwo',
          ref: 'buttontwo'
        },
      ]
    }
  },
  
  ready: function() {
    this.buttonone = this.refs.buttonone;
    this.buttontwo = this.findRef('buttontwo');
  },

  doActionOne: function() {
    this.buttonone.setValue(this.firstButtonValue);
  },
    
  doActionTwo: function() {
    this.buttontwo.setValue(this.getSecondButtonValue());
  }
})

exports.init = function() {
  require('builder').build({
    view: ButtonExample
  }).placeIn(document.body);
}
