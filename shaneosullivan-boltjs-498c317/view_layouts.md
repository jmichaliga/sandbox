---
title: Layout Views
layout: default
section: view
---

<h1>Layout Views</h1>

Bolt provides two layout views,
<ul>
  <li>HBox - lays out child views horizontally</li>
  <li>VBox - lays out child views vertically</li>
</ul>

Each of these implement the [http://www.w3.org/TR/css3-flexbox CSS Flex Box Model].

The default behavior is for each child view to take up its natural amount of space.  If no size is specified by a child view, it can be made take up the remaining unused space by setting a <b>flex</b> attribute.  For a more complete explanation of the Flex Box model see <a href="http://www.the-haystack.com/2010/01/23/css3-flexbox-part-1">HERE</a>.

The example below shows a horizontally laid out container with two child views.  The first view takes up its natural size, while the second child, which has been given a <b>flex</b> value of 1, will take up the remaining space.
{% highlight javascript%}
require('builder').build({
  view: 'HBox',
  childViews: [
    {
      content: "I am small"
    },
    {
      flex: 1,
      content: "I take up the remaining space"
    }
  ]
});
{% endhighlight %}

<h2>Multiple Flex Values</h2>
If multiple child nodes are given <b>flex</b> values, their sizes are calculated relative to the flex values.  In the example below, child A takes up it's natural height, child B takes up one third of the remaining space and child C takes up two thirds of the remaining space.  Therefore since B's flex value is 1 and C's flex value is 2, C takes up twice as much space as B.

{% highlight javascript %}
require('builder').build({
  view: 'VBox',
  childViews: [
    {
      content: "A"
    },
    {
      flex: 1,
      content: "B"
    },
    {
      flex: 2,
      content: "C"
    }
  ]
});
{% endhighlight %}

<h2>Nesting Layouts</h2>
Any number of HBox and VBox views can be nested inside each other.  The code below shows a complex example

{% highlight javascript %}
builder.build({
  view: "HBox",

  style: {
    "height": "300px",
    "width": "600px"
  },

  childViews: [
    {
      innerHTML: "Leading Content",
      style: "color: red"
    },
  {
    flex: 1,
    view: "VBox",

    childViews: [
      {
        className: "test-negative",
        innerHTML: "Heading 1"
      },
      {
        flex: 2,
        innerHTML: "Vertical Body Content"
      },
      {
        flex: 1,
        innerHTML: "Smaller Body Content"
      },
      {
        innerHTML: "footer"
      }
    ]

  },
    {
      flex: 1,
      childViews: [
        {
        view: "HBox",
        style: {
        padding: "10px"
        },
        childViews: [
          {
          innerHTML: "AA"
          },
          {
          view: "VBox",
          className: "test-negative",
          childViews: [
            {
            innerHTML: "Foo"
            },
            {
            innerHTML: "Bar"
            }
          ]

          }
        ]

        }
      ],
      style: {
        'textAlign': 'center'
      }
    },
    {
      innerHTML: "Trailing Content"
    }
  ]
}
{% endhighlight %}

