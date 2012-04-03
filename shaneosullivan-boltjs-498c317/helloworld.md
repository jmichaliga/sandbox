---
title: Creating a Hello World application using Bolt.
layout: default
section: gettingstarted
---

<h1>01. Tutorial: Hello-World</h1>
<p>
  Lets start with the tutorial every framework / language tutorial ever starts with: Hello World. All the source code for this tutorial is available below, or you can download it <a href="examples/helloworld.zip" target="_blank">here</a>
</p>

<h2>lib</h2>
<p>First, you should download the compiled version of bolt.js as well as bolt.css and place these files inside a folder called lib in your root directory</p>

<h2>package.json</h2>
<p>
  A bolt application has several components. The first is the <b>package.json</b> file, located at the root level of the application package. Here is an example of a basic package.json file:</p>
{% highlight javascript %}
  {
  "bolt_build_manifest" : [ 
    {   
      "sources": [
        ["", "js"],
        "css"
      ],  
      "package_target": "pkg",
      "package_name": "hellopacket"
    }   
  ]
  }
{% endhighlight %}
<p> Breakdown of this file:</p>
<ul>
  <li>*bolt_build_manifest*: tells bolt where all the source files are. In this case, it is telling bolt that one group of files will come from the root directory and the js folder, and another group of files will come from the css directory</li>
  <li>*package_target*: tells bolt where to put all the compiled files. In this case, bolt will compile a js file and a css file and dump the results into the *pkg* folder inside the root directory.</li>
</ul>
<br>Next we have the *package_target* which tells bolt where to put the compiled files

<h2>index.html</h2>
<p>Next, we have the default html page. This is the page where the application will be embedded in. Here is a sample *index.html* file:</p>

{% highlight html %}
<html>
<head>
  <title>Hello World Application</title>

  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta http-equiv="content-type" content="text/html; charset=utf-8">
  <meta name = "viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no,width=device-width,target-densityDpi=device-dpi" />  
  <!-- CSS -->  <link rel="stylesheet" href="lib/bolt.css" type="text/css" media="screen" charset="utf-8">
  <link rel="stylesheet" href="pkg/helloworld.css" type="text/css" media="screen" charset="utf-8">

  <!-- BOLT -->
  <script src="lib/bolt.js"></script>

  <!-- HelloWorld JS -->
  <script type="text/javascript" charset="utf-8" src="pkg/helloworld.js"></script>
</head>
<body>
  <script type="text/javascript" charset="utf-8">
    var helloworld = require('helloworld');
     helloworld.init();
  </script>
</body>
</html>
{% endhighlight %}
<p>Here, weve linked together all the resources we will need in our hello world application:</p>
<ul>
  <li>*css*: Weve linked the default bolt.css as well as a custom css. Any of your own css can be put in here.</li>
  <li>*bolt*: Compiled version of bolt.js</li>
  <li>*helloworld js*: Point this to the compiled version of helloworld located in pkg/</li>
  <li>*init*: We created an init function that gets called inside. This function will initialize everything and place it in the dom</li>
</ul>

<h2>helloworld.js</h2>
<p>This is the exciting part. Inside *js/helloworld.js* is where we will write our bolt code. Here is the starter code we will use for our HelloWorld application:</p>
{% highlight javascript %}
var core  = require('javelin/core');
var View  = require('view').View;

var HelloView = core.createClass({
  extend: View,

  declare: function(options) {
    return{
      content: "Hello World!"
    }   
  }
})

exports.init = function() {
  require('builder').build({
    view: HelloView
  }).placeIn(document.body);
}
{% endhighlight %}
<p> Okay, this seems like a lot at first. The <b>require</b> statements at top are like include statements. <b>core</b> is used everywhere in the bolt framework to create models, views, and controllers. <b>View</b> is the base class that you can extend to create your own custom views. This is what we have done here. We have created the <b>HelloView</b> view which extends View, and set its content to "Hello World!" </p>
<p>
<b>init</b> is the function we called in *index.html* above. <b>exports</b> tells bolt that this function will be called outside the scope of this file. In this <b>init</b> function, weve created an instance of HelloView and placed that instance inside the document body.
</p>

<h2>bolt build</h2>
<p>If you have followed this tutorial and created all the files as above, you should then compile your project using <b>bolt build</b>. Simply type <b>bolt build</b> in your root directory. Alternatively, if you want it to continuously build while your make changes, you can use <b>bolt build -w</b> in a separate tab and leave it there.</p>

<p>and, voila! You should now be able to navigate to your index.html file and see Hello, World! on the screen.</p>
