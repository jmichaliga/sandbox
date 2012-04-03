//----------------------------------------------------------------------------
// Copyright (c) 2010 Patrick Mueller
// 
// The MIT License - see: http://www.opensource.org/licenses/mit-license.php
//----------------------------------------------------------------------------

//----------------------------------------------------------------------------
// an implementation of the require() function as specified for use with
// CommonJS Modules - see http://commonjs.org/specs/modules/1.0.html
//----------------------------------------------------------------------------

//----------------------------------------------------------------------------
// inspired from David Flanagan's require() function documented here:
// http://www.davidflanagan.com/2009/11/a-module-loader.html
//----------------------------------------------------------------------------

//----------------------------------------------------------------------------
// only supports "preloaded" modules ala require.define (Transport/D)
//    http://wiki.commonjs.org/wiki/Modules/Transport/D
// but only supports the first parameter
//----------------------------------------------------------------------------

//----------------------------------------------------------------------------
// globals
//----------------------------------------------------------------------------
var require
var modjewel

//----------------------------------------------------------------------------
// function wrapper
//----------------------------------------------------------------------------
(function(){

//----------------------------------------------------------------------------
// some constants
//----------------------------------------------------------------------------
var PROGRAM = "modjewel"
var VERSION = "1.1.0"

//----------------------------------------------------------------------------
// if require() is already defined, leave
//----------------------------------------------------------------------------
if (modjewel) {
    log("modjewel global variable already defined")
    return
}

var OriginalRequire = require
var NoConflict      = false

//----------------------------------------------------------------------------
// "globals" (local to this function scope though)
//----------------------------------------------------------------------------
var ModuleStore
var ModulePreloadStore
var MainModule
var WarnOnRecursiveRequire = false

//----------------------------------------------------------------------------
// the require function
//----------------------------------------------------------------------------
function get_require(currentModule) {
    var result = function require(moduleId) {

        if (moduleId.match(/^\.{1,2}\//)) {
            moduleId = normalize(currentModule, moduleId)
        }

        if (hop(ModuleStore, moduleId)) {
            var module = ModuleStore[moduleId]
            if (module.__isLoading) {
                if (WarnOnRecursiveRequire) {
                    var fromModule = currentModule ? currentModule.id : "<root>" 
                    console.log("module '" + moduleId + "' recursively require()d from '" + fromModule + "', problem?")
                }
            }
            
            currentModule.moduleIdsRequired.push(moduleId)
            
            return module.exports
        }

        if (!hop(ModulePreloadStore, moduleId)) {
            var fromModule = currentModule ? currentModule.id : "<root>" 
            error("module '" + moduleId + "' not found from '" + fromModule + "', must be preloaded")
        }
        
        var moduleDefFunction = ModulePreloadStore[moduleId]

        var module = create_module(moduleId)

        var newRequire = get_require(module) 

        ModuleStore[moduleId] = module
        
        module.__isLoading = true
        try {
            currentModule.moduleIdsRequired.push(moduleId)
            
            moduleDefFunction.call(null, newRequire, module.exports, module)
        }
        finally {
            module.__isLoading = false
        }
        
        return module.exports
    }
    
    result.define         = require_define
    result.implementation = PROGRAM
    result.version        = VERSION
    
    return result
}

//----------------------------------------------------------------------------
// shorter version of hasOwnProperty
//----------------------------------------------------------------------------
function hop(object, name) {
    return Object.prototype.hasOwnProperty.call(object, name)
}

//----------------------------------------------------------------------------
// create a new module
//----------------------------------------------------------------------------
function create_module(id) {
    return { 
        id:                id, 
        uri:               id, 
        exports:           {},
        moduleIdsRequired: []
    }
}

//----------------------------------------------------------------------------
// reset the stores
//----------------------------------------------------------------------------
function require_reset() {
    ModuleStore        = {}
    ModulePreloadStore = {}
    MainModule         = create_module(null)
    
    require = get_require(MainModule)
    
    require.define({modjewel: modjewel_module})
    
    modjewel = require("modjewel")
}

//----------------------------------------------------------------------------
// used by pre-built modules that can be included via <script src=>
// a simplification of 
//    http://wiki.commonjs.org/wiki/Modules/Transport/D
// but only supports the first parameter
//----------------------------------------------------------------------------
function require_define(moduleSet) {
    for (var moduleName in moduleSet) {
        if (!hop(moduleSet, moduleName)) continue
        
        if (moduleName.match(/^\./)) {
            console.log("require.define(): moduleName in moduleSet must not start with '.': '" + moduleName + "'")
            return
        }
        
        var moduleDefFunction = moduleSet[moduleName]
        
        if (typeof moduleDefFunction != "function") {
            console.log("require.define(): expecting a function as value of '" + moduleName + "' in moduleSet")
            return
        }
        
        if (hop(ModulePreloadStore, moduleName)) {
            console.log("require.define(): module '" + moduleName + "' has already been preloaded")
            return
        }

        ModulePreloadStore[moduleName] = moduleDefFunction
    }
}

//----------------------------------------------------------------------------
// get the path of a module
//----------------------------------------------------------------------------
function getModulePath(module) {
    if (!module || !module.id) return ""
    
    var parts = module.id.split("/")
    
    return parts.slice(0, parts.length-1).join("/")
}

//----------------------------------------------------------------------------
// normalize a 'file name' with . and .. with a 'directory name'
//----------------------------------------------------------------------------
function normalize(module, file) {
    var modulePath = getModulePath(module)
    var dirParts   = ("" == modulePath) ? [] : modulePath.split("/")
    var fileParts  = file.split("/")
    
    for (var i=0; i<fileParts.length; i++) {
        var filePart = fileParts[i]
        
        if (filePart == ".") {
        }
        
        else if (filePart == "..") {
            if (dirParts.length > 0) {
                dirParts.pop()
            }
            else {
                // error("error normalizing '" + module + "' and '" + file + "'")
                // eat non-valid .. paths
            }
        }
        
        else {
            dirParts.push(filePart)
        }
    }
    
    return dirParts.join("/")
}

//----------------------------------------------------------------------------
// throw an error
//----------------------------------------------------------------------------
function error(message) {
    throw new Error(PROGRAM + ": " + message)
}

//----------------------------------------------------------------------------
// get a list of loaded modules
//----------------------------------------------------------------------------
function modjewel_getLoadedModuleIds() {
    var result = []
    
    for (moduleId in ModuleStore) {
        result.push(moduleId)
    }
    
    return result
}

//----------------------------------------------------------------------------
// get a list of the preloaded module ids
//----------------------------------------------------------------------------
function modjewel_getPreloadedModuleIds() {
    var result = []
    
    for (moduleId in ModulePreloadStore) {
        result.push(moduleId)
    }
    
    return result
}

//----------------------------------------------------------------------------
// get a module by module id
//----------------------------------------------------------------------------
function modjewel_getModule(moduleId) {
    if (null == moduleId) return MainModule
    
    return ModuleStore[moduleId]
}

//----------------------------------------------------------------------------
// get a list of module ids which have been required by the specified module id
//----------------------------------------------------------------------------
function modjewel_getModuleIdsRequired(moduleId) {
    var module = modjewel_getModule(moduleId)
    if (null == module) return null
    
    return module.moduleIdsRequired.slice()
}

//----------------------------------------------------------------------------
// set the WarnOnRecursiveRequireFlag
// - if you make use of "module.exports =" in your code, you will want this on
//----------------------------------------------------------------------------
function modjewel_warnOnRecursiveRequire(value) {
    if (arguments.length == 0) return WarnOnRecursiveRequire
    WarnOnRecursiveRequire = !!value
}

//----------------------------------------------------------------------------
// relinquish modjewel's control of the require variable
// - like jQuery's version'
//----------------------------------------------------------------------------
function modjewel_noConflict() {
    NoConflict = true
    
    require = OriginalRequire
}

//----------------------------------------------------------------------------
// the modjewel module
//----------------------------------------------------------------------------
function modjewel_module(require, exports, module) {
    exports.VERSION                = VERSION
    exports.require                = require
    exports.define                 = require.define
    exports.getLoadedModuleIds     = modjewel_getLoadedModuleIds
    exports.getPreloadedModuleIds  = modjewel_getPreloadedModuleIds
    exports.getModule              = modjewel_getModule
    exports.getModuleIdsRequired   = modjewel_getModuleIdsRequired
    exports.warnOnRecursiveRequire = modjewel_warnOnRecursiveRequire
    exports.noConflict             = modjewel_noConflict
}

//----------------------------------------------------------------------------
// log a message
//----------------------------------------------------------------------------
function log(message) {
    console.log("modjewel: " + message)
}

//----------------------------------------------------------------------------
// make the require function a global
//----------------------------------------------------------------------------
require_reset()

//----------------------------------------------------------------------------
})();

window.require = require;
require.define({'binding': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/binding.js */
var util = require('util');
var core = require('javelin/core');

var Binding = core.createClass({
  name: 'Binding',

  construct: function(view, model, options) {
    this.setView(view);
    this.setModel(model);

    options = options || {};

    if (options.property && !options.modelProperty && !options.viewProperty) {
      options.modelProperty = options.viewProperty = options.property;
    }

    util.forEach(options, function(value, name) {
      this[util.setter(name)](value);
    }, this);

    var viewEvents = util.$A(this.getViewEvent());
    this.viewTokens = [];
    for (var i = 0; i < viewEvents.length; i++) {
      this.viewTokens.push(this.getView().listen(
        this.getViewEvent(),
        util.bind(this.updateModel, this)));
    }

    this.modelToken = this.getModel().listen(
      'changed',
      util.bind(this.updateView, this));

    if (options.sync !== false) {
      this.setViewValue(this.getModelValue());
    }
  },

  properties: {
    model: null,
    modelProperty: 'value',
    view: null,
    viewEvent: 'blur',
    viewProperty: 'value',
    property: 'value'
  },

  members: {
    destroy: function() {
      util.invoke(this.viewTokens, 'remove');
      this.modelToken.remove();
    },

    getViewValue: function() {
      return this.getView()[util.getter(this.getViewProperty())]();
    },

    setViewValue: function(value) {
      this.getView()[util.setter(this.getViewProperty())](value);
      this.setViewErrorState();
      return this;
    },

    getModelValue: function() {
      return this.getModel().get(this.getModelProperty());
    },

    setModelValue: function(value) {
      this.getModel().set(this.getModelProperty(), value);
      this.setViewErrorState();
      return this;
    },

    setViewErrorState: function() {
      this.getView().setErrorState(
        this.getViewProperty(),
        !this.getModel().isValid(this.getModelProperty()));
    },

    updateModel: function(event) {
      if (this.getViewValue() != this.getModelValue()) {
        this.setModelValue(this.getViewValue());
      }
    },

    updateView: function(event) {
      var modelProperty = this.getModelProperty();
      var modelValue = this.getModelValue();
      var viewValue = this.getViewValue();
      var isRelevant = (event.changedProperties || {}).hasOwnProperty(modelProperty) !== false;
      if (isRelevant && viewValue !== modelValue && event.source !== this ) {
        this.setViewValue(this.getModelValue());
      }
    }
  }
});


exports.Binding = Binding;

}});
require.define({'builder': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/builder.js */
var util = require('util');
var core = require('javelin/core');


var Builder = core.createClass({
  /**
  * @constructor
  */
  construct: function(namespace) {
    this.setNamespace(namespace || require('view'));
  },

  properties: {
    namespace: null
  },

  members: {
    build: function(configuration, owner) {
      return withBuilder(this, function() {
        if (configuration.length || configuration.length === 0) {
          return util.map(configuration, function(configurationItem) {
            return this.buildOne(configurationItem, owner);
          }, this);
        }
        return this.buildOne(configuration, owner);
      });
    },

    buildOne: function(configuration, owner) {
      if (configuration.createDom) {
        return configuration;
      }
      var viewName = configuration.view || 'View';
      var view;

      if (util.isFunction(viewName)) {
        view = viewName;
      } else {
        view = this.getNamespace()[viewName];
      }

      if (!view) {
        console.error('The view ' + viewName + ' is not defined');
      }

      // construct in the configuration for builder is deprecated
      if (configuration.construct) {
        console.log('the construct hash in builder is deprectated');
        util.forEach(configuration.construct, function(val, key) {
          configuration[key] = val;
        });
      }

      configuration.owner = configuration.owner || owner;
      try {
        view = new view(configuration);
      } catch(e) {
        console.log('Invalid view configuration', viewName, configuration);
        throw e;
      }
      return view;
    }
  }
});

var defaultBuilder = new Builder();

function withBuilder(builder, callback) {
  var oldBuilder = defaultBuilder;
  defaultBuilder = builder;
  var result = callback.call(builder);
  defaultBuilder = oldBuilder;
  return result;
}



exports.build = function(configuration, owner) {
  return defaultBuilder.build(configuration, owner);
};

exports.Builder = Builder;

}});
require.define({'collection': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/collection.js */
var util = require('util');
var core = require('javelin/core');
var Model = require('model').Model;
var Events = require('mixins/events').Events;

/**
 * Collections allow you to observe a set of models and receive notifications
 * when collection membership changes occur via adding and removing models.
 * Collections also proxy property change notifications on their models on to
 * the observer. This allows views to update the ui to reflect model state
 * within an observed collection.
 *
 * The Collection class was inspired by and borrows heavily from backbone.js
 * http://documentcloud.github.com/backbone/
 */
var Collection = core.createClass({
  name: 'Collection',

  /**
   * create a new collection
   */
  construct: function(options) {
    this.length = 0;
    this.models = [];
    this._byCid = {};
    this._byId = {};
    this._listeners = {};
    options = options || {};
    this.modelType = options.modelType || this.klass.modelType;
  },

  statics: {
    modelType: Model
  },

  mixins: [Events],

  members: {

    /**
     * add a model or a hash to a collection and invoke the modelAdded event
     * if a hash is passed in, the collection's default type is used to
     * construct a model for it
     * if the quiet flag is passed the modelAdded event will not be invoked.
     * if a comparator is provided the collection will maintain sort order
     * as items are added
     */
    add: function(model, quiet) {
      if (!model.klass) {
        model = new this.modelType(model);
      } else {
        var chain = model.klass.inheritanceChain;
        if (!chain || chain[chain.length-1].klassName !== 'Model') {
          model = new this.modelType(model);
        }
      }
      var cid = model.cid;
      var id = model.id;
      if (!this._byCid[cid] && (!id || !this._byId[id])) {
        var idx = this.comparator ?
          this.sortedIndex(model, this.comparator) : this.length;
        this.models.splice(idx, 0, model);
        this._byCid[cid] = model;
        if (model.id !== null) {
          this._byId[id] = model;
        }
        this.length++;
        this._boundModelChange = this._boundModelChange || util.bind(this._onModelChanged, this);
        this._listeners[cid] = model.listen('changed', this._boundModelChange);
        if (!quiet) {
          this._invoke('modelAdded', {model: model});
        }
        return true;
      }
      return false;
    },

    /**
     * remove a model from the collection and invoke the modelRemoved event
     * if the quiet flag is passed the modelRemoved event will not be invoked
     */
    remove: function(model, quiet) {
      var cid = model.cid;
      var id = model.id;
      if (this._byCid[cid]) {
        delete this._byCid[cid];
        delete this._byId[id];
        var idx = this.indexOf(model);
        this.models.splice(idx, 1);
        this.length--;
        if (!quiet) {
          this._invoke('modelRemoved', {model: model});
        }
        var listener = this._listeners[cid];
        listener && listener.remove();
      }
    },

    /**
     * clear all models from the collection can be performed silently if the
     * quiet flag is passed in
     */
    clear: function(quiet) {
      this._byCid = {};
      this._byId = {};
      this.models = [];
      this.length = 0;
      if (!quiet) {
        this._invoke('updated', {collection: this});
      }
    },

    /**
     * clears all models in the collection and replaces them
     * with the models passed in. The updated event is inovked upon
     * completion if the quiet flag is not passed in.
     */
    replace: function(models, quiet) {
      this.clear(true);
      this.merge(models, quiet);
    },

    /**
     * merge the passed in set of models into the collection by updating
     * or adding
     */
    merge: function(models) {
      var updated = false;
      if (!util.isArray(models)) {
        models = [models];
      }
      util.forEach(models, function(model) {
        var existingModel = this.get(model.id);
        // TODO: we have a weird case here where if a model is added without
        // an id it can appear to be a duplicate of any other models without
        // ids. Should we allow models without ids to be added? what use cases
        // does that break currently if we remove it.
        if (!existingModel) {
          var added = this.add(model, true);
          if (added) {
            updated = true;
          }
        } else {
          var ret = existingModel.merge(model.toObject(), true);
          updated = updated || !!ret;
        }
      }, this);
      if (updated) {
        this._invoke('updated', {collection: this});
      }
    },

    /**
     * sort the collection using the comparator
     */
    sort: function(quiet) {
      if (!this.comparator) {
        return false;
      }
      this.models = this.sortBy(this.comparator);
      if (!quiet) {
        this._invoke('updated', {collection: this});
      }
      return this;
    },

    /**
     * get a model by id from the collection
     */
    get: function(id) {
      return this._byId[id];
    },

    /**
     * get the ids of all the models
     */
    getIds: function(id) {
      return this.map(function(m) {
        return m.id;
      });
    },

    /**
     * get a model by client id from the collection
     */
    getByCid: function(cid) {
      return this._byCid[cid];
    },

    /**
     * get a model at a given index from the collection
     */
    at: function(idx) {
      return this.models[idx];
    },

    /**
     * proxy on a model change event
     */
    _onModelChanged: function(evt) {
      this._invoke('modelChanged', evt);
      var sortNeeded = (evt.changedProperties || {})[this.sortKey] !== undefined;
      if (sortNeeded) {
        this.sort();
      }
    },

    _invoke: function(evt, config) {
      config = config || {};
      config.evt = evt;
      // TODO: javelin doesn't pass the event signature along
      //       by default. I like including it so handlers can
      //       be generic and delegate based on the event they
      //       receive.
      this.invoke(evt, config);
    }

  }

});

var methods = [
  'filter', 'forEach', 'each', 'map', 'include', 'without',
  'find', 'first', 'last', 'isEmpty', 'toArray', 'select',
  'reject', 'indexOf', 'sortBy', 'sortedIndex'
];

util.forEach(methods, function(method) {
  Collection.prototype[method] = function() {
    return util[method].apply(
      this,
      [this.models].concat(util.toArray(arguments)));
  };
});

exports.Collection = Collection;

}});
require.define({'collection_view': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/collection_view.js */
var util  = require('util');
var build = require('builder').build;

var View = require('view').View;
var Collection = require('collection').Collection;


var CollectionView = require('javelin/core').createClass({
  name: 'CollectionView',

  extend: View,

  properties: {
    /**
     * backing collection to render this view from
     */
    collection: null,

    /**
     * provides a mapping between a model pulled from a collection
     * and a view. Allows you to pass any configuration to the view
     * that you would normally pass.
     */
    modelViewMapping: {
    },

    /**
     * The default binding configurations options to apply to
     * all bindings
     */
    defaultOptions: null
  },

  construct: function(options) {
    this.itemViews = {};
    this._collectionTokens = [];
    this._onCollectionEvent = util.bind(this._onCollectionEvent, this);

    options.collection = options.collection || new Collection();

    // if a a viewForModel function is passed in override the default
    if (options.viewForModel) {
      this.viewForModel = util.bind(options.viewForModel, this);
      delete options.viewForModel;
    }
    View.call(this, options);
  },

  members: {
    /**
     * by default attempt to map from the modelViewMapping to create
     * the appropriate view for a given model
     * this method can also be overridden to generate your own model
     * outside of the mapping
     */
    viewForModel: function(model) {
      return this._viewFromModelMapping(model);
    },

    /**
     * Insert the child view into the CollectionView.
     * This function can be overridden by subclasses to redirect
     * the destination of a created view.
     */
    insertCollectionChild: function(itemView, idx) {
      this.insertChild(itemView, idx);
    },

    /**
     * Remove the child view from the CollectionView.
     * This function can be overridden by subclasses to redirect
     * the destination of a created view.
     */
    removeCollectionChild: function(itemView) {
      this.removeChild(itemView);
    },

    /**
     * received when a model is added to the underlying collection
     */
    onModelAdded: function(model) {
      var itemView = this.viewForModel(model);
      if (itemView.getModel() !== model) {
        itemView.setModel(model);
      }
      this.itemViews[model.cid] = itemView;
      var idx = this.getCollection().indexOf(model);
      this.insertCollectionChild(itemView, idx);
      return itemView;
    },

    /**
     * received when a model is removed from the underlying collection
     */
    onModelRemoved: function(model) {
      var view = this.itemViews[model.cid];
      if (view) {
        this.removeCollectionChild(view);
        delete this.itemViews[model.cid];
      }
    },

    onUpdated: function() {
      // populate the initial set of models
      this.clearChildren();
      console.log('childViews.length', this.getChildViews().length);
      this.getCollection().each(function(model) {
        this.onModelAdded(model);
      }, this);
    },

    /**
     * received when a model is changed in the underlying collection
     */
    onModelChanged: function(obj) {
      //TODO:
    },

    /**
     * set the collection that this CollectionView is based on
     * and attach listeners
     */
    setCollection: function(collection) {
      var existingCollection = this.getProperty('collection');
      if (existingCollection) {
        util.invoke(this._collectionTokens, 'remove');
        this._collectionTokens = [];
      }
      this.setProperty('collection', collection);
      this[name] = collection;
      if (collection) {
        this._collectionTokens.push(
          collection.listen('modelChanged', this._onCollectionEvent),
          collection.listen('modelAdded', this._onCollectionEvent),
          collection.listen('modelRemoved', this._onCollectionEvent),
          collection.listen('updated', this._onCollectionEvent));
      }
      this.onUpdated();
      return this;
    },

    /**
     * destroy the collection view
     */
    destroy: function() {
      util.invoke(this._collectionTokens, 'remove');
      View.prototype.destroy.call(this);
    },

    /**
     * handle model events and delegate to the appropriate
     * callback based on the type of event
     */
    _onCollectionEvent: function(obj) {
      var handlerName = util.eventHandler(obj.evt);
      if (this[handlerName]) {
        this[handlerName](obj.model);
      }
    },

    /**
     * return a view for a model
     */
    _viewFromModelMapping: function(model) {
      var klass = model.getDeclaredClass();
      klass = klass.replace(/^JX\./, '');
      var config = this.getModelViewMapping()[klass];
      if (!config) {
        throw 'received a model without a mapping';
      }
      //TODO: should be able to pass this in directly
      var view = this.build(config);
      view.setBinding(model, config.bindingConfig, this.getDefaultOptions());
      return view;
    }
  }
});


exports.CollectionView = CollectionView;

}});
require.define({'container': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/container.js */
exports.Container = require('view').View;

}});
require.define({'deferred': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/deferred.js */
var util = require('util');
var core = require('javelin/core');


var STATUS_UNKNOWN   = 0;
var STATUS_SUCCEEDED = 1;
var STATUS_FAILED    = 2;

/**
* Basic Deferred implementation. Based on EventMachine API.
*
* @example
*   doSomethingAsync()
*     .addCallback(function() { do stuff })
*     .addErrback(function() { report error });
*
*   function doSomethingAsync() {
*     var def = new Deferred();
*     setTimeout(function() {
*       try {
*         var result = doSomeRendering();
*         def.succeed(result);
*       } catch (e) {
*         def.fail();
*       }
*     });
*     return def;
*   }
*
* @class
*/
var Deferred = core.createClass({
  name: 'Deferred',

  construct: function() {
    this.callbacks = [];
    this.errbacks  = [];
  },

  properties: {
    status: STATUS_UNKNOWN
  },

  members: {

    addCallback: function(callback) {
      if (this.getStatus() === STATUS_SUCCEEDED) {
        callback();
      } else {
        this.callbacks.push(callback);
      }
      return this;
    },

    removeCallback: function(callback) {
      this.callbacks = util.without(this.callbacks, callback);
      return this;
    },

    addErrback: function(callback) {
      if (this.getStatus() === STATUS_FAILED) {
        callback();
      } else {
        this.errbacks.push(callback);
      }
      return this;
    },

    removeErrback: function(callback) {
      this.errbacks = util.without(this.errbacks, callback);
      return this;
    },

    setStatus: function(status) {
      this.setProperty(status);
      var args = util.toArray(arguments).slice(1);
      if (status === STATUS_FAILED) {
        var errbacks = this.errbacks;
        this.errbacks = [];
        runCallbacks(errbacks, this, args);
      } else if (status === STATUS_SUCCEEDED) {
        var callbacks = this.callbacks;
        this.callbacks = [];
        runCallbacks(callbacks, this, args);
      }
      return this;
    },

    setTimeout: function(timeout) {
      this.timeout = setTimeout(util.bind(this.fail, this), timeout);
    },

    clearTimeout: function() {
      clearTimeout(this.timeout);
    },

    succeed: function() {
      var args = [STATUS_SUCCEEDED].concat(util.toArray(arguments));
      return this.setStatus.apply(this, args);
    },

    fail: function() {
      var args = [STATUS_FAILED].concat(util.toArray(arguments));
      return this.setStatus.apply(this, args);
    }
  }
});


/**
* Group several deferreds into one. Will succeed when all
* deferreds succeed or fail when all are finished and at least
* one failed.
* 
* Provides a hook for non deferred world, @see createWaitForCallback
* 
* @example
*   var list = new DeferredList();
*   performRequest(list.createWaitForCallback());
*   list.waitFor(doSomethingAsync());
*   list
*     .addCallback(function() { all is good }).
*     .startWaiting();
*
* @example
*   performRequest
*
* @class
*/
var DeferredList = core.createClass({
  name: 'DeferredList',

  extend: Deferred,

  construct: function(list) {
    Deferred.call(this);
    
    this.completed = 0;

    if (list) {
      util.forEach(list, this.waitFor, this);
      this.startWaiting();
    } else {
      this.list = [];
    }
  },

  members: {
    startWaiting: function() {
      this.waiting = true;
      this.checkDeferreds();
      return this;
    },

    waitFor: function(deferred) {
      this.list.push(deferred);
      this.checkDeferreds();
      deferred.addCallback(util.bind(this.deferredComplete, this));
      deferred.addErrback(util.bind(this.deferredComplete, this));
      return this;
    },

    createWaitForDeferred: function() {
      var deferred = new Deferred();
      this.waitFor(deferred);
      return deferred;
    },

    createWaitForCallback: function() {
      var deferred = this.createWaitForDeferred();
      return util.bind(deferred.succeed, deferred);
    },

    deferredComplete: function() {
      this.completed++;
      if (this.completed === this.list.length) {
        this.checkDeferreds();
      }
    },

    checkDeferreds: function() {
      if (!this.waiting || this.completed !== this.list.length) {
        return;
      }
      var failed = false;
      for (var i = 0; i < this.list.length; i++) {
        if (this.list[i].getStatus() === STATUS_FAILED) {
          failed = true;
        }
      }
      this.setStatus(failed ? STATUS_FAILED : STATUS_SUCCEEDED);
    }
  }
});


function runCallbacks(callbacks, context, args) {
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i].apply(context, args);
  }
}


exports.Deferred         = Deferred;
exports.DeferredList     = DeferredList;
exports.STATUS_UNKNOWN   = STATUS_UNKNOWN;
exports.STATUS_SUCCEEDED = STATUS_SUCCEEDED;
exports.STATUS_FAILED    = STATUS_FAILED;

}});
require.define({'javelin/core': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/javelin/core.js */
var JX = require('JX');

function getDeclaredClass() {
  return this.klass.klassName;
}

function setProperty(name, value) {
  this['__auto__' + name] = value;
}

function getProperty(name) {
  return this['__auto__' + name];
}

var JX_SPECIAL_KEYS = {
  construct : true,
  statics : true,
  members : true,
  extend : true,
  properties : true,
  events : true,
  name : true,
  beforeCreateClass: true,
  afterCreateClass: true
};

/**
 * Bolt specific class creation behavior
 */
function createClass(config) {
  config.members = config.members || {};
  config.events = config.events || [];

  config.members.getDeclaredClass = getDeclaredClass;
  config.members.getProperty = getProperty;
  config.members.setProperty = setProperty;

  // iterate over the mixins and copy each one to the config
  var mixins = JX.$A(config.mixins || []);
  delete config.mixins;
  while(mixins.length) {
    var mixin = mixins.shift();
    JX.copy(config.members, mixin);
  }

  // Default Name for Bolt Object
  config.name = config.name || 'BoltObject';

  // perform any class chain specific modifications to the config object
  // respecting the inheritance chain
  var beforeCreateClass;
  if (!config.beforeCreateClass && config.extend) {
    config.beforeCreateClass = config.extend.beforeCreateClass;
  }
  beforeCreateClass = config.beforeCreateClass || function(config){
    return config;
  };
  config = beforeCreateClass(config);

  // Saving and deleting these before createClass, otherwise
  // Javelin will complain in Dev mode that they is not valid
  delete config.beforeCreateClass;
  // perform any post class creation modifications respecting the inheritance
  // chain
  if (!config.afterCreateClass && config.extend) {
    config.afterCreateClass = config.extend.afterCreateClass;
  }
  var afterCreateClass = config.afterCreateClass || function() {};
  delete config.afterCreateClass;

  // anything else not explicitly handled by javelin special key is added
  // to members allowing for a more concise class declaration
  //
  // e.g.
  // core.createClass({
  //   name: 'Widget',
  //   extend: View,
  //
  //   // these will be instance methdos
  //   foo: function() {
  //
  //   },
  //   bar: function() {
  //
  //   }
  // });
  for (key in config) {
    if (!JX_SPECIAL_KEYS[key]) {
      config.members[key] = config[key];
    }
  }

  // create the class
  var klass = JX.createClass(config);
  klass.beforeCreateClass = beforeCreateClass;

  // setup a traversable inheritance chain
  klass.klassName = config.name;
  klass.prototype.klass = klass;
  klass.superKlass = config.extend;
  klass.prototype.superKlass = klass.superKlass;
  var inheritanceChain = [];
  var k = klass;
  while (k) {
    inheritanceChain.push(k);
    k = k.superKlass;
  }
  klass.inheritanceChain = inheritanceChain;

  klass.afterCreateClass = afterCreateClass;
  klass.afterCreateClass.call(klass, config);

  return klass;
}

exports.createClass = createClass;

}});
require.define({'javelin/dom': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/javelin/dom.js */
// temporary solution, till we have JX using modules
module.exports = require('JX').DOM;
module.exports.$N = require('JX').$N;

}});
require.define({'javelin/stratcom': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/javelin/stratcom.js */
// temporary solution, till we have JX using modules
module.exports = require('JX').Stratcom;

}});
require.define({'javelin/vector': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/javelin/vector.js */
// temporary solution, till we have JX using modules
module.exports = require('JX').Vector;
module.exports.$V = require('JX').$V;

}});
require.define({'mixins/events': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/mixins/events.js */
var util = require('util');

var tokenId = 0;

var Token = function(obj, ev, callback) {
  this.id = tokenId++;
  this.obj = obj;
  this.ev = ev;
  this.callback = callback;
};
Token.prototype.remove = function() {
  this.obj.removeListener(this.ev, this.callback);
};

exports.Events = {
  // Bind an event, specified by a string name, `ev`, to a `callback` function.
  // Passing `"all"` will bind the callback to all events fired.
  listen : function(ev, callback) {
    var calls = this._callbacks || (this._callbacks = {});
    var list  = calls[ev] || (calls[ev] = []);
    list.push(callback);
    return new Token(this, ev, callback);
  },

  // Remove one or many callbacks. If `callback` is null, removes all
  // callbacks for the event. If `ev` is null, removes all bound callbacks
  // for all events.
  removeListener : function(ev, callback) {
    var calls;
    if (!ev) {
      delete this._callbacks;
    } else if (calls = this._callbacks) {
      if (!callback) {
        delete calls[ev];
      } else {
        var list = calls[ev];
        for (var i = 0, l = list.length; i < l; i++) {
          if (callback === list[i]) {
            list.splice(i, 1);
            break;
          }
        }
      }
    }
    return this;
  },

  // Invoke an event, firing all bound callbacks. Callbacks are passed the
  // same arguments as `Invoke` is, apart from the event name.
  // Listening for `"all"` passes the true event name as the first argument.
  invoke : function(ev) {
    var list, calls, i, l;
    if (!(calls = this._callbacks)) return this;
    // NB: wbailey -- we must clone the callback lists here because the list
    // can be mutated during the course of processing. This occurs in the
    // filterableCollection code where a changeEvent triggers a removeEvent
    // that reduces the number of callbacks.
    if (calls[ev] && (list = util.clone(calls[ev]))) {
      for (i = 0, l = list.length; i < l; i++) {
        list[i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
    if (calls['all'] && (list = util.clone(calls['all']))) {
      for (i = 0, l = list.length; i < l; i++) {
        list[i].apply(this, arguments);
      }
    }
    return this;
  }
}

}});
require.define({'mixins/filterable_collection': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/mixins/filterable_collection.js */
var Collection = require('collection').Collection;
var util       = require('util');

// _fcid is an incrementing unique id for filteredCollections. The purpose of
// this is to allow filters to be easily added and removed.
var _fcid = 0;

// Mixing in filtered collection allows you to pull automatically maintained
// subcollections from the parent collection.
//
// Whenever an item is added/removed/modified in the parent collection, the
// parent will execute its filters on the model and determine if it needs to
// be added or removed from any sub collections.

var FilterableCollection = exports.FilterableCollection = {

  // destroy a filtered collection that is no longer in use
  destroyFilteredCollection: function(filteredCollection) {
    delete this._filtersById[filteredCollection._fcid];
    this._filters = util.values(this._filtersById);
  },

  // return a filtered collection containing models based on the passed in
  // filter function. If a collectionClass is passed as the second argument
  // then the resulting collection will be based on that class.
  //
  // filteredCollections are automatically updated as data is
  // added/removed/modified in the parent collection.
  getCollectionByFilter: function(filter, collectionClass) {
    // lazily initialize the filteredCollection capabilities the first time
    // a filter is requested
    if (!this._filterableCollectionInitialized) {
      this._initializeFilterableCollection();
    }

    var filteredCollection = new (collectionClass || Collection)();
    // we give each filteredCollection a unique id so they can easily
    // be cleaned up.
    filteredCollection._fcid = _fcid++;
    var _this = this;
    filteredCollection.destroy = function() {
      _this.destroyFilteredCollection(filteredCollection);
    };

    // if the parent collection is sorted and the new child collection
    // does not declare a comparator, inherit the comparator from the
    // parent collection.
    if (this.comparator && !filteredCollection.comparator) {
      filteredCollection.comparator = this.comparator;
    }

    // execute the filter over the models and set the filteredCollection to
    // include the initial set
    var models = this.filter(filter);
    filteredCollection.replace(models, true);

    // filters are maintained in a hash for random access while removing. The
    // filters are iterated by the processFilterEvent method to handle each
    // received event.
    this._filtersById[filteredCollection._fcid] = {
      filterFunction: filter,
      filteredCollection: filteredCollection
    };
    this._filters = util.values(this._filtersById);

    return filteredCollection;
  },

  // getFilteredCollectionByProperty sugars the process of creating a filter
  // function so that you can think of it terms of getting all items with a
  // certain property value into a collection
  //
  // e.g.
  // pool.getCollectionByProperty('thread_id', 1234);
  //
  // returns an automatically maintained collection of all items with thread_id
  // 1234
  getCollectionByProperty: function(property, value, collectionClass) {
    var filter = function(model) {
      return model.get(property) === value;
    };
    return this.getCollectionByFilter(filter, collectionClass);
  },

  // processFilterEvent is the single listener that handles moving models
  // into and out of child filtered sets based on the return value of each
  // filter
  processFilterEvent: function(eventSig, eventData) {
    switch (eventSig) {
      case 'updated':
        this.processUpdateEvent(eventData);
        break;
      case 'modelChanged':
        this.processModelChangedEvent(eventData);
        break;
      case 'modelRemoved':
        this.processModelRemovedEvent(eventData);
        break;
      case 'modelAdded':
        this.processModelAddedEvent(eventData);
        break;
      default: break;
    }
  },

  // handle an update event -- recreate all filteredCollections
  processUpdateEvent: function(eventData) {
    var filter, filterFunction, filteredCollection;
    for (var i = 0, len = this._filters.length; i < len; i++) {
      filter = this._filters[i];
      filterFunction = filter.filterFunction;
      filteredCollection = filter.filteredCollection;
      var models = this.filter(filterFunction);
      filteredCollection.replace(models);
    }
  },

  // handle a change event -- add the model to any matching collections
  //                       -- remove the model from any non matching collections
  processModelChangedEvent: function(eventData) {
    var filter, filterFunction, filteredCollection,
        model = eventData.model, matches;
    for (var i = 0, len = this._filters.length; i < len; i++) {
      filter = this._filters[i];
      filterFunction = filter.filterFunction;
      filteredCollection = filter.filteredCollection;

      // does the model in question match this filter
      matches = filterFunction(model);

      // add the model if it matches: (noop if it's already there)
      if (matches) {
        filteredCollection.add(model);
      } else {
        // remove the model if it doesn't match (noop if it's not there)
        filteredCollection.remove(model);
      }
    }
  },

  // handle a remove event -- remove the model from all filtered collections
  processModelRemovedEvent: function(eventData) {
    var filter, filterFunction, filteredCollection,
        model = eventData.model, matches;
    for (var i = 0, len = this._filters.length; i < len; i++) {
      filter = this._filters[i];
      filterFunction = filter.filterFunction;
      filteredCollection = filter.filteredCollection;
      filteredCollection.remove(model);
    }
  },

  // handle an add event -- add the model to any matching filtered collections
  processModelAddedEvent: function(eventData) {
    var filter, filterFunction, filteredCollection,
        model = eventData.model, matches;
    for (var i = 0, len = this._filters.length; i < len; i++) {
      filter = this._filters[i];
      filterFunction = filter.filterFunction;
      filteredCollection = filter.filteredCollection;

      // does the model in question match this filter
      matches = filterFunction(model);

      // add the model if it matches: (noop if it's already there)
      if (matches) {
        filteredCollection.add(model);
      }
    }
  },

  // set up the hash for storing filters and add a listener to the parent
  // collection to allow routing of events to the sub collections
  _initializeFilterableCollection: function() {
    this._filtersById = {};
    this._filters = [];
    this._filterableCollectionInitialized = true;
    this.listen('all', util.bind(this.processFilterEvent, this));
  }

};

}});
require.define({'model': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/model.js */
var util = require('util');
var core = require('javelin/core');
var Events = require('mixins/events').Events;

/**
 * Models provide observable sets of properties that you can use to model
 * your domain logic.
 *
 * The Model class was inspired by and borrows heavily from backbone.js
 * http://documentcloud.github.com/backbone/
 */
var Model = core.createClass({
  name: 'Model',

  mixins: [Events],

  /**
   * Create a new model
   */
  construct: function(data) {
    this._properties = {};
    this.setAll(data);
    this.cid = this.__id__;
  },

  members: {

    /**
     * get a property of the of model
     */
    get: function(key) {
      return this._properties[key];
    },

    /**
     * set a property of the model
     * optionally pass quiet parameter to avoid
     * invoke changed event
     *
     * @return false if there is no change; or an object for changeset
     */
    set: function(key, value, quiet) {
      var prev = this._properties[key];
      if (!util.isEqual(prev, value)) {
        this._properties[key] = value;
        if (key === 'id') {
          // TODO:wbailey depending on how we decide to handle id changes
          //              we may want to fire an additional event here
          //              if we can always send the client id up when syncing
          //              then this is not necessary.
          this.id = value;
        }
        var change = {};
        change[key] = prev;
        if (!quiet) {
          this.invoke('changed', {model: this, changedProperties: change});
        }
        return change;
      }
      return false;
    },

    /**
     * unset a property of the model
     * optionally pass quiet parameter to avoid
     * invoke changed event
     *
     * @return false if not changed, the change set object if changed.
     */
    unset: function(key, quiet) {
      var prev = this._properties[key];

      // The following block is similar to set(key, null), while the
      // key difference is that we are checking prev not defined and prev
      // not equal to null. see unittest of testModel with the case of
      // 'unset an undefined property'
      if (prev !== undefined && prev !== null) {
        this._properties[key] = null;
        var change = {};
        change[key] = prev;
        if (!quiet) {
          this.invoke('changed', {changedProperties: change});
        }
        return change;
      }
      return false;
    },

    /**
     * set multiple properties in one call
     * takes an optional quiet flag avoid invoking
     * changed event
     */
    /** UNSET PROPERTIES that are not defined **/
    setAll: function(obj, quiet) {
      var changedProperties = {};
      // use a for loop instead of forEach
      util.forEach(obj, function(value, key) {
        var changed = this.set(key, value, true);
        if (changed) {
          changedProperties = util.extend(changedProperties, changed);
        }
      }, this);
      if (!util.isEmpty(changedProperties)) {
        if (!quiet) {
          this.invoke('changed', {changedProperties: changedProperties});
        }
        return changedProperties;
      }
      return false;
    },

    /**
     * merge a set of properties of the model -- this is similar to setAll,
     * while the merge action would not overwrite
     *
     * Default to be a setAll, OK to override in inheritance
     *
     * @return false if not changed, the change set object if changed.
     */
    merge: function(object, quiet) {
      return this.setAll(object, quiet);
    },

    /**
     * Function to be overridden to provide validity checks for
     * model values
     */
    isValid: function(key) {
      return true;
    },

    /**
     * iterate over each data property of the model
     */
    eachProperty: function(func, context) {
      util.each(this._properties, func, context);
    },

    /**
     * get the data properties of an object
     */
    toObject: function() {
      return util.extend({}, this._properties);
    }

  }
});


exports.Model = Model;

}});
require.define({'util': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/util.js */
module.exports = exports = require('_');
var JX = require('JX');

exports.$A = JX.$A;
exports.$AX = JX.$AX;

var createTransformer = function(prefix) {
  var names = {};
  return function(name) {
    if (!names[name]) {
      names[name] = prefix + name.charAt(0).toUpperCase() + name.substr(1);
    }
    return names[name];
  };
};

exports.setter = createTransformer('set');
exports.getter = createTransformer('get');
exports.eventHandler = createTransformer('on');

exports.hasClass = function(node, classStr) {
  return (" " + node.className + " ").indexOf(" " + classStr + " ") >= 0;
};

var stringTransform = function(str, separator) {
  var out = [];
  for (var i = 0; i < str.length; i++) {
    var chr = str.charAt(i);
    if (chr.match(/[A-Z]/) && i > 0) {
      out.push(separator, chr.toLowerCase());
    } else if (chr.match(/[_.\s]/)) {
      out.push(separator);
    } else {
      out.push(chr.toLowerCase());
    }
  }
  return out.join('');
};

exports.hyphenate = function(str) {
  return stringTransform(str, '-');
};

exports.underscore = function(str) {
  return stringTransform(str, '_');
};

// Copy the onload functionality from Javelin
// This function accepts a function, which is invoked when the
// page is loaded.  If onload is called after the page has
// completed loading, the passed function is invoked immediately.
exports.onload = JX.onload;

exports._getProp = function(/*Array*/parts, /*Boolean*/create, /*Object*/context){
  var obj = context || window;
  for(var i = 0, p; obj && (p = parts[i]); i++) {
   obj = (p in obj ? obj[p] : (create ? obj[p] = {} : undefined));
  }
  return obj; // mixed
}

exports.getObject = function(/*String*/name, /*Boolean?*/create, /*Object?*/context) {
  // summary:
  //    Get a property from a dot-separated string, such as "A.B.C"
  //  description:
  //    Useful for longer api chains where you have to test each object in
  //    the chain, or when you have an object reference in string format.
  //  name:
  //    Path to an property, in the form "A.B.C".
  //  create:
  //    Optional. Defaults to `false`. If `true`, Objects will be
  //    created at any point along the 'path' that is undefined.
  //  context:
  //    Optional. Object to use as root of path. Defaults to
  //    'dojo.global'. Null may be passed.
  return exports._getProp(name.split("."), create, context); // Object
}

exports.trim = String.prototype.trim ?
  function(str){ return str.trim(); } :
  function(str){ return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');};

exports.createStylesheet = function(code) {
  var style = document.createElement('style');
  document.getElementsByTagName('head')[0].appendChild(style);
  if (style.styleSheet) { //IE
    style.styleSheet.cssText = code;
  } else {
    style.appendChild(document.createTextNode(code));
  }
  return style;
};

}});
require.define({'validate': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/validate.js */


// summary: Validates any sort of number based format
//
// description:
//    Validates any sort of number based format. Use it for phone numbers,
//    social security numbers, zip-codes, etc. The value can be validated
//    against one format or one of multiple formats.
//
// Format Definition
// |   #        Stands for a digit, 0-9.
// |   ?        Stands for an optional digit, 0-9 or nothing.
//    All other characters must appear literally in the expression.
//
// example:
// |  "(###) ###-####"       ->   (510) 542-9742
// |  "(###) ###-#### x#???" ->   (510) 542-9742 x153
// |  "###-##-####"          ->   506-82-1089       i.e. social security number
// |  "#####-####"           ->   98225-1649        i.e. zip code
//
// value: A string
//
// flags: Object?
// format: String
//
//    flags.format  A string or an Array of strings for multiple formats.
//
// example:
// | // returns true:
// | isNumberFormat("123-45", { format:"###-##" });
//
// example:
//   Check Multiple formats:
// | isNumberFormat("123-45", {
// |  format:["### ##","###-##","## ###"]
// | });
function isNumberFormat(value, flags) {
  var re = new RegExp("^" + numberFormat(flags) + "$", "i");
  return re.test(value); // Boolean
}

// summary: Builds a regular expression to match any sort of number based format
// description:
//  Use this method for phone numbers, social security numbers, zip-codes, etc.
//  The RE can match one format or one of multiple formats.
//
//  Format
//    #        Stands for a digit, 0-9.
//    ?        Stands for an optional digit, 0-9 or nothing.
//    All other characters must appear literally in the expression.
//
//  Example
//    "(###) ###-####"       ->   (510) 542-9742
//    "(###) ###-#### x#???" ->   (510) 542-9742 x153
//    "###-##-####"          ->   506-82-1089       i.e. social security number
//    "#####-####"           ->   98225-1649        i.e. zip code
//
// flags:  An object
//    flags.format  A string or an Array of strings for multiple formats.
function numberFormat(flags) {
  // assign default values to missing paramters
  flags = (typeof flags == "object") ? flags : {};
  if(typeof flags.format == "undefined"){
    flags.format = "###-###-####";
  }

  // Converts a number format to RE.
  var digitRE = function(format){
  // escape all special characters, except '?'
    return escapeString(format, "?")
      // Now replace '?' with Regular Expression
      .replace(/\?/g, "\\d?")
      // replace # with Regular Expression
      .replace(/#/g, "\\d");
  };

   // build RE for multiple number formats
  return buildGroupRE(flags.format, digitRE); //String
}

function escapeString(/*String*/str, /*String?*/except) {
  //  summary:
  //    Adds escape sequences for special characters in regular expressions
  // except:
  //    a String with special characters to be left unescaped

  return str.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, function(ch){
    if(except && except.indexOf(ch) != -1){
      return ch;
    }
    return "\\" + ch;
  }); // String
};

function buildGroupRE(/*Object|Array*/arr, /*Function*/re, /*Boolean?*/nonCapture){
  //  summary:
  //    Builds a regular expression that groups subexpressions
  //  description:
  //    A utility function used by some of the RE generators. The
  //    subexpressions are constructed by the function, re, in the second
  //    parameter.  re builds one subexpression for each elem in the array
  //    a, in the first parameter. Returns a string for a regular
  //    expression that groups all the subexpressions.
  // arr:
  //    A single value or an array of values.
  // re:
  //    A function. Takes one parameter and converts it to a regular
  //    expression.
  // nonCapture:
  //    If true, uses non-capturing match, otherwise matches are retained
  //    by regular expression. Defaults to false

  // case 1: a is a single value.
  if(!(arr instanceof Array)){
    return re(arr); // String
  }

  // case 2: a is an array
  var b = [];
  for(var i = 0; i < arr.length; i++){
    // convert each elem to a RE
    b.push(re(arr[i]));
  }

   // join the REs as alternatives in a RE group.
  return group(b.join("|"), nonCapture); // String
};

function group(/*String*/expression, /*Boolean?*/nonCapture){
  // summary:
  //    adds group match to expression
  // nonCapture:
  //    If true, uses non-capturing match, otherwise matches are retained
  //    by regular expression.
  return "(" + (nonCapture ? "?:":"") + expression + ")"; // String
};

var domainLabelRE = "(?:[\\da-zA-Z](?:[-\\da-zA-Z]{0,61}[\\da-zA-Z])?)";
var domainNameRE = "(?:[a-zA-Z](?:[-\\da-zA-Z]{0,6}[\\da-zA-Z])?)";
var hostRE = "((?:" + domainLabelRE + "\\.)+" + domainNameRE + "\\.?)";
var usernameRE = "([!#-'*+\\-\\/-9=?A-Z^-~]+[.])*[!#-'*+\\-\\/-9=?A-Z^-~]+";
var emailAddressRE = usernameRE + "@" + hostRE;
var protocolRE = buildGroupRE(
  [true, false],
  function(q){ if(q){ return "(https?|ftps?)\\://"; } return ""; });
var pathRE = "(/(?:[^?#\\s/]+/)*(?:[^?#\\s/]+(?:\\?[^?#\\s/]*)?(?:#[A-Za-z][\\w.:-]*)?)?)?";


var emailAddressRegex;
var urlRegex;

exports.isEmail = function(value) {
  // Lazily create the email regex
  return (
    emailAddressRegex ||
    (emailAddressRegex = new RegExp("^" + emailAddressRE + "$", "i"))).test(value);
}

exports.isZipCode = function(value) {
  return isNumberFormat(value,   {
      format: [
        "#####-####",
        "##### ####",
        "#########",
        "#####"
      ]
  });
}

exports.isUSPhone = function(value) {
  return isNumberFormat(value,     {
    format: [
      "###-###-####",
      "(###) ###-####",
      "(###) ### ####",
      "###.###.####",
      "###/###-####",
      "### ### ####",
      "###-###-#### x#???",
      "(###) ###-#### x#???",
      "(###) ### #### x#???",
      "###.###.#### x#???",
      "###/###-#### x#???",
      "### ### #### x#???",
      "##########"
    ]
  });
}

exports.isUrl = function(value) {
  return (
    urlRegex ||
    (urlRegex = new RegExp("^" + (protocolRE + hostRE + pathRE) + "$", "i"))).test(value);
}
}});
require.define({'view': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/lib/view.js */
var util     = require('util');
var core     = require('javelin/core');
var stratcom = require('javelin/stratcom');
var dom      = require('javelin/dom');
var builder  = require('builder');
var JX       = require('JX');

var Binding = require('binding').Binding;

// is view running in a touchable device
var hasTouch = exports.hasTouch = 'ontouchstart' in window;

// map of touch events or mouse equivalents for testing in browser or device
var touchEvents = exports.touchEvents = {
  TOUCHSTART: hasTouch ? 'touchstart' : 'mousedown',
  TOUCHEND: hasTouch ? 'touchend' : 'mouseup',
  TOUCHMOVE: hasTouch ? 'touchmove' : 'mousemove'
};


var id = 1;

var domEvents = [
  "click", "mouseover", "mouseout", "mousedown", "mouseup",
  "keypress", "keydown", "keyup", "focus", "blur", "change",
  "mousemove", "touchstart", "touchend", "touchmove", "touchcancel"
];
var domEventsStr = ' ' + domEvents.join(' ') + ' ';

var touched;
var touchLimit = 30;
var touchRemovalQueue = [];

// Listen for mousedown and mouseup events on elemtents with the
// sigil 'touchable', and add/remove the class 'touched'

stratcom.listen([touchEvents.TOUCHSTART], 'touchable', function(evt) {
  var rawEvt = evt.getRawEvent();
  if (!rawEvt.button) {
    rawEvt = rawEvt.touches ? rawEvt.touches[0] : rawEvt;
    var target = evt.getNodes().touchable;
    if (touched) {
      // Cancel the previous touched event
      scheduleRemoveTouchable(target);
    }
    touched = {
      x: rawEvt.pageX,
      y: rawEvt.pageY,
      target: target
    };

    dom.alterClass(target, 'touched', true);
  }
});

stratcom.listen([touchEvents.TOUCHMOVE], 'touchable', function(evt) {
  if (touched) {
    var rawEvt = evt.getRawEvent();
    rawEvt = rawEvt.touches ? rawEvt.touches[0] : rawEvt;
    var xDiff = touched.x - rawEvt.pageX;
    var yDiff = touched.y - rawEvt.pageY;
    if (Math.sqrt(
        (xDiff * xDiff) +
        (yDiff * yDiff)) > touchLimit) {
      scheduleRemoveTouchable(touched.target);
    }
  }
});

stratcom.listen([touchEvents.TOUCHEND, 'mouseout'], 'touchable', function(evt) {
  touched = null;
  scheduleRemoveTouchable(evt.getNodes().touchable);
});


function scheduleRemoveTouchable(node) {
  touchRemovalQueue.push(node);
  setTimeout(removeTouchable, 20);
}

function removeTouchable() {
  while (touchRemovalQueue.length) {
      dom.alterClass(touchRemovalQueue.shift(), 'touched', false);
  }
}

function createClass(junk) {
  junk.extend = junk.extend || View;
  junk.members = junk.members || {};
  console.log('view.createClass is deprecated: please fix ' + junk.name);
  var Class = core.createClass(junk);
  return Class;
}

function setThisOwner(viewSpec) {
  viewSpec.owner = viewSpec.owner || this;
}

// PRESETUP_OPTIONS are always handled in order before any of the other
// options are processed in the setup method
var PRESETUP_OPTIONS = [
  // owner is used in various places during the setup process so we
  // guarantee that it is always set before any other options.
  'owner',
  // childViews is always handled first. This means that we setup the
  // hierarchy recursively depth first. This is important because it
  // allows the full hierarchy of refs to be defined before any potential
  // delegate properties are setup which might need to reference a child.
  'childViews'
];

var View = core.createClass({

  name: 'View',

  // Override declare in your subclasses to provide default options for your
  // specific View. This actually removes the need for a custom render
  // function, since childViews are just another part of setup. Views that
  // render in the old way will still work for backwards compatibility.
  //
  //   declaring a custom view can now be as simple as this:
  //   createClass({
  //     name: 'CustomView',
  //     extend: View,
  //     declare: {
  //       color: 'red'
  //       childViews: [
  //         {content: 'foo'}
  //       ]
  //     }
  //   }
  //
  // NOTE: wbailey 5-10-2011
  // The way we are do setLayout inside of render obscures what is
  // actually happening. The setChildViews setter at each level of the
  // hierarchy actually does the recursion. Thus a cleaner api is to just let
  // this happen during setup and provide a way to *declare* overridable default
  // options.
  declare: function() {return {};},

  construct: function(options) {

    // the options for the view are now derived by extending a shallow copy
    // of the the *declared* options on the prototype. This allows you to
    // specify any property of the parent in the declare block and optionally
    // override it with options passed to the constructor.
    var declOptions = util.clone(this.declare(options));

    // Set the owner of each of the childViews to default to this View
    if (declOptions.childViews) {
      util.forEach(declOptions.childViews, setThisOwner, this);
    }

    this.options = util.extend(declOptions, options || {});

    // set owner to the current view if not specified this will be setup by
    // the builder usually.
    this.options.owner = this.options.owner || this;

    this._modes = {};
    this._tokens = {};
    this.refs = {};

    // create the node container for the view
    this.createDom(this.options);

    // NOTE: wbailey 5-10-2011
    // Going forward render is not really necessary since we have declare and
    // setup. Moving render out of the view init process would help us
    // transition render into a method that actually generates output and let
    // setup merely transform and cache the properties. Per our discussion,
    // we could then have a variety of render serializers for DOM or innerHTML
    // based rendering.
    this.render(this.options);

    // setup is where all the work really happens. Setup iterates over the
    // options hash and recursively generates views based on passed in childView
    // properties.
    this.setup(this.options);

    // hook to setup any post construct handlers
    this.ready && this.ready();
    stratcom.mergeData(0, {});
  },

  properties: {
    node: null,
    width: null,
    height: null,
    tagName: 'div',
    parentView: null,
    owner: null,
    model: null,
    boxOrientation: null,
    flex: null,
    metadata: null
  },

  // Set up the delegated properties.  A property that is just a string sets up
  // a setter and getter with that name on the parent widget, e.g. the
  // property of 'label' delegated to 'node' will set up a setLabel and getLabel
  // function that looks for either this.node or a referenced child widget in
  // this.refs['node'], then sets and gets the label on it.
  // A property that is a JSON object, with both an 'alias' and 'name'
  // member works slightly differently.  A getter and setter for the alias
  // are added to the parent widget, but these functions look for the 'name'
  // in the child property.  E.g. a property {alias: 'label', name: 'innerHTML'}
  // delegated to 'node' would create the functions 'getLabel' and 'setLabel'
  // on the parent view, but would get and set the 'innerHTML' property of
  // 'node'
  delegateProperties: {
    node: [
      'className',
      'id',
      'innerHTML',
      'tabIndex',
      'title',
      'href',
      'src',
      'type',
      'target',
      'rows',
      'cols',
      'data-ref',
      'cellspacing',
      'cellpadding',
      {alias: 'content', name: 'innerHTML'}
    ]
  },

  members: {
    /**
     * specify if the view should get a NOP css-3d transform to
     * enable rendering on the GPU
     */
    wantsHardwareAcceleration: false,

    /**
     * configure view options
     */
    setup: function(options) {
      // the PRESETUP_OPTIONS [owner, childViews] are handled first to allow a
      // depth first recursion through the viewspec. This facilitates allowing
      // delegate properties to be invoked directly on the parent as the child
      // refs are already available by the time the delegate property is
      // invoked.
      for (var i = 0; i < PRESETUP_OPTIONS.length; i++) {
        var option = PRESETUP_OPTIONS[i];
        if (this.options.hasOwnProperty(option)) {
          this[util.setter(option)](this.options[option]);
        }
      }

      for (var key in this.options) {
        // skip the PRESETUP_OPTIONS since they already been handled
        if (PRESETUP_OPTIONS.indexOf(key) !== -1) {
          continue;
        }

        var setter = util.setter(key);
        var getter = util.getter(key);

        var val = this.options[key];
        // attach event handlers
        var events = ' ' + (this.getEvents() || []).join(' ') + ' ';

        // properties prefixed with 'on' where the suffix is included
        // in the events declaration will automatically define listeners
        if (key.indexOf('on') === 0 &&
          events.indexOf(' ' + key.substring(2) + ' ') > -1) {
          this.listen(key.substring(2), val);
        // otherwise we are dealing with a setter
        } else {
          // If a property is set to an object with a delegate key, it will
          // be assumed to be a delegate property.
          //
          // The value of the delegate key will be used as the property to bind
          // to on the parent. Since we now guarantee that childViews are setup
          // before any delegated property we don't need to immediately invoke
          // the setter. The setter will be called during the normal flow of
          // the setup process.
          //
          // example of a delegate property:
          //   declare: {
          //     foo: foo,
          //     childViews: [
          //       {
          //         ref 'bar',
          //         // foo on the outer class is passed to the inner class
          //         property: 'value',
          //         bar: {delegate: 'foo'}
          //       }
          //     ]
          //   }
          if (val && val.delegate) {
            var owner = this.getOwner(),
                filter = val.filter,
                ownerGetter = util.getter(val.delegate),
                ownerSetter = util.setter(val.delegate);
            // add the delegate getter to the owner class
            owner[ownerGetter] = util.bind(function() {
              return this[getter] && this[getter]();
            }, this);
            // add the delegate setter to the owner class
            owner[ownerSetter] = util.bind(function(value) {
              // filters allow you to transform the data prior to setting it
              // on the child view
              if (filter) {
                value = filter.call(this, value);
              }
              this[setter] && this[setter](value);
            }, this);
          } else {
            // create setters and getters if they dont exist already
            if (!this[setter]) {
              this[setter] = util.bind(this.setProperty, this, key);
            }
            if (!this[getter]) {
              this[getter] = util.bind(this.getProperty, this, key);
            }
            // in the default case we just invoke the setter on the childView.
            // This does not provide the persistent bridge between an external
            // owner setter method and the childView setter as the delegate
            // does; however, it is sufficient for cases where the data is not
            // dynamic.
            this[setter](val);
          }
        }
      }
    },

    /**
     * create the dom node for this view to render within
     * options
     *   - tagName: specify a tag name to use when creating the dom node
     *              other than the default div
     *   - wantsHardwareAcceleration: add a css class that requests gpu
     *                                rendering
     */
    createDom: function(options) {
      var node = this.getNode();
      if (node) {
        return node;
      }
      if (options.tagName) {
        this.setTagName(options.tagName);
      }
      this.setNode(dom.$N(this.getTagName()));

      node = this.getNode();
      // implement a method for onDocumentInsertion and the view will
      // automatically listen for and fire this event
      if (this.onDocumentInsertion) {
        node.addEventListener('DOMNodeInsertedIntoDocument',
          util.bind(this.onDocumentInsertion, this));
      }

      // this class adds a css 3d transform no-op that forces
      // the view into a new hardware gfx compositing layer
      if (this.wantsHardwareAcceleration) {
        this.addClass('bt-hwa');
      }

      // set a css class not the node
      if (this.klass.cssClass) {
        this.addClass(this.klass.cssClass);
      }
      return node;
    },


    /**
     * add additional classes to the node for this view
     */
    setAdditionalClasses: function(classes) {
      util.forEach(util.flatten([classes]), function(className) {
        this.addClass(className);
      }, this);
    },

    /**
     * override in subclasses to define the contents of your view
     */
    render: function(options) {
      // fill the node with content here
    },

    /**
     * set a sigil attribute on the view
     */
    setSigil: function(sigil) {
      this.getNode().setAttribute('data-sigil', sigil);
    },

    /**
     * get a sigil atribute from the view
     */
    getSigil: function() {
      return this.getNode.getAttribute('data-sigil');
    },

    /**
     * DATA BINDING
     */

    /**
     * TODO:wbailey revisit this
     */
    setBinding: function(model, options, defaultOptions) {
      this.setModel(model);
      this.removeBinding();
      this._binding = [];

      // Create multiple binding objects, one per property binding.
      // This creates a listener per binding.  It optimizes for the use
      // case where a widget will almost always have just one binding.
      // The alternative is to create a single binding that listens to
      // a single 'onChange' method on a view, then does a map lookup
      // for each view-to-model binding and executes it.  At runtime
      // this will be much less performant, hence this approach.
      var opt;
      if (!util.isArray(options)) {
        options = [options];
      }
      for (var i = 0; i < options.length; i++) {
        opt = util.extend({}, options[i]);
        if (defaultOptions) {
          opt = util.extend(defaultOptions, opt);
        }
        this._binding.push(new Binding(
          this, model, util.extend(this.getBindingOptions(), opt)));
      }
    },

    getBindingOptions: function() {
      return {};
    },

    /**
     * remove the view binding
     */
    removeBinding: function() {
      util.invoke(this._binding || [], 'destroy');
    },

    /*
     * set the data attribute on the DOM node
     */
    setMetadata: function(obj) {
      this.setProperty('metadata', obj);
      var node = this.getNode();
      for (var name in obj) {
        node.setAttribute('data-' + name, obj[name]);
      }
    },

    /**
     * LAYOUT PROPERTIES
     */

    /**
     * show the view
     */
    show: function(disp) {
      this.getNode().style.display = disp || 'block';
    },

    /**
     * hide the view
     */
    hide: function() {
      this.getNode().style.display = 'none';
    },

    /**
     * add a class to the view
     */
    addClass: function(className) {
      dom.alterClass(this.getNode(), className, true);
      return this;
    },

    /**
     * remove a class from the view
     */
    removeClass: function(className) {
      dom.alterClass(this.getNode(), className, false);
      return this;
    },

    // add a class if it is not present; remove it if it is
    toggleClass: function(className) {
      if (this.hasClass(className)) {
        this.removeClass(className);
      } else {
        this.addClass(className);
      }
    },

    hasClass: function(className) {
      var regex = new RegExp('\\b' + className + '\\b');
      return regex.test(this.getNode().className);
    },

    /**
     * apply a css class that is mutually exclusive with other classes
     * in a given set and save the state in an instance variable
     *
     * e.g.
     *
     * setMode('chocolate', 'flavor');
     * setMode('vanilla', 'flavor');
     * setMode('strawberry', 'flavor');
     * would toggle between chocolate-flavor, vanilla-flavor and
     * strawberry-flavor css classes and capture the value in this.modes.state.
     *
     * This is useful when you have a view that has various mutually exclusive
     * modes that can be transitioned through via a top level css class.
     */
    setMode: function(setting, mode) {
      this._modes[mode] = setting;
      var node = this.getNode(),
          classes = node.className.split(/\s/),
          newClasses = '',
          regexp = new RegExp('-' + mode + '$');
      for (var i = 0; i < classes.length; i++) {
        var cssClass = classes[i];
        if (!regexp.test(classes[i])) {
          newClasses += ' ' + cssClass;
        }
      }
      newClasses += ' ' + setting + '-' + mode;
      node.className = newClasses;
    },

    /**
     * get a mode value from the cache
     */
    getMode: function(mode) {
      return this._modes[mode];
    },

    /**
     * sets flexbox orientation onto the view
     * @param {String} orientation - vertical/horizontal
     *                 the flexbox orientation to use
     */
    setBoxOrientation: function(orientation) {
      this.setProperty('boxOrientation', orientation);
      this.addClass('bt-webkit-box');
      this.setStyle({'webkitBoxOrient': orientation});
    },

    /**
     * set the box flex for a box child view
     */
    setFlex: function(flex) {
      this.setProperty('flex', flex);
      this.setStyle({
        '-webkit-box-flex': flex
      });
    },

    /**
     * set an error state class on the node
     */
    setErrorState: function(key, isError) {
      dom.alterClass(this.getNode(), 'bt-error', isError);
    },

    /**
     * set the height of the view
     */
    setHeight: function(height) {
      this.setProperty('height', height);
      this.getNode().style.height = height;
    },

    /**
     * set the width of the view
     */
    setWidth: function(width) {
      this.setProperty('width', width);
      this.getNode().style.width = width;
    },

    /**
     * build a layout from a layout spec with the specified owner
     */
    build: function(config, owner) {
      return builder.build(config, owner || this);
    },

    /**
     * build and append a layout
     */
    setLayout: function(layout, owner) {
      this.append(this.build(layout, owner));
    },

    /**
     * get the bounding rect for the view
     */
    getRect: function() {
      return this.getNode().getBoundingClientRect();
    },

    /**
     * apply a set of styles to the view
     */
    setStyle: function(styles) {
      var styleObj = this.getNode().style;
      if (typeof(styles) == 'string') {
        styleObj.cssText += ';' + styles;
      } else {
        for (var name in styles) {
          styleObj[name] = styles[name];
        }
      }
    },

    /**
     * REFERENCES
     */

    /**
     * get the reference for this view
     */
    getRef: function() {
      return this._ref;
    },

    /**
     * set the reference for the view
     */
    setRef: function(ref) {
      var owner = this.getOwner();
      if (owner) {
        owner.refs = owner.refs || {};
        owner.refs[ref] = this;
      }
      this._ref = ref;
      var node = this.getNode();
      node.setAttribute('data-ref', this._ref);
    },

    /**
     * find a reference within the views hierarchy
     */
    findRef: function(ref) {
      if (this.refs) {
        return this.refs[ref];
      }
      return null;
    },

    /**
     * remove a reference
     */
    removeRef: function(ref) {
      if (this.refs) {
        delete this.refs[ref];
      }
    },

    /**
     * given a javelin event, find the nearest relevant ref
     */
    refForEvent: function(evt) {
      var target = evt.getTarget();
      return this.findContainingRef(target);
    },

    /**
     * find the nearest ref for a given node
     * this is useful for event handling
     */
    findContainingRef: function(node) {
      var touchedButton = null;
      while (node !== this.getNode()) {
        var ref = node.getAttribute('data-ref');
        if (ref && this.refs && this.refs[ref]) {
          return this.refs[ref];
        }
        node = node.parentNode;
      }
      return false;
    },

    /**
     * walk up the dom tree to a parent with the specified class
     */
    findPathToParentWithClass: function(node, className) {
      var touchedButton = null;
      var regex = new RegExp('\\b' + className + '\\b');
      var path = [];
      while (node.parentNode && node.parentNode != this.getNode()) {
        path.push(node);
        if (regex.test(node.className)) {
          return path;
        }
        node = node.parentNode;
      }
      return false;
    },

    /**
     * insert the view into a node at the requested position
     */
    placeIn: function(node, position) {
      position = position || 'append';
      var n = this.getNode();
      switch (position) {
        case 'append':
          node.appendChild(n);
          break;
        case 'before':
          node.parentNode.insertBefore(n, node);
          break;
        case 'prepend':
          node.insertBefore(n, node.firstChild);
          break;
        default:
          throw "Invalid node placement: " + position;
      }
      return this;
    },

    /**
     * remove the view from the dom without destroying it
     */
    remove: function() {
      dom.remove(this.getNode());
    },

    /**
     * destroy a view
     *  - removes child views
     *  - removes listeners
     *  - cleans up references
     */
    destroy: function() {
      util.invoke(this.getChildViews(), 'destroy');
      util.invoke(this._tokens, 'remove');
      var owner = this.getOwner();
      var ref = this.getRef();
      if (owner && ref && owner.removeRef) {
        owner.removeRef(ref);
      }
      this.remove();
      this.isDestroyed = true;
    },

    /**
     * CHILD VIEWS
     */

    getChildViews: function() {
      var childViews = this.getProperty('childViews');
      if (!childViews) {
        childViews = [];
        this.setProperty('childViews', childViews);
      }
      return childViews;
    },

    setChildViews: function(childViews) {
      util.forEach(this.getChildViews(), this.removeChild, this);
      util.forEach(builder.build(childViews, this.getOwner()), this.appendChild, this);
    },

    removeChild: function(child) {
      this._setParent(child, null);
      this.setProperty('childViews', util.without(this.getChildViews(), child));
      child.destroy();
      this.__childrenChanged();
      return this;
    },

    append: function(arg) {
      if (util.isArray(arg)) {
        util.forEach(arg, this.appendChild, this);
      }
      else {
        this.appendChild(arg);
      }
    },

    appendChild: function(child) {
      this.getChildViews().push(child);
      this._setParent(child, this);
      this.__appendChildNode(child);
      this.__childrenChanged();
      return this;
    },

    prependChild: function(child) {
      this.insertChild(child, 0);
    },

    clearChildren: function() {
      util.invoke(this.getChildViews(), 'destroy');
      this.setChildViews([]);
      this.__childrenChanged();
    },

    // protected
    __appendChildNode: function(child) {
      this.getNode().appendChild(child.getNode());
    },

    insertChild: function(child, position) {
      var children = this.getChildViews();
      if (typeof position === 'undefined' || position === children.length) {
        this.appendChild(child);
      } else {
        position = Math.max(0, Math.min(children.length - 1, position));
        this._insertAt(child, position);
      }
      return this;
    },

    _insertAt: function(child, position) {
      var children = this.getChildViews();
      var beforeChild = children[position];
      children.splice(position, 0, child);
      this._setParent(child, this);
      this.__insertNodeBefore(child, beforeChild);
      this.__childrenChanged();
      return this;
    },

    // protected
    __insertNodeBefore: function(child, beforeChild) {
      this.getNode().insertBefore(child.getNode(), beforeChild.getNode());
    },

    // hook for descendants
    __childrenChanged: function() {
    },

    _setParent: function(child, parent) {
      child.setParentView(parent);
      // TODO: we need to make sure we understand how this is working fully
      //       Currently we are saying that changing the parent of a child view
      //       should not automatically update its owner. This allows you
      //       to pass in an owner to a subview in a hierarchy other than
      //       owner of the top level view in that hierarchy.
      if (!child.getOwner()) {
        child.setOwner(parent ? parent.getOwner() : null);
      }
    }
  },/* END MEMBERS */

  /**
   * modifications to the config object performed before the class is created
   */
  beforeCreateClass: function(junk) {
    /**
     * DELEGATE PROPERTIES SETUP
     */
    util.forEach(junk.delegateProperties, function(names, target) {
      util.forEach(names, function(name) {
        var getTarget = util.getter(target);

        // Support both simple string names and objects of the
        // form {alias: 'src name', name: 'target name'}, e.g.
        // {alias: 'content', name: 'innerHTML'}
        var setValue  = util.setter(name.name || name);
        var aliasSetValue  = util.setter(name.alias || name);
        var aliasGetValue  = util.getter(name.alias || name);
        var getValue  = util.getter(name.name || name);
        junk.members[aliasSetValue] = function(value) {

          // Support both getting a value directly from the refs
          // object created by the builder, and from a target with a
          // defined getter
          var obj = (this.refs ? this.refs[target] : null) || this[getTarget]();
          if (obj[setValue]) {
            obj[setValue](value);
          } else {
            if (value !== undefined) {
              obj[name.name || name] = value;
            }
          }
          return this;
        };

        junk.members[aliasGetValue] = function() {
          var obj = this.findRef(target) || this[getTarget]();
          return obj[getValue] ? obj[getValue]() : obj[name.name || name];
        };
      });
    });
    delete junk.delegateProperties;

    // Ensure that events are non-null.  This is for Javelin, as without
    // an events object a class is not given an invoke() or listen() method.
    // Hmpfh.
    var extend = junk.extend;
    var events;
    if (extend) {
      events = junk.events.concat(extend.prototype[util.getter('events')].call(this) || []);
    } else {
      events = domEvents.concat(junk.events || []);
    }
    junk.events = events;
    junk.members[util.getter('events')] = function() {
      return events;
    };

    return junk;
  },

  /**
   * modifications to the class after it is created
   */
  afterCreateClass: function(junk) {
    /**
     * AUTOMATIC CSS CLASS SETUP
     */

    var names = util.map(this.inheritanceChain, function(k) {
      return 'bt-' + util.hyphenate(k.klassName);
    }).reverse();
    this.cssClass = names.join(' ');


    var getIdForEvent = function(type) {
      if (domEventsStr.indexOf(' ' + type + ' ') < 0 ) {
        return 'obj:' + type;
      } else {
        return type;
      }
    };

    var getPathForEvent = function(type) {
      if (domEventsStr.indexOf(' ' + type + ' ') < 0 ) {
        return this.__id__;
      } else {
        return ['id:' + dom.uniqID(this.getNode())];
      }
    };

    /**
     * LISTEN OVERRIDE
     *
     * Supports two different types for the callback parameter.
     * - String, the name of a function on the owner of this view, e.g.
     *   view.listen('click', 'handleClick')
     * - Function, a normal JavaScript function
     *   e.g. view.listen('click', function(event){})
     */
    this.prototype.listen = function(type, callback) {
      if (!util.isArray(type)) {
        type = [type];
      }
      var path;
      if (typeof callback == "string") {
        var owner = this.getOwner();
        callback = util.bind(owner[callback], owner);
      } else {
        callback = util.bind(callback, this);
      }

      var token = stratcom.listen(
        util.map(type, getIdForEvent, this),
        path || util.map(type, getPathForEvent, this),
        callback);
      var originalRemove = token.remove;
      var tokens = this._tokens;
      token.id = id++;
      token.remove = function() {
        delete tokens[token.id];
        return originalRemove.call(this);
      };
      tokens[token.id] = token;
      return token;
    };
    // add to the export
    exports[this.klassName] = this;
  }
});


exports.View = View;
exports.Container = View; // Backwards compatibility
exports.createClass = createClass;

}});
require.define({'_': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/node_modules/underscore/underscore.js */
//     Underscore.js 1.1.6
//     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **CommonJS**, with backwards-compatibility
  // for the old `require()` API. If we're not in CommonJS, add `_` to the
  // global object.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _;
    _._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.1.6';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects implementing `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (_.isNumber(obj.length)) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = memo !== void 0;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial && index === 0) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError("Reduce of empty array with no initial value");
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
    return _.reduce(reversed, iterator, memo, context);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result = iterator.call(context, value, index, list)) return breaker;
    });
    return result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    any(obj, function(value) {
      if (found = value === target) return true;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (method.call ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return iterable;
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Get the last element of an array.
  _.last = function(array) {
    return array[array.length - 1];
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(_.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    var values = slice.call(arguments, 1);
    return _.filter(array, function(value){ return !_.include(values, value); });
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted) {
    return _.reduce(array, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) memo[memo.length] = el;
      return memo;
    }, []);
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  };


  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function(func, obj) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(obj, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Internal function used to implement `_.throttle` and `_.debounce`.
  var limit = function(func, wait, debounce) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        timeout = null;
        func.apply(context, args);
      };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    return limit(func, wait, false);
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    return limit(func, wait, true);
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = slice.call(arguments);
    return function() {
      var args = slice.call(arguments);
      for (var i=funcs.length-1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };


  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    return _.filter(_.keys(obj), function(key){ return _.isFunction(obj[key]); }).sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (source[prop] !== void 0) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    // Check object identity.
    if (a === b) return true;
    // Different types?
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // Basic equality test (watch out for coercions).
    if (a == b) return true;
    // One is falsy and the other truthy.
    if ((!a && b) || (a && !b)) return false;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // One of them implements an isEqual()?
    if (a.isEqual) return a.isEqual(b);
    // Check dates' integer values.
    if (_.isDate(a) && _.isDate(b)) return a.getTime() === b.getTime();
    // Both are NaN?
    if (_.isNaN(a) && _.isNaN(b)) return false;
    // Compare regular expressions.
    if (_.isRegExp(a) && _.isRegExp(b))
      return a.source     === b.source &&
             a.global     === b.global &&
             a.ignoreCase === b.ignoreCase &&
             a.multiline  === b.multiline;
    // If a is not an object by this point, we can't handle it.
    if (atype !== 'object') return false;
    // Check for different array lengths before comparing contents.
    if (a.length && (a.length !== b.length)) return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // Recursive comparison of contents.
    for (var key in a) if (!(key in b) || !_.isEqual(a[key], b[key])) return false;
    return true;
  };

  // Is a given array or object empty?
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
  };

  // Is a given value a function?
  _.isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
  };

  // Is the given value `NaN`? `NaN` happens to be the only value in JavaScript
  // that does not equal itself.
  _.isNaN = function(obj) {
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false;
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      method.apply(this._wrapped, arguments);
      return result(this._wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

})();

}});
require.define({'JX': function(require, exports, module) {
__DEV__ = 0;
/* From: node_modules/bolt_core/node_modules/bolt-jx/JX.js */
/**
 * Javelin core; installs Javelin and Stratcom event delegation.
 *
 * @provides javelin-magical-init
 *
 * @javelin-installs JX.__rawEventQueue
 * @javelin-installs JX.__simulate
 * @javelin-installs JX.enableDispatch
 * @javelin-installs JX.onload
 *
 * @javelin
 */
if (window.JX) {
  JX.copy(exports, JX);
  return;
}
(function() {

  if (window.JX) {
    JX.copy(exports, JX);
    return;
  }

  window.JX = exports;

  // The holding queues hold calls to functions (JX.install() and JX.behavior())
  // before they load, so if you're async-loading them later in the document
  // the page will execute correctly regardless of the order resources arrive
  // in.

  var holding_queues = {};

  function makeHoldingQueue(name) {
    if (JX[name]) {
      return;
    }
    holding_queues[name] = [];
    JX[name] = function() { holding_queues[name].push(arguments); }
  }

  JX.flushHoldingQueue = function(name, fn) {
    for (var ii = 0; ii < holding_queues[name].length; ii++) {
      fn.apply(null, holding_queues[name][ii]);
    }
    holding_queues[name] = {};
  }

  makeHoldingQueue('install');
  makeHoldingQueue('behavior');
  makeHoldingQueue('install-init');

  window['__DEV__'] = window['__DEV__'] || 0;

  var loaded = false;
  var onload = [];
  var master_event_queue = [];
  var root = document.documentElement;
  var has_add_event_listener = !!root.addEventListener;

  JX.__rawEventQueue = function(what) {
    master_event_queue.push(what);

    // Evade static analysis - JX.Stratcom
    var Stratcom = JX['Stratcom'];
    if (Stratcom && Stratcom.ready) {
      //  Empty the queue now so that exceptions don't cause us to repeatedly
      //  try to handle events.
      var local_queue = master_event_queue;
      master_event_queue = [];
      for (var ii = 0; ii < local_queue.length; ++ii) {
        var evt = local_queue[ii];

        //  Sometimes IE gives us events which throw when ".type" is accessed;
        //  just ignore them since we can't meaningfully dispatch them. TODO:
        //  figure out where these are coming from.
        try { var test = evt.type; } catch (x) { continue; }

        if (!loaded && evt.type == 'domready') {
          document.body && (document.body.id = null);
          loaded = true;
          for (var ii = 0; ii < onload.length; ii++) {
            onload[ii]();
          }
        }

        Stratcom.dispatch(evt);
      }
    } else {
      var target = what.srcElement || what.target;
      if (target &&
          (what.type in {click: 1, submit: 1}) &&
          target.getAttribute &&
          target.getAttribute('data-mustcapture') === '1') {
        what.returnValue = false;
        what.preventDefault && what.preventDefault();
        document.body.id = 'event_capture';

        // For versions of IE that use attachEvent, the event object is somehow
        // stored globally by reference, and all the references we push to the
        // master_event_queue will always refer to the most recent event. We
        // work around this by popping the useless global event off the queue,
        // and pushing a clone of the event that was just fired using the IE's
        // proprietary createEventObject function.
        // see: http://msdn.microsoft.com/en-us/library/ms536390(v=vs.85).aspx
        if (!add_event_listener && document.createEventObject) {
          master_event_queue.pop();
          master_event_queue.push(document.createEventObject(what));
        }

        return false;
      }
    }
  }

  JX.enableDispatch = function(target, type) {
    if (__DEV__) {
      JX.__allowedEvents[type] = true;
    }

    if (target.addEventListener) {
      target.addEventListener(type, JX.__rawEventQueue, true);
    } else if (target.attachEvent) {
      target.attachEvent('on' + type, JX.__rawEventQueue);
    }
  };

  var document_events = [
    'click',
    'change',
    'keypress',
    'mousedown',
    'mouseover',
    'mouseout',
    'mouseup',
    'keyup',
    'keydown',
    'drop',
    'dragenter',
    'dragleave',
    'dragover',
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel'
  ];

  //  Simulate focus and blur in old versions of IE using focusin and focusout
  //  TODO: Document the gigantic IE mess here with focus/blur.
  //  TODO: beforeactivate/beforedeactivate?
  //  http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
  if (!has_add_event_listener) {
    document_events.push('focusin', 'focusout');
  }

  //  Opera is multilol: it propagates focus / blur odd, and submit differently
  if (window.opera) {
    document_events.push('focus', 'blur');
  } else {
    document_events.push('submit');
  }

  if (__DEV__) {
    JX.__allowedEvents = {};
    if ('onpagehide' in window) {
      JX.__allowedEvents.unload = true;
    }
  }

  for (var ii = 0; ii < document_events.length; ++ii) {
    JX.enableDispatch(root, document_events[ii]);
  }

  //  In particular, we're interested in capturing window focus/blur here so
  //  long polls can abort when the window is not focused.
  var window_events = [
    ('onpagehide' in window) ? 'pagehide' : 'unload',
    'resize',
    'focus',
    'blur'
  ];


  for (var ii = 0; ii < window_events.length; ++ii) {
    JX.enableDispatch(window, window_events[ii]);
  }

  JX.__simulate = function(node, event) {
    if (!has_add_event_listener) {
      var e = {target: node, type: event};
      JX.__rawEventQueue(e);
      if (e.returnValue === false) {
        return false;
      }
    }
  };

  if (has_add_event_listener) {
    document.addEventListener('DOMContentLoaded', function() {
      JX.__rawEventQueue({type: 'domready'});
    }, true);
  } else {
    var ready =
      "if (this.readyState == 'complete') {" +
        "JX.__rawEventQueue({type: 'domready'});" +
      "}";

    document.write(
      '<script' +
      ' defer="defer"' +
      ' src="javascript:void(0)"' +
      ' onreadystatechange="' + ready + '"' +
      '><\/sc' + 'ript\>');
  }

  JX.onload = function(func) {
    if (loaded) {
      func();
    } else {
      onload.push(func);
    }
  }
})();
/**
 * Javelin utility functions.
 *
 * @provides javelin-util
 *
 * @javelin-installs JX.$A
 * @javelin-installs JX.$AX
 * @javelin-installs JX.copy
 * @javelin-installs JX.bind
 * @javelin-installs JX.bag
 * @javelin-installs JX.keys
 * @javelin-installs JX.defer
 * @javelin-installs JX.log
 *
 * @javelin
 */

/**
 * Convert an array-like object (usually ##arguments##) into a real Array. An
 * "array-like object" is something with a ##length## property and numerical
 * keys. The most common use for this is to let you call Array functions on the
 * magical ##arguments## object.
 *
 *   JX.$A(arguments).slice(1);
 *
 * @param  obj     Array, or array-like object.
 * @return Array   Actual array.
 */
JX.$A = function(mysterious_arraylike_object) {
  // NOTE: This avoids the Array.slice() trick because some bizarre COM object
  // I dug up somewhere was freaking out when I tried to do it and it made me
  // very upset, so do not replace this with Array.slice() cleverness.
  var r = [];
  for (var ii = 0; ii < mysterious_arraylike_object.length; ii++) {
    r.push(mysterious_arraylike_object[ii]);
  }
  return r;
};


/**
 * Cast a value into an array, by wrapping scalars into singletons. If the
 * argument is an array, it is returned unmodified. If it is a scalar, an array
 * with a single element is returned. For example:
 *
 *   JX.$AX([3]); // Returns [3].
 *   JX.$AX(3);   // Returns [3].
 *
 * Note that this function uses an "instanceof Array" check so you may need to
 * convert array-like objects (such as ##arguments## and Array instances from
 * iframes) into real arrays with @{JX.$A()}.
 *
 * @param  wild    Scalar or Array.
 * @return Array   If the argument was a scalar, an Array with the argument as
 *                 its only element. Otherwise, the original Array.
 *
 */
JX.$AX = function(maybe_scalar) {
  return (maybe_scalar instanceof Array) ? maybe_scalar : [maybe_scalar];
};


/**
 * Copy properties from one object to another. Note: does not copy the
 * ##toString## property or anything else which isn't enumerable or is somehow
 * magic or just doesn't work. But it's usually what you want. If properties
 * already exist, they are overwritten.
 *
 *   var cat  = {
 *     ears: 'clean',
 *     paws: 'clean',
 *     nose: 'DIRTY OH NOES'
 *   };
 *   var more = {
 *     nose: 'clean',
 *     tail: 'clean'
 *   };
 *
 *   JX.copy(cat, more);
 *
 *   // cat is now:
 *   //  {
 *   //    ears: 'clean',
 *   //    paws: 'clean',
 *   //    nose: 'clean',
 *   //    tail: 'clean'
 *   //  }
 *
 * @param  obj Destination object, which properties should be copied to.
 * @param  obj Source object, which properties should be copied from.
 * @return obj Destination object.
 */
JX.copy = function(copy_dst, copy_src) {
  for (var k in copy_src) {
    copy_dst[k] = copy_src[k];
  }
  return copy_dst;
};


/**
 * Create a function which invokes another function with a bound context and
 * arguments (i.e., partial function application) when called; king of all
 * functions.
 *
 * Bind performs context binding (letting you select what the value of ##this##
 * will be when a function is invoked) and partial function application (letting
 * you create some function which calls another one with bound arguments).
 *
 * = Context Binding =
 *
 * Normally, when you call ##obj.method()##, the magic ##this## object will be
 * the ##obj## you invoked the method from. This can be undesirable when you
 * need to pass a callback to another function. For instance:
 *
 *   COUNTEREXAMPLE
 *   var dog = new JX.Dog();
 *   dog.barkNow(); // Makes the dog bark.
 *
 *   JX.Stratcom.listen('click', 'bark', dog.barkNow); // Does not work!
 *
 * This doesn't work because ##this## is ##window## when the function is
 * later invoked; @{JX.Stratcom.listen()} does not know about the context
 * object ##dog##. The solution is to pass a function with a bound context
 * object:
 *
 *   var dog = new JX.Dog();
 *   var bound_function = JX.bind(dog, dog.barkNow);
 *
 *   JX.Stratcom.listen('click', 'bark', bound_function);
 *
 * ##bound_function## is a function with ##dog## bound as ##this##; ##this##
 * will always be ##dog## when the function is called, no matter what
 * property chain it is invoked from.
 *
 * You can also pass ##null## as the context argument to implicitly bind
 * ##window##.
 *
 * = Partial Function Application =
 *
 * @{JX.bind()} also performs partial function application, which allows you
 * to bind one or more arguments to a function. For instance, if we have a
 * simple function which adds two numbers:
 *
 *   function add(a, b) { return a + b; }
 *   add(3, 4); // 7
 *
 * Suppose we want a new function, like this:
 *
 *   function add3(b) { return 3 + b; }
 *   add3(4); // 7
 *
 * Instead of doing this, we can define ##add3()## in terms of ##add()## by
 * binding the value ##3## to the ##a## argument:
 *
 *   var add3_bound = JX.bind(null, add, 3);
 *   add3_bound(4); // 7
 *
 * Zero or more arguments may be bound in this way. This is particularly useful
 * when using closures in a loop:
 *
 *   COUNTEREXAMPLE
 *   for (var ii = 0; ii < button_list.length; ii++) {
 *     button_list[ii].onclick = function() {
 *       JX.log('You clicked button number '+ii+'!'); // Fails!
 *     };
 *   }
 *
 * This doesn't work; all the buttons report the highest number when clicked.
 * This is because the local ##ii## is captured by the closure. Instead, bind
 * the current value of ##ii##:
 *
 *   var func = function(button_num) {
 *     JX.log('You clicked button number '+button_num+'!');
 *   }
 *   for (var ii = 0; ii < button_list.length; ii++) {
 *     button_list[ii].onclick = JX.bind(null, func, ii);
 *   }
 *
 * @param  obj|null  Context object to bind as ##this##.
 * @param  function  Function to bind context and arguments to.
 * @param  ...       Zero or more arguments to bind.
 * @return function  New function which invokes the original function with
 *                   bound context and arguments when called.
 */
JX.bind = function(context, func, more) {

  if (__DEV__) {
    if (typeof func != 'function') {
      throw new Error(
        'JX.bind(context, <yuck>, ...): '+
        'Attempting to bind something that is not a function.');
    }
  }

  var bound = JX.$A(arguments).slice(2);
  return function() {
    return func.apply(context || window, bound.concat(JX.$A(arguments)));
  }
};


/**
 * "Bag of holding"; function that does nothing. Primarily, it's used as a
 * placeholder when you want something to be callable but don't want it to
 * actually have an effect.
 *
 * @return void
 */
JX.bag = function() {
  // \o\ \o/ /o/ woo dance party
};


/**
 * Convert an object's keys into a list. For example:
 *
 *   JX.keys({sun: 1, moon: 1, stars: 1}); // Returns: ['sun', 'moon', 'stars']
 *
 * @param  obj    Object to retrieve keys from.
 * @return list   List of keys.
 */
JX.keys = function(obj) {
  var r = [];
  for (var k in obj) {
    r.push(k);
  }
  return r;
};


/**
 * Defer a function for later execution, similar to ##setTimeout()##. Returns
 * an object with a ##stop()## method, which cancels the deferred call.
 *
 *   var ref = JX.defer(yell, 3000); // Yell in 3 seconds.
 *   // ...
 *   ref.stop(); // Cancel the yell.
 *
 * @param function Function to invoke after the timeout.
 * @param int?     Timeout, in milliseconds. If this value is omitted, the
 *                 function will be invoked once control returns to the browser
 *                 event loop, as with ##setTimeout(func, 0)##.
 * @return obj     An object with a ##stop()## method, which cancels function
 *                 execution.
 */
JX.defer = function(func, timeout) {
  var t = setTimeout(func, timeout || 0);
  return {stop : function() { clearTimeout(t); }}
};

JX.id = function(any) {
  return any;
};

if (__DEV__) {
  if (!window.console || !window.console.log) {
    if (window.opera && window.opera.postError) {
      window.console = {log: function(m) { window.opera.postError(m); }};
    } else {
      window.console = {log: function(m) { }};
    }
  }

  /**
   * Print a message to the browser debugging console (like Firebug). This
   * method exists only in ##__DEV__##.
   *
   * @param  string Message to print to the browser debugging console.
   * @return void
   */
  JX.log = function(message) {
    window.console.log(message);
  }

  window.alert = (function(native_alert) {
    var recent_alerts = [];
    var in_alert = false;
    return function(msg) {
      if (in_alert) {
        JX.log(
          'alert(...): '+
          'discarded reentrant alert.');
        return;
      }
      in_alert = true;
      recent_alerts.push(new Date().getTime());

      if (recent_alerts.length > 3) {
        recent_alerts.splice(0, recent_alerts.length - 3);
      }

      if (recent_alerts.length >= 3 &&
          (recent_alerts[recent_alerts.length - 1] - recent_alerts[0]) < 5000) {
        if (confirm(msg + "\n\nLots of alert()s recently. Kill them?")) {
          window.alert = JX.bag;
        }
      } else {
        //  Note that we can't .apply() the IE6 version of this "function".
        native_alert(msg);
      }
      in_alert = false;
    }
  })(window.alert);

}
/**
 * @requires javelin-util
 * @provides javelin-install
 * @javelin-installs JX.install
 * @javelin
 */

/**
 * Install a class into the Javelin ("JX") namespace. The first argument is the
 * name of the class you want to install, and the second is a map of these
 * attributes (all of which are optional):
 *
 *   - ##construct## //(function)// Class constructor. If you don't provide one,
 *       one will be created for you (but it will be very boring).
 *   - ##extend## //(string)// The name of another JX-namespaced class to extend
 *       via prototypal inheritance.
 *   - ##members## //(map)// A map of instance methods and properties.
 *   - ##statics## //(map)// A map of static methods and properties.
 *   - ##initialize## //(function)// A function which will be run once, after
 *       this class has been installed.
 *   - ##properties## //(map)// A map of properties that should have instance
 *       getters and setters automatically generated for them. The key is the
 *       property name and the value is its default value. For instance, if you
 *       provide the property "size", the installed class will have the methods
 *       "getSize()" and "setSize()". It will **NOT** have a property ".size"
 *       and no guarantees are made about where install is actually chosing to
 *       store the data. The motivation here is to let you cheaply define a
 *       stable interface and refine it later as necessary.
 *   - ##events## //(list)// List of event types this class is capable of
 *       emitting.
 *
 * For example:
 *
 *   JX.install('Dog', {
 *     construct : function(name) {
 *       this.setName(name);
 *     },
 *     members : {
 *       bark : function() {
 *         // ...
 *       }
 *     },
 *     properites : {
 *       name : null,
 *     }
 *   });
 *
 * This creates a new ##Dog## class in the ##JX## namespace:
 *
 *   var d = new JX.Dog();
 *   d.bark();
 *
 * Javelin classes are normal Javascript functions and generally behave in
 * the expected way. Some properties and methods are automatically added to
 * all classes:
 *
 *   - ##instance.__id__## Globally unique identifier attached to each instance.
 *   - ##prototype.__class__## Reference to the class constructor.
 *   - ##constructor.__path__## List of path tokens used emit events. It is
 *       probably never useful to access this directly.
 *   - ##constructor.__readable__## Readable class name. You could use this
 *       for introspection.
 *   - ##constructor.__events__## //DEV ONLY!// List of events supported by
 *       this class.
 *   - ##constructor.listen()## Listen to all instances of this class. See
 *       @{JX.Base}.
 *   - ##instance.listen()## Listen to one instance of this class. See
 *       @{JX.Base}.
 *   - ##instance.invoke()## Invoke an event from an instance. See @{JX.Base}.
 *
 *
 * @param  string  Name of the class to install. It will appear in the JX
 *                 "namespace" (e.g., JX.Pancake).
 * @param  map     Map of properties, see method documentation.
 * @return void
 *
 * @author epriestley
 */
JX.install = function(new_name, new_junk) {

  if (typeof JX.install._nextObjectID == 'undefined') {
    JX.install._nextObjectID = 0;
  }

  // If we've already installed this, something is up.
  if (new_name in JX) {
    if (__DEV__) {
      throw new Error(
        'JX.install("' + new_name + '", ...): ' +
        'trying to reinstall something that has already been installed.');
    }
    return;
  }

  if (__DEV__) {
    if ('name' in new_junk) {
      throw new Error(
        'JX.install("' + new_name + '", {"name": ...}): ' +
        'trying to install with "name" property.' +
        'Either remove it or call JX.createClass directly.');
    }
  }

  // Since we may end up loading things out of order (e.g., Dog extends Animal
  // but we load Dog first) we need to keep a list of things that we've been
  // asked to install but haven't yet been able to install around.
  if (!JX.install._queue) {
    JX.install._queue = [];
  }
  JX.install._queue.push([new_name, new_junk]);
  do {
    var junk;
    var name = null;
    var initialize;
    for (var ii = 0; ii < JX.install._queue.length; ++ii) {
      junk = JX.install._queue[ii][1];
      if (junk.extend && !JX[junk.extend]) {
        // We need to extend something that we haven't been able to install
        // yet, so just keep this in queue.
        continue;
      }

      // Install time! First, get this out of the queue.
      name = JX.install._queue.splice(ii, 1)[0][0];
      --ii;

      if (junk.extend) {
        junk.extend = JX[junk.extend];
      }

      initialize = junk.initialize;
      delete junk.initialize;
      junk.name = 'JX.' + name;

      JX[name] = JX.createClass(junk);

      if (initialize) {
        if (JX.Stratcom && JX.Stratcom.ready) {
          initialize.apply(null);
        } else {
          // This is a holding queue, defined in init.js.
          JX['install-init'](initialize);
        }
      }
    }

    // In effect, this exits the loop as soon as we didn't make any progress
    // installing things, which means we've installed everything we have the
    // dependencies for.
  } while (name);
};


/**
 * Creates a class from a map of attributes. Requires ##extend## property to
 * be an actual Class object and not a "String". Supports ##name## property
 * to give the created Class a readable name.
 *
 * @see JX.install for description of supported attributes.
 *
 * @param  junk     Map of properties, see method documentation.
 * @return function Constructor of a class created
 */
JX.createClass = function(junk) {
  if (typeof JX.install._nextObjectID == 'undefined') {
    JX.install._nextObjectID = 0;
  }
  var name = junk.name || '';

  if (__DEV__) {
    var valid = {
      construct : 1,
      statics : 1,
      members : 1,
      extend : 1,
      properties : 1,
      events : 1,
      name : 1
    };
    for (var k in junk) {
      if (!(k in valid)) {
        throw new Error(
          'JX.createClass("' + name + '", {"' + k + '": ...}): ' +
          'trying to create unknown property `' + k + '`.');
      }
    }
    if (junk.constructor !== {}.constructor) {
      throw new Error(
        'JX.createClass("' + name + '", {"constructor": ...}): ' +
        'property `constructor` should be called `construct`.');
    }
  }

  // First, build the constructor. If construct is just a function, this
  // won't change its behavior (unless you have provided a really awesome
  // function, in which case it will correctly punish you for your attempt
  // at creativity).
  var Class = (function(name, junk) {
    var result = function() {
      this.__id__ = '__obj__' + (++JX.install._nextObjectID);
      return (junk.construct || junk.extend || JX.bag).apply(this, arguments);
      // TODO: Allow mixins to initialize here?
      // TODO: Also, build mixins?
    };

    if (__DEV__) {
      var inner = result;
      result = function() {
        if (this == window || this == JX) {
          throw new Error(
            '<' + Class.__readable__ + '>: ' +
            'Tried to construct an instance without the "new" operator.');
        }
        return inner.apply(this, arguments);
      };
    }
    return result;
  })(name, junk);

  Class.__readable__ = name;

  // Copy in all the static methods and properties.
  for (var k in junk.statics) {
    // Can't use JX.copy() here yet since it may not have loaded.
    Class[k] = junk.statics[k];
  }

  var proto;
  if (junk.extend) {
    var Inheritance = function() {};
    Inheritance.prototype = junk.extend.prototype;
    proto = Class.prototype = new Inheritance();
  } else {
    proto = Class.prototype = {};
  }

  proto.__class__ = Class;

  // Build getters and setters from the `prop' map.
  for (var k in (junk.properties || {})) {
    var base = k.charAt(0).toUpperCase()+k.substr(1);
    var prop = '__auto__' + k;
    proto[prop] = junk.properties[k];
    proto['set' + base] = (function(prop) {
      return function(v) {
        this[prop] = v;
        return this;
      };
    })(prop);

    proto['get' + base] = (function(prop) {
      return function() {
        return this[prop];
      };
    })(prop);
  }

  if (__DEV__) {

    // Check for aliasing in default values of members. If we don't do this,
    // you can run into a problem like this:
    //
    //  JX.install('List', { members : { stuff : [] }});
    //
    //  var i_love = new JX.List();
    //  var i_hate = new JX.List();
    //
    //  i_love.stuff.push('Psyduck');  // I love psyduck!
    //  JX.log(i_hate.stuff);          // Show stuff I hate.
    //
    // This logs ["Psyduck"] because the push operation modifies
    // JX.List.prototype.stuff, which is what both i_love.stuff and
    // i_hate.stuff resolve to. To avoid this, set the default value to
    // null (or any other scalar) and do "this.stuff = [];" in the
    // constructor.

    for (var member_name in junk.members) {
      if (junk.extend && member_name[0] == '_') {
        throw new Error(
          'JX.createClass("' + name + '", ...): ' +
          'installed member "' + member_name + '" must not be named with ' +
          'a leading underscore because it is in a subclass. Variables ' +
          'are analyzed and crushed one file at a time, and crushed ' +
          'member variables in subclasses alias crushed member variables ' +
          'in superclasses. Remove the underscore, refactor the class so ' +
          'it does not extend anything, or fix the minifier to be ' +
          'capable of safely crushing subclasses.');
      }
      var member_value = junk.members[member_name];
      if (typeof member_value == 'object' && member_value !== null) {
        throw new Error(
          'JX.createClass("' + name + '", ...): ' +
          'installed member "' + member_name + '" is not a scalar or ' +
          'function. Prototypal inheritance in Javascript aliases object ' +
          'references across instances so all instances are initialized ' +
          'to point at the exact same object. This is almost certainly ' +
          'not what you intended. Make this member static to share it ' +
          'across instances, or initialize it in the constructor to ' +
          'prevent reference aliasing and give each instance its own ' +
          'copy of the value.');
      }
    }
  }


  // This execution order intentionally allows you to override methods
  // generated from the "properties" initializer.
  for (var k in junk.members) {
    proto[k] = junk.members[k];
  }


  // Build this ridiculous event model thing. Basically, this defines
  // two instance methods, invoke() and listen(), and one static method,
  // listen(). If you listen to an instance you get events for that
  // instance; if you listen to a class you get events for all instances
  // of that class (including instances of classes which extend it).
  //
  // This is rigged up through Stratcom. Each class has a path component
  // like "class:Dog", and each object has a path component like
  // "obj:23". When you invoke on an object, it emits an event with
  // a path that includes its class, all parent classes, and its object
  // ID.
  //
  // Calling listen() on an instance listens for just the object ID.
  // Calling listen() on a class listens for that class's name. This
  // has the effect of working properly, but installing them is pretty
  // messy.

  var parent = junk.extend || {};
  var old_events = parent.__events__;
  var new_events = junk.events || [];
  var has_events = old_events || new_events.length;

  if (has_events) {
    var valid_events = {};

    // If we're in dev, we build up a list of valid events (for this class
    // and our parent class), and then check them on listen and invoke.
    if (__DEV__) {
      for (var key in old_events || {}) {
        valid_events[key] = true;
      }
      for (var ii = 0; ii < new_events.length; ++ii) {
        valid_events[junk.events[ii]] = true;
      }
    }

    Class.__events__ = valid_events;

    // Build the class name chain.
    Class.__name__ = 'class:' + name;
    var ancestry = parent.__path__ || [];
    Class.__path__ = ancestry.concat([Class.__name__]);

    proto.invoke = function(type) {
      if (__DEV__) {
        if (!(type in this.__class__.__events__)) {
          throw new Error(
            this.__class__.__readable__ + '.invoke("' + type + '", ...): ' +
            'invalid event type. Valid event types are: ' +
            JX.keys(this.__class__.__events__).join(', ') + '.');
        }
      }
      // Here and below, this nonstandard access notation is used to mask
      // these callsites from the static analyzer. JX.Stratcom is always
      // available by the time we hit these execution points.
      return JX['Stratcom'].invoke(
        'obj:' + type,
        this.__class__.__path__.concat([this.__id__]),
        {args : JX.$A(arguments).slice(1)});
    };

    proto.listen = function(type, callback) {
      if (__DEV__) {
        if (!(type in this.__class__.__events__)) {
          throw new Error(
            this.__class__.__readable__ + '.listen("' + type + '", ...): ' +
            'invalid event type. Valid event types are: ' +
            JX.keys(this.__class__.__events__).join(', ') + '.');
        }
      }
      return JX['Stratcom'].listen(
        'obj:' + type,
        this.__id__,
        JX.bind(this, function(e) {
          return callback.apply(this, e.getData().args);
        }));
    };

    Class.listen = function(type, callback) {
      if (__DEV__) {
        if (!(type in this.__events__)) {
          throw new Error(
            this.__readable__ + '.listen("' + type + '", ...): ' +
            'invalid event type. Valid event types are: ' +
            JX.keys(this.__events__).join(', ') + '.');
        }
      }
      return JX['Stratcom'].listen(
        'obj:' + type,
        this.__name__,
        JX.bind(this, function(e) {
          return callback.apply(this, e.getData().args);
        }));
    };
  } else if (__DEV__) {
    var error_message =
      'class does not define any events. Pass an "events" property to ' +
      'JX.createClass() to define events.';
    Class.listen = Class.listen || function() {
      throw new Error(
        this.__readable__ + '.listen(...): ' +
        error_message);
    };
    Class.invoke = Class.invoke || function() {
      throw new Error(
        this.__readable__ + '.invoke(...): ' +
        error_message);
    };
    proto.listen = proto.listen || function() {
      throw new Error(
        this.__class__.__readable__ + '.listen(...): ' +
        error_message);
    };
    proto.invoke = proto.invoke || function() {
      throw new Error(
        this.__class__.__readable__ + '.invoke(...): ' +
        error_message);
    };
  }

  return Class;
};

JX.flushHoldingQueue('install', JX.install);
/**
 * @requires javelin-install
 * @provides javelin-event
 * @javelin
 */

/**
 * A generic event, routed by @{JX.Stratcom}. All events within Javelin are
 * represented by a {@JX.Event}, regardless of whether they originate from
 * a native DOM event (like a mouse click) or are custom application events.
 *
 * Events have a propagation model similar to native Javascript events, in that
 * they can be stopped with stop() (which stops them from continuing to
 * propagate to other handlers) or prevented with prevent() (which prevents them
 * from taking their default action, like following a link). You can do both at
 * once with kill().
 *
 * @author epriestley
 * @task stop Stopping Event Behaviors
 * @task info Getting Event Information
 */
JX.install('Event', {
  members : {

    /**
     * Stop an event from continuing to propagate. No other handler will
     * receive this event, but its default behavior will still occur. See
     * ""Using Events"" for more information on the distinction between
     * 'stopping' and 'preventing' an event. See also prevent() (which prevents
     * an event but does not stop it) and kill() (which stops and prevents an
     * event).
     *
     * @return this
     * @task stop
     */
    stop : function() {
      var r = this.getRawEvent();
      if (r) {
        r.cancelBubble = true;
        r.stopPropagation && r.stopPropagation();
      }
      this.setStopped(true);
      return this;
    },


    /**
     * Prevent an event's default action. This depends on the event type, but
     * the common default actions are following links, submitting forms,
     * and typing text. Event prevention is generally used when you have a link
     * or form which work properly without Javascript but have a specialized
     * Javascript behavior. When you intercept the event and make the behavior
     * occur, you prevent it to keep the browser from following the link.
     *
     * Preventing an event does not stop it from propagating, so other handlers
     * will still receive it. See ""Using Events"" for more information on the
     * distinction between 'stopping' and 'preventing' an event. See also
     * stop() (which stops an event but does not prevent it) and kill()
     * (which stops and prevents an event).
     *
     * @return this
     * @task stop
     */
    prevent : function() {
      var r = this.getRawEvent();
      if (r) {
        r.returnValue = false;
        r.preventDefault && r.preventDefault();
      }
      this.setPrevented(true);
      return this;
    },


    /**
     * Stop and prevent an event, which stops it from propagating and prevents
     * its defualt behavior. This is a convenience function, see stop() and
     * prevent() for information on what it means to stop or prevent an event.
     *
     * @return this
     * @task stop
     */
    kill : function() {
      this.prevent();
      this.stop();
      return this;
    },


    /**
     * Get the special key (like tab or return), if any,  associated with this
     * event. Browsers report special keys differently;  this method allows you
     * to identify a keypress in a browser-agnostic way. Note that this detects
     * only some special keys: delete, tab, return escape, left, up, right,
     * down.
     *
     * For example, if you want to react to the escape key being pressed, you
     * could install a listener like this:
     *
     *  JX.Stratcom.listen('keydown', 'example', function(e) {
     *    if (e.getSpecialKey() == 'esc') {
     *      JX.log("You pressed 'Escape'! Well done! Bravo!");
     *    }
     *  });
     *
     * @return string|null ##null## if there is no associated special key,
     *                     or one of the strings 'delete', 'tab', 'return',
     *                     'esc', 'left', 'up', 'right', or 'down'.
     * @task info
     */
    getSpecialKey : function() {
      var r = this.getRawEvent();
      if (!r || r.shiftKey) {
        return null;
      }

      return JX.Event._keymap[r.keyCode] || null;
    },


    /**
     * Get whether the mouse button associated with the mouse event is the
     * right-side button in a browser-agnostic way.
     *
     * @return bool
     * @task info
     */
    isRightButton : function() {
      var r = this.getRawEvent();
      return r.which == 3 || r.button == 2;
    },


    /**
     * Get the node corresponding to the specified key in this event's node map.
     * This is a simple helper method that makes the API for accessing nodes
     * less ugly.
     *
     *  JX.Stratcom.listen('click', 'tag:a', function(e) {
     *    var a = e.getNode('tag:a');
     *    // do something with the link that was clicked
     *  });
     *
     * @param  string     sigil or stratcom node key
     * @return node|null  Node mapped to the specified key, or null if it the
     *                    key does not exist. The available keys include:
     *                    - 'tag:'+tag - first node of each type
     *                    - 'id:'+id - all nodes with an id
     *                    - sigil - first node of each sigil
     * @task info
     */
    getNode : function(key) {
      return this.getNodes()[key] || null;
    },


    /**
     * Get the metadata associated with the node that corresponds to the key
     * in this event's node map.  This is a simple helper method that makes
     * the API for accessing metadata associated with specific nodes less ugly.
     *
     *  JX.Stratcom.listen('click', 'tag:a', function(event) {
     *    var anchorData = event.getNodeData('tag:a');
     *    // do something with the metadata of the link that was clicked
     *  });
     *
     * @param  string   sigil or stratcom node key
     * @return dict     dictionary of the node's metadata
     * @task info
     */
    getNodeData : function(key) {
      // Evade static analysis - JX.Stratcom
      return JX['Stratcom'].getData(this.getNode(key));
    }
  },

  statics : {
    _keymap : {
      8     : 'delete',
      9     : 'tab',
      13    : 'return',
      27    : 'esc',
      37    : 'left',
      38    : 'up',
      39    : 'right',
      40    : 'down',
      63232 : 'up',
      63233 : 'down',
      62234 : 'left',
      62235 : 'right'
    }
  },

  properties : {

    /**
     * Native Javascript event which generated this @{JX.Event}. Not every
     * event is generated by a native event, so there may be ##null## in
     * this field.
     *
     * @type Event|null
     * @task info
     */
    rawEvent : null,

    /**
     * String describing the event type, like 'click' or 'mousedown'. This
     * may also be an application or object event.
     *
     * @type string
     * @task info
     */
    type : null,

    /**
     * If available, the DOM node where this event occurred. For example, if
     * this event is a click on a button, the target will be the button which
     * was clicked. Application events will not have a target, so this property
     * will return the value ##null##.
     *
     * @type DOMNode|null
     * @task info
     */
    target : null,

    /**
     * Metadata attached to nodes associated with this event.
     *
     * For native events, the DOM is walked from the event target to the root
     * element. Each sigil which is encountered while walking up the tree is
     * added to the map as a key. If the node has associated metainformation,
     * it is set as the value; otherwise, the value is null.
     *
     * @type dict<string, *>
     * @task info
     */
    data : null,

    /**
     * Sigil path this event was activated from. TODO: explain this
     *
     * @type list<string>
     * @task info
     */
    path : [],

    /**
     * True if propagation of the event has been stopped. See stop().
     *
     * @type bool
     * @task stop
     */
    stopped : false,

    /**
     * True if default behavior of the event has been prevented. See prevent().
     *
     * @type bool
     * @task stop
     */
    prevented : false,

    /**
     * @task info
     */
    nodes : {}
  },

  /**
   * @{JX.Event} installs a toString() method in ##__DEV__## which allows you to
   * log or print events and get a reasonable representation of them:
   *
   *  Event<'click', ['path', 'stuff'], [object HTMLDivElement]>
   */
  initialize : function() {
    if (__DEV__) {
      JX.Event.prototype.toString = function() {
        var path = '['+this.getPath().join(', ')+']';
        return 'Event<'+this.getType()+', '+path+', '+this.getTarget()+'>';
      }
    }
  }
});
/**
 *  @requires javelin-install javelin-event javelin-util javelin-magical-init
 *  @provides javelin-stratcom
 *  @javelin
 */

/**
 * Javelin strategic command, the master event delegation core. This class is
 * a sort of hybrid between Arbiter and traditional event delegation, and
 * serves to route event information to handlers in a general way.
 *
 * Each Javelin :JX.Event has a 'type', which may be a normal Javascript type
 * (for instance, a click or a keypress) or an application-defined type. It
 * also has a "path", based on the path in the DOM from the root node to the
 * event target. Note that, while the type is required, the path may be empty
 * (it often will be for application-defined events which do not originate
 * from the DOM).
 *
 * The path is determined by walking down the tree to the event target and
 * looking for nodes that have been tagged with metadata. These names are used
 * to build the event path, and unnamed nodes are ignored. Each named node may
 * also have data attached to it.
 *
 * Listeners specify one or more event types they are interested in handling,
 * and, optionally, one or more paths. A listener will only receive events
 * which occurred on paths it is listening to. See listen() for more details.
 *
 * @author epriestley
 *
 * @task invoke   Invoking Events
 * @task listen   Listening to Events
 * @task handle   Responding to Events
 * @task sigil    Managing Sigils
 * @task meta     Managing Metadata
 * @task internal Internals
 */
JX.install('Stratcom', {
  statics : {
    ready : false,
    _targets : {},
    _handlers : [],
    _need : {},
    _auto : '*',
    _data : {},
    _execContext : [],
    _typeMap : {focusin: 'focus', focusout: 'blur'},

    /**
     * Node metadata is stored in a series of blocks to prevent collisions
     * between indexes that are generated on the server side (and potentially
     * concurrently). Block 0 is for metadata on the initial page load, block 1
     * is for metadata added at runtime with JX.Stratcom.siglize(), and blocks
     * 2 and up are for metadata generated from other sources (e.g. JX.Request).
     * Use allocateMetadataBlock() to reserve a block, and mergeData() to fill
     * a block with data.
     *
     * When a JX.Request is sent, a block is allocated for it and any metadata
     * it returns is filled into that block.
     */
    _dataBlock : 2,

    /**
     * Within each datablock, data is identified by a unique index. The data
     * pointer (data-meta attribute) on a node looks like this:
     *
     *  1_2
     *
     * ...where 1 is the block, and 2 is the index within that block. Normally,
     * blocks are filled on the server side, so index allocation takes place
     * there. However, when data is provided with JX.Stratcom.addData(), we
     * need to allocate indexes on the client.
     */
    _dataIndex : 0,

    /**
     * Dispatch a simple event that does not have a corresponding native event
     * object. It is unusual to call this directly. Generally, you will instead
     * dispatch events from an object using the invoke() method present on all
     * objects. See @{JX.Base.invoke()} for documentation.
     *
     * @param  string       Event type.
     * @param  list?        Optionally, a path to attach to the event. This is
     *                      rarely meaingful for simple events.
     * @param  object?      Optionally, arbitrary data to send with the event.
     * @return @{JX.Event}  The event object which was dispatched to listeners.
     *                      The main use of this is to test whether any
     *                      listeners prevented the event.
     * @task invoke
     */
    invoke : function(type, path, data) {
      var proxy = new JX.Event()
        .setType(type)
        .setData(data || {})
        .setPath(path || []);

      return this._dispatchProxy(proxy);
    },


    /**
     * Listen for events on given paths. Specify one or more event types, and
     * zero or more paths to filter on. If you don't specify a path, you will
     * receive all events of the given type:
     *
     *   // Listen to all clicks.
     *   JX.Stratcom.listen('click', null, handler);
     *
     * This will notify you of all clicks anywhere in the document (unless
     * they are intercepted and killed by a higher priority handler before they
     * get to you).
     *
     * Often, you may be interested in only clicks on certain elements. You
     * can specify the paths you're interested in to filter out events which
     * you do not want to be notified of.
     *
     *   //  Listen to all clicks inside elements annotated "news-feed".
     *   JX.Stratcom.listen('click', 'news-feed', handler);
     *
     * By adding more elements to the path, you can create a finer-tuned
     * filter:
     *
     *   //  Listen to only "like" clicks inside "news-feed".
     *   JX.Stratcom.listen('click', ['news-feed', 'like'], handler);
     *
     *
     * TODO: Further explain these shenanigans.
     *
     * @param  string|list<string>  Event type (or list of event names) to
     *                   listen for. For example, ##'click'## or
     *                   ##['keydown', 'keyup']##.
     *
     * @param  wild      Sigil paths to listen for this event on. See discussion
     *                   in method documentation.
     *
     * @param  function  Callback to invoke when this event is triggered. It
     *                   should have the signature ##f(:JX.Event e)##.
     *
     * @return object    A reference to the installed listener. You can later
     *                   remove the listener by calling this object's remove()
     *                   method.
     * @author epriestley
     * @task listen
     */
    listen : function(types, paths, func) {

      if (__DEV__) {
        if (arguments.length == 4) {
          throw new Error(
            'JX.Stratcom.listen(...): '+
            'requires exactly 3 arguments. Did you mean JX.DOM.listen?');
        }
        if (arguments.length != 3) {
          throw new Error(
            'JX.Stratcom.listen(...): '+
            'requires exactly 3 arguments.');
        }
        if (typeof func != 'function') {
          throw new Error(
            'JX.Stratcom.listen(...): '+
            'callback is not a function.');
        }
      }

      var ids = [];

      types = JX.$AX(types);

      if (!paths) {
        paths = this._auto;
      }
      if (!(paths instanceof Array)) {
        paths = [[paths]];
      } else if (!(paths[0] instanceof Array)) {
        paths = [paths];
      }

      //  To listen to multiple event types on multiple paths, we just install
      //  the same listener a whole bunch of times: if we install for two
      //  event types on three paths, we'll end up with six references to the
      //  listener.
      //
      //  TODO: we'll call your listener twice if you install on two paths where
      //  one path is a subset of another. The solution is "don't do that", but
      //  it would be nice to verify that the caller isn't doing so, in __DEV__.
      for (var ii = 0; ii < types.length; ++ii) {
        var type = types[ii];
        if (('onpagehide' in window) && type == 'unload') {
          // If we use "unload", we break the bfcache ("Back-Forward Cache") in
          // Safari and Firefox. The BFCache makes using the back/forward
          // buttons really fast since the pages can come out of magical
          // fairyland instead of over the network, so use "pagehide" as a proxy
          // for "unload" in these browsers.
          type = 'pagehide';
        }
        if (!(type in this._targets)) {
          this._targets[type] = {};
        }
        var type_target = this._targets[type];
        for (var jj = 0; jj < paths.length; ++jj) {
          var path = paths[jj];
          var id = this._handlers.length;
          this._handlers.push(func);
          this._need[id] = path.length;
          ids.push(id);
          for (var kk = 0; kk < path.length; ++kk) {
            if (__DEV__) {
              if (path[kk] == 'tag:#document') {
                throw new Error(
                  'JX.Stratcom.listen(..., "tag:#document", ...): ' +
                  'listen for all events using null, not "tag:#document"');
              }
              if (path[kk] == 'tag:window') {
                throw new Error(
                  'JX.Stratcom.listen(..., "tag:window", ...): ' +
                  'listen for window events using null, not "tag:window"');
              }
            }
            if (!type_target[path[kk]]) {
              type_target[path[kk]] = [];
            }
            type_target[path[kk]].push(id);
          }
        }
      }

      return {
        remove : function() {
          for (var ii = 0; ii < ids.length; ii++) {
            delete JX.Stratcom._handlers[ids[ii]];
          }
        }
      };
    },


    /**
     * Dispatch a native Javascript event through the Stratcom control flow.
     * Generally, this is automatically called for you by the master dispatcher
     * installed by ##init.js##. When you want to dispatch an application event,
     * you should instead call invoke().
     *
     * @param  Event       Native event for dispatch.
     * @return :JX.Event   Dispatched :JX.Event.
     * @task internal
     */
    dispatch : function(event) {
      var path = [];
      var nodes = {};
      var push = function(key, node) {
        // we explicitly only store the first occurrence of each key
        if (!nodes.hasOwnProperty(key)) {
          nodes[key] = node;
          path.push(key);
        }
      };

      var target = event.srcElement || event.target;

      // Touch events may originate from text nodes, but we want to start our
      // traversal from the nearest Element, so we grab the parentNode instead.
      if (target && target.nodeType === 3) {
        target = target.parentNode;
      }

      // Since you can only listen by tag, id, or sigil we unset the target if
      // it isn't an Element. Document and window are Nodes but not Elements.
      if (!target || !target.getAttribute) {
        target = null;
      }

      var cursor = target;
      while (cursor && cursor.getAttribute) {
        push('tag:' + cursor.nodeName.toLowerCase(), cursor);

        var id = cursor.id;
        if (id) {
          push('id:' + id, cursor);
        }

        var sigils = cursor.getAttribute('data-sigil');
        if (sigils) {
          sigils = sigils.split(' ');
          for (var ii = 0; ii < sigils.length; ii++) {
            push(sigils[ii], cursor);
          }
        }

        cursor = cursor.parentNode;
      }

      var etype = event.type;
      if (etype in this._typeMap) {
        etype = this._typeMap[etype];
      }

      var proxy = new JX.Event()
        .setRawEvent(event)
        .setType(etype)
        .setTarget(target)
        .setNodes(nodes)
        .setPath(path.reverse());

      //JX.log('~> '+proxy.toString());

      return this._dispatchProxy(proxy);
    },


    /**
     * Dispatch a previously constructed proxy :JX.Event.
     *
     * @param  :JX.Event Event to dispatch.
     * @return :JX.Event Returns the event argument.
     * @task internal
     */
    _dispatchProxy : function(proxy) {

      var scope = this._targets[proxy.getType()];

      if (!scope) {
        return proxy;
      }

      var path = proxy.getPath();
      var len = path.length;
      var hits = {};
      var matches;

      for (var root = -1; root < len; ++root) {
        if (root == -1) {
          matches = scope[this._auto];
        } else {
          matches = scope[path[root]];
        }
        if (!matches) {
          continue;
        }
        for (var ii = 0; ii < matches.length; ++ii) {
          hits[matches[ii]] = (hits[matches[ii]] || 0) + 1;
        }
      }

      var exec = [];

      for (var k in hits) {
        if (hits[k] == this._need[k]) {
          var handler = this._handlers[k];
          if (handler) {
            exec.push(handler);
          }
        }
      }

      this._execContext.push({
        handlers: exec,
        event: proxy,
        cursor: 0
      });

      this.pass();

      this._execContext.pop();

      return proxy;
    },

    /**
     * Pass on an event, allowing other handlers to process it. The use case
     * here is generally something like:
     *
     *   if (JX.Stratcom.pass()) {
     *     // something else handled the event
     *     return;
     *   }
     *   // handle the event
     *   event.prevent();
     *
     * This allows you to install event handlers that operate at a lower
     * effective priority, and provide a default behavior which is overridable
     * by listeners.
     *
     * @return bool  True if the event was stopped or prevented by another
     *               handler.
     * @task handle
     */
    pass : function() {
      var context = this._execContext[this._execContext.length - 1];
      while (context.cursor < context.handlers.length) {
        var cursor = context.cursor;
        ++context.cursor;
        (context.handlers[cursor] || JX.bag)(context.event);
        if (context.event.getStopped()) {
          break;
        }
      }
      return context.event.getStopped() || context.event.getPrevented();
    },


    /**
     * Retrieve the event (if any) which is currently being dispatched.
     *
     * @return :JX.Event|null   Event which is currently being dispatched, or
     *                          null if there is no active dispatch.
     * @task handle
     */
    context : function() {
      var len = this._execContext.length;
      if (!len) {
        return null;
      }
      return this._execContext[len - 1].event;
    },


    /**
     * Merge metadata. You must call this (even if you have no metadata) to
     * start the Stratcom queue.
     *
     * @param  int          The datablock to merge data into.
     * @param  dict          Dictionary of metadata.
     * @return void
     * @task internal
     */
    mergeData : function(block, data) {
      this._data[block] = data;
      if (block == 0) {
        JX.Stratcom.ready = true;
        JX.flushHoldingQueue('install-init', function(fn) {
          fn();
        });
        JX.__rawEventQueue({type: 'start-queue'});
      }
    },


    /**
     * Determine if a node has a specific sigil.
     *
     * @param  Node    Node to test.
     * @param  string  Sigil to check for.
     * @return bool    True if the node has the sigil.
     *
     * @task sigil
     */
    hasSigil : function(node, sigil) {
      if (__DEV__) {
        if (!node || !node.getAttribute) {
          throw new Error(
            'JX.Stratcom.hasSigil(<non-element>, ...): ' +
            'node is not an element. Most likely, you\'re passing window or ' +
            'document, which are not elements and can\'t have sigils.');
        }
      }

      var sigils = node.getAttribute('data-sigil') || false;
      return sigils && (' ' + sigils + ' ').indexOf(' ' + sigil + ' ') > -1;
    },


    /**
     * Add a sigil to a node.
     *
     * @param   Node    Node to add the sigil to.
     * @param   string  Sigil to name the node with.
     * @return  void
     * @task sigil
     */
    addSigil: function(node, sigil) {
      if (__DEV__) {
        if (!node || !node.getAttribute) {
          throw new Error(
            'JX.Stratcom.addSigil(<non-element>, ...): ' +
            'node is not an element. Most likely, you\'re passing window or ' +
            'document, which are not elements and can\'t have sigils.');
        }
      }

      var sigils = node.getAttribute('data-sigil');
      if (sigils && !JX.Stratcom.hasSigil(node, sigil)) {
        sigil = sigils + ' ' + sigil;
      }

      node.setAttribute('data-sigil', sigil);
    },


    /**
     * Retrieve a node's metadata.
     *
     * @param   Node    Node from which to retrieve data.
     * @return  object  Data attached to the node. If no data has been attached
     *                  to the node yet, an empty object will be returned, but
     *                  subsequent calls to this method will always retrieve the
     *                  same object.
     * @task meta
     */
    getData : function(node) {
      if (__DEV__) {
        if (!node || !node.getAttribute) {
          throw new Error(
            'JX.Stratcom.getData(<non-element>): ' +
            'node is not an element. Most likely, you\'re passing window or ' +
            'document, which are not elements and can\'t have data.');
        }
      }

      var meta_id = (node.getAttribute('data-meta') || '').split('_');
      if (meta_id[0] && meta_id[1]) {
        var block = this._data[meta_id[0]];
        var index = meta_id[1];
        if (block && (index in block)) {
          return block[index];
        }
      }

      var data = {};
      if (!this._data[1]) { // data block 1 is reserved for JavaScript
        this._data[1] = {};
      }
      this._data[1][this._dataIndex] = data;
      node.setAttribute('data-meta', '1_' + (this._dataIndex++));
      return data;
    },


    /**
     * Add data to a node's metadata.
     *
     * @param   Node    Node which data should be attached to.
     * @param   object  Data to add to the node's metadata.
     * @return  object  Data attached to the node that is returned by
     *                  JX.Stratcom.getData().
     * @task meta
     */
    addData : function(node, data) {
      if (__DEV__) {
        if (!node || !node.getAttribute) {
          throw new Error(
            'JX.Stratcom.addData(<non-element>, ...): ' +
            'node is not an element. Most likely, you\'re passing window or ' +
            'document, which are not elements and can\'t have sigils.');
        }
        if (!data || typeof data != 'object') {
          throw new Error(
            'JX.Stratcom.addData(..., <nonobject>): ' +
            'data to attach to node is not an object. You must use ' +
            'objects, not primitives, for metadata.');
        }
      }

      return JX.copy(JX.Stratcom.getData(node), data);
    },


    /**
     * @task internal
     */
    allocateMetadataBlock : function() {
      return this._dataBlock++;
    }
  }
});
/**
 * @provides javelin-behavior
 *
 * @javelin-installs JX.behavior
 * @javelin-installs JX.initBehaviors
 *
 * @javelin
 */

JX.behavior = function(name, control_function) {
  if (__DEV__) {
    if (JX.behavior._behaviors.hasOwnProperty(name)) {
      throw new Error(
        'JX.behavior("'+name+'", ...): '+
        'behavior is already registered.');
    }
    if (!control_function) {
      throw new Error(
        'JX.behavior("'+name+'", <nothing>): '+
        'initialization function is required.');
    }
    if (typeof control_function != 'function') {
      throw new Error(
        'JX.behavior("'+name+'", <garbage>): '+
        'initialization function is not a function.');
    }
  }
  JX.behavior._behaviors[name] = control_function;
};


JX.initBehaviors = function(map) {
  for (var name in map) {
    if (__DEV__) {
      if (!(name in JX.behavior._behaviors)) {
        throw new Error(
          'JX.initBehavior("'+name+'", ...): '+
          'behavior is not registered.');
      }
    }
    var configs = map[name];
    if (!configs.length) {
      if (JX.behavior._initialized.hasOwnProperty(name)) {
        continue;
      } else {
        configs = [null];
      }
    }
    for (var ii = 0; ii < configs.length; ii++) {
      JX.behavior._behaviors[name](configs[ii]);
    }
    JX.behavior._initialized[name] = true;
  }
};

!function(JX) {
  JX.behavior._behaviors = {};
  JX.behavior._initialized = {};
  JX.flushHoldingQueue('behavior', JX.behavior);
}(JX);
/**
 * @requires javelin-install
 *           javelin-stratcom
 *           javelin-util
 *           javelin-behavior
 * @provides javelin-request
 * @javelin
 */

/**
 * Make basic AJAX XMLHTTPRequests.
 */
JX.install('Request', {
  construct : function(uri, handler) {
    this.setURI(uri);
    if (handler) {
      this.listen('done', handler);
    }
  },

  events : ['send', 'done', 'error', 'finally'],

  members : {

    _xhrkey : null,
    _transport : null,
    _finished : false,
    _block : null,

    send : function() {
      var xport = null;

      try {
        try {
          xport = new XMLHttpRequest();
        } catch (x) {
          xport = new ActiveXObject("Msxml2.XMLHTTP");
        }
      } catch (x) {
        xport = new ActiveXObject("Microsoft.XMLHTTP");
      }

      this._transport = xport;
      this._xhrkey = JX.Request._xhr.length;
      JX.Request._xhr.push(this);

      xport.onreadystatechange = JX.bind(this, this._onreadystatechange);

      var data = this.getData() || {};
      data.__ajax__ = true;

      this._block = JX.Stratcom.allocateMetadataBlock();
      data.__metablock__ = this._block;

      var q = (this.getDataSerializer() ||
               JX.Request.defaultDataSerializer)(data);
      var uri = this.getURI();
      var method = this.getMethod().toUpperCase();

      if (method == 'GET') {
        uri += ((uri.indexOf('?') === -1) ? '?' : '&') + q;
      }

      this.invoke('send', this);

      if (this.getTimeout()) {
        this._timer = JX.defer(
          JX.bind(
            this,
            this._fail,
            JX.Request.ERROR_TIMEOUT),
          this.getTimeout());
      }

      xport.open(method, uri, true);

      if (__DEV__) {
        if (this.getFile()) {
          if (method != 'POST') {
            throw new Error(
              'JX.Request.send(): ' +
              'attempting to send a file over GET. You must use POST.');
          }
          if (this.getData()) {
            throw new Error(
              'JX.Request.send(): ' +
              'attempting to send data and a file. You can not send both ' +
              'at once.');
          }
        }
      }

      if (method == 'POST') {
        if (this.getFile()) {
          xport.send(this.getFile());
        } else {
          xport.setRequestHeader(
            'Content-Type',
            'application/x-www-form-urlencoded');
          xport.send(q);
        }
      } else {
        xport.send(null);
      }
    },

    abort : function() {
      this._cleanup();
    },

    _onreadystatechange : function() {
      var xport = this._transport;
      try {
        if (this._finished) {
          return;
        }
        if (xport.readyState != 4) {
          return;
        }
        // XHR requests to 'file:///' domains return 0 for success, which is why
        // we treat it as a good result in addition to HTTP 2XX responses.
        if (xport.status !== 0 && (xport.status < 200 || xport.status >= 300)) {
          this._fail();
          return;
        }

        if (__DEV__) {
          if (!xport.responseText.length) {
            throw new Error(
              'JX.Request("'+this.getURI()+'", ...): '+
              'server returned an empty response.');
          }
          if (xport.responseText.indexOf('for (;;);') != 0) {
            throw new Error(
              'JX.Request("'+this.getURI()+'", ...): '+
              'server returned an invalid response.');
          }
        }

        var text = xport.responseText.substring('for (;;);'.length);
        var response = eval('('+text+')');
      } catch (exception) {

        if (__DEV__) {
          JX.log(
            'JX.Request("'+this.getURI()+'", ...): '+
            'caught exception processing response: '+exception);
        }
        this._fail();
        return;
      }

      try {
        if (response.error) {
          this._fail(response.error);
        } else {
          JX.Stratcom.mergeData(
            this._block,
            response.javelin_metadata || {});
          this._done(response);
          JX.initBehaviors(response.javelin_behaviors || {});
        }
      } catch (exception) {
        //  In Firefox+Firebug, at least, something eats these. :/
        JX.defer(function() {
          throw exception;
        });
      }
    },

    _fail : function(error) {
      this._cleanup();

      this.invoke('error', error, this);
      this.invoke('finally');
    },

    _done : function(response) {
      this._cleanup();

      if (response.onload) {
        for (var ii = 0; ii < response.onload.length; ii++) {
          (new Function(response.onload[ii]))();
        }
      }

      this.invoke('done', this.getRaw() ? response : response.payload, this);
      this.invoke('finally');
    },

    _cleanup : function() {
      this._finished = true;
      delete JX.Request._xhr[this._xhrkey];
      this._timer && this._timer.stop();
      this._transport.abort();
    }

  },

  statics : {
    _xhr : [],
    shutdown : function() {
      for (var ii = 0; ii < JX.Request._xhr.length; ii++) {
        try {
          JX.Request._xhr[ii] && JX.Request._xhr[ii].abort();
        } catch (x) {
          // Ignore.
        }
      }
      JX.Request._xhr = [];
    },
    ERROR_TIMEOUT : -9000,
    defaultDataSerializer : function(data) {
      var uri = [];
      for (var k in data) {
        uri.push(encodeURIComponent(k) + '=' + encodeURIComponent(data[k]));
      }
      return uri.join('&');
    }
  },

  properties : {
    URI : null,
    data : null,
    dataSerializer : null,
    /**
     * Configure which HTTP method to use for the request. Permissible values
     * are "POST" (default) or "GET".
     *
     * @param string HTTP method, one of "POST" or "GET".
     */
    method : 'POST',
    file : null,
    raw : false,

    /**
     * Configure a timeout, in milliseconds. If the request has not resolved
     * (either with success or with an error) within the provided timeframe,
     * it will automatically fail with error JX.Request.ERROR_TIMEOUT.
     *
     * @param int Timeout, in milliseconds (e.g. 3000 = 3 seconds).
     */
    timeout : null
  },

  initialize : function() {
    JX.Stratcom.listen('unload', null, JX.Request.shutdown);
  }

});

/**
 * @requires javelin-install javelin-event
 * @provides javelin-vector
 * @javelin
 */

/**
 * Handy convenience function that returns a JX.Vector instance so you can
 * concisely write something like:
 *
 *  JX.$V(x, y).add(10, 10);
 * or
 *  JX.$V(node).add(50, 50).setDim(node);
 */
JX.$V = function(x, y) {
  return new JX.Vector(x, y);
};

/**
 * Query and update positions and dimensions of nodes (and other things) within
 * within a document. Each vector has two elements, 'x' and 'y', which usually
 * represent width/height ('dimension vector') or left/top ('position vector').
 *
 * Vectors are used to manage the sizes and positions of elements, events,
 * the document, and the viewport (the visible section of the document, i.e.
 * how much of the page the user can actually see in their browser window).
 * Unlike most Javelin classes, @{JX.Vector} exposes two bare properties,
 * 'x' and 'y'. You can read and manipulate these directly:
 *
 *   // Give the user information about elements when they click on them.
 *   JX.Stratcom.listen(
 *     'click',
 *     null,
 *     function(e) {
 *       var p = new JX.Vector(e);
 *       var d = JX.Vector.getDim(e.getTarget());
 *
 *       alert('You clicked at <' + p.x + ',' + p.y + '> and the element ' +
 *             'you clicked is ' + d.x + 'px wide and ' + d.y + 'px high.');
 *     });
 *
 * You can also update positions and dimensions using vectors:
 *
 *   // When the user clicks on something, make it 10px wider and 10px taller.
 *   JX.Stratcom.listen(
 *     'click',
 *     null,
 *     function(e) {
 *       var target = e.getTarget();
 *       JX.$V(target).add(10, 10).setDim(target);
 *     });
 *
 * Additionally, vectors can be used to query document and viewport information:
 *
 *   var v = JX.Vector.getViewport(); // Viewport (window) width and height.
 *   var d = JX.Vector.getDocument(); // Document width and height.
 *   var visible_area = parseInt(100 * (v.x * v.y) / (d.x * d.y), 10);
 *   alert('You can currently see ' + visible_area + ' % of the document.');
 *
 * @author epriestley
 *
 * @task query  Querying Positions and Dimensions
 * @task update Changing Positions and Dimensions
 * @task manip  Manipulating Vectors
 */
JX.install('Vector', {

  /**
   * Construct a vector, either from explicit coordinates or from a node
   * or event. You can pass two Numbers to construct an explicit vector:
   *
   *   var p = new JX.Vector(35, 42);
   *
   * Otherwise, you can pass a @{JX.Event} or a Node to implicitly construct a
   * vector:
   *
   *   var q = new JX.Vector(some_event);
   *   var r = new JX.Vector(some_node);
   *
   * These are just like calling JX.Vector.getPos() on the @{JX.Event} or Node.
   *
   * For convenience, @{JX.$V()} constructs a new vector so you don't need to
   * use the 'new' keyword. That is, these are equivalent:
   *
   *   var s = new JX.Vector(x, y);
   *   var t = JX.$V(x, y);
   *
   * Methods like getScroll(), getViewport() and getDocument() also create
   * new vectors.
   *
   * Once you have a vector, you can manipulate it with add():
   *
   *   var u = JX.$V(35, 42);
   *   var v = u.add(5, -12); // v = <40, 30>
   *
   * @param wild      'x' component of the vector, or a @{JX.Event}, or a Node.
   * @param Number?   If providing an 'x' component, the 'y' component of the
   *                  vector.
   * @return @{JX.Vector} Specified vector.
   * @task query
   */
  construct : function(x, y) {
    if (typeof y == 'undefined') {
      return JX.Vector.getPos(x);
    }

    this.x = parseFloat(x);
    this.y = parseFloat(y);
  },

  members : {
    x : null,
    y : null,

    /**
     * Move a node around by setting the position of a Node to the vector's
     * coordinates. For instance, if you want to move an element to the top left
     * corner of the document, you could do this (assuming it has 'position:
     * absolute'):
     *
     *   JX.$V(0, 0).setPos(node);
     *
     * @param Node Node to move.
     * @return this
     * @task update
     */
    setPos : function(node) {
      node.style.left = (this.x === null) ? '' : (parseInt(this.x, 10) + 'px');
      node.style.top  = (this.y === null) ? '' : (parseInt(this.y, 10) + 'px');
      return this;
    },

    /**
     * Change the size of a node by setting its dimensions to the vector's
     * coordinates. For instance, if you want to change an element to be 100px
     * by 100px:
     *
     *   JX.$V(100, 100).setDim(node);
     *
     * Or if you want to expand a node's dimensions by 50px:
     *
     *   JX.$V(node).add(50, 50).setDim(node);
     *
     * @param Node Node to resize.
     * @return this
     * @task update
     */
    setDim : function(node) {
      node.style.width =
        (this.x === null)
          ? ''
          : (parseInt(this.x, 10) + 'px');
      node.style.height =
        (this.y === null)
          ? ''
          : (parseInt(this.y, 10) + 'px');
      return this;
    },

    /**
     * Change a vector's x and y coordinates by adding numbers to them, or
     * adding the coordinates of another vector. For example:
     *
     *   var u = JX.$V(3, 4).add(100, 200); // u = <103, 204>
     *
     * You can also add another vector:
     *
     *   var q = JX.$V(777, 999);
     *   var r = JX.$V(1000, 2000);
     *   var s = q.add(r); // s = <1777, 2999>
     *
     * Note that this method returns a new vector. It does not modify the
     * 'this' vector.
     *
     * @param wild      Value to add to the vector's x component, or another
     *                  vector.
     * @param Number?   Value to add to the vector's y component.
     * @return @{JX.Vector} New vector, with summed components.
     * @task manip
     */
    add : function(x, y) {
      if (x instanceof JX.Vector) {
        return this.add(x.x, x.y);
      }
      return new JX.Vector(this.x + parseFloat(x), this.y + parseFloat(y));
    }
  },

  statics : {
    _viewport: null,

    /**
     * Determine where in a document an element is (or where an event, like
     * a click, occurred) by building a new vector containing the position of a
     * Node or @{JX.Event}. The 'x' component of the vector will correspond to
     * the pixel offset of the argument relative to the left edge of the
     * document, and the 'y' component will correspond to the pixel offset of
     * the argument relative to the top edge of the document. Note that all
     * vectors are generated in document coordinates, so the scroll position
     * does not affect them.
     *
     * See also getDim(), used to determine an element's dimensions.
     *
     * @param  Node|@{JX.Event}  Node or event to determine the position of.
     * @return @{JX.Vector}      New vector with the argument's position.
     * @task query
     */
    getPos : function(node) {
      JX.Event && (node instanceof JX.Event) && (node = node.getRawEvent());

      if (('pageX' in node) || ('clientX' in node)) {
        var c = JX.Vector._viewport;
        return new JX.Vector(
          node.pageX || (node.clientX + c.scrollLeft),
          node.pageY || (node.clientY + c.scrollTop));
      }

      var x = node.offsetLeft;
      var y = node.offsetTop;
      while (node.offsetParent && (node.offsetParent != document.body)) {
        node = node.offsetParent;
        x += node.offsetLeft;
        y += node.offsetTop;
      }

      return new JX.Vector(x, y);
    },

    /**
     * Determine the width and height of a node by building a new vector with
     * dimension information. The 'x' component of the vector will correspond
     * to the element's width in pixels, and the 'y' component will correspond
     * to its height in pixels.
     *
     * See also getPos(), used to determine an element's position.
     *
     * @param  Node      Node to determine the display size of.
     * @return @{JX.$V}  New vector with the node's dimensions.
     * @task query
     */
    getDim : function(node) {
      return new JX.Vector(node.offsetWidth, node.offsetHeight);
    },

    /**
     * Determine the current scroll position by building a new vector where
     * the 'x' component corresponds to how many pixels the user has scrolled
     * from the left edge of the document, and the 'y' component corresponds to
     * how many pixels the user has scrolled from the top edge of the document.
     *
     * See also getViewport(), used to determine the size of the viewport.
     *
     * @return @{JX.$V}  New vector with the document scroll position.
     * @task query
     */
    getScroll : function() {
      // We can't use JX.Vector._viewport here because there's diversity between
      // browsers with respect to where position/dimension and scroll position
      // information is stored.
      var b = document.body;
      var e = document.documentElement;
      return new JX.Vector(
        b.scrollLeft || e.scrollLeft,
        b.scrollTop || e.scrollTop
      );
    },

    /**
     * Determine the size of the viewport (basically, the browser window) by
     * building a new vector where the 'x' component corresponds to the width
     * of the viewport in pixels and the 'y' component corresponds to the height
     * of the viewport in pixels.
     *
     * See also getScroll(), used to determine the position of the viewport, and
     * getDocument(), used to determine the size of the entire document.
     *
     * @return @{JX.$V}  New vector with the viewport dimensions.
     * @task query
     */
    getViewport : function() {
      var c = JX.Vector._viewport;
      var w = window;

      return new JX.Vector(
        w.innerWidth || c.clientWidth || 0,
        w.innerHeight || c.clientHeight || 0
      );
    },

    /**
     * Determine the size of the document, including any area outside the
     * current viewport which the user would need to scroll in order to see, by
     * building a new vector where the 'x' component corresponds to the document
     * width in pixels and the 'y' component corresponds to the document height
     * in pixels.
     *
     * @return @{JX.$V} New vector with the document dimensions.
     * @task query
     */
    getDocument : function() {
      var c = JX.Vector._viewport;
      return new JX.Vector(c.scrollWidth || 0, c.scrollHeight || 0);
    }
  },

  /**
   * On initialization, the browser-dependent viewport root is determined and
   * stored.
   *
   * In ##__DEV__##, @{JX.$V} installs a toString() method so vectors print in a
   * debuggable way:
   *
   *   <23, 92>
   *
   * @return void
   */
  initialize : function() {
    var c = ((c = document) && (c = c.documentElement)) ||
            ((c = document) && (c = c.body))
    JX.Vector._viewport = c;

    if (__DEV__) {
      JX.Vector.prototype.toString = function() {
        return '<' + this.x + ', ' + this.y + '>';
      }
    }
  }

});
/**
 * @requires javelin-install javelin-util javelin-vector javelin-stratcom
 * @provides javelin-dom
 *
 * @javelin-installs JX.$
 * @javelin-installs JX.$N
 *
 * @javelin
 */


/**
 * Select an element by its "id" attribute, like ##document.getElementById()##.
 * For example:
 *
 *   var node = JX.$('some_id');
 *
 * This will select the node with the specified "id" attribute:
 *
 *   LANG=HTML
 *   <div id="some_id">...</div>
 *
 * If the specified node does not exist, @{JX.$()} will throw ##JX.$.NotFound##.
 * For other ways to select nodes from the document, see @{JX.DOM.scry()} and
 * @{JX.DOM.find()}.
 *
 * @param  string  "id" attribute to select from the document.
 * @return Node    Node with the specified "id" attribute.
 */
JX.$ = function(id) {

  if (__DEV__) {
    if (!id) {
      throw new Error('Empty ID passed to JX.$()!');
    }
  }

  var node = document.getElementById(id);
  if (!node || (node.id != id)) {
    if (__DEV__) {
      if (node && (node.id != id)) {
        throw new Error(
          'JX.$("'+id+'"): '+
          'document.getElementById() returned an element without the '+
          'correct ID. This usually means that the element you are trying '+
          'to select is being masked by a form with the same value in its '+
          '"name" attribute.');
      }
    }
    throw JX.$.NotFound;
  }

  return node;
};

JX.$.NotFound = {};
if (__DEV__) {
  //  If we're in dev, upgrade this object into an Error so that it will
  //  print something useful if it escapes the stack after being thrown.
  JX.$.NotFound = new Error(
    'JX.$() or JX.DOM.find() call matched no nodes.');
}


/**
 * Upcast a string into an HTML object so it is treated as markup instead of
 * plain text. See @{JX.$N} for discussion of Javelin's security model. Every
 * time you call this function you potentially open up a security hole. Avoid
 * its use wherever possible.
 *
 * This class intentionally supports only a subset of HTML because many browsers
 * named "Internet Explorer" have awkward restrictions around what they'll
 * accept for conversion to document fragments. Alter your datasource to emit
 * valid HTML within this subset if you run into an unsupported edge case. All
 * the edge cases are crazy and you should always be reasonably able to emit
 * a cohesive tag instead of an unappendable fragment.
 *
 * You may use @{JX.$H} as a shortcut for creating new JX.HTML instances.
 *
 * @task build String into HTML
 * @task nodes HTML into Nodes
 */
JX.install('HTML', {

  construct : function(str) {
    if (__DEV__) {
      var tags = ['legend', 'thead', 'tbody', 'tfoot', 'column', 'colgroup',
                  'caption', 'tr', 'th', 'td', 'option'];
      var evil_stuff = new RegExp('^\\s*<(' + tags.join('|') + ')\\b', 'i');
      var match = null;
      if (match = str.match(evil_stuff)) {
        throw new Error(
          'new JX.HTML("<' + match[1] + '>..."): ' +
          'call initializes an HTML object with an invalid partial fragment ' +
          'and can not be converted into DOM nodes. The enclosing tag of an ' +
          'HTML content string must be appendable to a document fragment. ' +
          'For example, <table> is allowed but <tr> or <tfoot> are not.');
      }

      var really_evil = /<script\b/;
      if (str.match(really_evil)) {
        throw new Error(
          'new JX.HTML("...<script>..."): ' +
          'call initializes an HTML object with an embedded script tag! ' +
          'Are you crazy?! Do NOT do this!!!');
      }

      var wont_work = /<object\b/;
      if (str.match(wont_work)) {
        throw new Error(
          'new JX.HTML("...<object>..."): ' +
          'call initializes an HTML object with an embedded <object> tag. IE ' +
          'will not do the right thing with this.');
      }

      //  TODO(epriestley): May need to deny <option> more broadly, see
      //  http://support.microsoft.com/kb/829907 and the whole mess in the
      //  heavy stack. But I seem to have gotten away without cloning into the
      //  documentFragment below, so this may be a nonissue.
    }

    this._content = str;
  },

  members : {
    _content : null,
    /**
     * Convert the raw HTML string into a DOM node tree.
     *
     * @task  nodes
     * @return DocumentFragment A document fragment which contains the nodes
     *                          corresponding to the HTML string you provided.
     */
    getFragment : function() {
      var wrapper = JX.$N('div');
      wrapper.innerHTML = this._content;
      var fragment = document.createDocumentFragment();
      while (wrapper.firstChild) {
        //  TODO(epriestley): Do we need to do a bunch of cloning junk here?
        //  See heavy stack. I'm disconnecting the nodes instead; this seems
        //  to work but maybe my test case just isn't extensive enough.
        fragment.appendChild(wrapper.removeChild(wrapper.firstChild));
      }
      return fragment;
    }
  }
});


/**
 * Build a new HTML object from a trustworthy string. JX.$H is a shortcut for
 * creating new JX.HTML instances.
 *
 * @task build
 * @param string A string which you want to be treated as HTML, because you
 *               know it is from a trusted source and any data in it has been
 *               properly escaped.
 * @return JX.HTML HTML object, suitable for use with @{JX.$N}.
 */
JX.$H = function(str) {
  return new JX.HTML(str);
};


/**
 * Create a new DOM node with attributes and content.
 *
 *   var link = JX.$N('a');
 *
 * This creates a new, empty anchor tag without any attributes. The equivalent
 * markup would be:
 *
 *   LANG=HTML
 *   <a />
 *
 * You can also specify attributes by passing a dictionary:
 *
 *   JX.$N('a', {name: 'anchor'});
 *
 * This is equivalent to:
 *
 *   LANG=HTML
 *   <a name="anchor" />
 *
 * Additionally, you can specify content:
 *
 *   JX.$N(
 *     'a',
 *     {href: 'http://www.javelinjs.com'},
 *     'Visit the Javelin Homepage');
 *
 * This is equivalent to:
 *
 *   LANG=HTML
 *   <a href="http://www.javelinjs.com">Visit the Javelin Homepage</a>
 *
 * If you only want to specify content, you can omit the attribute parameter.
 * That is, these calls are equivalent:
 *
 *   JX.$N('div', {}, 'Lorem ipsum...'); // No attributes.
 *   JX.$N('div', 'Lorem ipsum...')      // Same as above.
 *
 * Both are equivalent to:
 *
 *   LANG=HTML
 *   <div>Lorem ipsum...</div>
 *
 * Note that the content is treated as plain text, not HTML. This means it is
 * safe to use untrusted strings:
 *
 *   JX.$N('div', '<script src="evil.com" />');
 *
 * This is equivalent to:
 *
 *   LANG=HTML
 *   <div>&lt;script src="evil.com" /&gt;</div>
 *
 * That is, the content will be properly escaped and will not create a
 * vulnerability. If you want to set HTML content, you can use @{JX.HTML}:
 *
 *   JX.$N('div', JX.$H(some_html));
 *
 * **This is potentially unsafe**, so make sure you understand what you're
 * doing. You should usually avoid passing HTML around in string form. See
 * @{JX.HTML} for discussion.
 *
 * You can create new nodes with a Javelin sigil (and, optionally, metadata) by
 * providing "sigil" and "metadata" keys in the attribute dictionary.
 *
 * @param string                  Tag name, like 'a' or 'div'.
 * @param dict|string|@{JX.HTML}? Property dictionary, or content if you don't
 *                                want to specify any properties.
 * @param string|@{JX.HTML}?      Content string (interpreted as plain text)
 *                                or @{JX.HTML} object (interpreted as HTML,
 *                                which may be dangerous).
 * @return Node                   New node with whatever attributes and
 *                                content were specified.
 */
JX.$N = function(tag, attr, content) {
  if (typeof content == 'undefined' &&
      (typeof attr != 'object' || attr instanceof JX.HTML)) {
    content = attr;
    attr = {};
  }

  if (__DEV__) {
    if (tag.toLowerCase() != tag) {
      throw new Error(
        '$N("'+tag+'", ...): '+
        'tag name must be in lower case; '+
        'use "'+tag.toLowerCase()+'", not "'+tag+'".');
    }
  }

  var node = document.createElement(tag);

  if (attr.style) {
    JX.copy(node.style, attr.style);
    delete attr.style;
  }

  if (attr.sigil) {
    JX.Stratcom.addSigil(node, attr.sigil);
    delete attr.sigil;
  }

  if (attr.meta) {
    JX.Stratcom.addData(node, attr.meta);
    delete attr.meta;
  }

  if (__DEV__) {
    if (('metadata' in attr) || ('data' in attr)) {
      throw new Error(
        '$N(' + tag + ', ...): ' +
        'use the key "meta" to specify metadata, not "data" or "metadata".');
    }
  }

  JX.copy(node, attr);
  if (content) {
    JX.DOM.setContent(node, content);
  }
  return node;
};


/**
 * Query and update the DOM. Everything here is static, this is essentially
 * a collection of common utility functions.
 *
 * @task stratcom Attaching Event Listeners
 * @task content Changing DOM Content
 * @task nodes Updating Nodes
 * @task test Testing DOM Properties
 * @task convenience Convenience Methods
 * @task query Finding Nodes in the DOM
 * @task view Changing View State
 */
JX.install('DOM', {
  statics : {
    _autoid : 0,
    _metrics : {},

    /**
     * @task content
     */
    setContent : function(node, content) {
      if (__DEV__) {
        if (!JX.DOM.isNode(node)) {
          throw new Error(
            'JX.DOM.setContent(<yuck>, ...): '+
            'first argument must be a DOM node.');
        }
      }

      while (node.firstChild) {
        JX.DOM.remove(node.firstChild);
      }
      JX.DOM.appendContent(node, content);
    },


    /**
     * @task content
     */
    prependContent : function(node, content) {
      if (__DEV__) {
        if (!JX.DOM.isNode(node)) {
          throw new Error(
            'JX.DOM.prependContent(<junk>, ...): '+
            'first argument must be a DOM node.');
        }
      }

      this._insertContent(node, content, this._mechanismPrepend);
    },


    /**
     * @task content
     */
    appendContent : function(node, content) {
      if (__DEV__) {
        if (!JX.DOM.isNode(node)) {
          throw new Error(
            'JX.DOM.appendContent(<bleh>, ...): '+
            'first argument must be a DOM node.');
        }
      }

      this._insertContent(node, content, this._mechanismAppend);
    },


    /**
     * @task content
     */
    _mechanismPrepend : function(node, content) {
      node.insertBefore(content, node.firstChild);
    },


    /**
     * @task content
     */
    _mechanismAppend : function(node, content) {
      node.appendChild(content);
    },


    /**
     * @task content
     */
    _insertContent : function(parent, content, mechanism) {
      if (content === null || typeof content == 'undefined') {
        return;
      }
      if (content instanceof JX.HTML) {
        content = content.getFragment();
      }
      if (content instanceof Array) {
        for (var ii = 0; ii < content.length; ii++) {
          var child = (typeof content[ii] == 'string')
            ? document.createTextNode(content[ii])
            : content[ii];
          mechanism(parent, child);
        }
      } else if (content.nodeType) {
        mechanism(parent, content);
      } else {
        mechanism(parent, document.createTextNode(content));
      }
    },


    /**
     * @task nodes
     */
    remove : function(node) {
      node.parentNode && JX.DOM.replace(node, null);
      return node;
    },


    /**
     * @task nodes
     */
    replace : function(node, replacement) {
      if (__DEV__) {
        if (!node.parentNode) {
          throw new Error(
            'JX.DOM.replace(<node>, ...): '+
            'node has no parent node, so it can not be replaced.');
        }
      }

      var mechanism;
      if (node.nextSibling) {
        mechanism = JX.bind(node.nextSibling, function(parent, content) {
          parent.insertBefore(content, this);
        });
      } else {
        mechanism = this._mechanismAppend;
      }
      var parent = node.parentNode;
      node.parentNode.removeChild(node);
      this._insertContent(parent, replacement, mechanism);

      return node;
    },


    /**
     * Retrieve the nearest parent node matching the desired sigil.
     * @param  Node The child element to search from
     * @return  The matching parent or null if no parent could be found
     * @author jgabbard
     */
    nearest : function(node, sigil) {
      while (node && node.getAttribute && !JX.Stratcom.hasSigil(node, sigil)) {
        node = node.parentNode;
      }
      return node;
    },


    serialize : function(form) {
      var elements = form.getElementsByTagName('*');
      var data = {};
      for (var ii = 0; ii < elements.length; ++ii) {
        if (!elements[ii].name) {
          continue;
        }
        var type = elements[ii].type;
        var tag  = elements[ii].tagName;
        if ((type in {radio: 1, checkbox: 1} && elements[ii].checked) ||
             type in {text: 1, hidden: 1, password: 1} ||
              tag in {TEXTAREA: 1, SELECT: 1}) {
          data[elements[ii].name] = elements[ii].value;
        }
      }
      return data;
    },


    /**
     * Test if an object is a valid Node.
     *
     * @task test
     * @param wild Something which might be a Node.
     * @return bool True if the parameter is a DOM node.
     */
    isNode : function(node) {
      return !!(node && node.nodeName && (node !== window));
    },


    /**
     * Test if an object is a node of some specific (or one of several) types.
     * For example, this tests if the node is an ##<input />##, ##<select />##,
     * or ##<textarea />##.
     *
     *   JX.DOM.isType(node, ['input', 'select', 'textarea']);
     *
     * @task    test
     * @param   wild        Something which might be a Node.
     * @param   string|list One or more tags which you want to test for.
     * @return  bool        True if the object is a node, and it's a node of one
     *                      of the provided types.
     */
    isType : function(node, of_type) {
      node = ('' + (node.nodeName || '')).toUpperCase();
      of_type = JX.$AX(of_type);
      for (var ii = 0; ii < of_type.length; ++ii) {
        if (of_type[ii].toUpperCase() == node) {
          return true;
        }
      }
      return false;
    },

    /**
     * Listen for events occuring beneath a specific node in the DOM. This is
     * similar to @{JX.Stratcom.listen()}, but allows you to specify some node
     * which serves as a scope instead of the default scope (the whole document)
     * which you get if you install using @{JX.Stratcom.listen()} directly. For
     * example, to listen for clicks on nodes with the sigil 'menu-item' below
     * the root menu node:
     *
     *   var the_menu = getReferenceToTheMenuNodeSomehow();
     *   JX.DOM.listen(the_menu, 'click', 'menu-item', function(e) { ... });
     *
     * @task stratcom
     * @param Node        The node to listen for events underneath.
     * @param string|list One or more event types to listen for.
     * @param list?       A path to listen on, or a list of paths.
     * @param function    Callback to invoke when a matching event occurs.
     * @return object     A reference to the installed listener. You can later
     *                    remove the listener by calling this object's remove()
     *                    method.
     */
    listen : function(node, type, path, callback) {
      if (__DEV__) {
        var types = JX.$AX(type);
        for (var ix = 0; ix < types.length; ix++) {
          var t = types[ix];

          if (!(t in JX.__allowedEvents)) {
            throw new Error(
              'JX.DOM.listen(...): ' +
              'can only listen to events registered in init.js. "' +
               t + '" not found.');
          }
        }
      }

      var id = ['id:' + JX.DOM.uniqID(node)];
      path = JX.$AX(path || []);
      if (!path.length) {
        path = id;
      } else {
        for (var ii = 0; ii < path.length; ii++) {
          path[ii] = id.concat(JX.$AX(path[ii]));
        }
      }
      return JX.Stratcom.listen(type, path, callback);
    },

    uniqID : function(node) {
      if (!node.id) {
        node.id = 'autoid_'+(++JX.DOM._autoid);
      }
      return node.id;
    },

    alterClass : function(node, className, add) {
      var has = ((' '+node.className+' ').indexOf(' '+className+' ') > -1);
      if (add && !has) {
        node.className += ' '+className;
      } else if (has && !add) {
        node.className = node.className.replace(
          new RegExp('(^|\\s)' + className + '(?:\\s|$)', 'g'), ' ');
      }
    },

    htmlize : function(str) {
      return (''+str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    },


    /**
     * Show one or more elements, by removing their "display" style. This
     * assumes you have hidden them with hide(), or explicitly set the style
     * to "display: none;".
     *
     * @task convenience
     * @param ... One or more nodes to remove "display" styles from.
     * @return void
     */
    show : function() {
      if (__DEV__) {
        for (var ii = 0; ii < arguments.length; ++ii) {
          if (!arguments[ii]) {
            throw new Error(
              'JX.DOM.show(...): ' +
              'one or more arguments were null or empty.');
          }
        }
      }

      for (var ii = 0; ii < arguments.length; ++ii) {
        arguments[ii].style.display = '';
      }
    },


    /**
     * Hide one or more elements, by setting "display: none;" on them. This is
     * a convenience method. See also show().
     *
     * @task convenience
     * @param ... One or more nodes to set "display: none" on.
     * @return void
     */
    hide : function() {
      if (__DEV__) {
        for (var ii = 0; ii < arguments.length; ++ii) {
          if (!arguments[ii]) {
            throw new Error(
              'JX.DOM.hide(...): ' +
              'one or more arguments were null or empty.');
          }
        }
      }

      for (var ii = 0; ii < arguments.length; ++ii) {
        arguments[ii].style.display = 'none';
      }
    },

    textMetrics : function(node, pseudoclass, x) {
      if (!this._metrics[pseudoclass]) {
        var n = JX.$N(
          'var',
          {className: pseudoclass});
        this._metrics[pseudoclass] = n;
      }
      var proxy = this._metrics[pseudoclass];
      document.body.appendChild(proxy);
        proxy.style.width = x ? (x+'px') : '';
        JX.DOM.setContent(
          proxy,
          JX.$H(JX.DOM.htmlize(node.value).replace(/\n/g, '<br />')));
        var metrics = JX.Vector.getDim(proxy);
      document.body.removeChild(proxy);
      return metrics;
    },


    /**
     * Search the document for DOM nodes by providing a root node to look
     * beneath, a tag name, and (optionally) a sigil. Nodes which match all
     * specified conditions are returned.
     *
     * @task query
     *
     * @param  Node    Root node to search beneath.
     * @param  string  Tag name, like 'a' or 'textarea'.
     * @param  string  Optionally, a sigil which nodes are required to have.
     *
     * @return list    List of matching nodes, which may be empty.
     */
    scry : function(root, tagname, sigil) {
      if (__DEV__) {
        if (!JX.DOM.isNode(root)) {
          throw new Error(
            'JX.DOM.scry(<yuck>, ...): '+
            'first argument must be a DOM node.');
        }
      }

      var nodes = root.getElementsByTagName(tagname);
      if (!sigil) {
        return JX.$A(nodes);
      }
      var result = [];
      for (var ii = 0; ii < nodes.length; ii++) {
        if (JX.Stratcom.hasSigil(nodes[ii], sigil)) {
          result.push(nodes[ii]);
        }
      }
      return result;
    },


    /**
     * Select a node uniquely identified by a root, tagname and sigil. This
     * is similar to JX.DOM.scry() but expects exactly one result. It will
     * throw JX.$.NotFound if it matches no results.
     *
     * @task query
     *
     * @param  Node    Root node to search beneath.
     * @param  string  Tag name, like 'a' or 'textarea'.
     * @param  string  Optionally, sigil which selected node must have.
     *
     * @return Node    Node uniquely identified by the criteria.
     */
    find : function(root, tagname, sigil) {
      if (__DEV__) {
        if (!JX.DOM.isNode(root)) {
          throw new Error(
            'JX.DOM.find(<glop>, "'+tagname+'", "'+sigil+'"): '+
            'first argument must be a DOM node.');
        }
      }

      var result = JX.DOM.scry(root, tagname, sigil);

      if (__DEV__) {
        if (result.length > 1) {
          throw new Error(
            'JX.DOM.find(<node>, "'+tagname+'", "'+sigil+'"): '+
            'matched more than one node.');
        }
      }

      if (!result.length) {
        throw JX.$.NotFound;
      }

      return result[0];
    },


    /**
     * Focus a node safely. This is just a convenience wrapper that allows you
     * to avoid IE's habit of throwing when nearly any focus operation is
     * invoked.
     *
     * @task convenience
     * @param Node Node to move cursor focus to, if possible.
     * @return void
     */
    focus : function(node) {
      try { node.focus(); } catch (lol_ie) {}
    },

    /**
     * Scroll to the position of an element in the document.
     * @task view
     * @param Node Node to move document scroll position to, if possible.
     * @return void
     */
     scrollTo : function(node) {
       window.scrollTo(0, JX.$V(node).y);
     }
  }
});

/**
 *  Simple JSON serializer.
 *
 *  @requires javelin-install javelin-util
 *  @provides javelin-json
 *  @javelin
 */

JX.install('JSON', {
  statics : {
    serialize : function(obj) {
      if (__DEV__) {
        try {
          return JX.JSON._val(obj);
        } catch (x) {
          JX.log(
            'JX.JSON.serialize(...): '+
            'caught exception while serializing object. ('+x+')');
        }
      } else {
        return JX.JSON._val(obj);
      }
    },
    _val : function(val) {
      var out = [];
      if (val === null) {
        return 'null';
      } else if (val.push && val.pop) {
        for (var ii = 0; ii < val.length; ii++) {
          if (typeof val[ii] != 'undefined') {
            out.push(JX.JSON._val(val[ii]));
          }
        }
        return '['+out.join(',')+']';
      } else if (val === true) {
        return 'true';
      } else if (val === false) {
        return 'false';
      } else if (typeof val == 'string') {
        return JX.JSON._esc(val);
      } else if (typeof val == 'number') {
        return val;
      } else {
        for (var k in val) {
          out.push(JX.JSON._esc(k)+':'+JX.JSON._val(val[k]));
        }
        return '{'+out.join(',')+'}';
      }
    },

    // Lifted more or less directly from Crockford's JSON2.
    _escexp : /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,

    _meta : {
      '\b' : '\\b',
      '\t' : '\\t',
      '\n' : '\\n',
      '\f' : '\\f',
      '\r' : '\\r',
      '"'  : '\\"',
      '\\' : '\\\\'
    },

    _esc : function(str) {
      JX.JSON._escexp.lastIndex = 0;
      return JX.JSON._escexp.test(str) ?
        '"' + str.replace(JX.JSON._escexp, JX.JSON._replace) + '"' :
        '"' + str + '"';
    },

    _replace : function(m) {
      if (m in JX.JSON._meta) {
        return JX.JSON._meta[m];
      }
      return '\\u' + (('0000' + m.charCodeAt(0).toString(16)).slice(-4));
    }

  }
});

}});
require.define({'mixins/actionable': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/mixins/actionable.js */
var view = require('view');
var util = require('util');

exports.Actionable = {
  actionableInit: function() {
    this.setSigil('touchable');
    this.listen(view.touchEvents.TOUCHEND, util.bind(this.actionableTouchEnd, this));
  },

  actionableTouchEnd: function(evt) {
    if (util.hasClass(this.getNode(), 'touched')) {
      this.doAction(evt);
    }
  },

  doAction: function(evt) {
    var actions = this._actions;
    var action;

    if (!actions) {
      return;
    }

    for (var i = 0; i < actions.length; i++) {
      action = actions[i];
      if (typeof action == 'string') {
        this.getOwner()[action](this, evt);
      } else if (action) {
        action(this, evt);
      }
    }
  },

  addAction: function(action) {
    this._actions = this._actions || [];
    this._actions.push(action);
  },

  setAction: function(action) {
    this._actions = [action];
  }
};
}});
require.define({'mixins/animateable': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/mixins/animateable.js */
var util = require('util');
/**
 * Methods for managing animation of views
 */
exports.Animateable = {
  /**
   * perform an animation using a webkitTransform
   */
  animate: function(properties, callback, duration, ease) {
    var transforms = [], opacity, key;
    var node = this.getNode();
    util.forEach(properties, function(value, key) {
      if (key === 'opacity') {
        opacity = value;
      } else {
        transforms.push(key + '(' + value + ')');
      }
    });
    if (typeof callback === 'function') {
      // fires one time
      var transition = node.addEventListener('webkitTransitionEnd', function() {
        callback();
        node.removeEventListener('webkitTransitionEnd', arguments.callee);
      });
    }
    this.setStyle({
      'webkitTransition': 'all ' + (duration !== undefined ? duration : 0.5) + 's ' + (ease || ''),
      'webkitTransform': transforms.join(' '),
      opacity: opacity
    });
  }
};

}});
require.define({'mixins/has_event_listeners': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/mixins/has_event_listeners.js */
var util = require('util');
var HasEventListeners = exports.HasEventListeners = {

  // declaratively set event listeners
  setEventListeners: function(listeners) {
    this.clearEventListeners();
    // event listeners are defined with the format:
    // [comma separated event] [query selector]: [string callback name]
    // e.g.
    // 'mousedown,touchstart .foo.bar': 'onFooBarTouch'
    var splitter = /^(\S+)\s+(.*)$/;
    for (var eventKey in listeners) {
      var match = eventKey.match(splitter);
      var events = match[1].split(',');
      for (var i = 0; i < events.length; i++) {
        var evt = events[i];
        var selector = match[2];
        var callback = listeners[eventKey];
        this.addListener(evt, selector, callback);
      }
    }
  },

  // clear all event listeners
  clearEventListeners: function() {
    util.invoke(this._eventListeners || [], 'remove');
  },

  // add an event listener
  addListener: function(e, selector, callback) {
    var node = this.getNode();
    // wrap the callback invocation in a matching function that provides the
    // event delegation capability
    var wrapper = util.bind(function(e) {
      var matches = node.querySelectorAll(selector);
      for (var target = e.target; target && target !== node; target = target.parentNode) {
        for (var i = 0; i < matches.length; i++) {
          if (matches[i] === target) this[callback].call(this, e, target);
        }
      }
    }, this);
    this._eventListeners = this._eventListeners || [];
    var listener = {
      e: e,
      selector: selector,
      callback: wrapper,
      remove: function() {node.removeEventListener(e, wrapper);}
    };
    this._eventListeners.push(listener);
    this.getNode().addEventListener(e, wrapper);
    return listener;
  }
};

}});
require.define({'util/event_manager': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/util/event_manager.js */
// Event Manager Provides a global singleton for invoking and listening to
// high-level system events.
//
// In general it is better to invoke and listen for events at a more granular;
// however, at times it is more practical to provide a global Event bus that
// any object can hook into. This object should be used for that purpose.
//
// Please do not abuse it.

var util   = require('util'),
    Events = require('mixins/events').Events;

exports.EventManager = util.extend({}, Events);

}});
require.define({'util/image_queue': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/util/image_queue.js */
// ImageQueue is an image queueing service which loads images
// in sequence.  The most newly added image is downloaded first.

// Call the add() function to add an image to be loaded.  This takes
// three parameters:
// - url: the url of the image to load
// - callback: a function to be called back.  This is passed the url that has
//             requested, and a boolean value stating whether or not it was
//             successfullly loaded.
// - scope: an optional parameter which defines the scope in which the
//          callback function is executed.  Defaults to window.

// To pause the image loading queue, call the pause() method.
// To resume the image loading queue, call the run() method.

// The number of images to load at one time

var threshold = 2;

var paused = false;
var hardPause = false;

var queue = [];
var inflight = [];
var cached = {};
var deferred = [];

// Handle the loading of the image
function handleLoad(event) {

  // Find the matching callback
  var data;
  var success = event.type == 'load';

  for (var i = 0; i < inflight.length; i++) {
    data = inflight[i];
    if (data.img === event.target) {
      inflight.splice(i, 1);
      cached[data.url] = data.img;
      doCallback(data.url, data.callback, data.scope, success);
      break;
    }
  }

  if (!paused) {
    next();
  }
}

// Load the next image
function next() {
  if (paused) {
    return;
  }
  var data = queue.pop();
  if (!data) {
    return;
  }

  var img = document.createElement('img');
  img.onload = img.onerror = handleLoad;
  data.img = img;
  inflight.push(data);
  img.src = data.url;
}

// Execute the callback, unless a hard pause in in effect, 
// in which case enqueue it for execution when the queue
// starts running again
function doCallback(url, callback, scope, success) {
  if (paused && hardPause) {
    deferred.push({
      url: url,
      callback: callback,
      scope: scope,
      success: success
    });
    return;
  }
  callback.call(
    scope || window,
    url,
    success);
}

// Filter an array, removing the matching url, callback and scope
var filterArr = function(arr, url, callback, scope) {
  var i;
  var data;
  for (i = 0; i < arr.length; i++) {
    data = arr[i];
    if (data.url == url &&
        data.callback === callback &&
        (!scope || scope === data.scope)) {
      arr.splice(i, 1);
    }
  }
};

// Add a new image, specifying the url and callback.
exports.add = function(url, callback, scope) {

  if (cached[url]) {
    // If the image is already loaded, call back immediately
    doCallback(url, callback, scope, true);
    return;
  }

  queue.push({
    url: url,
    callback: callback,
    scope: scope
  });

  if (inflight.length < threshold) {
    next();
  }
};

// Remove a previously requested image load from the queue
exports.remove = function(url, callback, scope) {
  filterArr(queue, url, callback, scope);
  filterArr(inflight, url, callback, scope);
  filterArr(deferred, url, callback, scope);
};

// Start the queue running again
exports.run = function() {
  paused = false;

  // Go through any deferred callbacks and execute them
  var data;
  for (var i = 0; i < deferred.length; i++) {
    data = deferred[i];
    doCallback(data.url, data.callback, data.scope, data.success);
  }
  deferred = [];

  while (queue.length > 0 && inflight.length < threshold) {
    next();
  }
};

// Pause the image loading.  If the isHard parameter is true, even cached
// images are not sent back to the callee.
exports.pause = function(isHard) {
  paused = true;
  hardPause = isHard;
};

// Clear all loading images.
exports.clear = function() {
  queue = [];
  inflight = [];
  deferred = [];
}
}});
require.define({'iscroll': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/vendor/iscroll.js */
/**
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * iScroll v4.0 Beta 4
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * Copyright (c) 2010 Matteo Spinelli, http://cubiq.org/
 * Released under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 *
 * Last updated: 2011.03.10
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 */

(function(){
function iScroll (el, options) {
	var that = this, doc = document, div, i;

	that.wrapper = typeof el == 'object' ? el : doc.getElementById(el);
	that.wrapper.style.overflow = 'hidden';
	that.scroller = that.wrapper.children[0];

	// Default options
	that.options = {
		HWTransition: true,		// Experimental, internal use only
		HWCompositing: true,	// Experimental, internal use only
		hScroll: true,
		vScroll: true,
		hScrollbar: true,
		vScrollbar: true,
		fixedScrollbar: isAndroid,
		fadeScrollbar: (isIDevice && has3d) || !hasTouch,
		hideScrollbar: isIDevice || !hasTouch,
		scrollbarClass: '',
		bounce: has3d,
		bounceLock: false,
		momentum: has3d,
		lockDirection: true,
		zoom: false,
		zoomMin: 1,
		zoomMax: 4,
		snap: false,
		pullToRefresh: false,
		pullDownLabel: ['Pull down to refresh...', 'Release to refresh...', 'Loading...'],
		pullUpLabel: ['Pull up to refresh...', 'Release to refresh...', 'Loading...'],
		onPullDown: function () {},
		onPullUp: function () {},
		onScrollStart: null,
		onScrollChange: null,
		onScrollEnd: null,
		onZoomStart: null,
		onZoomEnd: null,
		checkDOMChange: false		// Experimental
	};

	// User defined options
	for (i in options) {
		that.options[i] = options[i];
	}

	that.options.HWCompositing = that.options.HWCompositing && hasCompositing;
	that.options.HWTransition = that.options.HWTransition && hasCompositing;

	if (that.options.HWCompositing) {
		that.scroller.style.cssText += '-webkit-transition-property:-webkit-transform;-webkit-transform-origin:0 0;-webkit-transform:' + trnOpen + '0,0' + trnClose;
	} else {
		that.scroller.style.cssText += '-webkit-transition-property:top,left;-webkit-transform-origin:0 0;top:0;left:0';
	}

	if (that.options.HWTransition) {
		that.scroller.style.cssText += '-webkit-transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);-webkit-transition-duration:0;';
	}

	that.options.hScrollbar = that.options.hScroll && that.options.hScrollbar;
	that.options.vScrollbar = that.options.vScroll && that.options.vScrollbar;

	that.pullDownToRefresh = that.options.pullToRefresh == 'down' || that.options.pullToRefresh == 'both';
	that.pullUpToRefresh = that.options.pullToRefresh == 'up' || that.options.pullToRefresh == 'both';

	if (that.pullDownToRefresh) {
		div = doc.createElement('div');
		div.className = 'iScrollPullDown';
		div.innerHTML = '<span class="iScrollPullDownIcon"></span><span class="iScrollPullDownLabel">' + that.options.pullDownLabel[0] + '</span>\n';
		that.scroller.insertBefore(div, that.scroller.children[0]);
		that.options.bounce = true;
		that.pullDownEl = div;
		that.pullDownLabel = div.getElementsByTagName('span')[1];
	}

	if (that.pullUpToRefresh) {
		div = doc.createElement('div');
		div.className = 'iScrollPullUp';
		div.innerHTML = '<span class="iScrollPullUpIcon"></span><span class="iScrollPullUpLabel">' + that.options.pullUpLabel[0] + '</span>\n';
		that.scroller.appendChild(div);
		that.options.bounce = true;
		that.pullUpEl = div;
		that.pullUpLabel = div.getElementsByTagName('span')[1];
	}

	that.refresh();

	that._bind(RESIZE_EV, window);
	that._bind(START_EV);
/*	that._bind(MOVE_EV);
	that._bind(END_EV);
	that._bind(CANCEL_EV);*/

	if (hasGesture && that.options.zoom) {
		that._bind('gesturestart');
		that.scroller.style.webkitTransform = that.scroller.style.webkitTransform + ' scale(1)';
	}

	if (!hasTouch) {
		that._bind('mousewheel');
	}

	if (that.options.checkDOMChange) {
		that.DOMChangeInterval = setInterval(function () { that._checkSize(); }, 250);
	}
}

iScroll.prototype = {
	x: 0, y: 0,
	currPageX: 0, currPageY: 0,
	pagesX: [], pagesY: [],
	offsetBottom: 0,
	offsetTop: 0,
	scale: 1, lastScale: 1,
	contentReady: true,

	handleEvent: function (e) {
		var that = this;

		switch(e.type) {
			case START_EV: that._start(e); break;
			case MOVE_EV: that._move(e); break;
			case END_EV:
			case CANCEL_EV: that._end(e); break;
			case 'webkitTransitionEnd': that._transitionEnd(e); break;
			case RESIZE_EV: that._resize(); break;
			case 'gesturestart': that._gestStart(e); break;
			case 'gesturechange': that._gestChange(e); break;
			case 'gestureend':
			case 'gesturecancel': that._gestEnd(e); break;
			case 'mousewheel': that._wheel(e); break;
			default: break;
		}
	},

	_scrollbar: function (dir) {
		var that = this,
			doc = document,
			bar;

		if (!that[dir + 'Scrollbar']) {
			if (that[dir + 'ScrollbarWrapper']) {
				that[dir + 'ScrollbarIndicator'].style.webkitTransform = '';	// Should free some mem
				that[dir + 'ScrollbarWrapper'].parentNode.removeChild(that[dir + 'ScrollbarWrapper']);
				that[dir + 'ScrollbarWrapper'] = null;
				that[dir + 'ScrollbarIndicator'] = null;
			}

			return;
		}

		if (!that[dir + 'ScrollbarWrapper']) {
			// Create the scrollbar wrapper
			bar = doc.createElement('div');
			if (that.options.scrollbarClass) {
				bar.className = that.options.scrollbarClass + dir.toUpperCase();
			} else {
				bar.style.cssText = 'position:absolute;z-index:100;' + (dir == 'h' ? 'height:7px;bottom:1px;left:2px;right:7px' : 'width:7px;bottom:7px;top:2px;right:1px');
			}
			bar.style.cssText += 'pointer-events:none;-webkit-transition-property:opacity;-webkit-transition-duration:' + (that.options.fadeScrollbar ? '350ms' : '0') + ';overflow:hidden;opacity:' + (that.options.hideScrollbar ? '0' : '1');

			that.wrapper.appendChild(bar);
			that[dir + 'ScrollbarWrapper'] = bar;

			// Create the scrollbar indicator
			bar = doc.createElement('div');
			if (!that.options.scrollbarClass) {
				bar.style.cssText = 'position:absolute;z-index:100;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);-webkit-background-clip:padding-box;-webkit-box-sizing:border-box;' + (dir == 'h' ? 'height:100%;-webkit-border-radius:4px 3px;' : 'width:100%;-webkit-border-radius:3px 4px;');
			}
			bar.style.cssText += 'pointer-events:none;-webkit-transition-property:-webkit-transform;-webkit-transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);-webkit-transition-duration:0;-webkit-transform:' + trnOpen + '0,0' + trnClose;

			that[dir + 'ScrollbarWrapper'].appendChild(bar);
			that[dir + 'ScrollbarIndicator'] = bar;
		}

		if (dir == 'h') {
			that.hScrollbarSize = that.hScrollbarWrapper.clientWidth;
			that.hScrollbarIndicatorSize = m.max(m.round(that.hScrollbarSize * that.hScrollbarSize / that.scrollerW), 8);
			that.hScrollbarIndicator.style.width = that.hScrollbarIndicatorSize + 'px';
			that.hScrollbarMaxScroll = that.hScrollbarSize - that.hScrollbarIndicatorSize;
			that.hScrollbarProp = that.hScrollbarMaxScroll / that.maxScrollX;
		} else {
			that.vScrollbarSize = that.vScrollbarWrapper.clientHeight;
			that.vScrollbarIndicatorSize = m.max(m.round(that.vScrollbarSize * that.vScrollbarSize / that.scrollerH), 8);
			that.vScrollbarIndicator.style.height = that.vScrollbarIndicatorSize + 'px';
			that.vScrollbarMaxScroll = that.vScrollbarSize - that.vScrollbarIndicatorSize;
			that.vScrollbarProp = that.vScrollbarMaxScroll / that.maxScrollY;
		}

		// Reset position
		that._indicatorPos(dir, true);
	},

	_resize: function () {
		var that = this;

		//if (that.options.momentum) that._unbind('webkitTransitionEnd');

		setTimeout(function () {
			that.refresh();
		}, 0);
	},

	_checkSize: function () {
		var that = this,
			scrollerW,
			scrollerH;

		if (that.moved || that.zoomed || !that.contentReady) return;

		scrollerW = m.round(that.scroller.offsetWidth * that.scale),
		scrollerH = m.round((that.scroller.offsetHeight - that.offsetBottom - that.offsetTop) * that.scale);

		if (scrollerW == that.scrollerW && scrollerH == that.scrollerH) return;

		that.refresh();
	},

	_pos: function (x, y) {
		var that = this;

		that.x = that.hScroll ? x : 0;
		that.y = that.vScroll ? y : 0;

		that.scroller.style.webkitTransform = trnOpen + that.x + 'px,' + that.y + 'px' + trnClose + ' scale(' + that.scale + ')';
//		that.scroller.style.left = that.x + 'px';
//		that.scroller.style.top = that.y + 'px';

		that._indicatorPos('h');
		that._indicatorPos('v');
	},

	_indicatorPos: function (dir, hidden) {
		var that = this,
			pos = dir == 'h' ? that.x : that.y;

		if (!that[dir + 'Scrollbar']) return;

		pos = that[dir + 'ScrollbarProp'] * pos;

		if (pos < 0) {
			pos = that.options.fixedScrollbar ? 0 : pos + pos*3;
			if (that[dir + 'ScrollbarIndicatorSize'] + pos < 9) pos = -that[dir + 'ScrollbarIndicatorSize'] + 8;
		} else if (pos > that[dir + 'ScrollbarMaxScroll']) {
			pos = that.options.fixedScrollbar ? that[dir + 'ScrollbarMaxScroll'] : pos + (pos - that[dir + 'ScrollbarMaxScroll'])*3;
			if (that[dir + 'ScrollbarIndicatorSize'] + that[dir + 'ScrollbarMaxScroll'] - pos < 9) pos = that[dir + 'ScrollbarIndicatorSize'] + that[dir + 'ScrollbarMaxScroll'] - 8;
		}
		that[dir + 'ScrollbarWrapper'].style.webkitTransitionDelay = '0';
		that[dir + 'ScrollbarWrapper'].style.opacity = hidden && that.options.hideScrollbar ? '0' : '1';
		that[dir + 'ScrollbarIndicator'].style.webkitTransform = trnOpen + (dir == 'h' ? pos + 'px,0' : '0,' + pos + 'px') + trnClose;
	},

	_transitionTime: function (time) {
		var that = this;

		time += 'ms';
		that.scroller.style.webkitTransitionDuration = time;

		if (that.hScrollbar) that.hScrollbarIndicator.style.webkitTransitionDuration = time;
		if (that.vScrollbar) that.vScrollbarIndicator.style.webkitTransitionDuration = time;
	},

	_start: function (e) {
		var that = this,
			point = hasTouch ? e.changedTouches[0] : e,
			matrix;

		that.moved = false;

		e.preventDefault();

		if (hasTouch && e.touches.length == 2 && that.options.zoom && hasGesture && !that.zoomed) {
			that.originX = m.abs(e.touches[0].pageX + e.touches[1].pageX - that.wrapperOffsetLeft*2) / 2 - that.x;
			that.originY = m.abs(e.touches[0].pageY + e.touches[1].pageY - that.wrapperOffsetTop*2) / 2 - that.y;
		}

		that.moved = false;
		that.distX = 0;
		that.distY = 0;
		that.absDistX = 0;
		that.absDistY = 0;
		that.dirX = 0;
		that.dirY = 0;
		that.returnTime = 0;

		that._transitionTime(0);

		if (that.options.momentum) {
			if (that.scrollInterval) {
				clearInterval(that.scrollInterval);
				that.scrollInterval = null;
			}

			if (that.options.HWCompositing) {
				matrix = new WebKitCSSMatrix(window.getComputedStyle(that.scroller, null).webkitTransform);
				if (matrix.m41 != that.x || matrix.m42 != that.y) {
					that._unbind('webkitTransitionEnd');
					that._pos(matrix.m41, matrix.m42);
				}
			} else {
				matrix = window.getComputedStyle(that.scroller, null);
				if (that.x + 'px' != matrix.left || that.y + 'px' != matrix.top) {
					that._unbind('webkitTransitionEnd');
					that._pos(matrix.left.replace(/[^0-9]/g)*1, matrix.top.replace(/[^0-9]/g)*1);
				}
			}

		}

		that.scroller.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.66,1)';
		if (that.hScrollbar) that.hScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.66,1)';
		if (that.vScrollbar) that.vScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.66,1)';
		that.startX = that.x;
		that.startY = that.y;
		that.pointX = point.pageX;
		that.pointY = point.pageY;

		that.startTime = e.timeStamp;

		// Registering/unregistering of events is done to preserve resources on Android
//		setTimeout(function () {
//			that._unbind(START_EV);
			that._bind(MOVE_EV);
			that._bind(END_EV);
			that._bind(CANCEL_EV);
//		}, 0);
	},

	_move: function (e) {
		if (hasTouch && e.touches.length > 1) return;

		var that = this,
			point = hasTouch ? e.changedTouches[0] : e,
			deltaX = point.pageX - that.pointX,
			deltaY = point.pageY - that.pointY,
			newX = that.x + deltaX,
			newY = that.y + deltaY;

		e.preventDefault();

		that.pointX = point.pageX;
		that.pointY = point.pageY;

		// Slow down if outside of the boundaries
		if (newX > 0 || newX < that.maxScrollX) {
			newX = that.options.bounce ? that.x + (deltaX / 2.4) : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX;
		}
		if (newY > 0 || newY < that.maxScrollY) {
			newY = that.options.bounce ? that.y + (deltaY / 2.4) : newY >= 0 || that.maxScrollY >= 0 ? 0 : that.maxScrollY;

			// Pull down to refresh
			if (that.options.pullToRefresh && that.contentReady) {
				if (that.pullDownToRefresh && newY > that.offsetBottom) {
					that.pullDownEl.className = 'iScrollPullDown flip';
					that.pullDownLabel.innerText = that.options.pullDownLabel[1];
				} else if (that.pullDownToRefresh && that.pullDownEl.className.match('flip')) {
					that.pullDownEl.className = 'iScrollPullDown';
					that.pullDownLabel.innerText = that.options.pullDownLabel[0];
				}

				if (that.pullUpToRefresh && newY < that.maxScrollY - that.offsetTop) {
					that.pullUpEl.className = 'iScrollPullUp flip';
					that.pullUpLabel.innerText = that.options.pullUpLabel[1];
				} else if (that.pullUpToRefresh && that.pullUpEl.className.match('flip')) {
					that.pullUpEl.className = 'iScrollPullUp';
					that.pullUpLabel.innerText = that.options.pullUpLabel[0];
				}
			}
		}

		if (that.absDistX < 4 && that.absDistY < 4) {
			that.distX += deltaX;
			that.distY += deltaY;
			that.absDistX = m.abs(that.distX);
			that.absDistY = m.abs(that.distY);
			return;
		}

		// Lock direction
		if (that.options.lockDirection) {
			if (that.absDistX > that.absDistY+3) {
				newY = that.y;
				deltaY = 0;
			} else if (that.absDistY > that.absDistX+3) {
				newX = that.x;
				deltaX = 0;
			}
		}

    // NB wbailey: only fire onScrollStart if we are transitioning from not
    //             moved to moved state
		if (!that.moved && that.options.onScrollStart) that.options.onScrollStart.call(that);
		that.moved = true;

		that._pos(newX, newY);
		that.dirX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
		that.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

		if (e.timeStamp - that.startTime > 300) {
			that.startTime = e.timeStamp;
			that.startX = that.x;
			that.startY = that.y;
		}
	},

	_end: function (e) {
		if (hasTouch && e.touches.length !== 0) return;

		var that = this,
			point = hasTouch ? e.changedTouches[0] : e,
			target, ev,
			momentumX = { dist:0, time:0 },
			momentumY = { dist:0, time:0 },
			duration = e.timeStamp - that.startTime,
			newPosX = that.x, newPosY = that.y,
			newDuration,
			snap;

//		that._bind(START_EV);
		that._unbind(MOVE_EV);
		that._unbind(END_EV);
		that._unbind(CANCEL_EV);

		if (that.zoomed) return;

		if (!that.moved) {
			if (hasTouch && that.options.zoom) {
				if (that.doubleTapTimer) {
					// Double tapped
					clearTimeout(that.doubleTapTimer);
					that.doubleTapTimer = null;
					that.zoom(that.pointX, that.pointY, that.scale == 1 ? 2 : 1);
				} else {
					that.doubleTapTimer = setTimeout(function () {
						that.doubleTapTimer = null;

						// Find the last touched element
						target = point.target;
						while (target.nodeType != 1) {
							target = target.parentNode;
						}

						ev = document.createEvent('MouseEvents');
						ev.initMouseEvent('click', true, true, e.view, 1,
							point.screenX, point.screenY, point.clientX, point.clientY,
							e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
							0, null);
						ev._fake = true;
						target.dispatchEvent(ev);
					}, that.options.zoom ? 250 : 0);
				}
			}

			that._resetPos();
			return;
		}

		if (that.pullDownToRefresh && that.contentReady && that.pullDownEl.className.match('flip')) {
			that.pullDownEl.className = 'iScrollPullDown loading';
			that.pullDownLabel.innerText = that.options.pullDownLabel[2];
			that.scroller.style.marginTop = '0';
			that.offsetBottom = 0;
			that.refresh();
			that.contentReady = false;
			that.options.onPullDown();
		}

		if (that.pullUpToRefresh && that.contentReady && that.pullUpEl.className.match('flip')) {
			that.pullUpEl.className = 'iScrollPullUp loading';
			that.pullUpLabel.innerText = that.options.pullUpLabel[2];
			that.scroller.style.marginBottom = '0';
			that.offsetTop = 0;
			that.refresh();
			that.contentReady = false;
			that.options.onPullUp();
		}

		if (duration < 300 && that.options.momentum) {
			momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX;
			momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, (that.maxScrollY < 0 ? that.scrollerH - that.wrapperH + that.y : 0), that.options.bounce ? that.wrapperH : 0) : momentumY;

			newPosX = that.x + momentumX.dist;
			newPosY = that.y + momentumY.dist;

 			if ((that.x > 0 && newPosX > 0) || (that.x < that.maxScrollX && newPosX < that.maxScrollX)) momentumX = { dist:0, time:0 };
 			if ((that.y > 0 && newPosY > 0) || (that.y < that.maxScrollY && newPosY < that.maxScrollY)) momentumY = { dist:0, time:0 };
		}

		if (momentumX.dist || momentumY.dist) {
			newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);

			// Do we need to snap?
			if (that.options.snap) {
				snap = that._snap(newPosX, newPosY);
				newPosX = snap.x;
				newPosY = snap.y;
				newDuration = m.max(snap.time, newDuration);
			}

/*			if (newPosX > 0 || newPosX < that.maxScrollX || newPosY > 0 || newPosY < that.maxScrollY) {
				// Subtle change of scroller motion
				that.scroller.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.5,1)';
				if (that.hScrollbar) that.hScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.5,1)';
				if (that.vScrollbar) that.vScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.5,1)';
			}*/

			if (that.options.onScrollChange) that.options.onScrollChange.call(that, newPosX, newPosY);

			that.scrollTo(newPosX, newPosY, newDuration);
			return;
		}

		// Do we need to snap?
		if (that.options.snap) {
			snap = that._snap(that.x, that.y);
			if (snap.x != that.x || snap.y != that.y) {
				if (that.options.onScrollChange) that.options.onScrollChange.call(that, newPosX, newPosY);

				that.scrollTo(snap.x, snap.y, snap.time);
			}
			return;
		}

		that._resetPos();
	},

	_resetPos: function (time) {
		var that = this,
			resetX = that.x,
			resetY = that.y;

		if (that.x >= 0) resetX = 0;
		else if (that.x < that.maxScrollX) resetX = that.maxScrollX;

		if (that.y >= 0 || that.maxScrollY > 0) resetY = 0;
		else if (that.y < that.maxScrollY) resetY = that.maxScrollY;

		if (resetX == that.x && resetY == that.y) {
			if (that.moved) {
				if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);		// Execute custom code on scroll end
				that.moved = false;
			}

			if (that.zoomed) {
				if (that.options.onZoomEnd) that.options.onZoomEnd.call(that);			// Execute custom code on scroll end
				that.zoomed = false;
			}

			if (that.hScrollbar && that.options.hideScrollbar) {
				that.hScrollbarWrapper.style.webkitTransitionDelay = '300ms';
				that.hScrollbarWrapper.style.opacity = '0';
			}
			if (that.vScrollbar && that.options.hideScrollbar) {
				that.vScrollbarWrapper.style.webkitTransitionDelay = '300ms';
				that.vScrollbarWrapper.style.opacity = '0';
			}

			return;
		}

		if (time === undefined) time = 200;

		// Invert ease
		if (time) {
			that.scroller.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.0,0.33,1)';
			if (that.hScrollbar) that.hScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.0,0.33,1)';
			if (that.vScrollbar) that.vScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.0,0.33,1)';
		}

		that.scrollTo(resetX, resetY, time);
	},

	_timedScroll: function (destX, destY, runtime) {
		var that = this,
			startX = that.x, startY = that.y,
			startTime = (new Date).getTime(),
			easeOut;

		that._transitionTime(0);

		if (that.scrollInterval) {
			clearInterval(that.scrollInterval);
			that.scrollInterval = null;
		}

		that.scrollInterval = setInterval(function () {
			var now = (new Date).getTime(),
				newX, newY;

			if (now >= startTime + runtime) {
				clearInterval(that.scrollInterval);
				that.scrollInterval = null;

				that._pos(destX, destY);
				that._transitionEnd();
				return;
			}

			now = (now - startTime) / runtime - 1;
			easeOut = m.sqrt(1 - now * now);
			newX = (destX - startX) * easeOut + startX;
			newY = (destY - startY) * easeOut + startY;
			that._pos(newX, newY);
		}, 20);
	},

	_transitionEnd: function (e) {
		var that = this;

		if (e) e.stopPropagation();

		that._unbind('webkitTransitionEnd');

		that._resetPos(that.returnTime);
		that.returnTime = 0;
	},


	/**
	 *
	 * Gestures
	 *
	 */
	_gestStart: function (e) {
		var that = this;

		that._transitionTime(0);
		that.lastScale = 1;

		if (that.options.onZoomStart) that.options.onZoomStart.call(that);

		that._unbind('gesturestart');
		that._bind('gesturechange');
		that._bind('gestureend');
		that._bind('gesturecancel');
	},

	_gestChange: function (e) {
		var that = this,
			scale = that.scale * e.scale,
			x, y, relScale;

		that.zoomed = true;

		if (scale < that.options.zoomMin) scale = that.options.zoomMin;
		else if (scale > that.options.zoomMax) scale = that.options.zoomMax;

		relScale = scale / that.scale;
		x = that.originX - that.originX * relScale + that.x;
		y = that.originY - that.originY * relScale + that.y;
		that.scroller.style.webkitTransform = trnOpen + x + 'px,' + y + 'px' + trnClose + ' scale(' + scale + ')';
		that.lastScale = relScale;
	},

	_gestEnd: function (e) {
		var that = this,
			scale = that.scale,
			lastScale = that.lastScale;

		that.scale = scale * lastScale;
		if (that.scale < that.options.zoomMin + 0.05) that.scale = that.options.zoomMin;
		else if (that.scale > that.options.zoomMax - 0.05) that.scale = that.options.zoomMax;
		lastScale = that.scale / scale;
		that.x = that.originX - that.originX * lastScale + that.x;
		that.y = that.originY - that.originY * lastScale + that.y;

		that.scroller.style.webkitTransform = trnOpen + that.x + 'px,' + that.y + 'px' + trnClose + ' scale(' + that.scale + ')';

		setTimeout(function () {
			that.refresh();
		}, 0);

		that._bind('gesturestart');
		that._unbind('gesturechange');
		that._unbind('gestureend');
		that._unbind('gesturecancel');
	},

	_wheel: function (e) {
		var that = this,
			deltaX = that.x + e.wheelDeltaX / 12,
			deltaY = that.y + e.wheelDeltaY / 12;

		if (deltaX > 0) deltaX = 0;
		else if (deltaX < that.maxScrollX) deltaX = that.maxScrollX;

		if (deltaY > 0) deltaY = 0;
		else if (deltaY < that.maxScrollY) deltaY = that.maxScrollY;

		that.scrollTo(deltaX, deltaY, 0);
	},


	/**
	 *
	 * Utilities
	 *
	 */
	_momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
		var that = this,
			deceleration = 0.0006,
			speed = m.abs(dist) / time,
			newDist = (speed * speed) / (2 * deceleration),
			newTime = 0, outsideDist = 0;

		// Proportinally reduce speed if we are outside of the boundaries
		if (dist > 0 && newDist > maxDistUpper) {
			outsideDist = size / (6 / (newDist / speed * deceleration));
			maxDistUpper = maxDistUpper + outsideDist;
			that.returnTime = 800 / size * outsideDist + 100;
			speed = speed * maxDistUpper / newDist;
			newDist = maxDistUpper;
		} else if (dist < 0 && newDist > maxDistLower) {
			outsideDist = size / (6 / (newDist / speed * deceleration));
			maxDistLower = maxDistLower + outsideDist;
			that.returnTime = 800 / size * outsideDist + 100;
			speed = speed * maxDistLower / newDist;
			newDist = maxDistLower;
		}

		newDist = newDist * (dist < 0 ? -1 : 1);
		newTime = speed / deceleration;

		return { dist: newDist, time: m.round(newTime) };
	},

	_offset: function (el, tree) {
		var left = -el.offsetLeft,
			top = -el.offsetTop;

		if (!tree) return { x: left, y: top };

		while (el = el.offsetParent) {
			left -= el.offsetLeft;
			top -= el.offsetTop;
		}

		return { x: left, y: top };
	},

	_snap: function (x, y) {
		var that = this,
			i, l,
			page, time,
			sizeX, sizeY;

		// Check page X
		page = that.pagesX.length-1;
		for (i=0, l=that.pagesX.length; i<l; i++) {
			if (x >= that.pagesX[i]) {
				page = i;
				break;
			}
		}
		if (page == that.currPageX && page > 0 && that.dirX < 0) page--;
		x = that.pagesX[page];
		sizeX = m.abs(x - that.pagesX[that.currPageX]);
		sizeX = sizeX ? m.abs(that.x - x) / sizeX * 500 : 0;
		that.currPageX = page;

		// Check page Y
		page = that.pagesY.length-1;
		for (i=0; i<page; i++) {
			if (y >= that.pagesY[i]) {
				page = i;
				break;
			}
		}
		if (page == that.currPageY && page > 0 && that.dirY < 0) page--;
		y = that.pagesY[page];
		sizeY = m.abs(y - that.pagesY[that.currPageY]);
		sizeY = sizeY ? m.abs(that.y - y) / sizeY * 500 : 0;
		that.currPageY = page;

		// Snap with constant speed (proportional duration)
		time = m.round(m.max(sizeX, sizeY)) || 200;

		return { x: x, y: y, time: time };
	},

	_bind: function (type, el) {
		(el || this.scroller).addEventListener(type, this, false);
	},

	_unbind: function (type, el) {
		(el || this.scroller).removeEventListener(type, this, false);
	},


	/**
	 *
	 * Public methods
	 *
	 */
	destroy: function () {
		var that = this;

		if (that.options.checkDOMChange) clearTimeout(that.DOMChangeInterval);

		// Remove pull to refresh
		if (that.pullDownToRefresh) {
			that.pullDownEl.parentNode.removeChild(that.pullDownEl);
		}
		if (that.pullUpToRefresh) {
			that.pullUpEl.parentNode.removeChild(that.pullUpEl);
		}

		// Remove the scrollbars
		that.hScrollbar = false;
		that.vScrollbar = false;
		that._scrollbar('h');
		that._scrollbar('v');

		// Free some mem
		that.scroller.style.webkitTransform = '';

		// Remove the event listeners
		that._unbind('webkitTransitionEnd');
		that._unbind(RESIZE_EV);
		that._unbind(START_EV);
		that._unbind(MOVE_EV);
		that._unbind(END_EV);
		that._unbind(CANCEL_EV);

		if (that.options.zoom) {
			that._unbind('gesturestart');
			that._unbind('gesturechange');
			that._unbind('gestureend');
			that._unbind('gesturecancel');
		}
	},

	refresh: function () {
		var that = this,
			pos = 0, page = 0,
			i, l, els,
			oldHeight, offsets,
			loading;

		if (that.pullDownToRefresh) {
			loading = that.pullDownEl.className.match('loading');
			if (loading && !that.contentReady) {
				oldHeight = that.scrollerH;
				that.contentReady = true;
				that.pullDownEl.className = 'iScrollPullDown';
				that.pullDownLabel.innerText = that.options.pullDownLabel[0];
				that.offsetBottom = that.pullDownEl.offsetHeight;
				that.scroller.style.marginTop = -that.offsetBottom + 'px';
			} else if (!loading) {
				that.offsetBottom = that.pullDownEl.offsetHeight;
				that.scroller.style.marginTop = -that.offsetBottom + 'px';
			}
		}

		if (that.pullUpToRefresh) {
			loading = that.pullUpEl.className.match('loading');
			if (loading && !that.contentReady) {
				oldHeight = that.scrollerH;
				that.contentReady = true;
				that.pullUpEl.className = 'iScrollPullUp';
				that.pullUpLabel.innerText = that.options.pullUpLabel[0];
				that.offsetTop = that.pullUpEl.offsetHeight;
				that.scroller.style.marginBottom = -that.offsetTop + 'px';
			} else if (!loading) {
				that.offsetTop = that.pullUpEl.offsetHeight;
				that.scroller.style.marginBottom = -that.offsetTop + 'px';
			}
		}

		that.wrapperW = that.wrapper.clientWidth;
		that.wrapperH = that.wrapper.clientHeight;
		that.scrollerW = m.round(that.scroller.offsetWidth * that.scale);
		that.scrollerH = m.round((that.scroller.offsetHeight - that.offsetBottom - that.offsetTop) * that.scale);
		that.maxScrollX = that.wrapperW - that.scrollerW;
		that.maxScrollY = that.wrapperH - that.scrollerH;
		that.dirX = 0;
		that.dirY = 0;

		that._transitionTime(0);

		that.hScroll = that.options.hScroll && that.maxScrollX < 0;
		that.vScroll = that.options.vScroll && (!that.options.bounceLock && !that.hScroll || that.scrollerH > that.wrapperH);
		that.hScrollbar = that.hScroll && that.options.hScrollbar;
		that.vScrollbar = that.vScroll && that.options.vScrollbar && that.scrollerH > that.wrapperH;

		// Prepare the scrollbars
		that._scrollbar('h');
		that._scrollbar('v');

		// Snap
		if (typeof that.options.snap == 'string') {
			that.pagesX = [];
			that.pagesY = [];
			els = that.scroller.querySelectorAll(that.options.snap);
			for (i=0, l=els.length; i<l; i++) {
				pos = that._offset(els[i]);
				that.pagesX[i] = pos.x < that.maxScrollX ? that.maxScrollX : pos.x * that.scale;
				that.pagesY[i] = pos.y < that.maxScrollY ? that.maxScrollY : pos.y * that.scale;
			}
		} else if (that.options.snap) {
			that.pagesX = [];
			while (pos >= that.maxScrollX && that.wrapperW > 0) {
				that.pagesX[page] = pos;
				pos = pos - that.wrapperW;
				page++;
			}
			if (that.maxScrollX%that.wrapperW) that.pagesX[that.pagesX.length] = that.maxScrollX - that.pagesX[that.pagesX.length-1] + that.pagesX[that.pagesX.length-1];

			pos = 0;
			page = 0;
			that.pagesY = [];
			while (pos >= that.maxScrollY && that.wrapperH > 0) {
				that.pagesY[page] = pos;
				pos = pos - that.wrapperH;
				page++;
			}
			if (that.maxScrollY%that.wrapperH) that.pagesY[that.pagesY.length] = that.maxScrollY - that.pagesY[that.pagesY.length-1] + that.pagesY[that.pagesY.length-1];
		}

		// Recalculate wrapper offsets
		if (that.options.zoom) {
			offsets = that._offset(that.wrapper, true);
			that.wrapperOffsetLeft = -offsets.x;
			that.wrapperOffsetTop = -offsets.y;
		}

		if (oldHeight && that.y == 0) {
			oldHeight = oldHeight - that.scrollerH + that.y;
			that.scrollTo(0, oldHeight, 0);
		}

		that._resetPos();
	},

	scrollTo: function (x, y, time, relative) {
		var that = this;

		if (relative) {
			x = that.x - x;
			y = that.y - y;
		}

		time = !time || (m.round(that.x) == m.round(x) && m.round(that.y) == m.round(y)) ? 0 : time;

		that.moved = true;

		if (!that.options.HWTransition) {
			that._timedScroll(x, y, time);
			return;
		}

		if (time) that._bind('webkitTransitionEnd');
		that._transitionTime(time);
		that._pos(x, y);
		if (!time) setTimeout(function () { that._transitionEnd(); }, 0);
	},

	scrollToElement: function (el, time) {
		var that = this, pos;
		el = el.nodeType ? el : that.scroller.querySelector(el);
		if (!el) return;

		pos = that._offset(el);
		pos.x = pos.x > 0 ? 0 : pos.x < that.maxScrollX ? that.maxScrollX : pos.x;
		pos.y = pos.y > 0 ? 0 : pos.y < that.maxScrollY ? that.maxScrollY : pos.y;
		time = time === undefined ? m.max(m.abs(pos.x)*2, m.abs(pos.y)*2) : time;

		that.scrollTo(pos.x, pos.y, time);
	},

	scrollToPage: function (pageX, pageY, time) {
		var that = this, x, y;

		if (that.options.snap) {
			pageX = pageX == 'next' ? that.currPageX+1 : pageX == 'prev' ? that.currPageX-1 : pageX;
			pageY = pageY == 'next' ? that.currPageY+1 : pageY == 'prev' ? that.currPageY-1 : pageY;

			pageX = pageX < 0 ? 0 : pageX > that.pagesX.length-1 ? that.pagesX.length-1 : pageX;
			pageY = pageY < 0 ? 0 : pageY > that.pagesY.length-1 ? that.pagesY.length-1 : pageY;

			that.currPageX = pageX;
			that.currPageY = pageY;
			x = that.pagesX[pageX];
			y = that.pagesY[pageY];
		} else {
			x = -that.wrapperW * pageX;
			y = -that.wrapperH * pageY;
			if (x < that.maxScrollX) x = that.maxScrollX;
			if (y < that.maxScrollY) y = that.maxScrollY;
		}

		that.scrollTo(x, y, time || 400);
	},

	zoom: function (x, y, scale) {
		var that = this,
			relScale = scale / that.scale;

		x = x - that.wrapperOffsetLeft - that.x;
		y = y - that.wrapperOffsetTop - that.y;
		that.x = x - x * relScale + that.x;
		that.y = y - y * relScale + that.y;

		that.scale = scale;

		if (that.options.onZoomStart) that.options.onZoomStart.call(that);

		that.refresh();

		that._bind('webkitTransitionEnd');
		that._transitionTime(200);

		setTimeout(function () {
			that.zoomed = true;
			that.scroller.style.webkitTransform = trnOpen + that.x + 'px,' + that.y + 'px' + trnClose + ' scale(' + scale + ')';
		}, 0);
	}
};


var has3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix(),
	hasTouch = 'ontouchstart' in window,
	hasGesture = 'ongesturestart' in window,
//	hasHashChange = 'onhashchange' in window,
//	hasTransitionEnd = 'onwebkittransitionend' in window,
	hasCompositing = 'WebKitTransitionEvent' in window,
	isIDevice = true; //(/iphone|ipad/gi).test(navigator.appVersion),
	isAndroid = false; //(/android/gi).test(navigator.appVersion),
	RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
	START_EV = hasTouch ? 'touchstart' : 'mousedown',
	MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
	END_EV = hasTouch ? 'touchend' : 'mouseup',
	CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
	trnOpen = 'translate' + (has3d ? '3d(' : '('),
	trnClose = has3d ? ',0)' : ')',
	m = Math;

if (typeof exports !== 'undefined') exports.iScroll = iScroll;
else window.iScroll = iScroll;

})();

}});
require.define({'tokenizer': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/vendor/tokenizer.js */
/**
 * @requires javelin-typeahead javelin-dom javelin-util
 *           javelin-stratcom javelin-vector javelin-install
 *           javelin-typeahead-preloaded-source
 * @provides javelin-tokenizer
 * @javelin
 */

/**
 * A tokenizer is a UI component similar to a text input, except that it
 * allows the user to input a list of items ("tokens"), generally from a fixed
 * set of results. A familiar example of this UI is the "To:" field of most
 * email clients, where the control autocompletes addresses from the user's
 * address book.
 *
 * @{JX.Tokenizer} is built on top of @{JX.Typeahead}, and primarily adds the
 * ability to choose multiple items.
 *
 * To build a @{JX.Tokenizer}, you need to do four things:
 *
 *  1. Construct it, padding a DOM node for it to attach to. See the constructor
 *     for more information.
 *  2. Build a {@JX.Typeahead} and configure it with setTypeahead().
 *  3. Configure any special options you want.
 *  4. Call start().
 *
 * If you do this correctly, the input should suggest items and enter them as
 * tokens as the user types.
 */
JX.install('Tokenizer', {
  construct : function(containerNode) {
    this._containerNode = containerNode;
  },

  properties : {
    limit : null,
    nextInput : null
  },

  members : {
    _containerNode : null,
    _root : null,
    _focus : null,
    _orig : null,
    _typeahead : null,
    _tokenid : 0,
    _tokens : null,
    _tokenMap : null,
    _initialValue : null,
    _seq : 0,
    _lastvalue : null,

    start : function() {
      if (__DEV__) {
        if (!this._typeahead) {
          throw new Error(
            'JX.Tokenizer.start(): ' +
            'No typeahead configured! Use setTypeahead() to provide a ' +
            'typeahead.');
        }
      }

      this._orig = JX.DOM.find(this._containerNode, 'input', 'tokenizer');
      this._tokens = [];
      this._tokenMap = {};

      var focus = this.buildInput(this._orig.value);
      this._focus = focus;

      JX.DOM.listen(
        focus,
        ['click', 'focus', 'blur', 'keydown'],
        null,
        JX.bind(this, this.handleEvent));

      JX.DOM.listen(
        this._containerNode,
        'click',
        null,
        JX.bind(
          this,
          function(e) {
            if (e.getNode('remove')) {
              this._remove(e.getNodeData('token').key);
            } else if (e.getTarget() == this._root) {
              this.focus();
            }
          }));

      var root = JX.$N('div');
      root.id = this._orig.id;
      JX.DOM.alterClass(root, 'jx-tokenizer', true);
      root.style.cursor = 'text';
      this._root = root;

      root.appendChild(focus);

      var typeahead = this._typeahead;
      typeahead.setInputNode(this._focus);
      typeahead.start();

      JX.defer(
        JX.bind(
          this,
          function() {
            var container = this._orig.parentNode;
            JX.DOM.setContent(container, root);
            var map = this._initialValue || {};
            for (var k in map) {
              this.addToken(k, map[k]);
            }
            JX.DOM.appendContent(
              root,
              JX.$N('div', {style: {clear: 'both'}})
            );
            this._redraw();
          }));
    },

    setInitialValue : function(map) {
      this._initialValue = map;
      return this;
    },

    setTypeahead : function(typeahead) {

      typeahead.setAllowNullSelection(false);

      typeahead.listen(
        'choose',
        JX.bind(
          this,
          function(result) {
            JX.Stratcom.context().prevent();
            if (this.addToken(result.rel, result.name)) {
              this._typeahead.hide();
              this._focus.value = '';
              this._redraw();
              this.focus();
            }
          }));

      typeahead.listen(
        'query',
        JX.bind(
          this,
          function(query) {

          // TODO: We should emit a 'query' event here to allow the caller to
          // generate tokens on the fly, e.g. email addresses or other freeform
          // or algorithmic tokens.

          // Then do this if something handles the event.
          // this._focus.value = '';
          // this._redraw();
          // this.focus();

          if (query.length) {
            // Prevent this event if there's any text, so that we don't submit
            // the form (either we created a token or we failed to create a
            // token; in either case we shouldn't submit). If the query is
            // empty, allow the event so that the form submission takes place.
            JX.Stratcom.context().prevent();
          }
        }));

      this._typeahead = typeahead;

      return this;
    },

    handleEvent : function(e) {

      this._typeahead.handleEvent(e);
      if (e.getPrevented()) {
        return;
      }

      if (e.getType() == 'click') {
        if (e.getTarget() == this._root) {
          this.focus();
          e.prevent();
          return;
        }
      } else if (e.getType() == 'keydown') {
        this._onkeydown(e);
      } else if (e.getType() == 'blur') {
        this._redraw();
      }
    },

    refresh : function() {
      this._redraw(true);
      return this;
    },

    _redraw : function(force) {
      var focus = this._focus;

      if (focus.value === this._lastvalue && !force) {
        return;
      }
      this._lastvalue = focus.value;

      var root  = this._root;
      var metrics = JX.DOM.textMetrics(
        this._focus,
        'jx-tokenizer-metrics');
      metrics.y = null;
      metrics.x += 24;
      metrics.setDim(focus);

      // This is a pretty ugly hack to force a redraw after copy/paste in
      // Firefox. If we don't do this, it doesn't redraw the input so pasting
      // in an email address doesn't give you a very good behavior.
      focus.value = focus.value;
    },

    addToken : function(key, value) {
      if (key in this._tokenMap) {
        return false;
      }

      var focus = this._focus;
      var root = this._root;
      var token = this.buildToken(key, value);

      this._tokenMap[key] = {
        value : value,
        key : key,
        node : token
      };
      this._tokens.push(key);

      root.insertBefore(token, focus);

      return true;
    },

    buildInput: function(value) {
      return JX.$N('input', {
        className: 'jx-tokenizer-input',
        type: 'text',
        value: value
      });
    },

    /**
     * Generate a token based on a key and value. The "token" and "remove"
     * sigils are observed by a listener in start().
     */
    buildToken: function(key, value) {
      var input = JX.$N('input', {
        type: 'hidden',
        value: key,
        name: this._orig.name + '[' + (this._seq++) + ']'
      });

      var remove = JX.$N('a', {
        className: 'jx-tokenizer-x',
        sigil: 'remove'
      }, JX.$H('&times;'));

      return JX.$N('a', {
        className: 'jx-tokenizer-token',
        sigil: 'token',
        meta: {key: key}
      }, [value, input, remove]);
    },

    getTokens : function() {
      var result = {};
      for (var key in this._tokenMap) {
        result[key] = this._tokenMap[key].value;
      }
      return result;
    },

    _onkeydown : function(e) {
      var focus = this._focus;
      var root = this._root;
      switch (e.getSpecialKey()) {
        case 'tab':
          var completed = this._typeahead.submit();
          if (this.getNextInput()) {
            if (!completed) {
              this._focus.value = '';
            }
            JX.defer(JX.bind(this, function() {
              this.getNextInput().focus();
            }));
          }
          break;
        case 'delete':
          if (!this._focus.value.length) {
            var tok;
            while (tok = this._tokens.pop()) {
              if (this._remove(tok)) {
                break;
              }
            }
          }
          break;
        case 'return':
          // Don't subject this to token limits.
          break;
        default:
          if (this.getLimit() &&
              JX.keys(this._tokenMap).length == this.getLimit()) {
            e.prevent();
          }
          JX.defer(JX.bind(this, this._redraw));
          break;
      }
    },

    _remove : function(index) {
      if (!this._tokenMap[index]) {
        return false;
      }
      JX.DOM.remove(this._tokenMap[index].node);
      delete this._tokenMap[index];
      this._redraw(true);
      this.focus();
      return true;
    },

    focus : function() {
      var focus = this._focus;
      JX.DOM.show(focus);
      JX.defer(function() { JX.DOM.focus(focus); });
    }
  }
});

}});
require.define({'typeahead/Typeahead': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/vendor/typeahead/Typeahead.js */
/**
 * @requires javelin-install
 *           javelin-dom
 *           javelin-vector
 *           javelin-util
 * @provides javelin-typeahead
 * @javelin
 */
require('javelin/core');

/**
 * A typeahead is a UI component similar to a text input, except that it
 * suggests some set of results (like friends' names, common searches, or
 * repository paths) as the user types them. Familiar examples of this UI
 * include Google Suggest, the Facebook search box, and OS X's Spotlight
 * feature.
 *
 * To build a @{JX.Typeahead}, you need to do four things:
 *
 *  1. Construct it, passing some DOM nodes for it to attach to. See the
 *     constructor for more information.
 *  2. Attach a datasource by calling setDatasource() with a valid datasource,
 *     often a @{JX.TypeaheadPreloadedSource}.
 *  3. Configure any special options that you want.
 *  4. Call start().
 *
 * If you do this correctly, a dropdown menu should appear under the input as
 * the user types, suggesting matching results.
 *
 * @task build        Building a Typeahead
 * @task datasource   Configuring a Datasource
 * @task config       Configuring Options
 * @task start        Activating a Typeahead
 * @task control      Controlling Typeaheads from Javascript
 * @task internal     Internal Methods
 */
JX.install('Typeahead', {
  /**
   * Construct a new Typeahead on some "hardpoint". At a minimum, the hardpoint
   * should be a ##<div>## with "position: relative;" wrapped around a text
   * ##<input>##. The typeahead's dropdown suggestions will be appended to the
   * hardpoint in the DOM. Basically, this is the bare minimum requirement:
   *
   *   LANG=HTML
   *   <div style="position: relative;">
   *     <input type="text" />
   *   </div>
   *
   * Then get a reference to the ##<div>## and pass it as 'hardpoint', and pass
   * the ##<input>## as 'control'. This will enhance your boring old
   * ##<input />## with amazing typeahead powers.
   *
   * On the Facebook/Tools stack, ##<javelin:typeahead-template />## can build
   * this for you.
   *
   * @param Node  "Hardpoint", basically an anchorpoint in the document which
   *              the typeahead can append its suggestion menu to.
   * @param Node? Actual ##<input />## to use; if not provided, the typeahead
   *              will just look for a (solitary) input inside the hardpoint.
   * @task build
   */
  construct : function(hardpoint, control) {
    this._hardpoint = hardpoint;
    this._control = control || JX.DOM.find(hardpoint, 'input');

    this._root = JX.$N(
      'div',
      {className: 'jx-typeahead-results'});
    this._display = [];

    this._listener = JX.DOM.listen(
      this._control,
      ['focus', 'blur', 'keypress', 'keydown'],
      null,
      JX.bind(this, this.handleEvent));

    JX.DOM.listen(
      this._root,
      ['mouseover', 'mouseout'],
      null,
      JX.bind(this, this._onmouse));

    JX.DOM.listen(
      this._root,
      'mousedown',
      'tag:a',
      JX.bind(this, function(e) {
        this._choose(e.getNode('tag:a'));
        e.prevent();
      }));

  },

  events : ['choose', 'query', 'start', 'change', 'show'],

  properties : {

    /**
     * Boolean. If true (default), the user is permitted to submit the typeahead
     * with a custom or empty selection. This is a good behavior if the
     * typeahead is attached to something like a search input, where the user
     * might type a freeform query or select from a list of suggestions.
     * However, sometimes you require a specific input (e.g., choosing which
     * user owns something), in which case you can prevent null selections.
     *
     * @task config
     */
    allowNullSelection : true,

    /**
     * Function. Allows you to reconfigure the Typeahead's normalizer, which is
     * @{JX.TypeaheadNormalizer} by default. The normalizer is used to convert
     * user input into strings suitable for matching, e.g. by lowercasing all
     * input and removing punctuation. See @{JX.TypeaheadNormalizer} for more
     * details. Any replacement function should accept an arbitrary user-input
     * string and emit a normalized string suitable for tokenization and
     * matching.
     *
     * @task config
     */
    normalizer : null,

    /**
     * Number of milliseconds to wait before hiding results list on
     * blur event.
     *
     * When running inside an iframe on mobile webkit browsers, the
     * browser will fire a blur event before mousedown or touchstart
     * events. If the blur event is handled first, the typeahead results
     * are hidden and the resulting click targets the elements behind them.
     * By delaying the blur event, we can ensure that the correct result
     * is selected before any results are hidden. By default, no delay is used.
     *
     * @task config
     */
    blurDefer : 0
  },

  members : {
    _root : null,
    _control : null,
    _hardpoint : null,
    _listener : null,
    _value : null,
    _stop : false,
    _focus : -1,
    _display : null,
    _hasFocus : false,

    /**
     * Activate your properly configured typeahead. It won't do anything until
     * you call this method!
     *
     * @task start
     * @return void
     */
    start : function() {
      this.invoke('start');
    },


    /**
     * Configure a datasource, which is where the Typeahead gets suggestions
     * from. See @{JX.TypeaheadDatasource} for more information. You must
     * provide a datasource.
     *
     * @task datasource
     * @param JX.TypeaheadDatasource The datasource which the typeahead will
     *                               draw from.
     */
    setDatasource : function(datasource) {
      datasource.bindToTypeahead(this);
    },


    /**
     * Override the <input /> selected in the constructor with some other input.
     * This is primarily useful when building a control on top of the typeahead,
     * like @{JX.Tokenizer}.
     *
     * @task config
     * @param node An <input /> node to use as the primary control.
     */
    setInputNode : function(input) {
      this._control = input;
      return this;
    },


    /**
     * Hide the typeahead's dropdown suggestion menu.
     *
     * @task control
     * @return void
     */
    hide : function() {
      this._changeFocus(Number.NEGATIVE_INFINITY);
      this._display = [];
      this._moused = false;
      JX.DOM.setContent(this._root, '');
      JX.DOM.remove(this._root);
    },


    /**
     * Show a given result set in the typeahead's dropdown suggestion menu.
     * Normally, you only call this method if you are implementing a datasource.
     * Otherwise, the datasource you have configured calls it for you in
     * response to the user's actions.
     *
     * @task   control
     * @param  list List of ##<a />## tags to show as suggestions/results.
     * @return void
     */
    showResults : function(results) {
      var obj = {show: results};
      var e = this.invoke('show', obj);
      this._display = obj.show;

      if (this._display.length && !e.getPrevented()) {
        JX.DOM.setContent(this._root, this._display);
        this._changeFocus(Number.NEGATIVE_INFINITY);
        var d = JX.Vector.getDim(this._hardpoint);
        d.x = 0;
        d.setPos(this._root);
        this._hardpoint.appendChild(this._root);
      } else {
        this.hide();
      }
    },

    refresh : function() {
      if (this._stop) {
        return;
      }

      this._value = this._control.value;
      if (!this.invoke('change', this._value).getPrevented()) {
        if (__DEV__) {
          throw new Error(
            "JX.Typeahead._update(): " +
            "No listener responded to Typeahead 'change' event. Create a " +
            "datasource and call setDatasource().");
        }
      }
    },
    /**
     * Show a "waiting for results" UI in place of the typeahead's dropdown
     * suggestion menu. NOTE: currently there's no such UI, lolol.
     *
     * @task control
     * @return void
     */
    waitForResults : function() {
      // TODO: Build some sort of fancy spinner or "..." type UI here to
      // visually indicate that we're waiting on the server.
      this.hide();
    },

    /**
     * @task internal
     */
    _onmouse : function(event) {
      this._moused = (event.getType() == 'mouseover');
      this._drawFocus();
    },


    /**
     * @task internal
     */
    _changeFocus : function(d) {
      var n = Math.min(Math.max(-1, this._focus + d), this._display.length - 1);
      if (!this.getAllowNullSelection()) {
        n = Math.max(0, n);
      }
      if (this._focus >= 0 && this._focus < this._display.length) {
        JX.DOM.alterClass(this._display[this._focus], 'focused', 0);
      }
      this._focus = n;
      this._drawFocus();
      return true;
    },


    /**
     * @task internal
     */
    _drawFocus : function() {
      var f = this._display[this._focus];
      if (f) {
        JX.DOM.alterClass(f, 'focused', !this._moused);
      }
    },


    /**
     * @task internal
     */
    _choose : function(target) {
      var result = this.invoke('choose', target);
      if (result.getPrevented()) {
        return;
      }

      this._control.value = target.name;
      this.hide();
    },


    /**
     * @task control
     */
    clear : function() {
      this._control.value = '';
      this.hide();
    },


    /**
     * @task control
     */
    disable : function() {
      this._control.blur();
      this._control.disabled = true;
      this._stop = true;
    },


    /**
     * @task control
     */
    submit : function() {
      if (this._focus >= 0 && this._display[this._focus]) {
        this._choose(this._display[this._focus]);
        return true;
      } else {
        result = this.invoke('query', this._control.value);
        if (result.getPrevented()) {
          return true;
        }
      }
      return false;
    },

    setValue : function(value) {
      this._control.value = value;
    },

    getValue : function() {
      return this._control.value;
    },

    /**
     * @task internal
     */
    _update : function(event) {
      var k = event && event.getSpecialKey();
      if (k && event.getType() == 'keydown') {
        switch (k) {
          case 'up':
            if (this._display.length && this._changeFocus(-1)) {
              event.prevent();
            }
            break;
          case 'down':
            if (this._display.length && this._changeFocus(1)) {
              event.prevent();
            }
            break;
          case 'return':
            if (this.submit()) {
              event.prevent();
              return;
            }
            break;
          case 'esc':
            if (this._display.length && this.getAllowNullSelection()) {
              this.hide();
              event.prevent();
            }
            break;
          case 'tab':
            // If the user tabs out of the field, don't refresh.
            return;
        }
      }

      // We need to defer because the keystroke won't be present in the input's
      // value field yet.
      JX.defer(JX.bind(this, function() {
        if (this._value == this._control.value) {
          // The typeahead value hasn't changed.
          return;
        }
        this.refresh();
      }));
    },

    /**
     * This method is pretty much internal but @{JX.Tokenizer} needs access to
     * it for delegation. You might also need to delegate events here if you
     * build some kind of meta-control.
     *
     * Reacts to user events in accordance to configuration.
     *
     * @task internal
     * @param JX.Event User event, like a click or keypress.
     * @return void
     */
    handleEvent : function(e) {
      if (this._stop || e.getPrevented()) {
        return;
      }
      var type = e.getType();
      if (type == 'blur') {
        this._hasFocus = false;
        // See documentation for blurDefer.
        JX.defer(JX.bind(this, function() {
          if (!this._hasFocus) {
            this.hide();
          }
        }), this.getBlurDefer());
      } else if (type == 'focus') {
        this._hasFocus = true;
      } else {
        this._update(e);
      }
    },

    removeListener : function() {
      if (this._listener) {
        this._listener.remove();
      }
    }
  }
});

}});
require.define({'typeahead/normalizer/TypeaheadInternationalNormalizer': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/vendor/typeahead/normalizer/TypeaheadInternationalNormalizer.js */
/**
 * @requires javelin-install javelin-typeahead-normalizer
 * @provides javelin-typeahead-international-normalizer
 * @javelin
 */
require('javelin/core');
require('typeahead/normalizer/TypeaheadNormalizer');

JX.install('TypeaheadInternationalNormalizer', {
  statics : {
    normalize : function(str) {
      var map = JX.TypeaheadInternationalNormalizer._charmap;
      return JX.TypeaheadNormalizer
        .normalize(str)
        .replace(
          /[\u00e0-\u0450]/g,
          function(c) {
            return (c in map ? map[c] : c);
          });
    },
    _charmap : {
      '\u00e0' : 'a',
      '\u00e1' : 'a',
      '\u00e2' : 'a',
      '\u00e3' : 'a',
      '\u00e4' : 'a',
      '\u00e5' : 'a',
      '\u00e6' : 'ae',
      '\u00e7' : 'c',
      '\u00e8' : 'e',
      '\u00e9' : 'e',
      '\u00ea' : 'e',
      '\u00eb' : 'e',
      '\u00ec' : 'i',
      '\u00ed' : 'i',
      '\u00ee' : 'i',
      '\u00ef' : 'i',
      '\u00f0' : 'd',
      '\u00f1' : 'n',
      '\u00f2' : 'o',
      '\u00f3' : 'o',
      '\u00f4' : 'o',
      '\u00f5' : 'o',
      '\u00f6' : 'o',
      '\u00f8' : 'o',
      '\u00f9' : 'u',
      '\u00fa' : 'u',
      '\u00fb' : 'u',
      '\u00fc' : 'u',
      '\u00fd' : 'y',
      '\u00ff' : 'y',
      '\u0153' : 'oe',
      '\u0430' : 'a',
      '\u0431' : 'b',
      '\u0432' : 'v',
      '\u0433' : 'g',
      '\u0434' : 'd',
      '\u0435' : 'e',
      '\u0437' : 'z',
      '\u0438' : 'i',
      '\u0439' : 'j',
      '\u043a' : 'k',
      '\u043b' : 'l',
      '\u043c' : 'm',
      '\u043d' : 'n',
      '\u043e' : 'o',
      '\u043f' : 'p',
      '\u0440' : 'r',
      '\u0441' : 's',
      '\u0442' : 't',
      '\u0443' : 'u',
      '\u0444' : 'f',
      '\u0445' : 'h',
      '\u0446' : 'c',
      '\u0447' : 'ch',
      '\u0448' : 'sh',
      '\u044b' : 'y',
      '\u044d' : 'e',
      '\u044e' : 'u',
      '\u044f' : 'ya'
    }
  }
});

}});
require.define({'typeahead/normalizer/TypeaheadNormalizer': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/vendor/typeahead/normalizer/TypeaheadNormalizer.js */
/**
 * @requires javelin-install
 * @provides javelin-typeahead-normalizer
 * @javelin
 */
require('javelin/core');

JX.install('TypeaheadNormalizer', {
  statics : {
    normalize : function(str) {
      return ('' + str)
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/ +/g, ' ')
        .replace(/^\s*|\s*$/g, '');
    }
  }
});

}});
require.define({'typeahead/source/TypeaheadOnDemandSource': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/vendor/typeahead/source/TypeaheadOnDemandSource.js */
/**
 * @requires javelin-install
 *           javelin-util
 *           javelin-stratcom
 *           javelin-request
 *           javelin-typeahead-source
 * @provides javelin-typeahead-ondemand-source
 * @javelin
 */
require('javelin/core');
require('typeahead/source/TypeaheadSource');

JX.install('TypeaheadOnDemandSource', {

  extend : 'TypeaheadSource',

  construct : function(uri) {
    JX.TypeaheadSource.call(this);
    this.uri = uri;
    this.haveData = {
      '' : true
    };
  },

  properties : {
    /**
     * Configures how many milliseconds we wait after the user stops typing to
     * send a request to the server. Setting a value of 250 means "wait 250
     * milliseconds after the user stops typing to request typeahead data".
     * Higher values reduce server load but make the typeahead less responsive.
     */
    queryDelay : 125,
    /**
     * Auxiliary data to pass along when sending the query for server results.
     */
    auxiliaryData : {}
  },

  members : {
    uri : null,
    lastChange : null,
    haveData : null,

    didChange : function(value) {
      if (JX.Stratcom.pass()) {
        return;
      }
      this.lastChange = new Date().getTime();
      value = this.normalize(value);

      if (this.haveData[value]) {
        this.matchResults(value);
      } else {
        this.waitForResults();
        JX.defer(
          JX.bind(this, this.sendRequest, this.lastChange, value),
          this.getQueryDelay());
      }

      JX.Stratcom.context().kill();
    },

    sendRequest : function(when, value) {
      if (when != this.lastChange) {
        return;
      }
      var r = new JX.Request(
        this.uri,
        JX.bind(this, this.ondata, this.lastChange, value));
      r.setMethod('GET');
      r.setData(JX.copy(this.getAuxiliaryData(), {q : value}));
      r.send();
    },

    ondata : function(when, value, results) {
      if (results) {
        for (var ii = 0; ii < results.length; ii++) {
          this.addResult(results[ii]);
        }
      }
      this.haveData[value] = true;
      if (when != this.lastChange) {
        return;
      }
      this.matchResults(value);
    }
  }
});

}});
require.define({'typeahead/source/TypeaheadPreloadedSource': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/vendor/typeahead/source/TypeaheadPreloadedSource.js */
/**
 * @requires javelin-install
 *           javelin-util
 *           javelin-stratcom
 *           javelin-request
 *           javelin-typeahead-source
 * @provides javelin-typeahead-preloaded-source
 * @javelin
 */
require('javelin/core');
require('typeahead/source/TypeaheadSource');

/**
 * Simple datasource that loads all possible results from a single call to a
 * URI. This is appropriate if the total data size is small (up to perhaps a
 * few thousand items). If you have more items so you can't ship them down to
 * the client in one repsonse, use @{JX.TypeaheadOnDemandSource}.
 */
JX.install('TypeaheadPreloadedSource', {

  extend : 'TypeaheadSource',

  construct : function(uri) {
    JX.TypeaheadSource.call(this);
    this.uri = uri;
  },

  members : {

    ready : false,
    uri : null,
    lastValue : null,

    didChange : function(value) {
      if (this.ready) {
        this.matchResults(value);
      } else {
        this.lastValue = value;
        this.waitForResults();
      }
      JX.Stratcom.context().kill();
    },

    didStart : function() {
      var r = new JX.Request(this.uri, JX.bind(this, this.ondata));
      r.setMethod('GET');
      r.send();
    },

    ondata : function(results) {
      for (var ii = 0; ii < results.length; ++ii) {
        this.addResult(results[ii]);
      }
      if (this.lastValue !== null) {
        this.matchResults(this.lastValue);
      }
      this.ready = true;
    }
  }
});

}});
require.define({'typeahead/source/TypeaheadSource': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/vendor/typeahead/source/TypeaheadSource.js */
/**
 * @requires javelin-install
 *           javelin-util
 *           javelin-dom
 *           javelin-typeahead-normalizer
 * @provides javelin-typeahead-source
 * @javelin
 */
require('javelin/core');
require('typeahead/normalizer/TypeaheadNormalizer');

JX.install('TypeaheadSource', {
  construct : function() {
    this._raw = {};
    this._lookup = {};
    this.setNormalizer(JX.TypeaheadNormalizer.normalize);
  },

  properties : {

    /**
     * Allows you to specify a function which will be used to normalize strings.
     * Strings are normalized before being tokenized, and before being sent to
     * the server. The purpose of normalization is to strip out irrelevant data,
     * like uppercase/lowercase, extra spaces, or punctuation. By default,
     * the @{JX.TypeaheadNormalizer} is used to normalize strings, but you may
     * want to provide a different normalizer, particiularly if there are
     * special characters with semantic meaning in your object names.
     *
     * @param function
     */
    normalizer : null,

    /**
     * Transformers convert data from a wire format to a runtime format. The
     * transformation mechanism allows you to choose an efficient wire format
     * and then expand it on the client side, rather than duplicating data
     * over the wire. The transformation is applied to objects passed to
     * addResult(). It should accept whatever sort of object you ship over the
     * wire, and produce a dictionary with these keys:
     *
     *    - **id**: a unique id for each object.
     *    - **name**: the string used for matching against user input.
     *    - **uri**: the URI corresponding with the object (must be present
     *      but need not be meaningful)
     *    - **display**: the text or nodes to show in the DOM. Usually just the
     *      same as ##name##.
     *
     * The default transformer expects a three element list with elements
     * [name, uri, id]. It assigns the first element to both ##name## and
     * ##display##.
     *
     * @param function
     */
    transformer : null,

    /**
     * Configures the maximum number of suggestions shown in the typeahead
     * dropdown.
     *
     * @param int
     */
    maximumResultCount : 5

  },

  members : {
    _raw : null,
    _lookup : null,
    _typeahead : null,
    _normalizer : null,

    bindToTypeahead : function(typeahead) {
      this._typeahead = typeahead;
      typeahead.listen('change', JX.bind(this, this.didChange));
      typeahead.listen('start', JX.bind(this, this.didStart));
    },

    didChange : function(value) {
      return;
    },

    didStart : function() {
      return;
    },

    clearCache : function() {
      this._raw = {};
      this._lookup = {};
    },

    addResult : function(obj) {
      obj = (this.getTransformer() || this._defaultTransformer)(obj);

      if (obj.id in this._raw) {
        // We're already aware of this result. This will happen if someone
        // searches for "zeb" and then for "zebra" with a
        // TypeaheadRequestSource, for example, or the datasource just doesn't
        // dedupe things properly. Whatever the case, just ignore it.
        return;
      }

      if (__DEV__) {
        for (var k in {name : 1, id : 1, display : 1, uri : 1}) {
          if (!(k in obj)) {
            throw new Error(
              "JX.TypeaheadSource.addResult(): " +
              "result must have properties 'name', 'id', 'uri' and 'display'.");
          }
        }
      }

      this._raw[obj.id] = obj;
      var t = this.tokenize(obj.name);
      for (var jj = 0; jj < t.length; ++jj) {
        this._lookup[t[jj]] = this._lookup[t[jj]] || [];
        this._lookup[t[jj]].push(obj.id);
      }
    },

    waitForResults : function() {
      this._typeahead.waitForResults();
      return this;
    },

    matchResults : function(value) {

      // This table keeps track of the number of tokens each potential match
      // has actually matched. When we're done, the real matches are those
      // which have matched every token (so the value is equal to the token
      // list length).
      var match_count = {};

      // This keeps track of distinct matches. If the user searches for
      // something like "Chris C" against "Chris Cox", the "C" will match
      // both fragments. We need to make sure we only count distinct matches.
      var match_fragments = {};

      var matched = {};
      var seen = {};

      var t = this.tokenize(value);

      // Sort tokens by longest-first. We match each name fragment with at
      // most one token.
      t.sort(function(u, v) { return v.length - u.length; });

      for (var ii = 0; ii < t.length; ++ii) {
        // Do something reasonable if the user types the same token twice; this
        // is sort of stupid so maybe kill it?
        if (t[ii] in seen) {
          t.splice(ii--, 1);
          continue;
        }
        seen[t[ii]] = true;
        var fragment = t[ii];
        for (var name_fragment in this._lookup) {
          if (name_fragment.substr(0, fragment.length) === fragment) {
            if (!(name_fragment in matched)) {
              matched[name_fragment] = true;
            } else {
              continue;
            }
            var l = this._lookup[name_fragment];
            for (var jj = 0; jj < l.length; ++jj) {
              var match_id = l[jj];
              if (!match_fragments[match_id]) {
                match_fragments[match_id] = {};
              }
              if (!(fragment in match_fragments[match_id])) {
                match_fragments[match_id][fragment] = true;
                match_count[match_id] = (match_count[match_id] || 0) + 1;
              }
            }
          }
        }
      }

      var hits = [];
      for (var k in match_count) {
        if (match_count[k] == t.length) {
          hits.push(k);
        }
      }

      this._typeahead.showResults(this.renderNodes(value, hits));
    },

    renderNodes : function(value, hits) {
      var n = Math.min(this.getMaximumResultCount(), hits.length);
      var nodes = [];
      for (var kk = 0; kk < n; kk++) {
        nodes.push(this.createNode(this._raw[hits[kk]]));
      }
      return nodes;
    },

    createNode : function(data) {
      return JX.$N(
        'a',
        {
          href: data.uri,
          name: data.name,
          rel: data.id,
          className: 'jx-result'
        },
        data.display
      );
    },

    normalize : function(str) {
      return (this.getNormalizer() || JX.bag())(str);
    },
    tokenize : function(str) {
      str = this.normalize(str);
      if (!str.length) {
        return [];
      }
      return str.split(/ /g);
    },
    _defaultTransformer : function(object) {
      return {
        name : object[0],
        display : object[0],
        uri : object[1],
        id : object[2]
      };
    }
  }
});

}});
require.define({'views/action_scroller': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/action_scroller.js */
// ActionScroller is a view that pops up from the bottom of the screen
// and offers the user a set of choices.  The choices are displayed as
// a vertically scrolling list.  When the user taps an option, it scrolls to
// the center of the view.  If the user scrolls the list, when the scroll
// completes it automatically scrolls to the closest option.
//
// By default all options are displayed in a single scrollable vertical column.
// Multiple vertical columns of action buttons can be created by passing
// a 'col' parameter with the action, e.g.
//
// actionScroller.addAction(
//   {value: 'Choice 1', col: 0, action: 'handleChoice1'}
// )
// actionScroller.addAction(
//   {value: 'Choice 2', col: 1, action: 'handleChoice2'}
// )
//
// An ActionScroller can also be constructed with a set of actions, e.g.
//
// builder.build({
//   view: 'ActionScroller',
//   title: 'Choose Wisely',
//   text: 'There are penalties for those who choose..... poorly',
//   actions: [
//     {
//       value: 'Big Golden Goblet',
//       action: function() {console.log('You chose poorly');}
//     },
//     {
//       value: 'Humble Wooden Cup',
//       action: function() {console.log('You chose wisely');}
//     },
//   ]
// }).show();

require('views/scroll_view');

require('views/button');
require('views/layout/vbox');
var View = require('view').View;
var ActionSheet = require('views/action_sheet').ActionSheet;
var util = require('util');

exports.ActionScroller = require('javelin/core').createClass({
  name: 'ActionScroller',

  extend: ActionSheet,

  construct: function(options) {
    this.buttons = [];
    this.scrollToElement = util.bind(this.scrollToElement, this);
    ActionSheet.call(this, options);
  },

  members: {

    // Called by a ScrollView when it finished scrolling.  Find the closest
    // action button and scroll to it at this point.
    didScrollTo: function(x, y, scrollView) {

      var halfHeight = this.getNode().offsetHeight / 2;
      var centerY = -y + halfHeight;

      var columnIdx = scrollView.getMetadata().column;

      // Find the button center closest
      var dist, lowDist = this.getNode().offsetHeight;
      var buttonNode;
      var closestButton;
      var len = this.buttons.length;
      for (var i = 0; i < len; i++) {
        // If the button is not in the column which scrolled, ignore it
        if (this.buttons[i].getMetadata().column != columnIdx) {
          continue;
        }
        buttonNode = this.buttons[i].getNode();
        dist = Math.floor(centerY - (buttonNode.offsetTop + buttonNode.offsetHeight/2));
        if (Math.abs(dist) < Math.abs(lowDist)) {
          lowDist = dist;
          closestButton = this.buttons[i];
        }
      }
      // If the button closest to the scroll position is not already selected, select it.
      if (closestButton && !closestButton.getMetadata().actioned) {
        closestButton.doAction(null);
      }
    },

    // Scroll to an action button
    // To scroll instantly, with no animation, pass 'true' for the second parameter
    scrollToElement: function(view, instant) {
      var node = view.getNode();
      var columnIdx = view.getMetadata().column;
      var scrollView = this.getColumn(columnIdx);
      var yPos = scrollView.coords()[1];

      // Get the distance between the center of the button and
      // the center of the scroller
      var dist = Math.floor(
        -(node.offsetTop + node.offsetHeight / 2) -
          (yPos - (this.getDesiredHeight() / 2)));

      if (yPos + dist > 0) {
        dist = -yPos;
      }

      if (dist !== 0) {
        setTimeout(function(){
          // return;
          scrollView.scrollTo(0, -dist, instant ? 0 : 200, true);
        }, 1);
      }
    },

    // Set one or more selected action IDs.  These should match to the 'actionId'
    // parameter set on the action when it was added.  A single string or an
    // Array of strings can be passed.
    setSelectedAction: function(actionId) {
      // Ensure that the id is an Array
      actionId = util.$AX(actionId);

      var actions = (this.getSelectedAction() || []).concat(actionId);

      this.setProperty('selectedAction', actions);

      if (this._visible) {
        this.chooseSelectedAction(false);
      }
    },


    updateHeight: function(height){
      var scrollViews = this.findRef('actionContainer').getChildViews();

      // Now that the height has been set, refresh all the ScrollViews
      // so they can measure themselves.
      setTimeout(util.bind(function() {
        util.invoke(scrollViews, 'refresh');
        this.chooseSelectedAction(true);
      }, this), 0);
    },

    chooseSelectedAction: function(instant) {

      var actions = this.getSelectedAction() || [];

      // Clear the initially selected actions
      this.setProperty('selectedAction', []);
      var selectedCols = {};

      var actionId;
      for (var i = 0; i < actions.length; i++) {
        actionId = actions[i];
        for (var j = 0; j < this.buttons.length; j++) {
          metadata = this.buttons[j].getMetadata();
          if (metadata.actionId == actionId && !selectedCols[metadata.column]) {
            selectedCols[metadata.column] = 1;
            this.scrollToElement(this.buttons[j], instant);
            this.markActioned(this.buttons[j]);
          }
        }
      }
    },

    // Gets the height of the view
    getDesiredHeight: function() {
      return 216;
    },

    appendButton: function(button, columnIdx) {
      // By overriding this function, the ActionScroller will not
      // be dismissed when an element is chosen
      this.buttons.push(button);

      button.addAction(this.handleAction);

      this.getColumn(columnIdx);

      this.findRef('container' + columnIdx).append(this.build({
        className: 'bolt-button-wrapper',
        childViews: [button]
      }));
    },


    // Create a vertical column which is scrollable
    createColumn: function(columnIdx) {
      var cls = 'bolt-action-scroller-col';
      return {
        // Create a scrollable view
        view: 'ScrollView',
        ref: 'col' + columnIdx,
        flex: 1,
        useScrollbar: false,
        additionalClasses: cls + ' ' + cls + '-' + columnIdx,

        metadata: {column: columnIdx},

        style: {height: this.getDesiredHeight() + 'px'},
        childViews: [
          {
            // Set the ref using the columnIdx so it can be looked up directly later
            ref: 'container' + columnIdx,
            view: 'VBox',
            additionalClasses: 'bolt-action-scroll-container'
          }
        ]
      };
    },

    // Mark a button as being the currently selected on in its column
    markActioned: function(button) {
      var column = button.getMetadata().column;
      var metadata;

      for (var i = 0; i < this.buttons.length; i++) {
        metadata = this.buttons[i].getMetadata;
        if (metadata.column == column) {
          metadata.actioned = false;
        }
      }
      metadata = button.getMetadata();
      metadata.actioned = true;
      button.setMetadata(metadata);
    },

    handleAction: function(button) {
      this.markActioned(button);


      this.scrollToElement(button);
    }
  }
});

}});
require.define({'views/action_sheet': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/action_sheet.js */
// ActionSheet is a view that pops up from the bottom of the screen, and offers
// the user a number of actions to choose from.  It can optionally have a 'title'
// and 'text' (or subtitle) which are displayed above the action buttons.
// By default all action buttons are displayed vertically.  Multiple vertical
// columns of action buttons can be created by passing a 'col' parameter with the
// action, e.g.
//
// actionSheet.addAction(
//   {value: 'Choice 1', col: 0, action: 'handleChoice1'}
// )
// actionSheet.addAction(
//   {value: 'Choice 2', col: 1, action: 'handleChoice2'}
// )
//
// An ActionSheet can also be constructed with a set of actions, e.g.
//
// builder.build({
//   view: 'ActionSheet',
//   title: 'Choose Wisely',
//   text: 'There are penalties for those who choose..... poorly',
//   actions: [
//     {
//       value: 'Big Golden Goblet',
//       action: function() {console.log('You chose poorly');}
//     },
//     {
//       value: 'Humble Wooden Cup',
//       action: function() {console.log('You chose wisely');}
//     },
//   ]
// }).show();


require('views/button');

var util = require('util');
var view = require('view');

require('views/layout/vbox');
require('views/layout/hbox');
var View = view.View;

var idCntr = 0;

var ActionSheet = require('javelin/core').createClass({

  name: 'ActionSheet',

  extend: View,

  properties: {
    destroyOnHide: false,

    actions: null,

    selectedAction: null
  },

  construct: function(options) {
    this.handleAction = util.bind(this.handleAction, this);
    View.call(this, options);
  },

  members: {
    _title: null,
    _text: null,
    _visible: false,

    render: function() {
      this.setLayout({
        ref: 'actionContainer',
        view: 'HBox'
      });
      this.setMode('sync_hidden', 'state');
    },

    // Add an action that can be selected.  This supports all the properties
    // of a Button, as well as
    // - col : The column in which to display the button.  Default is 0.
    // - actionId: The identifier for the action.
    // - selected: Whether or not the button is currently selected. This is more used
    //             with ActionScroller
    addAction: function(buttonProps) {
      var columnIdx = buttonProps.col || 0;
      var actionId = buttonProps.actionId || this.generateId();
      var selected = buttonProps.selected;
      var metadata = buttonProps.metadata || {};

      delete buttonProps.col;
      delete buttonProps.actionId;
      delete buttonProps.selected;
      delete buttonProps.metadata;

      var actionButton = this.build(util.extend({
          view: 'Button',
          metadata: util.extend(metadata, {
            column: columnIdx,
            actionId: actionId
          })
        }, buttonProps), this.getOwner() || this);

      this.appendButton(actionButton, columnIdx);
      var height = this.getDesiredHeight();
      this.updateHeight && this.updateHeight(height);
      this.setStyle({height: height, bottom: '-' + height + 'px'});

      if (selected) {
        this.setSelectedAction(actionId);
      }
    },

    appendButton: function(button, columnIdx) {
      button.addAction(this.handleAction);

      this.getColumn(columnIdx).append(button);
    },

    generateId: function() {
      return 'actionId_' + (++idCntr);
    },

    // Gets the column at the specified position.
    // If one does not exist, it is created in the correct position.
    getColumn: function(columnIdx) {
      var columnView = this.findRef('col' + columnIdx);

      if (!columnView) {
        // If the column doesn't exist, find the right position for it
        // and insert it
        var actionContainer = this.findRef('actionContainer');
        var children = actionContainer.getChildViews();
        var insertPos = children.length;
        var metadata;
        for (var i = 0; i < children.length; i++) {
          metadata = children[i].getMetadata();
          if (!metadata) {
            continue;
          }
          if (metadata.column > columnIdx) {
            insertPos = i;
            break;
          }
        }

        columnView = this.build(this.createColumn(columnIdx));
        actionContainer.insertChild(columnView, insertPos);
      }
      return columnView;
    },

    createColumn: function(columnIdx) {
      return {
        view: 'VBox',
        ref: 'col' + columnIdx,
        flex: 1,
        metadata: {column: columnIdx}
      };
    },

    hide: function() {
      this._visible = false;
      this.setMode('hidden', 'state');
      var style = this.getNode().style;
      var _this = this;
      setTimeout(function() {
        style.display = 'none';
        if (_this.getDestroyOnHide()) {
          _this.destroy();
        }
      }, 300);
    },

    setActions: function(actions) {
      if (actions) {
        util.forEach(actions, function(action) {
          this.addAction(action);
        }, this);
      }
    },

    _setContent: function(child, content, create) {
      if (content) {
        if (this[child]) {
          this[child].setContent(content);
        } else {
          create();
        }
      } else {
        this.removeChild(this[child]);
        this[child] = null;
      }
    },

    setText: function(text) {
      var _this = this;

      this._setContent('_text', text, function() {
        _this._text = _this.build({ tagName: 'h3', content: text });
        _this.insertChild(_this._text, (_this._title ? 1 : 0));
      });
    },

    setTitle: function(title) {
      var _this = this;
      this._setContent('_title', title, function() {
        _this._title = _this.build({ tagName: 'h2', content: title });
        _this.insertChild(_this._title, 0);
      });
    },

    handleAction: function() {
      this.hide();
    },

    show: function() {
      if (this._visible) {
        return;
      }

      this._visible = true;
      var node = this.getNode(),
          style = node.style;

      style.cssText =
        'display: block; visibility: hidden; height: auto; width:' +
        this.getWidth();

      if (!node.parentNode) {
        this.placeIn(document.body);
      }

      var height = this.getDesiredHeight(); // measure
      this.updateHeight && this.updateHeight(height);

      this.setStyle({
        display: 'block',
        height: height,
        visibility: 'visible',
        bottom: '-' + height + 'px',
        width: this.getWidth() || '100%'
      });

      var isMultiCol = this.findRef('actionContainer').getChildViews().length > 1;

      this[isMultiCol ? 'addClass' : 'removeClass']('bolt-action-sheet-multi-col');

      var _this = this;
      setTimeout(function() {
        _this.setMode('visible', 'state');
      },0);
    },

    getDesiredHeight: function() {
      return this.getRect().height;
    },

    toggle: function() {
      this._visible ? this.hide() : this.show();
    }
  }
});

exports.ActionSheet = ActionSheet;

}});
require.define({'views/button': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/button.js */
var util = require('util');
var View = require('view').View;
var dom  = require('javelin/dom');
var Actionable = require('mixins/actionable').Actionable;

var Button = require('javelin/core').createClass({

  name: 'Button',

  extend: View,

  properties: {
    tagName: 'span',
    value: ''
  },

  mixins: [Actionable],

  members: {
    render: function() {
      this.setLayout({
        tagName: 'span',
        className: 'bolt-button-inner',
        childViews: [
          {
            ref: 'button',
            tagName: 'input',
            type: 'button',
            className: 'uiButtonInput'
          }
        ]
      });
      dom.alterClass(this.getNode(), 'uiButton uiButtonNoText', true);

      this.actionableInit();
    },

    setLarge: function(state) {
      this.large = state;
      dom.alterClass(this.getNode(), 'uiButtonLarge', state);
    },

    getLarge: function(state) {
      return this.large;
    },

    setValue: function(value) {
      this.refs.button.getNode().value = value;
    },

    getValue: function() {
      return this.refs.button.getNode().value;
    },

    setUse: function(use) {
      dom.alterClass(this.getNode(), useClassName(this.use), false);
      this.use = use;
      dom.alterClass(this.getNode(), useClassName(this.use), true);
      return this;
    },

    getUse: function() {
      return this.use;
    },

    setDown: function(down) {
      if (down) {
        this.addClass('bt-button-down');
      } else {
        this.removeClass('bt-button-down');
      }
    }
  }
});

function useClassName(use) {
  if (use === 'special') {
    return 'uiButtonSpecial';
  } else {
    return 'uiButtonConfirm';
  }
}


exports.Button = Button;

}});
require.define({'views/buttontooltip': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/buttontooltip.js */
var util = require('util');
var HBox = require('views/layout/hbox').HBox;
var SimpleTooltip = require('views/simpletooltip').SimpleTooltip;


var ButtonTooltip = require('javelin/core').createClass({

  name: 'ButtonTooltip',

  extend: SimpleTooltip,

  events: ['choose'],

  properties: {
    labels: '',
    value: ''
  },

  members: {
    render: function() {
      SimpleTooltip.prototype.render.call(this);
      var hbox = this.build({
        view: 'HBox',
        ref: 'container'
      });
      this.appendChild(hbox);
    },

    setLabels: function(labels) {
      this.setProperty('labels', labels);
      this.findRef('container').setLayout(
        util.map(labels || [], this.generateOptionButton, this), this);
    },

    generateOptionButton: function(label) {
      return {
        childViews: [{
            view: 'Button',
            owner: this,
            onclick: 'handleSelect',
            value: label,
            ref: 'button-' + label
          }
        ]
      };
    },

    handleSelect: function(event) {
      var view = this.refForEvent(event);
      this.setValue(view.getValue());
      this.hide();
      this.invoke('choose');
    }
  }
});

exports.ButtonTooltip = ButtonTooltip;

}});
require.define({'views/clearabletextinput': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/clearabletextinput.js */
require('views/textinput');
require('views/closeicon');

var util = require('util');
var dom = require('javelin/dom');
var view = require('view');

var HBox = require('views/layout/hbox').HBox;

var ClearableTextInput = require('javelin/core').createClass({

  name: 'ClearableTextInput',

  extend: HBox,

  properties: {
    label: '',
    clearable: true
  },

  delegateProperties: {
    input: ['size', 'value', 'select', 'placeholder', 'maxlen',
      'disabled', 'readonly']
  },

  events: [
    'clear',
    'change'
  ],

  members: {

    render: function() {
      HBox.prototype.render.apply(this);
      var views = this.build([
        {
          flex: 1,
          className: 'bolt-clearable-text-input',
          childViews: [
            {
              view: 'TextInput',
              ref: 'input',
              onfocus: 'handleFocus',
              onblur: 'handleBlur'
            }
          ]
        },
        {
          className: 'bolt-clearable-text-icon',
          childViews: [
            {
              view: 'CloseIcon',
              ref: 'button',
              action: 'handleClear'
            }
          ]
        }
      ]);

      this.addClass('inactive');

      util.forEach(views, this.appendChild, this);

      this.delayedFocus = util.bind(this.delayedFocus, this);
      this.setActiveStatus = util.bind(this.updateActive, this, true);
      this.setInactiveStatus = util.bind(this.updateActive, this, false);
      this.focus = util.bind(this.focus, this);

      // Ensure that when the clear button is tapped, the input
      // does not lose focus
      this.listen(view.touchEvents.TOUCHSTART, this.delayedFocus);
    },

    focus: function() {
      this.findRef('input').focus();
    },

    delayedFocus: function() {
      setTimeout(this.focus, 50);
    },

    handleClear: function(event){
      if (this.isActive()) {
        this.setValue('');
        this.invoke('clear');
      }
      this.focus();
    },

    handleFocus: function(event) {
      this.clearTimer();
      this._timer = setTimeout(this.setActiveStatus, 200);
    },
    handleBlur: function(event) {
      this.clearTimer();
      this._timer = setTimeout(this.setInactiveStatus, 200);
    },

    updateActive: function(isActive) {
      this.clearTimer();
      dom.alterClass(this.getNode(), 'active', isActive);
      dom.alterClass(this.getNode(), 'inactive', !isActive);
    },

    isActive: function() {
      return util.hasClass(this.getNode(), 'active');
    },

    clearTimer: function() {
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
    }

  }
});

exports.ClearableTextInput = ClearableTextInput;

}});
require.define({'views/closeicon': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/closeicon.js */
var Actionable = require('mixins/actionable').Actionable;

var view = require('view');


var CloseIcon = require('javelin/core').createClass({

  name: 'CloseIcon',

  extend: view.View,

  properties: {
    tagName: 'span'
  },

  mixins: [Actionable],

  members: {
    render: function(){
      view.View.prototype.render.call(this);
      this.actionableInit();
    }
  }
});


exports.CloseIcon = CloseIcon;

}});
require.define({'views/image': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/image.js */
// ## An Image widget that supports delayed queued loading.

var View = require('view').View;
var imageQueue = require('util/image_queue');


exports.Image = require('javelin/core').createClass({

  name: 'Image',

  extend: View,

  properties: {
    tagName: 'img',

    // If set to true, this Image view delays the loading of its
    // src parameter by using the global ImageQueue.
    queued: true
  },

  construct: function(options) {
    View.call(this, options);
  },

  setup: function(options) {
    View.prototype.setup.call(this, options);
    this.getNode().onload = this.handleLoad;
  },

  handleLoad: function(event) {
    event.target.style.visibility = 'visible';
  },

  setSrc: function(url) {
    if (this.getQueued() && url) {
      this.setProperty('src', url);
      this.getNode().style.visibility = 'hidden';
      imageQueue.add(url, this.handleQueueCallback, this);

      this.enqueued = true;
    } else {
      View.prototype.setSrc.call(this, url);
    }
  },

  handleQueueCallback: function(url, imgNode) {
    this.enqueued = false;
    if (url == this.getProperty('src')) {
      View.prototype.setSrc.call(this, url);
    }
  },

  destroy: function() {
    if (this.enqueued) {
      imageQueue.remove(this.getProperty('src'), this.handleQueueCallback, this);
    }
    View.prototype.destroy.call(this);
  }
});

}});
require.define({'views/labelledtextinput': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/labelledtextinput.js */
require('views/clearabletextinput');
require('views/closeicon');
require('views/buttontooltip');
require('views/button');

var util = require('util');
var view = require('view');
var Model = require('model').Model;

var HBox = require('views/layout/hbox').HBox;


// TODO:wbailey we should document all the bind point
// on our views that expect a model backer
var LabelledTextInput = require('javelin/core').createClass({

  name: 'LabelledTextInput',

  extend: HBox,

  construct: function(options) {
    var labelOptions = options.labelOptions;
    delete options.labelOptions;
    HBox.call(this, options);
    this.setLabelOptions(labelOptions);
  },

  properties: {
    label: '',
    clearable: true,
    labelOptions: null
  },

  delegateProperties: {
    input: ['size', 'value', 'select', 'placeholder', 'maxlen', 'disabled'],
    labelview: [{alias: 'label', name: 'innerHTML'}]
  },

  events: [
    'labelclick'
  ],

  members: {
    render: function() {
      HBox.prototype.render.apply(this);
      var views = this.build([
        {
          className: 'bolt-labelled-text-label',
          sigil: 'touchable',
          onclick: 'handleLabelClick',
          ref: 'labelcontainer',
          childViews: [
            {ref: 'labelview', className: 'bolt-label'},
            {
              ref: 'tooltip',
              view: 'ButtonTooltip',
              onchoose: 'handleLabelOptionSelect'
            }
          ]
        },
        {
          flex: 1,
          className: 'bolt-labelled-text-input-wrapper',
          childViews: [
            {
              view: 'ClearableTextInput',
              ref: 'input'
            }
          ]
        }
      ]);

      this.addClass('inactive');
      util.forEach(views, this.appendChild, this);
    },

    setErrorState: function(key, isError) {
      // The error state of this view depends only on the value property
      if (key == 'value') {
        HBox.prototype.setErrorState.call(this, key, isError);
      }
    },

    handleLabelOptionSelect: function(event, b) {
      this.setLabel(this.findRef('tooltip').getValue());
      this.findRef('tooltip').hide();
    },

    setLabelOptions: function(options) {
      this.findRef('tooltip').setLabels(options);
      if (options && options.length) {
        this.findRef('labelcontainer').addClass('bolt-touchable-view');
      }
    },

    handleLabelClick: function(event) {
      this.invoke('labelclick', event);
      this.findRef('input').focus();

      var labelOptions = this.findRef('tooltip').getLabels();
      if (labelOptions && labelOptions.length) {
        this.findRef('tooltip').toggle();
      }
    }
  }
});

exports.LabelledTextInput = LabelledTextInput;

}});
require.define({'views/layout/boxbase': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/layout/boxbase.js */
var core = require('javelin/core');
var View = require('view').View;


var BoxBase = core.createClass({
  name: 'BoxBase',

  extend: View,

  members: {
    className: 'bolt-box-layout',

    orientation: '',

    render: function() {
      this.setStyle({
        'display': '-webkit-box',
        'webkitBoxOrient': this.orientation
      });
    }
  }
});


exports.BoxBase = BoxBase;

}});
require.define({'views/layout/hbox': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/layout/hbox.js */
var core = require('javelin/core');
var view = require('view');

var BoxBase = require('views/layout/boxbase').BoxBase;


var HBox = core.createClass({
  name: 'HBox',

  extend: BoxBase,

  members: {
    orientation: 'horizontal'
  }
});


exports.HBox = HBox;

}});
require.define({'views/layout/vbox': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/layout/vbox.js */
var core = require('javelin/core');
var view = require('view');

var BoxBase = require('views/layout/boxbase').BoxBase;


var VBox = core.createClass({
  name: 'VBox',
  extend: BoxBase,

  members: {
    orientation: 'vertical'
  }
});


exports.VBox = VBox;

}});
require.define({'views/link': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/link.js */
var View = require('view').View;

var Actionable = require('mixins/actionable').Actionable;

var Link = require('javelin/core').createClass({

  name: 'Link',

  extend: View,

  delegateProperties: {
    label: [{alias: 'label', name: 'content'}]
  },

  mixins: [Actionable],

  members: {
    render: function() {
      this.setLayout({
        ref: 'label',
        content: ''
      });
      this.addClass('bolt-touchable-view');
      this.actionableInit();
    }
  }

});


exports.Link = Link;

}});
require.define({'views/pageheader': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/pageheader.js */
var core = require('javelin/core');
var util = require('util');

var View = require('view').View;
var HBox = require('views/layout/hbox').HBox;

var PageHeader = core.createClass({

  name: 'PageHeader',

  extend: View,

  properties: {
    label: 'Default'
  },

  delegateProperties: {
    label: [{alias: 'label', name: 'innerHTML'}]
  },

  members: {
    setup: function(options) {
      View.prototype.setup.call(this, options);
      this.setAdditionalClasses(['bolt-page-header', 'bt-bar']);
    },

    render: function() {
      this.setLayout([{
        view: 'HBox',
        childViews: [
          {
            ref: 'left',
            additionalClasses: 'bolt-page-header-left',
            flex: 1
          },
          {
            flex: 8
          },
          {
            ref: 'right',
            additionalClasses: 'bolt-page-header-right',
            flex: 1
          }
        ]
        },
        {
          ref: 'label',
          additionalClasses: 'bolt-page-header-label'
        }
      ]);
      this.addClass('bolt-page-header');
    },

    /**
     * Adds a view to either the left or the right
     *
     * @param {Object} view The view definition, usually a Button
     * @param {String} position Either 'left' or 'right'
     */
    addView: function(view, position) {
      this.refs[position || 'right'].setChildViews([view]);
    },

    getView: function(position) {
      return this.refs[position || 'right'].getChildViews()[0];
    },

    setChildViews: function(views) {
        var container = 'left';

        this.refs['left'].setChildViews([]);
        this.refs['right'].setChildViews([]);

        for (var i = 0; i < views.length && i < 2; i++) {
          if (views[i].headerAlign) {
            container = views[i].headerAlign;
            delete views[i].headerAlign;
          }
          this.addView(views[i], container);

          container = 'right';
        }
    }
  }
});


exports.PageHeader = PageHeader;

}});
require.define({'views/scene': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/scene.js */
var view = require('view');
var util = require('util');

var core = require('javelin/core');
var View = view.View;
var Button = require('views/button').Button;


var Scene = core.createClass({
  name: 'Scene',

  extend: View,

  properties: {
    /**
    * Will be set by stack once scene is pushed into the stack
    *
    * @type {SceneStack}
    */
    stack: null,

    /**
    * Track if a scene was pushed as modal. The out and reverse.in
    * animations are skipped on the preceding scene if true
    */
    modal: null,

    /**
     * The PageHeader for this scene.  This is created and managed by
     * the stack
     */
    header: null,

    title: 'Scene'
  },

  members: {

    // header API
    /**
     * Returns true if a header should be created for the scene,
     * false otherwise
     *
     * @return {Boolean}
     */
    useHeader: function() {
      return true;
    },

    setTitle: function(value) {
      this.setProperty('title', value);
      var header = this.getHeader();
      if (header) {
        header.setLabel(value);
      }
    },

    /**
    * Return header left button
    * Either a description or a view
    *
    * @return {Object|View}
    */
    getHeaderLeft: function() {
      if (this.getStack().getDepth() > 0) {
        return { view: Button, value: 'Back',
          onclick: util.bind(this.getStack().pop, this.getStack()) };
      }
      return null;
    },

    /**
    * Return header left button
    * Either a description or a view
    *
    * @return {Object|View}
    */
    getHeaderRight: function() {
      return null;
    },


    // lifecycle
    /**
    * Called by SceneStack after being pushed first time.
    * May return Deferred object, if setup is asynchronous
    *
    * @return {null|Deferred}
    */
    prepare: function() {},

    /**
    * Will be called by SceneStack during:
    * a) push
    * b) pop when current scene is previous to the one being popped
    *
    * @param {object} data Optional data which can be supplied by
    *                      another scene popped off the stack
    */
    activate: function(data) {},

    /**
    * Will be called by SceneStack during:
    * a) pop
    * b) push when current scene is previous to the one being pushed
    */
    deactivate: function() {},

    /**
    * Will be called by SceneStack during transition.
    * Transition won't start unti activate/deactivate is complete
    *
    * @param {String} transition Possible values: 'in', 'in.reverse',
    *                            'out', 'out.reverse'
    */
    startTransition: function(transition) {},

    /**
    * @see startTransition
    *
    * @param {String} transition
    */
    endTransition: function(transition) {}

  }
});


exports.Scene = Scene;
view.Scene = Scene;

}});
require.define({'views/scene_stack': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/scene_stack.js */
var core = require('javelin/core');
var view = require('view');
var util = require('util');
var dom  = require('javelin/dom');

var View = view.View;
var VBox = require('views/layout/vbox').VBox;
var PageHeader = require('views/pageheader').PageHeader;


var TRANSITON_TIME = 600;

var SceneStack = core.createClass({
  name: 'SceneStack',

  extend: View,

  construct: function(options) {
    View.call(this, options);
    this.scenes = [];
  },

  properties: {
    inTransition: false,

    hideInactiveScene: false,

    disableHeaders: false
  },

  members: {

    getDepth: function() {
      return this.scenes.length;
    },

    /**
    * Push scene into a stack.
    *
    * Activate the scene and then add it to the view.
    * If this scene is not the first one, deactivate the previous scene
    * and perform a css-based transition. Note that transition will not
    * start untill the new scene finished it prepare.
    *
    * @example
    *   stack.push(
    *     { view: Scene, content: 'Hello World!' },
    *     { transition: 'drawer'}
    *   );
    *
    * @param {Scene} scene
    * @param {object} options
    *                 - transition: specify a transition animation from
    *                               transitions.css
    */
    push: function(scene, options) {
      options = options || {};
      // ignore request if we're in transition
      if (this.getInTransition()) {
        return;
      }
      this.setInTransition(true);

      scene = this.build(scene);
      scene.setStack(this);

      var wrapper = this.insertScene(scene, options);
      var def = scene.prepare();
      if (def && def.addCallback) {
        def.addCallback(util.bind(function() {
          this.setWrapperVisibility(wrapper, true);
          this.pushPrepareComplete(scene, wrapper, options);
        }, this));
      } else {
        this.setWrapperVisibility(wrapper, true);
        this.pushPrepareComplete(scene, wrapper, options);
      }
    },

    /**
     * convenience method for pushing modal scenes
     */
    pushModal: function(scene, options) {
      scene.modal = true;
      this.push(scene, options);
    },

    /**
    * Pops the last scene from the view.
    *
    * Deactivate the last scene. Activate the previous one if available.
    * Perform a css-based transition. Remove last scene from the view.
    *
    * @param {object} data Optional data to pass back to the activate
    *                      method of the previous scene.
    */
    pop: function(data, options) {
      // ignore request if we're in transition
      if (this.getInTransition()) {
        return;
      }
      this.setInTransition(true);

      this.scenes[0].deactivate();

      // start activating previous scene (if previous available)
      // and deactivating the last one
      if (this.getDepth() > 1) {
        this.scenes[1].activate(data);
      }

      // run callback when both activation and deactivation are complete
      this.popActivationComplete(options || {});
    },

    /**
     * Pops the top scene off the stack and shows the scene specified
     * by the 'type' parameter.  All scenes in between are destroyed.
     *
     * @param {string|null} type The declared class name of the scene
     *                           which should be transitioned to. If null,
     *                           the first scene is transitioned to
     * @param {object} data Optional data to pass back to the activate
     *                      method of the previous scene.
     * @param {boolean} options Options to pass, e.g. an onComplete function,
     *                          or 'noTransition': true to not use animations
     */
    popTo: function(type, data, options) {
      var scene;

      for (var i = this.scenes.length - 2; i > 0; i--) {
        if (!type || type != this.scenes[i].getDeclaredClass()) {
          scene = this.scenes.splice(i, 1)[0];
          scene.setStack(null);
          // will call .destruct() for scene
          this.removeChild(this.getChildViews()[i]);
          i--;
        }
      }

      if (this.getDepth() > 1) {
        this.pop(data, options);
        return true;
      }
      return false;
    },

    insertScene: function(scene, options) {
      // start activating new scene and deactivating the previous one
      // (if previous available)
      if (this.getDepth() > 0) {
        this.scenes[0].deactivate();
      }

      // set up header
      options = options || {};

      var headerChildViews = [];
      var childViews = [];
      if (!this.getDisableHeaders() && scene.useHeader()) {
        var left = scene.getHeaderLeft();
        var right = scene.getHeaderRight();
        var title = scene.getTitle();

        left && (left.headerAlign = 'left') && headerChildViews.push(left);
        right && (right.headerAlign = 'right') && headerChildViews.push(right);
        childViews.push({
            view: 'PageHeader',
            label: title,
            ref: 'header',
            childViews: headerChildViews
        });
      }
      childViews.push(scene);

      // create css-based transition class
      var transition = options.transition || 'slide';
      var className = 'bt-scene-stack-wrapper ' + transition;

      // create a wrapper for header and scene
      scene.setFlex(1);
      var owner = {};
      var wrapper = this.build({
        view: VBox,
        className: className,
    //    style: { zIndex: this.scenes.length + 10 },
        childViews: childViews
      }, owner);

      var header = owner.refs ? owner.refs.header : null;
      if (header) {
        scene.setHeader(header);
      }

      // store scene, wrapper, and options
      this.setWrapperVisibility(wrapper, false);
      this.insertChild(wrapper);
      this.scenes.unshift(scene);

      return wrapper;
    },

    setWrapperVisibility: function(wrapper, visible) {
      wrapper.setStyle({visibility: (visible ? 'visible' : 'hidden')});
    },

    pushPrepareComplete: function(scene, wrapper, options) {
      scene.activate();

      // skip first scene, no transition is going to happen
      if (this.getDepth() > 1 && !options.noTransition) {
        if (!scene.getModal()) {
          this.scenes[1].startTransition('out');
          var childViews = this.getChildViews();
          childViews[childViews.length - 2].addClass('out').removeClass('in');
        }
        scene.startTransition('in');

        // one time animation event handler
        var _this = this;
        wrapper.getNode().addEventListener('webkitAnimationEnd', function() {
          wrapper.getNode().removeEventListener('webkitAnimationEnd', arguments.callee);
          _this.pushTransitionComplete();
          options.onComplete && options.onComplete();
        }, false);

        wrapper.addClass('in');
      } else {
        this.setInTransition(false);
      }
    },

    pushTransitionComplete: function() {
      this.scenes[1].endTransition('out');
      this.scenes[0].endTransition('in');

      if (this.getHideInactiveScene()) {
        this.scenes[1].getNode().parentNode.style.display = 'none';
      }
      var childViews = this.getChildViews();

      childViews[childViews.length - 1].removeClass('in');

      this.setInTransition(false);
    },


    popActivationComplete: function(options) {
      var childViews;
      var noTransition = options.noTransition;

      // start css-based transition for previous scene
      if (this.getDepth() > 1) {
        this.scenes[1].getNode().parentNode.style.display = '-webkit-box';
        if (!this.scenes[0].getModal()) {
          this.scenes[1].startTransition('in.reverse');

          childViews = this.getChildViews();
          childViews[childViews.length - 2].removeClass('out');
          if (!noTransition) {
            childViews[childViews.length - 2].addClass('in reverse');
          }
        }
      }

      // start css-based transition for poped scene
      this.scenes[0].startTransition('out.reverse');

      childViews = this.getChildViews();

      if (!noTransition) {
        var wrapper = childViews[childViews.length - 1];

        // one time animation event handler
        var _this = this;
        wrapper.getNode().addEventListener('webkitAnimationEnd', function() {
          wrapper.getNode().removeEventListener('webkitAnimationEnd', arguments.callee);
          _this.popTransitionComplete();
          options.onComplete && options.onComplete();
        }, false);

        wrapper.addClass('out reverse');
      } else {
        this.popTransitionComplete();
        options.onComplete && options.onComplete();
      }
    },

    popTransitionComplete: function() {
      var childViews = this.getChildViews();
      if (this.getDepth() > 1) {
        this.scenes[1].endTransition('in.reverse');

        childViews[childViews.length - 2].removeClass('in').removeClass('reverse');
      }

      this.scenes[0].endTransition('out.reverse');
      this.scenes[0].setStack(null);
      // will call .destruct() for scene
      this.removeChild(childViews[childViews.length - 1]);
      this.scenes.shift();

      this.setInTransition(false);
    }
  }
});


exports.SceneStack = SceneStack;
view.SceneStack = SceneStack;

}});
require.define({'views/scroll_view': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/scroll_view.js */
require('views/layout/vbox');

var core = require('javelin/core');
var dom = require('javelin/dom');
var util = require('util');
var build = require('builder').build;

var View = require('view').View;
var iScroll = require('iscroll').iScroll;

var ScrollView = core.createClass({

  name: 'ScrollView',

  extend: View,

  properties: {
    useScrollbar: true
  },

  members: {
    SCROLL_CHECK_INTERVAL: 10,

    // if a scroll event fires more than n times without a change
    // in state kill the timer as it is probably malfunctioning
    TIMER_NOOP_KILL_THRESHOLD: 250,

    flex: 1,

    render: function() {
      var node = this.getNode();
      node.style.position = 'relative';
      dom.alterClass(node, 'wrapper', true);
      if (!this._scroller) {
        this._scroller = this.build({
          className: 'scroller',
          style: {
            position: 'relative'
          }
        });
        dom.appendContent(node, this._scroller.getNode());
      }
      this.matrix = new WebKitCSSMatrix();
      return this;
    },

    destroy: function() {
      View.prototype.destroy.call(this);
      this.scrolling = false;
      clearTimeout(this.scrollTimeout);
      this._iScroll && this._iScroll.destroy();
    },

    onDocumentInsertion: function() {
      var iScrollOptions = {
        onScrollEnd: util.bind(this.onScrollEnd, this),
        onScrollChange: util.bind(this.onScrollChange, this),
        onScrollStart: util.bind(this.onScrollStart, this)
      };

      if (this.options.iscroll) {
        iScrollOptions = util.extend(iScrollOptions, this.options.iscroll);
      }
      this._iScroll = new iScroll(this.getNode(), iScrollOptions);
      this._iScrollStyle = this._iScroll.scroller.style;
      this._scrollObserver = util.bind(this.observeScroll, this);
    },

    observeScroll: function() {
      clearTimeout(this.scrollTimeout);
      this.matrix.setMatrixValue(window.getComputedStyle(this._iScroll.scroller, null).webkitTransform);
      var x, y, N = 1;
      var deltaX = Math.abs(this.matrix.m41 - (this.scrollX || 0));
      var deltaY = Math.abs(this.matrix.m42 - (this.scrollY || 0));
      if (deltaX > N || deltaY > N) {
        x = this.scrollX = this.matrix.m41;
        y = this.scrollY = this.matrix.m42;
        this.onScroll(x, y);
      }

      // wbailey 06-02-11: we discovered that touching down on a non ScrollView
      // area while releasing a scroll on a ScrollView causes the scrollEnd
      // event to not be fired from iScroll. The _timerNOOPCount variable checks
      // to see if we return the same scrollValue several times in a row and
      // kills the timer if so.
      if (this.scrollY === this._lastScrollY) {
        this._timerNOOPCount = this._timerNOOPCount || 0;
        this._timerNOOPCount++;
      } else {
        this._timerNOOPCount = 0;
      }
      this._lastScrollY = this.scrollY;

      if (this.scrolling && this._timerNOOPCount < this.TIMER_NOOP_KILL_THRESHOLD) {
        this.scrollTimeout = setTimeout(this._scrollObserver, this.SCROLL_CHECK_INTERVAL);
      } else {
        if (this._timerNOOPCount >= this.TIMER_NOOP_KILL_THRESHOLD) {
          console.log('killed a runaway timer in Bolt ScrollView');
        }
      }
    },

    onScrollStart: function() {
      this.scrolling = true;
      this.observeScroll();
      var owner = this.getOwner();
      owner.didScrollStart && owner.didScrollStart(this);
    },

    onScroll: function(x, y) {
      if (this.isDestroyed) return;
      var owner = this.getOwner();
      owner.scrollViewDidScrollTo && owner.scrollViewDidScrollTo(this, x, y);
    },

    onScrollChange: function(newX, newY) {
      var owner = this.getOwner();
      if (owner && owner.willScrollToAnimated) {
        owner.willScrollToAnimated(newX, newY);
      }
    },

    onScrollEnd: function() {
      var owner = this.getOwner();
      if (owner && owner.didScrollTo) {
        owner.didScrollTo(this._iScroll.x, this._iScroll.y, this);
      }
      this.scrolling = false;
      clearTimeout(this.scrollTimeout);
    },

    setHeight: function(height) {
      View.prototype.setHeight.call(this, height);
      this.refresh();
    },

    scrollTo: function(x, y, time, relative) {
      this._iScroll.scrollTo(x, y, time, relative);
      this.onScrollChange(x,y);
    },

    scrollToPageX: function(pageNum, time) {
      this._iScroll.scrollToPage(pageNum, 0, time);
    },

    getPageXNum: function() {
      return this._iScroll.currPageX;
    },

    getDirX: function() {
      return this._iScroll.dirX;
    },

    setContentHeight: function(height) {
      this._scroller.getNode().style.height = height + 'px';
    },

    setUseScrollbar: function(useScrollbar) {
      dom.alterClass(this.getNode(), 'bolt-hidden-scrollbar', !useScrollbar);
    },

    maxScrollY: function() {
      return -this._iScroll.maxScrollY;
    },

    scrollHeight: function() {
      return this._iScroll.scrollerH;
    },

    appendChild: function(child) {
      this.getChildViews().push(child);
      this._scroller.appendChild(child);
      util.debounce(this.refresh, 250)();
      return this;
    },

    // notify iScroll of changes
    refresh: function() {
      this._iScroll && this._iScroll.refresh();
    },

    clear: function() {
      util.invoke(this.getChildViews(), 'destroy');
      this._scroller.getNode().innerHTML = '';
    },

    /**
     * get the current coordinates for the scroller
     */
    coords: function() {
      if (!this._iScroll) {
        return [0, 0];
      }
      return [this._iScroll.x, this._iScroll.y];
    }

    // _onScrollChange: function(newX, newY) {
    //   var owner = this.getOwner();
    //   if (owner && owner.willScrollToAnimated) {
    //     owner.willScrollToAnimated(newX, newY);
    //   }
    // },

    // _onScrollEnd: function() {
    //   var owner = this.getOwner();
    //   if (owner && owner.didScrollTo) {
    //     owner.didScrollTo(this._iScroll.x, this._iScroll.y, this);
    //   }
    // },

    // _checkScroll: function() {
    //   if (!this._iScroll) {
    //     return null;
    //   }
    //   util.forEach(['x', 'y'], function(coord) {
    //     var last = '_' + coord;
    //     if (this[last] === 'undefined') this[last] = this._iScroll[coord];
    //     if (this[last] != this._iScroll[coord]) {
    //       this[last] = this._iScroll[coord];
    //     }
    //   }, this);

    //   return [this.scrollX || 0, this.scrollY || 0];
    // }

  }
});


exports.ScrollView = ScrollView;

}});
require.define({'views/scrubber': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/scrubber.js */
var util = require('util');
var view = require('view');
var View = view.View;

var Scrubber = require('javelin/core').createClass({
  extend: View,

  name: 'Scrubber',

  properties: {
    characters: 'abcdefghijklmnopqrstuvwxyz#',
    caps: true
  },

  members: {
    render: function() {
      var caseFn = this.getCaps() ? 'toUpperCase' : 'toLowerCase';
      if (this.getCaps()) {
        this.addClass('bolt-upper-case');
      }

      this.setBoxOrientation(this.getBoxOrientation() || 'vertical');
      this.handleTouch = util.bind(this.handleTouch, this);

      var touchEvents = view.touchEvents;

      var kids = [];
      var chars = this.getCharacters();
      var len = chars.length;
      var c;
      for (var i = 0; i < len; i++) {
        c = chars.substr(i, 1).toLowerCase();
        kids.push({
          content: c,
          flex: 1,
          metadata: {letter: c}
        });
      }

      this.addClass('bolt-' + this.getBoxOrientation());
      this.listen([touchEvents.TOUCHSTART], util.bind(this.handleTouchStart, this));
      this.listen([touchEvents.TOUCHEND], util.bind(this.handleTouchEnd, this));

      this.setLayout(kids);
      if (view.hasTouch) {
        this.listen([touchEvents.TOUCHMOVE], this.handleTouch, this);
      } else {
        // TODO: JX doesn't get mousemove currently
        this.getNode().onmousemove = this.handleTouch;
      }
    },

    handleTouchStart: function(evt) {
      var rawEvt = this.getRawEvent(evt);
      var target = rawEvt.target;
      if (target && target.nodeType === 3) {
        target = target.parentNode;
      }

      if (!target.getAttribute('data-letter')) {
        return;
      }
      var h = target.offsetHeight;
      this.touchPos = {
        x: rawEvt.pageX,
        y: rawEvt.pageY,
        nodeIndex: util.indexOf(this.getNode().childNodes, target)
      };
      this.letterHeight = target.offsetHeight;

      this.addClass('touched');
      this.handleTouch(evt);
    },


    handleTouchEnd: function(evt) {
      this.touchPos = null;
      this.removeClass('touched');
      var owner = this.getOwner();
      if (owner && owner.onScrubEnd) {
        owner.onScrubEnd(this);
      }
    },

    handleTouch: function(evt) {
      if (!this.touchPos) {
        this.handleTouchStart(evt);
        return;
      }
      evt.kill();
      this.addClass('touched');
      var owner = this.getOwner();
      var rawEvt = this.getRawEvent(evt);

      var diffY = this.touchPos.y - rawEvt.pageY;
      var siblings = this.getNode().childNodes;
      var childIdx =
        Math.max(0,
          Math.min(siblings.length - 1,
            Math.round(this.touchPos.nodeIndex - (diffY / this.letterHeight))
          )
        );
      var target = siblings[childIdx];
      var letter = target.getAttribute('data-letter');
      if (owner && owner.onScrub && letter) {
        owner.onScrub(letter);
      }
    },

    getRawEvent: function(evt) {
      var rawEvt = evt.getRawEvent ? evt.getRawEvent() : evt;
      if (rawEvt.touches) {
        rawEvt = rawEvt.touches[0];
      }
      return rawEvt;
    }
  }
});

exports.Scrubber = Scrubber;

}});
require.define({'views/simpletooltip': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/simpletooltip.js */
var util = require('util');
var stratcom = require('javelin/stratcom');

var View = require('view').View;


var SimpleTooltip = require('javelin/core').createClass({
  name: 'SimpleTooltip',

  extend: View,

  construct: function(options) {
    View.call(this, options);
    stratcom.listen('modalopen', null, util.bind(this.handleModalOpen, this));
  },

  members: {
    style: {
      display: 'none'
    },

    handleModalOpen: function(evt) {
      if (evt.getData() !== this) {
        this.hide();
      }
    },

    render: function() {
      View.prototype.render.call(this);
      this.hide();
    },

    show: function() {
      stratcom.invoke('modalopen', null, this);
      this.getNode().style.display = 'inherit';
    },

    hide: function() {
      this.getNode().style.display = 'none';
    },

    toggle: function() {
      this[this.getNode().style.display == 'none' ? 'show' : 'hide']();
    }
  }
});


exports.SimpleTooltip = SimpleTooltip;

}});
require.define({'views/table': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/table.js */
var core   = require('javelin/core');
var view   = require('view');
var util   = require('util');
var dom    = require('javelin/dom');
var vector = require('javelin/vector');

var View  = require('view').View;
var ScrollView = require('views/scroll_view').ScrollView;


// TODO: remove this -- temporarily used for measuring performance
var $i = window.$i || {stop: function(){}, start: function(){}};

// protocol to be implemented by the table owner
// var TableOwner = {
//
//   // total number of sections in the table
//   numberOfSections: function() {
//     return 0;
//   },
//
//   // number of rows in a section
//   numberOfRowsInSection: function(section) {
//     return 0;
//   },
//
//   // view for a given section and row
//   cellForRowInSection: function(row, section) {
//     return {};
//   },
//
//   // view for a given section
//   sectionHeaderAtIndex : function(row) {
//     return {};
//   },
//
//   // height for the requested section
//   heightForSectionHeader: function(section) {
//     return 0;
//   },
//
//   // height of a requested row
//   heightForRowInSection: function(row, section) {
//     return 0;
//   },
//
//   // tapped on a row
//   onRowTap: function() {
//   }
//
// };


var Table = core.createClass({
  name: 'Table',

  extend: View,

  properties: {
    // should the cells in this table be selectable
    // fires onRowTap if true
    selectable: true,

    // if you only have a small amount of data you can just
    // render all of it
    progressive: true,

  	// set whether or not to show the scrollbar
    scrollbar: true,

    // Set to a non-null value if all rows are the same height
    fixedRowHeight: 0,

    // disable cleaning up the dom after scroll finishes
    disableClear: false,

    // number of cells to render as a group
    packSize: 3,

    // number of additional screens to keep around after scrolling
    postScrollBuffer: 0,

    // number of screens to buffer ahead while scrolling
    bufferSize: 0,

    // perform additional logging for performance tuning
    debug: true

  },

  members: {
    // packs to render
    _packs: [],

    /**
     * perform the initial render of the view components
     * and refresh the data from the delegate
     */
    render: function() {
      this.setBoxOrientation('vertical');
      this._layout = this.setLayout([
        {
          view: 'ScrollView',
          ref: 'scrollview',
          owner: this,
          style: {height: '100%'},
          flex: 1
        },
        {
          className: 'bt-loading-view',
          content: '<div class="bt-loading-text"><div class="bt-loading-indicator"></div>loading...</div>',
          ref: 'loadingShield',
          style: {
            fontSize: '18px'
          },
          flex: 1
        }
      ]);

      this.setStyle({height: '100%'});
      this.scrollView = this.refs.scrollview;
      this.scrollView.onScroll = util.bind(this.onScroll, this);
      this.loadingShield = this.refs.loadingShield;
    },

    onScroll: function(x, y) {
      y = -y;
      this._log('table did scroll', x,y);
      this._log('range:', this.lastY,y);
      this._tableWantsDataInRange(this.lastY || 0, y, this.getBufferSize());
      this._removePacksNotInRange(this._lastRenderedRange);
      this.lastY = y;
    },

    setup: function(options) {
      View.prototype.setup.call(this, options);

      var touchEvents = view.touchEvents;
      this.listen([touchEvents.TOUCHSTART], util.bind(this._onTouchStart, this));
      this.listen([touchEvents.TOUCHEND], util.bind(this._onTouchEnd, this));

      if (view.hasTouch) {
        this.listen([touchEvents.TOUCHMOVE], util.bind(this._onTouchMove, this));
      } else {
        // TODO: JX doesn't get mousemove currently
        this.getNode().onmousemove = util.bind(this._onTouchMove, this);
      }
    },

    /**
     * refresh the data
     */
    refresh: function() {
      this._packs = [];
      if (!this.scrollView) return;
      var range = this._getViewportRange();
      this.cleanup();
      delete this.totalHeight;
      this._tableWantsDataInRange(
        range[0], range[1], this.getPostScrollBuffer());
      this.scrollView.refresh();
    },

    /**
     * clear the data in the scroll
     */
    cleanup: function() {
      //TODO:this needs to clean up child views
      this.scrollView.clear();
    },

    /**
     * set the table to busy state
     */
    setLoading: function(loading) {
      this._loading = loading;
      if (loading) {
        this.addClass('bt-loading');
      } else {
        this.removeClass('bt-loading');
      }
    },

    setScrollbar: function(value) {
      this[!value ? 'addClass' : 'removeClass']('bolt-table-no-scrollbar');
    },

    /**
     * scroll to a given y
     */
    scrollTo: function(y, time, relative) {
      this.scrollView.scrollTo(0, y, time, relative);
    },

    /**
     * scroll to the max y
     */
    scrollToEnd: function(time) {
      if (this.totalHeight < this.visibleHeight()) {
        return;
      }
      this.scrollTo(this.visibleHeight() - this.totalHeight, time);
    },

    visibleHeight: function() {
      return this.getRect().height;
    },

    // EVENT HANDLERS
    _onTouchStart: function(e) {
      var evt = e.getRawEvent();
      this._startX = evt.clientX;
      this._startY = evt.clientY;
      var path = this.findPathToParentWithClass(
        e.getTarget(),
        'bt-table-row-pack');
      this._moved = false;
      this._canceled = false;
      if (path && path[path.length - 2]) {
        this._touchDownRow = path[path.length -2];
          var _this = this;
          this._touchDownTimer = setTimeout(function() {
            if (_this._touchDownRow && _this.getSelectable()) {
              dom.alterClass(_this._touchDownRow, 'bt-active', true);
            }
          }, 50);
      }
    },

    _onTouchCancel: function() {
      this._canceled = true;
      this._deselectRow();
    },

    _onTouchMove: function() {
      this._moved = true;
      this._deselectRow();
    },

    _deselectRow: function() {
      if (this._touchDownRow) {
        if (this.getSelectable()) {
          dom.alterClass(this._touchDownRow, 'bt-active');
        }
        clearTimeout(this._touchDownTimer);
        delete this._touchDownRow;
      }
    },

    _onTouchEnd: function(e) {
      clearTimeout(this._touchDownTimer);
      if (this._touchDownRow && this._isTap(e)) {
        this._onTap(this._touchDownRow);
        this._clearSelection();
      }
    },

    _clearSelection: function() {
      clearTimeout(this._touchDownTimer);
      if (this._touchDownRow) {
        if (this.getSelectable()) {
          dom.alterClass(this._touchDownRow, 'bt-active');
        }
        delete this._touchDownRow;
      }
    },

    _onTap: function(row, deselectCallback) {
      this.getOwner() && this.getOwner().onRowTap &&
        this.getOwner().onRowTap(row, deselectCallback);
    },

    _isTap: function(e) {
      return !this._moved && !this._canceled;
    },

    /**
     * get the y coordinate range comprising the current viewport
     */
    _getViewportRange: function() {
      var from = -this.scrollView.coords()[1];
      var to = from + this.scrollView.getRect().height;
      this._log('refreshing range:', [from, to]);
      return [from, to];
    },

    /**
     * iterate over the data from the delgate capturing row height information
     */
    _iterateData: function(callback) {
      var iterated = 0;
      var currentHeight = 0;
      var owner = this.getOwner();
      var sections = owner.numberOfSections ? owner.numberOfSections() : 1;
      var fixedRowHeight = this.getFixedRowHeight();

      for (var i = 0; i < sections; i++) {
        currentHeight = owner.heightForSectionHeader ? owner.heightForSectionHeader(i) : 0;
        res = callback.call(this, iterated, iterated + currentHeight, i);
        if (res === false) return;
        iterated += currentHeight;
        var rows = owner.numberOfRowsInSection(i);
        for (var j = 0; j < rows; j++) {
          currentHeight = fixedRowHeight || owner.heightForRowInSection(j, i);
          res = callback.call(this, iterated, iterated + currentHeight, i, j);
          if (res === false) return;
          iterated += currentHeight;
        }
      }
    },

    tableWantsDataAtIndex: function(targetSection, targetIdx) {
      var startRange;
      var justSection = arguments.length < 2;

      this._iterateData(function(iteratedHeight, currentRowEnd, section, row) {
        startRange = iteratedHeight;

        if (targetSection == section && (justSection || targetIdx === row)) {
          return false;
        }
      });
      // TODO: wbailey don't use a hardcoded number here
      this._tableWantsDataInRange(startRange, startRange + this.visibleHeight(), 1);

      this.scrollTo(-1 * startRange, 0);
    },

    /**
     * derive the height of the scrollable region from the data
     */
    _deriveScrollHeight: function() {
      if (this.totalHeight) return this.totalHeight;
      this.totalHeight = this.totalHeight || 0;
      this._iterateData(function(from, to, section, row) {
        this.totalHeight = to;
      });
      this.scrollView.setContentHeight(this.totalHeight);
      return this.totalHeight;
    },

    /**
     * determine if a given set of view packs fill the requested
     * range
     */
    _packsFillRange: function(packs, from, to) {
      if (packs.length === 0) return false;
      var first = packs[0];
      var last = packs[packs.length - 1];
      if (first.from <= from && last.to >= to) {
        return true;
      } else {
        return false;
      }
    },

    /**
     * determine if an object the expose from and to properties fits
     * within a given range
     */
    _isInRange: function(elem, from, to) {
      if (elem.from <= from && elem.to >= from) return true;
      if (elem.from >= from && elem.to <= to) return true;
      if (elem.from >= from && elem.from <= to) return true;
      return false;
    },

    /**
     * load the packs required to fill a given range from cache if possible
     */
    _packsForRange: function(from, to) {
      this._packs = this._packs || [];
      var packsInRange = [];
      var fillStart = 0;
      var fillEnd = 0;
      for (var i = 0; i < this._packs.length; i++) {
        var pack = this._packs[i];
        if (this._isInRange(pack, from, to)) {
          packsInRange.push(pack);
          if (fillStart === null) {
            fillStart = pack.from;
          }
          fillEnd = pack.to;
        }
      }
      if (this._packsFillRange(packsInRange, from, to)) {
        this._log('returning early with packs');
        return packsInRange;
      }

      var currentPack;
      var packSize = this.getPackSize();
      var owner = this.getOwner();
      this._iterateData(function(itemFrom, itemTo, section, row) {
        var shim = {from: itemFrom, to: itemTo};
        if (this._isInRange(shim, fillEnd, to)) {
          // this._log('adding item to pack: ' + from + ' ' + to);
          if (!currentPack || currentPack.length >= packSize) {
            currentPack = [];
            this._packs.push(currentPack);
            packsInRange.push(currentPack);
          }
          var view;
          if (typeof row === 'undefined') {
            view = owner.sectionHeaderAtIndex && owner.sectionHeaderAtIndex(section);
          } else {
            view = owner.cellForRowInSection && owner.cellForRowInSection(row, section);
          }

          if (view) {
            if (typeof currentPack.from === 'undefined') {
              currentPack.from = itemFrom;
            }
            currentPack.to = itemTo;
            currentPack.push(view);
          }
          if (itemTo > to) return false;
        }
        return true;
      });

      return packsInRange;
    },

    /**
     * render a set of packs
     */
    _renderPacks: function(packs) {
      $i.start('table:_renderPacks');
      var _this = this;
      // setTimeout(function() {
        for (var i = 0; i < packs.length; i++) {
          pack = packs[i];
          if (!pack.view) {
            var packView;
            if (typeof pack[0] === 'string') {
              packView = _this.build({
                content: pack.join(''),
                className: 'bt-table-row-pack bt-hwa'
              });
            } else {
              packView = _this.build({
                childViews: pack,
                className: 'bt-table-row-pack bt-hwa'
              });
            }
            packView.getNode().style.cssText = 'width:100%;position:absolute;top:' +
              pack.from + 'px';
            pack.view = packView;
          }
          if (!pack.view.getNode().parentNode) {
            _this.scrollView.appendChild(pack.view);
          }
        }
      // },0);
      $i.stop('table:_renderPacks');
    },

    /**
     * called to indicate that the table will be showing data in a given
     * y coordinate range
     */
    _tableWantsDataInRange: function(from, to, padding) {
      $i.start('table:_tableWantsDataInRange');
      var maxHeight = this._deriveScrollHeight();
      var constrained = this._constrainToBounds(from, to, maxHeight, padding);
      from = constrained[0];
      to = constrained[1];
      this._log('from:' + from + ' to:' + to);
      var packs = this._packsForRange(from, to);
      this._renderPacks(packs);
      this._lastRenderedRange = [from, to];
      $i.stop('table:_tableWantsDataInRange');
    },

    /**
     * clean up packs that are not in the current range
     */
    _removePacksNotInRange: function(range) {
      $i.start('table:removePacksNotInRange');
      for (var i = 0; i < this._packs.length; i++) {
        var pack = this._packs[i];
        var from = range[0];
        var to   = range[1];
        if (!this._isInRange(pack, from, to) && pack.view) {
          pack.view.remove();
        }
      }
      $i.stop('table:removePacksNotInRange');
    },

    /**
     * this method takes a requested range and constrains and optimizes it
     * for rendering
     *
     * We ensure that the bounds of the total scrollable height are not exceeded
     * and pad the range with an additional screen of data on either side
     */
    _constrainToBounds: function(from, to, maxHeight, padding) {
      if (!this.getProgressive()) {
        from = 0;
        to = Infinity;
        console.log('rendering range:', [from, to]);
        return [from, to];
      }
      padding = padding || 1; // number of extra screens to render
      var viewportHeight = this.scrollView.getRect().height;
      if (to < viewportHeight) {
        to = viewportHeight;
      }

      // add a buffer
      from = from - (viewportHeight * padding);
      to = to + (viewportHeight * padding);

      if (maxHeight && to > maxHeight) {
        to = maxHeight;
      }
      if (from < 0) {
        from = 0;
      }

      from = Math.round(from);
      to = Math.round(to);
      return [from, to];
    },

    /**
     * internal logging
     */
    _log: function() {
      if (this.getDebug()) {
        console.log.apply(console, arguments);
      }
    },

    /**
     * convert a coordinate to the viewport range it defines
     */
    _convertCoordinatesToRange: function(x, y) {
      var currentY = this.scrollView.coords()[1];
      var from, to;
      var rect = this.scrollView.getRect();
      if (y > currentY) {
        from = -y;
        to = -currentY + rect.height;
      } else {
        from = -currentY;
        to = -y + rect.height;
      }
      return [from, to];
    },

    /**
     * fired just before an animated scroll begins
     */
    willScrollToAnimated: function(x,y) {
      // if (!this.getProgressive()) return;
      // var _this = this;
      // // setTimeout(function() {
      //   var range = _this._convertCoordinatesToRange(x, y);
      //   var from = range[0];
      //   var to = range[1];
      //   _this._tableWantsDataInRange(from, to);
      // // },0);
    },

    /**
     * fired after every scroll move
     */
    didScrollTo: function(x,y) {
      // if (!this.getProgressive()) return;
      // var range = this._convertCoordinatesToRange(x, y);
      // var from = range[0];
      // var to = range[1];
      // this._log('********* DID SCROLL TO RANGE ************', from, to);
      // if (this._lastRenderedRange && !this.getDisableClear()) {
      //   this._removePacksNotInRange(this._lastRenderedRange);
      // }
      // this._tableWantsDataInRange(from, to, this.getPostScrollBuffer());
    }
  }

});


exports.Table = Table;

}});
require.define({'views/table_view': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/table_view.js */
var core              = require('javelin/core');
var util              = require('util');
var view              = require('view');
var View              = require('view').View;
var ScrollView        = require('views/scroll_view').ScrollView;
var HasEventListeners = require('mixins/has_event_listeners').HasEventListeners;

// ### TableView
// TableView provides an efficient mechanism for progressively
// rendering from a data source provided by the owner object.
// Cells are queued for reuse when they go offscreen and then
// translated back into position with updated content as they
// are reused.
var TableView = exports.TableView = core.createClass({
  name: 'TableView',

  extend: View,

  mixins: [HasEventListeners],

  declare: function(options) {
    return {
      eventListeners: {
        'touchstart,touchend,touchmove .bt-table-view-cell': 'onCellTouch'
      },
      debug: false,
      style: {height: '100%'},
      flex: 1,
      boxOrientation: 'vertical',
      bufferSize: 0,
      sectioned: true,

      // Stick a header to the top of the list
      stickySectionHeaders: false,
      fixedSectionHeaderHeight: 0,
      childViews: [
        {
          ref: 'floatingSection',
          owner: this,
          additionalClasses: 'bolt-table-view-floating-section'
        },
        {
          view: 'ScrollView',
          owner: this,
          ref: 'scrollView',
          flex: 1
        },
        {
          additionalClasses: 'bt-table-loading-view',
          ref: 'loadingView',
          style: {display: 'none'},
          owner: this,
          childViews: [
            {
              content: 'Loading...',
              additionalClasses: 'bt-loading-view-text'
            }
          ]
        }
      ]
    };
  },

  // after the setup method is invoked we cache a few references for
  // later use.
  ready: function() {
    this.itemList = [];
    this.owner = this.getOwner();
    this.scrollView = this.findRef('scrollView');
    this.bufferSize = this.getBufferSize();
    this.y = 0;
    this.topSectionIdx = -1;
    this.sectionHeaderContents = [];
    this.lastY = 0;
    this.lastX = 0;
    this.loadingView = this.findRef('loadingView');

    if (this.getFixedRowHeight) {
      this.fixedRowHeight = this.getFixedRowHeight();
    }
  },

  setLoading: function(loading) {
    if (loading) {
      var height = this.calculateViewPort().height + 'px';
      this.loadingView && this.loadingView.show();
    } else {
      this.loadingView && this.loadingView.hide();
    }
  },

  show: function() {
    this.setStyle({display: '-webkit-box'});
    var _this = this;
    setTimeout(function() {
      _this.refresh();
      _this.moveToTop();
    }, 100);
  },

  destroy: function() {
    this.superKlass.prototype.destroy.call(this);
  },

  // clear the currently selected cell
  clearSelection: function() {
    this.selectedCell && this.selectedCell.setSelected(false);
  },

  // Fired by the baseview. We set the initial Y coordinate of the TableView
  // and invalidate it, which forces buffering to occur
  onDocumentInsertion: function() {
    this.isInserted = true;
    var _this = this;
    setTimeout(function() {_this.refresh();}, 10);
  },

  // Fired when the user taps on a cell
  onCellTouch: function(e, elem) {
    var idx = elem.getAttribute('data-item-index');
    this.log(e.type);
    var item = this.itemList[idx];
    var view = item && item.view;
    var owner = this.getOwner();
    if (!view) return;
    switch(e.type) {
      case 'touchstart':
        this._cellSelectTimer = setTimeout(util.bind(function() {
          this.clearSelection();
          view.setSelected(true);
          this.selectedCell = view;
        }, this), 50);
        break;
      case 'touchend':
        clearTimeout(this._cellSelectTimer);
        if (view.getSelected()) {
          owner.cellSelectedAtRowInSection(this, item.row, item.section, view);
        }
        break;
      case 'touchmove':
        clearTimeout(this._cellSelectTimer);
        this.clearSelection();
        break;
      default:
        break;
    }
  },

  // Call refresh whenever you want to do a full refresh of the table.
  // The table's size will be recalculated and it will be freshly buffered
  // to the current scroll coordinates.
  refresh: function() {
    this.clear();
    this.buffer();
  },

  // Delegate callback from the scrollview indicating that it scrolled to the
  // current x, y coordinates.
  scrollViewDidScrollTo: function(scrollView, x, y) {
    this.x = -x;
    this.y = -y;
    var deltaY = Math.abs(this.y - this.lastY);
    if (deltaY > 20) {
      this.buffer();
      this.lastY = y;
      this.lastX = x;
    }
  },

  didScrollTo: function(scrollView) {
    var owner = this.getOwner();
    owner.didScrollEnd && owner.didScrollEnd(this);
  },

  didScrollStart: function(scrollView) {
    var owner = this.getOwner();
    owner.didScrollStart && owner.didScrollStart(this);
  },

  // clear all childviews;
  clear: function() {
    delete this.viewPort;
    delete this.scrollHeight;
    delete this.sectionCount;
    delete this.rowCounts;
    delete this.lastHeadPtr;
    delete this.lastTailPtr;
    this.clearSelection && this.clearSelection();
    util.forEach(this.itemList || [], function(item) {
      this.reapItem(item);
    }, this);
  },

  // buffer the data by rendering the delta between the old and new scroll
  // positions and cleaninup up anything unused.
  buffer: function() {
    this.calculateBuffer(this.y);
    if (this.viewPort.height === 0) {
      delete this.viewPort;
      delete this.scrollHeight;
    } else {
      if (this.lastHeadPtr !== this.headPtr || this.lastTailPtr !== this.tailPtr) {
        this.renderBuffer(
          this.headPtr,
          this.tailPtr,
          this.lastHeadPtr,
          this.lastTailPtr);
      }
    }
  },

  // Determine the desired buffer for the given y coordinate. This buffer will
  // be used to determine which unused cells can be cleaned up and which cells
  // to use when populating the empty region after the scroll.
  calculateBuffer: function(y) {
    if (!this.viewPort) this.calculateViewPort();
    if (!this.scrollHeight) this.calculateScrollHeight();
    this.viewPortHeadPtr = this.findItemIndex(Math.max(y, 0));
    this.viewPortTailPtr = this.findItemIndex(
      Math.min((y + this.viewPort.height), this.scrollHeight));
    // The head and tail pointers provide an extra buffer around the view port
    // allowing for some latency between rendering and scrolling. Increasing
    // the buffer can be configured from the owner class and may help reduce
    // flickering in some cases.
    this.headPtr = Math.max(this.viewPortHeadPtr - this.bufferSize, 0);
    this.tailPtr = Math.min(
      this.viewPortTailPtr + this.bufferSize,
      this.itemList.length - 1);
  },

  moveToSection: function(section, time) {
    var sectionIndex = this.sectionIndices[section];
    section = this.itemList[sectionIndex];
    //this.calculateBuffer(section.start);
    this.y = section.start;
    util.forEach(this.itemList, this.reapItem, this);

    // Delete the last pointers to force renderBuffer to enter the refresh state
    delete this.lastHeadPtr;
    delete this.lastTailPtr;

    this.buffer();
    this.scrollView.scrollTo(0, -this.y, time || 0, false);
  },

  moveToEnd: function(time) {
    var endY;
    if (this.scrollHeight < this.viewPort.height) {
      endY = 0;
    } else {
      endY = this.scrollHeight - this.viewPort.height;
    }
    if (time === 0) {
      this.y = endY;
      this.refresh();
      this.scrollView.scrollTo(0, -endY, 0, false);
    } else {
      this.scrollView.scrollTo(0, -endY, time || 0, false);
    }
  },

  moveToTop: function(time) {
    this.scrollView.scrollTo(0, 0, time || 0, false);
  },

  // Render the current buffer window by calculating the direction of
  // movement, rendering items to fill the revealed portion of the buffer
  // and reaping items from the portion of the prior buffer not included
  // in the current buffer.
  //
  // For Example in a downward scroll:
  //
  // -------------
  //               <- last head ptr
  // BUFFER        <- to be reaped
  //               <- current head ptr
  // -------------
  //
  //  VIEW PORT
  //
  // -------------
  //              <- last tail ptr
  //   BUFFER     <- to be rendered
  //              <- current tail ptr
  // -------------
  renderBuffer: function(headPtr, tailPtr, lastHeadPtr, lastTailPtr) {
    var direction;
    if (lastHeadPtr === undefined && lastTailPtr === undefined) {
      direction = 'refresh';
    } else if (tailPtr > lastTailPtr || headPtr > lastHeadPtr) {
      direction = 'down';
    } else if (tailPtr < lastTailPtr || headPtr < lastHeadPtr) {
      direction = 'up';
    }

    var i;
    switch (direction) {
      // If we don't have a prior state, then just render the entire viewport.
      case 'refresh':
        for (i = headPtr; i <= tailPtr; i++) {
          this.renderItem(this.itemList[i], i);
        }
        break;
      // The user is scrolling down the table so reap from the head and render
      // to the tail.
      case 'down':
        for (i = lastHeadPtr; i < headPtr; i++) {
          this.reapItem(this.itemList[i]);
        }
        for (i = lastTailPtr + 1; i <= tailPtr; i++) {
          this.renderItem(this.itemList[i], i);
        }
        break;
      // the user is scrolling up the table so reap from the tail and render
      // to the head.
      case 'up':
        for (i = lastTailPtr; i > tailPtr; i--) {
          this.reapItem(this.itemList[i]);
        }
        for (i = lastHeadPtr - 1; i >= headPtr; i--) {
          this.renderItem(this.itemList[i], i);
        }
        break;
      default:
        break;
    }

    if (this.getStickySectionHeaders()) {
      var topSectionIdx = 0;

      if (this.topSectionIdx > -1) {
        var sectionHeader = this.itemList[this.sectionIndices[this.topSectionIdx]];
        var start;

        // Either search up or down for the header that should be shown at the top
        if (sectionHeader.start < this.y) {
          for (i = topSectionIdx; i < this.sectionIndices.length; i++) {
            start = this.itemList[this.sectionIndices[i]].start;
            if (start < this.y) {
              topSectionIdx = i;
            } else {
              break;
            }
          }
        } else {
          for (i = this.topSectionIdx; i > -1; i--) {
            start = this.itemList[this.sectionIndices[i]].start;
            if (start < this.y) {
              topSectionIdx = i;
              break;
            }
          }
        }
      }

      // If the top section has changed, update the contents of the floating section header
      if (topSectionIdx != this.topSectionIdx && this.sectionHeaderContents.length) {
        var floatingSection = this.findRef('floatingSection');
        var content = this.sectionHeaderContents[topSectionIdx];

        if (!content) {
          // If this section header has never been loaded, ask the owner to generate it
          var viewIdx = this.sectionIndices[topSectionIdx];
          var view = this.renderItem(this.itemList[viewIdx], viewIdx);//this.owner.viewForHeaderInSection(this, topSectionIdx);
          this.sectionHeaderContents[topSectionIdx] = content = view.getNode().outerHTML;
          this.reapItem(view);
        }
        this.topSectionIdx = topSectionIdx;
        floatingSection.setInnerHTML(content);
        floatingSection.getNode().firstChild.style.webkitTransform = '';
      }
    }

    this.lastHeadPtr = this.headPtr;
    this.lastTailPtr = this.tailPtr;
  },

  // To render an item we ask our owner to provide the cell or section header.
  // We then apply the appropriate transform so the item appears at the
  // appropriate index.
  renderItem: function(item, index) {
    if (item.view) return null;
    if (item.hasOwnProperty('row')) {
      view = this.owner.cellForRowInSection(this, item.row, item.section);
      view.setMetadata({'item-index': index});
    } else {
      view = this.owner.viewForHeaderInSection(this, item.section);
      view.setMetadata({'item-index': index});

      // If using sticky headers, store the HTML for each header
      // so it will be available
      if (this.getStickySectionHeaders() && !this.sectionHeaderContents[item.section]) {
        this.sectionHeaderContents[item.section] = view.getNode().outerHTML;
      }
    }
    view.setStyle({webkitTransform: 'translate3d(0,' + item.start + 'px,0)'});
    item.view = view;
    if (!view.getNode().parentNode) {
      this.scrollView.appendChild(view);
    }
    return view;
  },

  // Items that are no longer within the buffer range can be reaped and queued
  // for reuse. When an item is reaped we delete it from the item in the item
  // cache to signal that it can no longer be rendered without refetching from
  // the data source. We then push the item onto the appropriate section or
  // cell queue and hide the dom representation offscreen.
  reapItem: function(item) {
    var view = item.view;
    if (!view) return;
    delete item.view;
    if (item.hasOwnProperty('row')) {
      this.enqueueReusableCellWithIdentifier(
        view,
        view.getReuseIdentifier());
    } else {
      this.enqueueReusableSectionHeaderWithIdentifier(
        view,
        view.getReuseIdentifier());
    }
    view.setStyle({webkitTransform: 'translate3d(-5000px,0,0)'});
    view.setMetadata({'item-index': 'queued'});
  },

  // Use binary search to find the item in the itemList that wraps the
  // requested coordinate.
  findItemIndex: function(y) {
    var high = this.itemList.length; low = 0;
    var item;
    while(low < high) {
      mid = (low + high) >> 1;
      item = this.itemList[mid];
      if (item.start <= y && item.end >= y) {
        return mid;
      } else if (y < item.end) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }
    return null;
  },

  // Calculate the total scroll height of the view by iterating the data
  // source and marking where each view begins and ends. This is cached until
  // the invalidate method is called on the view.
  calculateScrollHeight: function() {
    this.itemList = [];
    this.sectionIndices = [];
    this.scrollHeight = 0;
    if (this.getSectioned()) {
      this.sectionCount = this.hasOwnProperty('sectionCount') ? this.sectionCount : this.owner.numberOfSections(this);
    } else {
      this.sectionCount = 1;
    }
    this.rowCounts = this.rowCounts || {};
    var absoluteIndex = 0;
    var item;
    var sectionHeight;
    for (var i = 0; i < this.sectionCount; i++) {
      item = {section: i, row: j, start: this.scrollHeight};
      sectionHeight =
          this.getFixedSectionHeaderHeight() ||
          (this.owner.heightForSectionHeader ? this.owner.heightForSectionHeader(this, i) : 0);


      if (sectionHeight > 0) {
        item = {section: i, start: this.scrollHeight};
        this.scrollHeight += sectionHeight;
        item.end = this.scrollHeight;
        this.sectionIndices[i] = this.itemList.length;
        this.itemList.push(item);
      }

      if (this.rowCounts[i] === undefined) {
        this.rowCounts[i] = this.owner.numberOfRowsInSection(this, i);
      }
      for (var j = 0; j < this.rowCounts[i]; j++) {
        item = {section: i, row: j, start: this.scrollHeight};
        if (this.hasOwnProperty('fixedRowHeight')) {
          this.scrollHeight += this.fixedRowHeight;
        } else {
          this.scrollHeight += this.owner.heightForRowInSection(this, j, i);
        }
        item.end = this.scrollHeight;
        this.itemList.push(item);
      }
      this.absoluteIndex++;
    }
    this.scrollView.setContentHeight(this.scrollHeight);
    this.scrollView.refresh();
  },

  setScrollbar: function(value) {
    this[!value ? 'addClass' : 'removeClass']('bolt-table-no-scrollbar');
  },

  // calculate the view port by grabbing the rectangle from the scroll view.
  calculateViewPort: function() {
    if (!this.scrollView) {
      return {height: 0, width: 0};
    }
    this.viewPort = this.scrollView.getRect();
    return this.viewPort;
  },

  // pull a cell from the queue and return it. The cell's contents can
  // then be modified for reuse.
  dequeueReusableCellWithIdentifier: function(identifier) {
    this.cells = this.cells || {};
    this.cells[identifier] = this.cells[identifier] || [];
    return this.cells[identifier].shift();
  },

  // pull a section header from the queue and return it. The section header's
  // contents can then be modified for reuse.
  dequeueReusableSectionHeaderWithIdentifier: function(identifier) {
    this.sectionHeaders = this.sectionHeaders || {};
    this.sectionHeaders[identifier] = this.sectionHeaders[identifier] || [];
    return this.sectionHeaders[identifier].shift();
  },

  // enqueue a cell for reuse
  enqueueReusableCellWithIdentifier: function(cell, identifier) {
    this.cells = this.cells || {};
    this.cells[identifier] = this.cells[identifier] || [];
    return this.cells[identifier].push(cell);
  },

  // enqueue a section header for reuse
  enqueueReusableSectionHeaderWithIdentifier: function(header, identifier) {
    this.sectionHeaders = this.sectionHeaders || {};
    this.sectionHeaders[identifier] = this.sectionHeaders[identifier] || [];
    return this.sectionHeaders[identifier].push(header);
  },

  // configurable log for debugging.
  log: function(message) {
    if (this.getDebug()) console.log.apply(console, arguments);
  }

});

// ### TableViewCell
// TableViews are populated with TableViewCell instances.
// Cells should generally not be subclassed, you should instead provide the
// cell with its content by specifying childViews in the builder.
var TableViewCell = exports.TableViewCell = core.createClass({
  name: 'TableViewCell',
  extend: View,
  declare: function(options) {
    return {
      selected: false,
      reuseIdentifier: 'cell'
    };
  },

  getSelected: function() {
    return this.getProperty('selected');
  },

  setSelected: function(state) {
    this.setProperty('selected', state);
    if (state) {
      this.addClass('bt-active');
    } else {
      this.removeClass('bt-active');
    }
  }

});

// ### TableViewSectionHeader
// Tables may optionally include section headers
var TableViewSectionHeader = exports.TableViewSectionHeader = core.createClass({
  name: 'TableViewSectionHeader',
  extend: View,
  declare: function(options) {
    return {
      reuseIdentifier: 'section'
    };
  }
});

}});
require.define({'views/textinput': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/textinput.js */
var core = require('javelin/core');
var view = require('view');
var dom  = require('javelin/dom');


var TextInput = core.createClass({
  name: 'TextInput',

  extend: view.View,

  properties: {
    tagName: 'input'
  },

  delegateProperties: {
    node: ['size', 'value', 'select', 'placeholder', 'maxlen', 'disabled']
  },

  members: {
    createDom: function(options) {
      view.View.prototype.createDom.call(this, options);
      this.getNode().setAttribute('type', 'text');
    },

    focus: function() {
      this.getNode().focus();
    },

    setReadonly: function(isReadonly) {
      var node = this.getNode();
      if (isReadonly) {
        node.setAttribute('readonly', 'readonly');
      } else {
        node.removeAttribute('readonly');
      }
    },

    getReadonly: function() {
      return this.getNode().getAttribute('readonly') == 'readonly';
    }
  }
});


exports.TextInput = TextInput;

}});
require.define({'views/toggle': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/toggle.js */
var core = require('javelin/core');
var view = require('view');
var util = require('util');

var Button = require('views/button').Button;
var View = view.View;

var ToggleOwner = {
  toggleChoiceSelectedAtIndex: function(toggle, idx){
  }
};

var Toggle = core.createClass({

  name: 'Toggle',

  extend: View,

  properties: {
    'choices': null,
    'activeChoice': null
  },

  members: {
    setChoices: function(choices) {
      this.setProperty('choices', choices);
      this._layout = {view: 'HBox', childViews: []};
      var idx = 0;
      util.forEach(this.getChoices(), function(choice) {
        this._layout.childViews.push({
          view: 'Button',
          ref: 'choice' + idx,
          value: choice,
          flex: 1,
          style: {display: 'block'}
        });
        idx++;
      }, this);
      this.setLayout(this._layout);
      this.listen(view.touchEvents.TOUCHSTART,
        util.bind(this.onTouchStart, this));
      var activeChoice = this.getActiveChoice();
      if (activeChoice !== null) {
        this.setActiveChoice(activeChoice);
      }
      return this;
    },

    setActiveChoice: function(idx) {
      if (util.isEmpty(this.refs)) return;
      this.setProperty('activeChoice', idx);
      this.refs['choice' + idx];
      for (var i = 0; i < this.getChoices().length; i++) {
        var ref = this.findRef('choice'+ i);
        if (i !== idx) {
          ref.setDown(false);
        } else {
          ref.setDown(true);
        }
      }
      if (this.getOwner() && this.getOwner().toggleChoiceSelectedAtIndex) {
        this.getOwner().toggleChoiceSelectedAtIndex(this, idx);
      }
    },

    /* event handlers */
    onTouchStart: function(evt) {
      button = this.refForEvent(evt);

      if (button) {
        this.setActiveChoice(parseInt(button.getRef().replace(/choice/,''),10));
      }
    },

    _findTouchTarget: function(node) {
      var touchedButton = null;
      while (node.parentNode && node.parentNode != this.getNode()) {
        if (node.className.match('bt-button')) {
          return this.findRef(node.getAttribute('data-ref'));
        }
        node = node.parentNode;
      }
      return false;
    }

  }
});


exports.Toggle = Toggle;

}});
require.define({'views/tokenizer': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/tokenizer.js */
require('tokenizer');

var core = require('javelin/core');
var JX   = require('JX');
var util = require('util');
var view = require('view');
var dom  = require('javelin/dom');

var Typeahead = require('views/typeahead').Typeahead;

var Tokenizer = core.createClass({
  name: 'Tokenizer',

  extend: view.View,

  properties: {
    tagName: 'div',
    _tokenizerControl: null
  },

  members: {
    render: function() {
      var node = this.getNode();
      this._input = dom.$N('input', { type: 'text', sigil: 'tokenizer' });
      node.appendChild(this._input);

      this.setSigil('touchable');
      this._tokenizerControl = new JX.Tokenizer(node);

      node.onclick = util.bind(this._handleTouch, this);
    },

    focus: function() {
      this._tokenizerControl._focus.focus();
    },

    getTokens: function() {
      return this._tokenizerControl.getTokens();
    },

    _handleTouch: function() {
      this.focus();
    },

    setTypeahead: function(value) {
      this.typeahead = value;

      // We're using the typeahead view as a service, instead of a view. This
      // is ugly. The Typeahead view needs to be refactored such that the
      // service can be used by both the tokenizer and the generic typeahead
      // view.
      this._tokenizerControl.setTypeahead(this.typeahead);
      this._tokenizerControl.start();

      // Patch up
      this.typeahead.listen('select', JX.bind(this, function(e) {
        // TODO: clean this up
        // Ugh - looks like an impedence mismatch between JX & Bolt
        if (e && e.__auto__data && e.__auto__data.args) {
          var data = e.__auto__data.args[0];
          this._tokenizerControl.addToken(data.id, data.name);
          this._tokenizerControl.refresh();
          e.prevent();
        }
      }));
    }
  }
});


exports.Tokenizer = Tokenizer;


}});
require.define({'views/typeahead': function(require, exports, module) {
__DEV__ = 0;
/* From: lib/views/typeahead.js */
require('typeahead_source');

var core     = require('javelin/core');
var util     = require('util');
var view     = require('view');
var JX       = require('JX');
var dom      = require('javelin/dom');
var stratcom = require('javelin/stratcom');
var builder  = require('builder');

var Table = require('views/table').Table;


var Typeahead = core.createClass({
  name: 'Typeahead',

  extend: view.View,

  construct: function(options) {
    view.View.call(this, options);
  },

  events : ['select', 'start'],

  properties: {
    tagName: 'div',
    _table: null,
    _rootNode: null,
    label: null
  },

  /**
   * set a text label on the typeahead
   */
  setLabel: function(label) {
    this.setProperty('label', label);
    this._label.innerHTML = label;
  },

  members: {
    handleEvent : function(e) {
      if (this._stop || e.getPrevented()) {
        return;
      }
      var type = e.getType();
      if (type === 'blur') {
        this.hideDropdown();
      }
      else if (type === 'keydown') {
        if (e.getSpecialKey() === 'esc') {
          this.hideDropdown();
        }

        JX.defer(JX.bind(this, function() {
          if (this._value !== this._input.value) {
            this.refresh();
          }
        }));
      }
    },

    focus: function() {
      this._input.focus();
    },

    hideDropdown: function() {
      this._table && this._table.destroy();
      delete this._table;
    },

    refresh: function() {
      this._value = this._input.value;
      if (this._dataSource) {
        this._dataSource.didChange(this._value);
      }
    },

    render: function() {
      this._rootNode = this.getNode();
      this._label = dom.$N('span');
      this._input = dom.$N('input', { type: 'text' });
      this._rootNode.appendChild(this._label);
      this._rootNode.appendChild(this._input);

      this.setSigil('touchable');
      this._tableSource.onRowTap = JX.bind(this, this.select);

      JX.DOM.listen(this._input,
        [ 'focus', 'blur', 'keypress', 'keydown'],
        null,
        JX.bind(this, this.handleEvent));
    },

    select: function(value) {
      if (value && value._dataItem) {
        var newValue = value._dataItem.display;
        if (this.invoke('select', value._dataItem).getPrevented()) {
          newValue = '';
        }
        this._value = this._input.value = newValue;
        this.hideDropdown();
      }
    },

    setDataSource: function(value) {
      // Patch datasource for table
      value.createNode = function(value) {
        return value;
      };
      value.setMaximumResultCount(2000); // Better value here?
      value.bindToTypeahead(this);

      this._dataSource = value;
      this.start();
    },

    setDefaultRowHeight: function(value) {
      this._tableSource._defaultRowHeight = value;
    },

    setDropdownHeight: function(value) {
      this._table.setHeight(value + 'px');
    },

    setDropdownWidth: function(value) {
      this._table.setWidth(value + 'px');
    },

    setRenderer: function(value) {
      this._tableSource._renderer = value;
    },

    showResults : function(results) {
      if (!results.length) {
        this.hideDropdown();
      } else {
        if (!this._table) {
          this._table = builder.build({
            view: Table,
            style: {display: '-webkit-box'},
            owner: this._tableSource
          }, this._tableSource);
          var tableNode = this._table.getNode();
          this._rootNode.appendChild(tableNode);
        }
        this._tableSource._dataItems = results;
        this._table.refresh();
      }
    },

    _tableSource: {
      _dataItems: [],
      _renderer: null,
      _defaultRowHeight: 50,
      _defaultMatchDelegate: function(data) { return true; },
      _defaultRenderer: function(data) {
        return builder.build({
          content: data.display,
          className: 'jx-result',
          style: {
            height: '50px'
          }
        });
      },

      numberOfSections: function() {
        return 1;
      },

      numberOfRowsInSection: function(section) {
        return this._dataItems.length;
      },

      cellForRowInSection: function(row, section) {
        var renderer = this._renderer || this._defaultRenderer;
        var dataItem = this._dataItems[row];
        var element = renderer(dataItem);
        var node = element.getNode();
        if (node) {
          node._dataItem = dataItem; // Is there a better way to send this data?
        }
        return element;
      },

      sectionHeaderAtIndex: function() {
        return null;
      },

      heightForSectionHeader: function(section) {
        return 0;
      },

      heightForRowInSection: function(row, section) {
        return this._defaultRowHeight;
      }
    },

    // The following functions are present only to serve as a hook for the
    // tokenizer.  If we decide to make a copy of the Javelin tokenizer, we
    // can clean these up
    setAllowNullSelection: function() {},
    setInputNode: function(inputNode) {
      this._input = inputNode;
      this._rootNode = inputNode.parentElement;
    },
    start: function() {
      this.invoke('start');
    },
    submit: function() { return true; }
  }
});

// We use TypeaheadSource and repurpose it for our table based
// typeahead view
var TypeaheadStaticSource = core.createClass({
  extend: JX.TypeaheadSource,

  construct: function(data) {
    JX.TypeaheadSource.call(this);
    if (data ) {
      util.forEach(data, function(item) {
        this.addResult(item);
      }, this);
    }
  },

  members: {
    didChange : function(value) {
      this.matchResults(value);
    }
  }
});

exports.Typeahead = Typeahead;
exports.TypeaheadStaticSource = TypeaheadStaticSource;

}});
