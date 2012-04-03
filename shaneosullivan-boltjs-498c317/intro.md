---
title: Introduction
layout: default
---

Introduction to BoltJS
======================

BoltJS is a UI framework designed by Facebook to be compact, fast and powerful.  It is written entirely in JavaScript and runs in the browser, needing no server backend.  While BoltJS can be used in a progressive enhancement approach, it is primarily designed for UIs that are built mostly, if not completely, in the browser.

While it is the aim of the BoltJS project to support as many modern browsers as sensible, it is currently focused on supporting mobile WebKit browsers, with the intention of being the best possible development platform for mobile sites and HTML5 apps.

<b>Built on Javelin</b>

Bolt is built on top of Javelin (http://javelinjs.com), from which it uses the event delegation and class declaration features, as well as various utility methods.  This ensures that Bolt does not duplicate code already present in the Facebook codebase, helping it stay lightweight and reuse patterns familiar to Facebook developers. 	


<b>Modules and CommonJS</b>

Bolt modules are defined using a popular standard called CommonJS, first popularized by the NodeJS community.  This ensures that each module is completely self contained, with no global variables being created.  CommonJS has been integrated with Haste on the server side, and so is also very easy to deploy in a non-mobile app context.
<a href="http://wiki.commonjs.org/wiki/Modules/1.1.1">Common JS Module Specification</a>

<b>Complex Widgets Made Simple(r)</b>

Bolt makes it very simple to composite many different widgets together, lay them out in a reliable fashion, listen to their events and synchronize their data models.  This is achieved using
<ul>
  <li>A <a href="view_building.html">Builder</a> which creates an infinitely deep hierarchy of child widgets using a JSON schema. </li>
  <li><a href="view_layouts.html">Layout classes</a> that position their child elements in either horizontal or vertical positions, complete with support for relative sizing of child elements</li>
  <li>Combining the Javelin event delegation framework with the concept of view <a href="view_building.html">"owners"</a>.  Any view that creates child views automatically becomes the "owner" of this views, and can add event listeners to it's children during the build process. </li>
  <li>A flexible <a href="model_binding.html">data-binding framework</a> with support for individual models and <a href="collection.html">collections</a> of models.</li>
</ul>


