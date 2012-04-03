---
title: Views
layout: default
section: view
---

<h1>Views</h1>

A View in Bolt, sometimes called a widget, is a UI component that contains a DOM node.  It controls the creation of a DOM node and its children, and provides methods for manipulating it.

The various parts of a view, in brief, are

<ul>
  <li><b>construct</b>: the constructor function, and the first function called in a view.  If not defined, the extended class constructor is called.  If it is defined, you should call your ancestral constructor, e.g. Container.call(this, options)</li>
  <li><b>properties</b>: the public properties supported by this view.  For each property a setter and getter are defined.  E.g. with a property called 'src', the functions getSrc and setSrc are automatically created.  All views automatically inherit properties commonly used on DOM nodes, but can specify their own.  These setters and getters are the only approved method of reading and writing to view properties.</li>
  <li><b>events</b>: an array of strings, each the name of an event that this view can invoke.  Each view automatically inherits the standard DOM events, but can add their own custom events also.  The one restriction is that a custom event cannot have the same name as a native DOM event.  For example, you should never specify an event called 'click' or 'mouseup'.  A view can at any time call this.invoke(eventName) to fire a custom event.</li>
  <li><b>delegateProperties</b>: a JSON object which automatically maps setters and getters on the owner view to sub-views contained within it.  For example, calling setClassName on any view will automatically set the className property of that view's DOM node.</li>
  <li><b>members</b>: A JSON object with all the methods of the view.  Each view should generally define a render method, which is called by the view constructor.  It is responsible for creating the sub-views, setting up event listeners etc.</li>
  <li><b>statics</b>: A JSON object that should contain the static methods and properties for the class.</li>
</ul>

To create a new view class, use the createClass method, e.g.
{% highlight javascript %}
var Container = require('container').Container;

require('javelin/core').createClass({

  name: 'MyViewName',

  extend: Container,

  construct: function(options){
    Container.call(this, options);
    // init type stuff
  },

  properties: {
    age: 18, // Creates setAge and getAge functions
    name: '' // Creates setName and getName functions
  },

  statics: {
    COMMON_VAR: 1
  },

  members: {
    render: function(options) {
      this.setLayout({
        content: 'Hello World!'
      });
    },

    handleTouchEvent: function(evt) {

    }
    // More functions
  }
});
{% endhighlight %}
