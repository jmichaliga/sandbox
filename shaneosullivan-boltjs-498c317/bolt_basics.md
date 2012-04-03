---
title: Bolt Basics
layout: default
section: gettingstarted
---

<h1>Bolt Basics </h1>

<p>
Last time we saw bare bones structure of bolt. Now we will learn about the basic component that a Bolt object has. The source code for this tutorial can be downloaded <a href="examples/bolt_basics.zip" target="_blank">here</a>
</p>
To create a basic application, we create a custom class that extends "view".

{% highlight javascript %}
var ButtonExample = core.createClass({
  extend: View,
})
{% endhighlight %}

<p>This is now a complete view. However, it's not terribly exciting. Let's insert two buttons now to spice things up:</p>

{% highlight javascript %}
var ButtonView  = require('views/button').Button;
var ButtonExample = core.createClass({
  extend: View,
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
})
{% endhighlight %}

<p>
What we've done here is define 'declare' which is a function which takes in one argument and returns a javascript object. This javascript object is essentially the layout for the application. There are a few things you should learn from this example:
</p>

<ul>
<li>childViews - an array of javascript objects. these objects are the "children" of this view. </li>
<li>view - this is the property which defines which View this child will use. Any predefined view will work fine, but you will need to import it (as I have up top) before using it</li>
<li>ref - this is basically an id that our ButtonExample class can use to identify a particular child. If you want to address any of the children somewhere else other than here, you should assign it the ref property a value.</li>
<li>onclick - This property refers to a method (by name) which to call when this button is clicked. We will now need to write these methods (doActionOne and doActionTwo) in the parent. </li>
<li>value - this is the property used by ButtonView to determine what text to place in the button.</li>
</ul>

<p>You can create a constructor for your view by defining the "construct" property as a function that takes in one argument.</p>
{% highlight javascript %}
  construct: function(options) {
    this.firstButtonValue = "First Button";
    View.call(this, options);
  },  
{% endhighlight %}

<p>
In this constructor we are assigning this.firstButtonValue to a string. It is important to include the last line "View.call(this, options)" or you will get strange errors. This must be called in any constructor for a bolt object that extends View. If you do not have a constructor, you do not need to call this, it will be called automatically.
</p>

<p>
Bolt provides some convenience for standard properties that need getters and setters. All properties that you put inside the "properties" property of ButtonExample will automatically generate getters and setters using camel case:
</p>

{% highlight javascript %}
  properties: {
    secondButtonValue: null
  },  
{% endhighlight %}

<p> By defining this, bolt will automatically generate the methods "getSecondButtonValue" and "setSecondButtonValue". We can use these methods to set "secondButtonValue" in the constructor by adding this line: </p>

{% highlight javascript %}
  this.setSecondButtonValue("Second Button");
{% endhighlight %}
<p> 
Those of you who have written javascript may know that a common beginner's foul is to run Javascript on a DOM element that has not yet been loaded yet. The way to get around this is to run the script only after the DOM has loaded. Bolt also has a similar problem and resolution. If you try to find any of the child views by reference in the constructor, it will be undefined. So, if you have some things you want to run while initializing a bolt object, define the ready property, which will automatically be called once the objecte has completed loading.
</p>
{% highlight javascript %}
  ready: function() {
    this.buttonone = this.refs.buttonone;
    this.buttontwo = this.findRef('buttontwo');
  },  
{% endhighlight %}

<p>
In this method, we are caching some of the references to children views for later use. Remember the ref property we talked about earlier? Here, we are finding each of the two buttons using this handle. Note that this.refs.xxxxx is functionally equivalent to this.findRef('xxxxx').
</p>

<p> Finally, let's write the functions to be called when the buttons are clicked: </p>
{% highlight javascript %}
  doActionOne: function() {
    this.buttonone.setValue(this.firstButtonValue);
  },  
    
  doActionTwo: function() {
    this.buttontwo.setValue(this.getSecondButtonValue());
  }
{% endhighlight %}

<p>These functions are fairly self explanatory. Notice that I'm using the auto-generated getSecondButtonValue method from the properties.</p>

<p>Now, to put it all together: (Remember you can download this. Link is above) </p>
{% highlight javascript %}
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
{% endhighlight %}
<p>
Now try it out! You should get two buttons whose values change when you click on them.
</p>
