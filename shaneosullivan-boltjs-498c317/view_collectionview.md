---
title: Collection Views
section: view
layout: default
---

<h1>Collection Views</h1>

<p>
  A <b>CollectionView</b> is a which constructs child views by listening to membership events on a <a href="collection.html">Collection</a>.  When a model is added, removed or updated in a collection, the <b>CollectionView</b> will add, remove or update the corresponding child view.
</p>

<p>
  There are two ways to use CollectionView, programmatic and declarative.  Which you use depends on the situation.
</p>

<h2>Programmatic View Declaration</h2>
<p>
  <b>CollectionView</b> contains the method <b>viewForModel</b> which can be overridden by a child class to define what view should be created when a given <a href="model.html">Model</a> is added to the <a href="collection.html">Collection</a>.  The <b>CollectionView</b> then takes care of inserting that <a href="view.html">View</a> in the correct position.  If the model that was used to create that View is ever removed from the Collection, the View will also be cleanly removed from the CollectionView.  The example shows a simple example of this.
</p>

{% highlight javascript %}
  var CollectionView = require('collection_view').CollectionView;
  var Collection = require('collection').Collection;
  var Model = require('model').Model;

  // Declare two models, containing a 'type' and a 'value'
  var model1 = new Model({type: 'url', value: 'http://facebook.com'});
  var model2 = new Model({type: 'email', value: 'helpdesk@facebook.com'});

  var InputCollectionView = require('javelin/core').createClass({

    // Call this class InputCollectionView
    name: 'InputCollectionView',

    // Extend the base CollectionView class
    extend: CollectionView,

    members: {

      // Define the viewForModel function.  This should be all you need to define
      // and the CollectionView class will take care of the rest
      viewForModel: function(model) {
        // Get the type of the model, which we set above
        // This is used to decide which view we create
        var type = model.get('type');
        var view;

        switch(type) {
          
          case 'url':
            view = this.build({
              // Assume that we have some custom input for urls
              view: CustomUrlInput
            });
            break;
          case 'email':
            view = this.build({
              // Assume that we have some custom input for emails
              view: CustomEmailInput
            });
            break;
        }

        // Bind the model to the view so that any changes to its value will
        // be reflected in the view
        view.setBinding(model, [{property: 'value'}]);

        return view;
      }
    }
  });

  // Create an instance of our customized CollectionView
  var collView = new InputCollectionView();

  // Insert it into the DOM
  collView.placeIn(document.body);

  // Get the default Collection from the CollectionView.  It is also possible
  // to pass an existing Collection to the CollectionView
  var coll = collView.getCollection();

  // Add the two models to the Collection.  This will cause two new Views to be
  // inserted into the InputCollectionView
  coll.add(model1);
  coll.add(model2);

{% endhighlight %}

<h2>Declarative View Creation</h2>

<p>
  For cases where the <b>Collection</b> contains different classes of <b>Model</b>,
  and each class of model can be represented by a particular type of view, a more simple
  declarative method of using a <b>CollectionView</b> is possible.
</p>

<p>
  Rather than subclassing a <b>CollectionView</b> and overriding the <b>viewForModel</b>
  method, pass in a JSON hash called <b>modelViewMapping</b> defining the mapping from the 
  declared class of a <b>Model</b> to the type of view to create.  Using this approach, 
  the earlier example can be changed to the code below.
</p>

{% highlight javascript %}
  var CollectionView = require('collection_view').CollectionView;
  var Collection = require('collection').Collection;
  var Model = require('model').Model;

  // Declare two models, both containing'value'
  // Assume that we have two models, UrlModel and EmailModel,
  // both which extend Model
  var model1 = new UrlModel({value: 'http://facebook.com'});
  var model2 = new EmailModel({value: 'helpdesk@facebook.com'});

  // Create an instance of our customized CollectionView
  var collView = new CollectionView({
    modelViewMapping: {
      'UrlModel': {
        // Create a 'CustomUrlInput' view when a UrlModel is encountered
        view: 'CustomUrlInput',
 
        // Bind the model to the view so that any changes to its value will
        // be reflected in the view
        bindingConfig: [{property: 'value'}]
      },
     'EmailModel': {
        // Create a 'CustomEmailInput' view when an EmailModel is encountered
        view: 'CustomEmailInput', 
 
        // Bind the model to the view so that any changes to its value will
        // be reflected in the view
        bindingConfig: [{property: 'value'}]
      }
    }
  });

  // Insert it into the DOM
  collView.placeIn(document.body);

  // Get the default Collection from the CollectionView.  It is also possible
  // to pass an existing Collection to the CollectionView
  var coll = collView.getCollection();

  // Add the two models to the Collection.  This will cause two new Views to be
  // inserted into the InputCollectionView
  coll.add(model1);
  coll.add(model2);

{% endhighlight %}

<p>
  Deciding which approach to use depends on the situation.  If all the Models in the Collection
  are of the same type, and deciding which view to create, and how to create it depends on some custom
  logic, then use the programmatic approach.  If the Models in your Collection are of different classes,
  and there is a simple one-to-one mapping between the Model class and the type of View to create,
  then the declarative approach is more suitable
</p>
