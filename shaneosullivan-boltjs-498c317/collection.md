---
title: Collections
section: collection
layout: default
---

<h1>Collections</h1>

<p>
  A Collection is a simple wrapper around an Array of <a href="model.html">Models</a> which provides the following membership events:
</p>

<ul>
  <li><b>modelAdded</b> - invoked when a model is added to the collection</li>
  <li><b>modelRemoved</b> - invoked when a model is removed from the collection</li>
  <li><b>modelChanged</b> - invoked when any property on a model in the collection changes</li>
  <li><b>updated</b> - invoked when the entire collection has been updated.</li>
</ul>

<p>
  To listen to any of these events, use the <b>listen</b> method, e.g.
</p>

{% highlight javascript %}
  var Collection = require('collection').Collection;
  var Model = require('model').Model;
  var c = new Collection();

  c.listen('modelAdded', function(obj) {
    console.log('This model was added ', obj.model);
  });

  c.listen('updated', function(obj) {
    console.log('This collection was updated', obj.collection);
  });

  var m = new Model({name: 'Shane', age: 32});
  c.add(m);
{% endhighlight %}

<p>
  While a Collection can be used in a standalone manner for managing and monitoring lists of 
  <a href="model.html">Models</a>, it's main purpose is to be combined with a 
  <a href="view_collectionview.html">CollectionView</a>.  Using Collections with a CollectionView,
  you can simply add and remove models from the Collection, and the view will update it's list of sub views.
  This decouples data an UI in a very clean manner.  See <a href="view_collectionview.html">CollectionView</a>
  for more information on this.
</p>
