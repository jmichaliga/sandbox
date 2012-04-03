---
title: Building Bolt Packages
layout: default
---

<h1>Building Bolt Packages</h1>
Bolt includes a build system that allows you to generate single file packages for your css and js files. A package.json manifest tells the build script what files to include in your package.

Here is an example package.json file:
{% highlight javascript %}
{
  "name": "MyProjectName",
  "version": "1.0.0",
  "bolt_build_manifest":{
    "provide_common_js_require_function": true,
    "sources": [
      ["module_name", "path/to/module.js"],
      ["namespace", "../directory/outside/my/project"]
      "another_module.js"
      "a_directory"
    ],
    "package_target": "path/to/package/directory",
    "package_name": "my_package"
  },
  {
    ...
    multiple configs can be provided in a single file
  }
}
{% endhighlight %}

<b>Key points</b>
<ul>
  <li>all file references are relative to the location of the package.json</li>
  <li>multiple configurations can be provided as a json array</li>
  <li>provide_common_js_require_function should only be included by the bolt package. Eventually we may put everything into one package; however, for now it's important that only the bolt framework package includes this file</li>
  <li>directory references in the package.json will cause all files to be recursively included within that directory.</li>
  <li>if a namespace is provided in the sources (e.g. ["module_name", "directory"]) files within that directory will be required as require('module_name/path/to/file/from/directory.js').</li>
  <li>any images in a directory you specify in sources will be copied into the package_target directory. This means your css files should be able to reference the images relatively as if they are alongside the css file.</li>
</ul>

<b>Running bolt build</b><br/>
Once you run npm-link on your bolt checkout, you'll have access to the "bolt build" command. bolt build takes a few options:
<ul>
  <li> -w : run the build continuously watching for changes to files</li>
  <li> -c : specify an alternate config file other than the default package.json</li>
  <li> -m: minify the output using uglify.js. package files will be names as package_name.min.js package_name.min.css</li>
</ul>

To see all of the tasks available to run in your project, type <b>bolt tasks</b>
