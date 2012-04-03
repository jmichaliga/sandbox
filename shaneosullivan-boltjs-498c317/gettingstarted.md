---
title: Getting Started with BoltJS
layout: default
section: gettingstarted
---

<h1>Getting Started</h1>

<h2>Checking out the code</h2>
<p>
  The first step to working with Bolt is to check out the code.  Bolt will soon be available on GitHub, but for now you must be a Facebook developer to get it.  Search for instructions on downloading it on the internal wiki.
</p>

<h2>Installing Node</h2>
<p>
  Bolt uses a build script to create it's packaged files, and to build a single package file for individual HTML5 apps.  This script is written in JavaScript and is executed using <a href="http://nodejs.org">NodeJS</a>.  The current version of Node, v0.4.7, runs on Mac and Linux, and can work on Windows through CygWin.  For this reason, it's easier to work with Bolt if you're not on Windows.  This is a situation we're looking into, but Joyent (Node maintainers) are working hard to get it working on Windows too, so this issue might just solve itself soon. 
</p>

<p>
  So, go ahead and <a href="https://github.com/joyent/node/wiki/Installation">install Node</a>.
</p>

<h2>Bolt Core</h2>

<b>Views</b>

<ul>
  <li>View: base level view class that provides life cycle, configuration, data binding, and dom access</li>
  <li>Container: base level view class that can contain other views and manage them as a set </li>
  <li>CollectionView: Container view that can be data-bound to a Collection</li>
</ul>

<b>Models</b>
<ul>
  <li>Model: Base level object with observable properties. These should be sub-classed to model the domain of your application</li>
  <li>Collection: Manage a set of models and provide notifications of membership changes.</li>
</ul>

<b>Controllers</b>
<ul>
  <li>Not yet defined in Bolt. Should be lightweight and provide the facility of connecting models and views prior to data-binding.</li>
</ul>

<b>Utilities</b>
<ul>
  <li>Javelin: DOM, Ajax, Class Inheritance, Events (data/DOM) </li>
  <li>Underscore: iterators</li>
  <li>Build System: nodejs script provides CommonJS module api and packages resources into single files</li>
</ul>

<h2>Setting Up An Application</h2>

<p>
  To build a standalone HTML5 app, first create a folder, let's call it <b>MyApp</b>, and create a file called <b>package.json</b>.  This file describes your application, as per the <a href="http://wiki.commonjs.org/wiki/Packages/1.0">CommonJS Spec</a>.   Bolt has added an extra parameter, <b>bolt_build_manifest</b> which is used to concatenate all of your source files into one JavaScript file and one CSS file.  It also provides the CommonJS wrappers necessary to allow just-in-time execution of your code, which speeds up app startup time.  
</p>

<p>
  Create a folder called <b>src</b>, which is where you'll put your code.
</p>

<p>
  Open package.json, and add the following:
</p>

{% highlight javascript %}
{
  "name": "MyApp",
  "version": "0.0.0",
  "bolt_build_manifest" : [
    {
      "sources": [
        "src"
      ],
      "package_target": "pkg",
      "package_name": "myapp"
    }
  ]
}
{% endhighlight %}

<p>
  The first two lines, name and version, are the minimum parameters required by the CommonJS spec.  The <b>bolt_build_manifest</b> parameter specifies <b>sources</b>, which is a list of the folders and files that are required in your application.  Both JavaScript and CSS files are included in the build process.  The <b>package_target</b> parameter specifies the name of the folder into which the built files will be placed.  The <b>package_name</b> parameter specifies the name of the files to be created, e.g. <b>myapp.js</b> and <b>myapp.css</b>.
</p>

<p>
  Note that double quotes must be used for each part of the package.json file, otherwise Node complains about it not being sytactically correct JSON.
</p>

<p>
  Go to where you have Bolt downloaded and type <b>npm link</b>.  This uses the Node NPM tool to set up the Bolt build script to be used from anywhere
</p>

<p>
  Go back to your new apps root folder.  Type <b>bolt-build</b>.  This builds your application, creating the files
</p>

<ul>
  <li>pkg/myapp.js</li>
  <li>pkg/myapp.css</li>
</ul>

<p>
  These two files should be included in your index.html file for the app, along with bolt.js and bolt.css.  One common layout for an app would be:
</p>

<ul>
  <li>MyApp</li>
  <li class="nobullet">
    <ul>
      <li>index.html</li>
      <li>bolt-build.json</li>
      <li>src</li>
      <li class="nobullet">
        <ul>
          <li>someCode.js</li>
          <li>someOtherCode.js</li>
          <li>someStyles.css</li>
        </ul>
      </li>
      <li>pkg</li>
      <li class="nobullet">
        <ul>
          <li>myapp.js (generated file)</li>
          <li>myapp.css (generated file)</li>
        </ul>
      </li>
    </ul>
  </li>
</ul>

<p>
  As it would be tiresome to have to run a build step every time you change any JavaScript or CSS file, the Bolt build script has a <b>watch</b> mode, which looks for changes to any files and rebuilds your app code.  To use this, type <b>bolt-build -w</b> in the root folder of your app.
</p>

<p>
  Now any JavaScript or CSS files that you place in the <b>src</b> folder of your app will be built into a single file.  See <a href="building.html">Building Bolt</a> for more details on how to build an app.
</p>


