---
title: Table View
layout: default
section: view
---

<h1>Table View</h1>

The Table view is possibly the most complex view in Bolt.  It is a highly performant infinite scrolling widget which utilises progressive rendering and CSS transforms to scroll quickly through any amount of data.
To create a table view, create a js file with these contents:

{% highlight javascript %}
var TableView = require('views/table_view').TableView;

var ExampleTable = require('javelin/core').createClass({
  extend: View,
  declare: function(options) {
    return {
      childViews: [
        view: TableView,
        ref:'table'
      ]
    }
  },

  //REQUIRED: total number of sections in a table
  numberOfSections: function() {
    return 0;
  },

  //REQUIRED: number of rows in a section
  numberOfRowsInSection: function(section) {
    return 0;
  },

  //REQUIRED: return a cell given the row and section
  cellForRowInSection: function(row, section) {
    return {};
  },
  
   // view for a given section
  sectionHeaderAtIndex : function(row) {
    return {};
  }

  // height for the requested section
  heightForSectionHeader: function(section) {
    return 0;
  },

  // REQUIRED: height of a requested row
  heightForRowInSection: function(row, section) {
    return 0;
  },
});
{% endhighlight %}

After filling in the above required functions, you can then create an instance of it:
{% highlight javascript %}
var exampleTable = new ExampleTable();
{% endhighlight %}

or use it as a view inside of another view:

{% highlight javascript %}
var AnotherView = require('javelin/core').createClass({
  extend: View,
  
  declare: function(options) {
    return {
      childViews: [
        view: ExampleTable,
      ]
    }
  }
});
{% endhighlight %}

<h2>Optimizations</h2>
If your TableView is not performing well, there are a few thing that you can do optimize / enhance the performance:
<ul>
  <li>Disable refreshing while scrolling. To do this, you can include two more methods *didScrollStart* and *didScrollEnd* after all the other required functions. For example, you can have a *ready* boolean that gets toggled on and off. Before refreshing, always perform a check to make sure it is *ready*.</li>
  <li>If the TableView is constantly refreshing, try putting a timer on it such that it only refreshes (in batches) once every second or so.</li>
  <li>If all of your cells are the same height, pass in a *fixedRowHeight* and leave out the heightForRowInSection method:</li>
</ul>

{% highlight javascript %}
  declare: function(options) {
    return {
      childViews: [
        view: TableView,
        fixedRowHeight: 40, /* this is in pixels */
        ref:'table'
      ]
    }
  }
{% endhighlight %}
