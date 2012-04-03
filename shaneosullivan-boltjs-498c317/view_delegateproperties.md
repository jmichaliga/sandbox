---
title: Delegating View Properties
section: view
layout: default
---

<h1>Delegating View Properties</h1>

A View is basically a set of JavaScript logic wrapping a DOM node.  To change the properties of a View, the setter and getter methods for those properties are used.  e.g.

{% highlight javascript %}

var CarView = require('javelin/core').createClass({

  name: 'CarView',

  extend: require('container').Container,

  properties: {
    wheels: 4,

    doors: 2
  },

  members: {
    render: function() {

      // Define the layout to given something like
      // I have 4 wheels and 2 doors
      this.setLayout([
        {
          content: 'I have '
        },
        {
          ref: 'wheelView'
        },
        {
          content: ' wheels and '
        },
        {
          ref: 'doorView'
        },
        {
          content: ' doors'
        }
      ]);
    },

    setWheels: function(wheels) {
      this.findRef('wheelView').setContent(wheels);
    },

    getWheels: function() {
      return this.findRef('wheelView').getContent();
    },

    setDoors: function(doors) {
      this.findRef('doorView').setContent(doors);
    },

    getDoors: function() {
      return this.findRef('doorView').getContent();
    }
  }
});

var car = new CarView();
car.setDoors(4);
car.setWheels(3);

car.placeIn(document.body);

// Will result in:
//<div>
//  <div>I have </div>
//  <div>3</div>
//  <div> wheels and </div>
//  <div>4</div>
//  <div> doors</div>
//</div>
{% endhighlight %}

<p>
Obviously it can get tedious to have to write setters and getters for every node you want to redirect a property do. This is where <b>delegateProperties</b> become useful.
</p>

<h2>Simple Delegation</h2>

<p>
<b>deletegateProperties</b> is a JSON hash of DOM nodes or refs, containing an array of properties to delegate to each.  For example, the base View class delegates common DOM properties to it's node using the following code:
</p>

{% highlight javascript %}

require('javelin/core').createClass({

  name: 'View',

  delegateProperties: {
    node: ['className', 'id']
  }
 ......

{% endhighlight %}

This means that whenever you call 
{% highlight javascript %}
  myView.setClassName('myCssClass')
{% endhighlight %}

, internally it executes

{% highlight javascript %}
  this.getNode().className = 'myCssClass';
{% endhighlight%}

<h2>More Complex Delegation</h2>
<p>
The above case is quite simple, <b>setClassName</b> is redirected to the <b>className</b> property of a DOM node.  However,in the case of the CarView view above, we want to redirect the <b>wheels</b> and <b>doors</b> properties to the <b>content</b> properties of two inner views.  To do that we change the definition of the <b>CarView</b> view to:
</p>

{% highlight javascript %}

var CarView = require('javelin/core').createClass({

  name: 'CarView',

  extend: require('container').Container,

  delegateProperties: {
    // Map setWheels() to this.findRef('wheelView').setContent(),
    // and getWheels() to this.findRef('wheelView').getContent()
    wheelView: [{alias: 'wheels', name: 'content'}],

    // Map setDoors() to this.findRef('doorView').setContent(),
    // and getDoors() to this.findRef('doorView').getContent()
    doorView: [{alias: 'doors', name: 'content'}]
  },

  members: {
    render: function() {

      // Define the layout to given something like      // I have 4 wheels and 2 doors
      this.setLayout([
        {
          content: 'I have '
        },
        {
          ref: 'wheelView'
        },
        {
          content: ' wheels and '
        },
        {
          ref: 'doorView'
        },
        {
          content: ' doors'
        }
      ]);
    },
  }
});

{% endhighlight %}

<p>
Now, the getters and setters from the earlier example are automatically generated, passing through the values from <b>setWheels</b> and <b>setDoors</b> to the <b>content</b> value of the <b>wheelView</b> and <b>doorView</b> views.
</p>
