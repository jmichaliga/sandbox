---
title: Building Views
section: view
layout: default
---

<h1>Building Views</h1>

<p>
  Bolt uses the concept of a <b>Builder</b> to instantiate views, making it very easy and concise to create both simple views and highly complex nested user interfaces.  The <b>Builder</b> also makes it simple to add listeners to views, both for DOM and custom events, as well as setting initial values for a views properties.
</p>

<p>
  A simple example is creating a Button view.  Call the builders <b>build</b> function, telling it the type of view to create, <b>Button</b>, the initial value of it's <b>value</b> property, and what to do when it is clicked or tapped using the <b>action</b> property.
</p>

{% highlight javascript %}
  var Button = require('views/button').Button;
  var builder = require('builder');

  var myButton = builder.build({
    // Define the type of view to build
    view: Button,

    // Set the initial value of the 'value' property
    value: 'Click Me',

    // Define an action to perform when this button is clicked or tapped.
    action: function(button, event) {
      alert('You clicked the button with the value ' + button.getValue());
    }
  });
  myButton.placeIn(document.body);

{% endhighlight %}

<h2>Building Nested Views</h2>

<p>
  The example above is quite simple, showing how to build a single view.  However, the real power of the <b>Builder</b> begins to show when constructing many views in a hierarchical layout.
</p>

<p>
  The example below shows a more complex example.  It uses the 
<a href="view_layouts.html">VBox and HBox layout views</a> to create 

<ul>
  <li>a header at the top</li>
  <li>two buttons in the middle</li>
  <li>two panes, each of which are hidden or shown when one of the buttons is pressed</li>
</ul> 
</p>

{% highlight javascript %}

  var VBox = require('views/layout/vbox').VBox;
  var HBox = require('views/layout/vbox').HBox;

  // Define a new view called MyPaneLayout
  require('javelin/core').createClass({
    
    name: 'MyPaneLayout',

    extend: VBox,

    members: {
      render: function() {

        // Call the setLayout function, which uses the builder to create
        // it's sub views
        this.setLayout([
          {
            className: 'header',
            content: 'Choose A Pane'
          },
          {
            // Define a horizontally laid out container with two buttons
            view: HBox,
            childViews: [
              // Create two buttons.  Note how the 'action' is bound to
              // 'onSelectPane'.  Because the 'MyPaneLayout' view is creating
              // the Button, a listener can be added to the Button as a 
              // string telling it the name of the funtion on the Buttons
              // owner to call
              {
                view: Button,
                value: 'Pane 1',
                action: 'onSelectPane'
              },
              {
                view: Button,
                value: 'Pane 2',
                action: 'onSelectPane'
              }
            ]
          },
          // Define the two panes which will be shown/hidden when a button
          // is clicked.  Since no view type or tagName is provided, these
          // default to being simple DIV elements
          {
            ref: 'pane1',
            style: {
              height: '200px',
              backgroundColor: '#bbb'
            },
            content: 'This is Pane 1'
          },
          {
            ref: 'pane2',
            style: {
              height: '200px',
              backgroundColor: '#333',
              color: 'white',
              display: 'none'
            },
            content: 'This is Pane 2'
          }
        ]);
      },

      onSelectPane: function(button, event) {
        var value = button.getValue();

        // Check which button was clicked, and show/hide the
        // the panes  
        if (value == 'Pane 1') {
          this.findRef('pane1').setStyle({display: ''});
          this.findRef('pane2').setStyle({display: 'none'});
        } else {
          this.findRef('pane1').setStyle({display: 'none'});
          this.findRef('pane2').setStyle({display: ''});
        }
      }
    }
  });

  // Instantiate a new instance of a MyPaneLayout view
  // and put it in the document body
  require('builder').build({
    view: 'MyPaneLayout'
  }).placeIn(document.body);

{% endhighlight %}

<h2>The Owner Concept</h2>
<p>
  In he example above, note how the <b>onSelectPane</b> function is bound to the action of the two Button views.  It is simply passed as a string, rather than passing the function itself.
</p>

<p>
  This demonstrates the concept of a view Owner.  The Owner of a view is the object that created it.  Calling the <b>setLayout</b> function in a view automatically sets that view as the Owner of all subviews, all the way down to the most deeply nested view.
</p>

<h3>Implicit Encapsulation</h3>
<p>
  The Owner concept enforces encapsulation of views.  If one view creates another view inside it, only it has access to that child view.  There is no global accessor, and no way of querying for it.  Neither is there any mapping from a DOM node back to the view which created it, such as an ID that could be used to look up some global registry.
</p>

<p>
  If the owner view wishes to allow outside entities to manipulate the contents or behavior of an inner child view, it must create public methods to allow this.  This leads to a very explicit API, where all points of control are known for all views.
</p>

<h3>Using Child Views</h3>
<p>
  To access a child view, give it a <b>ref</b> string parameter.  A <b>ref</b> is like an ID, but whereas an ID is also a DOM node attribute, a <b>ref</b> is simply an internal lookup key for that view.  in the example above, you can see that the two panes being switched have been given <b>ref: 'pane1'</b> and <b>ref: 'pane2'</b>.  A <b>ref</b> can be used to access a view at any depth of the hierarchy, not just at the root, and should only be used by the owner view internally. 
</p>

<p>
  Note: if a view is not given a <b>ref</b> attribute, it can not be accessed directly.  Often this is fine, as a view might just be a static visual object, or something that fires UI events like clicks and mouse overs.
</p>

<p>
 Once a view has been given a <b>ref</b>, it can be accessed using the <b>this.findRef</b> function.  In the example above you can see it using <b>this.findRef('pane1')</b> to find the first pane and set it's style. 
</p>

<p>
  The <b>findRef</b> function should only ever be used internally by the owner view.  You should never call <b>findRef</b> on another view.  For example:
</p>

{% highlight javascript %}
  this.findRef('myChildView').findRef('SomeInnerView').setContent('I am naughty');
{% endhighlight %}

<p>
  is very bad practice and breaks the encapsulation of views.  So don't do it.  Instead, <b>myChildView</b> should provide a public method for updating <b>SomeInnerView</b>.
</p>









