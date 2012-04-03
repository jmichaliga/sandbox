---
title: Binding Models To Views
layout: default
section: model
---

<h1>Binding Models To Views</h1>

<ul>
  <li>Data binding provides a way to declaratively synchronize view state with model state</li>
  <li>Encapsulates plumbing code facilitates separation of concerns between data layer and view layer</li>
  <li>Encourages development of a rich domain model where model objects interact and view responds</li>
  <li>Data binding in Bolt is currently accomplished through an intermediary binding object</li>
</ul>

{% highlight javascript %}

var core = require('javelin/core');
var Model = require('model').Model;
var View = require('view').View;

// declare a model with some properties
core.createClass({
  name: 'Thing',

  extend: Model,

  properties: {
    color:'#000000',
    background:'#00FFFF'
  }
});

// declare a view with some properties 
// and create appropriate setters that respond to changes 
// in those properties 
core.createClass({

  name: 'ThingView',

  extend: View,

  construct: function(){
    View.call(this);
  },

  properties: {
    backgroundColor:'',
    color:''
  },

  members: {
    setColor: function(val) {
      this.getNode().innerHTML = val;
      this.getNode().style.color = val;
    },
    setBackgroundColor: function(val) {
      this.getNode().style.background = val;
    }
  }
});

// instantiate our view and model
var model = new JX.Thing();
var view = new JX.ThingView();

view.setBinding(model, [
  {
    property: 'color'
  },
  {
    viewProperty: 'backgroundColor',
    modelProperty: 'background'
  },
]);

// insert the view into the dom
var container = document.getElementById('bindingExample');
view.placeIn(container);


// update our model properties in a loop and observe the changes in the view
var i = 0;
var timer = setInterval(function() {
  model.setColor(randomColor());
  model.setBackground(randomColor());
  i > 10 ? clearInterval(timer) : i++;
}, 500);

{% endhighlight %}
