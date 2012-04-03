---
title: Models
layout: default
section: model
---

<h1>Models</h1>

A Model is a simple wrapper around a JSON object which invokes a <b>changed</b> event when a value changes.  Models can be bound to views such that a view will automatically update itself when a model value changes.

To create a model, simply instantiate it with a JSON object defining it's data, e.g.

{% highlight javascript %}
  require('model');
  var personModel = new Model({
    name: 'Mark',
    age: 12,
    nationality: 'Irish'
  });
{% endhighlight %}

To update a models value, simply call the <b>set</b> function, passing it both the name of the property and it's value, e.g.

{% highlight javascript %}

  personModel.set('age', 14);

{% endhighlight %}

Calling the <b>set</b> function will fire a <b>changed</b> event.  However, sometimes is is necessary to update many properties in a single transaction, and the <b>changed</b> event shouldn't be fired until all have been set.  In this case, use the <b>setAll</b> function, passing it a JSON object with name value pairs to set e.g.

{% highlight javascript %}
  personModel.setAll({
    name: 'Mary',
    age: 34,
    nationality: 'Swedish'
  });

{% endhighlight %}

Getting a value from a model is simply, just call the <b>get</b> function, passing it the property name, e.g.

{% highlight javascript %}
  personModel.get('age');
{% endhighlight %}

