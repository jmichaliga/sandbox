/**
 * @class medialets.core
 * The core Medialets JavaScript library contains methods that help solve common JavaScript problems.  
 * A "medialets" namespace is created in which all methods and plugins will be sandboxed.  A "$m" namespace is also created as a shortcut for "medialets."  "$m" and "medialets" can be used interchangeably.  
 * All Medialets plugins make use of methods in this file.   
 * @namespace medialets
 * @singleton
 * @author ali.hasan@medialets.com
 * @source http://creative.medialytics.com/javascript/medialets.core.js
 * @compressed http://creative.medialytics.com/javascript/medialets.core.min.js
 * @version 1.2.1
 */

(function(window, document, medialets) { /* scoping fix */
  if (typeof Function.delegate === 'undefined') {
    Function.prototype.delegate = function(scope) {
      var fn = this;

      return function() {
        // Forward to the original function using 'scope' as 'this'.
        return fn.apply(scope, arguments);
      };
    };
  }

  /* nodeList fix*/
  NodeList.prototype.toArray = function() {
    var array = [],
        i = 0,
        l = this.length;
    for (; i < l; i++) {
      array.push(this[i]);
    }
    return array;
  };

  /* create namespace and shortcuts */
  if (!medialets) {
    window.medialets = window.$m = medialets = function() {
      return medialets._constructor.apply(null, arguments);
    };
  }

  /* private callback functions */
  var _scrollStopSDK = function() {
    medialets.scroll.update({
      contentOffset: {
        x: 0,
        y: 0
      }
    });
  },
      
      
      _touchmoveStop = function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }
      return false;
      };

  /**
   * Wrapper for for getElementById
   * @method medialets
   * @param {String} selector A DOM Element ID to select.
   */
  medialets._constructor = function(selector) {
    // Handle $m(""), $m(null), or $m(undefined)
    if (!selector) {
      return null;
    }

    // Handle $m(DOMElement)
    if (selector.nodeType) {
      return selector;
    }

    // Handle $m('DomElement Name')
    if (typeof selector === "string") {
      return document.getElementById(selector);
    }
  };

  /**
   * Wrapper function for querySelectorAll.
   * @method medialets.find
   * @param {String} query A selector expression to match elements against.
   * @param {DOMElement} context (optional) A DOM Element within which a matching element may be found. If no context is passed in then 'document' be used instead.
   * @return {NodeList} A collection of DOM Elements that match the specified query selector.
   */
  medialets.find = function(query, context) {
    context = (context) ? medialets(context) : document;

    return context.querySelectorAll(query);
  };

  /**
   * Assign the specified class(es) to a DOM Element.
   * @method medialets.addClass
   * @param {DOMElement|Array|NodeList} domElement A DOMElement or an array/nodelist of DOMElements to which the class(es) will be assigned.
   * @param {String} className A class name or a space separated list class names to assign to the DOM Element.
   * @return {DOMElement} The DOM Element to which the class(es) were assigned.
   */
  medialets.addClass = function(domElement, className) {
    var type = window.toString.call(domElement);

    if (type === '[object Array]' || type === '[object NodeList]') {
      var i;
      for (i in domElement) {
        if (domElement.hasOwnProperty(i)) {
          medialets.addClass(domElement[i], className);
        }
      }
    } else {
      domElement = medialets(domElement);
      if (domElement) {
        var classes = domElement.className,
            classesArray;

        if (classes !== '') {
          classesArray = classes.split(' ');
          if (medialets.arraySearch(classesArray, className) === false) {
            classesArray.push(className);
            domElement.className = classesArray.join(' ');
          }
        } else {
          domElement.className = className;
        }
      }
    }

    return domElement;
  };

  /**
   * Remove the specified class(es) from a DOM Element.
   * @method medialets.removeClass
   * @param {DOMElement|Array|NodeList} domElement A DOMElement or an array/nodelist of DOMElements from which the class(es) will be removed.
   * @param {String} className A class name or a space separated list class names to remove from the DOM Element.
   * @return {DOMElement} The DOM Element from which the class(es) were removed.
   */
  medialets.removeClass = function(domElement, className) {
    var type = window.toString.call(domElement);

    if (type === '[object Array]' || type === '[object NodeList]') {
      var i;
      for (i in domElement) {
        if (domElement.hasOwnProperty(i)) {
          medialets.removeClass(domElement[i], className);
        }
      }
    } else {
      domElement = medialets(domElement);
      if (domElement) {
        var classes = domElement.className,
            classesArray, matched;

        if (classes !== '') {
          classesArray = classes.split(' ');

          matched = medialets.arraySearch(classesArray, className);
          if (matched !== false) {
            classesArray.splice(matched, 1);
            domElement.className = classesArray.join(' ');
          }
        }
      }
    }

    return domElement;
  };

  /**
   * Determine whether a DOM Element has the given class.
   * @method medialets.hasClass
   * @param {DOMElement} domElement A DOM Element that will be checked for the given class.
   * @param {String} className A class name to check for.
   * @return {Boolean} true if domElement has the given class.  false if domElement does not have the given class.
   */

  /**
   * Determine whether a collection of DOM Element have the given class.
   * @method medialets.hasClass
   * @param {Array|NodeList} domElement A DOM Element from which the class(es) will be removed.
   * @param {String} className A class name or a space separated list class names to remove from the DOM Element.
   * @return {Array[domElement]}
   */
  medialets.hasClass = function(domElement, className) {
    var type = window.toString.call(domElement);

    if (type === '[object Array]' || type === '[object NodeList]') {
      if (type === '[object NodeList]') {
        domElement = domElement.toArray();
      }

      var i, domElementArray = [];
      for (i in domElement) {
        if (medialets.hasClass(domElement[i], className)) {
          domElementArray.push(domElement[i]);
        }
      }

      return domElementArray;
    } else {
      domElement = medialets(domElement);

      if (domElement) {
        var classes = domElement.className,
            classesArray;

        if (classes !== '') {
          classesArray = classes.split(' ');

          if (medialets.arraySearch(classesArray, className) !== false) {
            return true;
          }
        }
      }

      return false;
    }
  };

  /**
   * Create a new DOMElement.  
   * @method medialets.createEl
   * @param {String|DOMElement} $el The DOMElement that will be created.
   * @param {Object} _attributes (optional) An object containing attributes that will be applied to $el.
   * @return {DOMElement} The DOMElement that was created.
   */
  medialets.createEl = function($el, _attributes) {
    var i;

    if ($el) {
      if (!$el.nodeType) {
        $el = document.createElement($el);
      }

      if (_attributes) {
        for (i in _attributes) {
          if (_attributes.hasOwnProperty(i)) {
            if (i === 'className' || i === 'innerHTML') {
              $el[i] = _attributes[i];
            } else {
              $el.setAttribute(i, _attributes[i]);
            }
          }
        }
      }

      return $el;
    }

    return null;
  };

  /**
   * Append an existing DOMElement to another DOMElement, or create a new DOMElement and append it to another DOMELEMENT.  
   * @method medialets.appendEl
   * @param {DOMElement} parentEl The DOMElement to which childEl will be attached.
   * @param {String|DOMElement} childEl The DOMElement that will be attached to parentEl.
   * @param {Object} _attributes (optional) An object containing attributes that will be applied to childEl.
   * @return {DOMElement} The DOMElement that was appended.
   */
  medialets.appendEl = function(parentEl, childEl, _attributes) {
    parentEl = medialets(parentEl);
    var $el;

    if (parentEl) {
      $el = medialets.createEl(childEl, _attributes);
      parentEl.appendChild($el);
      return $el;
    }

    return null;
  };

  /**
   * Remove a DOMElement from the DOM.  
   * @method medialets.removeEl
   * @param {DOMElement} domElement The DOMElement to remove.
   */
  medialets.removeEl = function(domElement) {
    domElement = medialets(domElement);

    if (domElement) {
      domElement.parentNode.removeChild(domElement);
    }
  };

  /**
   * Copy the contents of one object into another object.  This does a recursive "deep" copy.  
   * The source object will not be effected by changes in the target object.   
   * @method medialets.deepCopy
   * @param {Object} source The object containing properties to copy over.
   * @param {Object} target The object that receives the new properties..
   * @return {Object}
   */
  medialets.deepCopy = function(source, target) {
    var i, src;

    for (i in source) {
      if (source.hasOwnProperty(i)) {
        src = source[i];

        if (src && typeof src === 'object' && !src.node) {
          switch (window.toString.call(src)) {
          case '[object Object]':
            target[i] = medialets.deepCopy(src, (typeof target[i] !== 'undefined' && window.toString.call(target[i]) === '[object Object]') ? target[i] : {});
            break;
          case '[object Array]':
            target[i] = medialets.deepCopy(src, (typeof target[i] !== 'undefined' && window.toString.call(target[i]) === '[object Array]') ? target[i] : []);
            break;
          default:
            target[i] = src;
            break;
          }
        } else {
          target[i] = src;
        }
      }
    }

    return target;
  };

  /**
   * Return the index of a value in an array.    
   * @method medialets.arraySearch
   * @param {Array} _array The array in which to search for the specified value.
   * @param {Value} _value The value to search for.
   * @return {Int|Boolean} false if specified value cannot be found in the array. 
   */
  medialets.arraySearch = function(_array, _value) {
    var i, output = false;

    for (i in _array) {
      if (_array[i] === _value) {
        output = i;
        break;
      }
    }

    return output;
  };

  /**
   * Attach a handler for an event to a DOM Element.    
   * @method medialets.bind
   * @param {DOMElement|Array|NodeList} domElement A DOMElement or an array/nodelist of DOMElements to which to attach the event handler.
   * @param {String} evtName
   * @param {Function} fn 
   */
  medialets.bind = function(domElement, evtName, fn) {
    var type = window.toString.call(domElement);

    if (type === '[object Array]' || type === '[object NodeList]') {
      var i;
      for (i in domElement) {
        if (domElement.hasOwnProperty(i)) {
          medialets.bind(domElement[i], evtName, fn);
        }
      }
    } else {
      domElement = medialets(domElement);

      if (domElement) {
        if (!domElement.events) {
          domElement.events = {};
        }
        if (!domElement.events[evtName]) {
          domElement.events[evtName] = [];
        }
        domElement.events[evtName].push(fn);

        domElement.addEventListener(evtName, fn, false);
      }
    }
  };

  /**
   * Attach a handler for an event to a DOM Element then once it fires removes the handler.    
   * @method medialets.bindOnce
   * @param {DOMElement|Array|NodeList} domElement A DOMElement or an array/nodelist of DOMElements to which to attach the event handler.
   * @param {String} evtName
   * @param {Function} fn 
   */
  medialets.bindOnce = function(domElement, evtName, fn) {
    var type = window.toString.call(domElement);

    if (type === '[object Array]' || type === '[object NodeList]') {
      var i;
      for (i in domElement) {
        if (domElement.hasOwnProperty(i)) {
          medialets.bindOnce(domElement[i], evtName, fn);
        }
      }
    } else {
      domElement = medialets(domElement);

      if (domElement) {
        if (!domElement.events) {
          domElement.events = {};
        }
        if (!domElement.events[evtName]) {
          domElement.events[evtName] = [];
        }
        domElement.events[evtName].push(fn);

        domElement.addEventListener(evtName, function() {
          medialets.unbind(domElement, evtName, arguments.callee);
          fn();
        }, false);
      }
    }
  };

  /**
   * Execute all handlers for an event attached to a DOM Element.    
   * @method medialets.trigger
   * @param {DOMElement} domElement
   * @param {String} evtName
   * @param {Object} (optional) data 
   */
  medialets.trigger = function(domElement, evtName, data) {
    domElement = medialets(domElement);

    if (domElement) {
      var evt = document.createEvent("Events");
      evt.initEvent(evtName, true, true);
      evt.data = (data) ? data : {};
      domElement.dispatchEvent(evt);
    }
  };

  /**
   * Remove one or all handler(s) for an event from a DOM Element.    
   * @method medialets.unbind
   * @param {DOMElement|Array|NodeList} domElement A DOMElement or an array/nodelist of DOMElements from which to remove the event handler.
   * @param {String} evtName
   * @param {Function} (optional) fn 
   */
  medialets.unbind = function(domElement, evtName, fn) {
    var type = window.toString.call(domElement);

    if (type === '[object Array]' || type === '[object NodeList]') {
      var i;
      for (i in domElement) {
        if (domElement.hasOwnProperty(i)) {
          medialets.unbind(domElement[i], evtName, fn);
        }
      }
    } else {
      domElement = medialets(domElement);

      if (domElement && domElement.hasOwnProperty('events') && domElement.events.hasOwnProperty(evtName)) {
        var events = domElement.events[evtName],
            match;

        if (fn) {
          domElement.removeEventListener(evtName, fn, false);

          if (events) {
            match = medialets.arraySearch(events, fn);
            if (match !== false) {
              events.splice(match, 1);
            }
          }
        } else if (events) {
          while (events.length > 0) {
            domElement.removeEventListener(evtName, events.shift(), false);
          }
        }
      }
    }
  };

  /**
   * @property ui.touchstart
   * @type String
   * If browser supports touch, the value will be 'touchstart,' otherwise it will be 'mousedown.' 
   */

  /**	 
   * @property ui.touchmove
   * @type String
   * If browser supports touch, the value will be 'touchmove,' otherwise it will be 'mousemove.'
   */

  /**	 
   * @property ui.touchend
   * @type String
   * If browser supports touch, the value will be 'touchend,' otherwise it will be 'mouseup.' 
   */

  /**	 
   * @property ui.tap
   * @type String
   * If browser supports touch, the value will be 'touchstart,' otherwise it will be 'click.'
   */
  medialets.ui = {
    touchstart: ('ontouchstart' in document) ? 'touchstart' : 'mousedown',
    touchmove: ('ontouchmove' in document) ? 'touchmove' : 'mousemove',
    touchend: ('ontouchend' in document) ? 'touchend' : 'mouseup',
    tap: ('ontouchstart' in document) ? 'touchstart' : 'click',
    click: 'click'
  };
  // all the bridge to override ui object
  if (medialets.hasOwnProperty('ua')) {
    medialets.deepCopy(medialets.ua, medialets.ui);
  }

  /**
   * Enable view scrolling.
   * @method medialets.enableViewScrolling
   */
  medialets.enableViewScrolling = function() {
    if (medialets.hasOwnProperty('scroll')) {
      medialets.scroll.update({
        enabled: true
      });
      medialets.unbind(document, 'scroll', _scrollStopSDK);
    } else {
      medialets.unbind(document, 'touchmove', _touchmoveStop);
    }
  };

  /**
   * Disable view scrolling.    
   * @method medialets.disableViewScrolling
   */
  medialets.disableViewScrolling = function() {
    if (medialets.hasOwnProperty('scroll')) {
      medialets.scroll.update({
        enabled: false
      });
      medialets.bind(document, 'scroll', _scrollStopSDK);
    } else {
      medialets.bind(document, 'touchmove', _touchmoveStop);
    }
  };

  if (typeof window.medialetsViewCanScroll !== 'undefined' && window.medialetsViewCanScroll) {
    medialets.enableViewScrolling();
  } else {
    medialets.disableViewScrolling();
  }
}(window, document, (typeof medialets !== 'undefined') ? medialets : false));

/**
 * @class medialets.trackAdExpandDuration
 * Tracks the expand duration.
 * @namespace medialets
 * @author ali.hasan@medialets.com
 * @source http://creative.medialytics.com/javascript/medialets.trackAdExpandDuration.js
 * @compressed http://creative.medialytics.com/javascript/medialets.trackAdExpandDuration.min.js
 * @version 1.1
 */

(function() {
  var expandCount = 0,
      startTime, totalTime = 0,
      
      
      track = function() {
      try {
        MMBridge.trackingEvent.setDurationForKey('MMExpandDuration', totalTime);
      } catch (e) {}
      },
      
      
      expandStart = function() {
      startTime = new Date();
      },
      
      
      collapseStart = function() {
      var currentTime = Math.round((new Date() - startTime) / 1000);

      if (currentTime >= 1 && currentTime <= 900) {
        totalTime = totalTime + currentTime;

        if (expandCount === 0) {
          track();
        } else {
          setTimeout(track, 250);
        }++expandCount;
      }
      };

  if (typeof MMBridge !== 'undefined') {
    try {
      MMBridge.AdData.onExpandStart.init(expandStart);
      MMBridge.AdData.onCollapseStart.init(collapseStart);
    } catch (e) {}
  }
}());

/**
 * @class medialets.storage
 * Method to create local key:value pairs in either local storage or cookies
 * @namespace medialets
 * @requires medialets.core.js
 * @author ray.matos@medialets.com
 * @source http://creative.medialytics.com/javascript/medialets.storage.js
 * @compressed http://creative.medialytics.com/javascript/medialets.storage.min.js
 * @version 1.2
 */

(function(window, document, medialets) {
  if (!medialets) {
    window.medialets = window.$m = medialets = {};
  }
  var isAndroid = navigator.userAgent.match(/Android/i) != null;
  medialets.storage = {
    nameFixed: function(name) {
      if ((typeof medialets.app !== 'undefined') && (typeof medialets.app.id !== 'undefined')) {
        return medialets.app.id + "_" + name;
      } else {
        return name;
      }
    },
    cookie: {
      create: function(name, value, mins) {
        var date, expires;
        if (mins) {
          date = new Date();
          date.setTime(date.getTime() + (mins * 60 * 1000));
          expires = "; expires=" + date.toGMTString();
        } else {
          expires = "";
        }
        document.cookie = name + "=" + value + expires + "; path=/";
      },

      read: function(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';'),
            i;
        for (; i < ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
          }
          if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
          }
        }
        return null;
      },

      erase: function(name) {
        this.create(name, "", -1);
      }
    },

    lStorage: {
      create: function(name, value) {
        localStorage.setItem(name, value);
      },

      read: function(name) {
      	if(typeof JSON.parse(localStorage.getItem(name)) === "object"){
      		return JSON.parse(localStorage.getItem(name));
      	}else{
 			return localStorage.getItem(name);
        }
      },

      erase: function(name) {
        localStorage.removeItem(name);
      }
    },
    /**
     * Set the name/value pair and set an expire timeframe
     * @method set
     * @param {String} name
     * The name of the storoge block
     * @param {String} value
     * The Value to set the name to.
     * @param {Int} hours
     * How many mins should it expire in
     */
    set: function(name, value, mins) {
      name = medialets.storage.nameFixed(name);
      medialets.storage.cookie.create(name, value, mins);
      if (window.localStorage && !isAndroid) {
      	if(typeof mins !== 'undefined' && typeof mins === 'number'){
			var expMins = mins * 60 * 1000,
			record = {value: value, timestamp: new Date().getTime() + expMins};
	        medialets.storage.lStorage.create(name, JSON.stringify(record));
        }else{
        	medialets.storage.lStorage.create(name, value);
        }
      }
    },
    /**
     * Get the value of the name passed in
     * @method get
     * @param {String} name
     * The name of the storage block
     * @param {String} value
     */
    get: function(name) {
      name = medialets.storage.nameFixed(name);
      var v = null;
      if (window.localStorage && !isAndroid) {
   		v = medialets.storage.lStorage.read(name);
        if (typeof v.timestamp === 'number' && v.timestamp < +new Date() && v.timestamp){
        	medialets.storage.lStorage.erase(name);
        	v = null;
        }
      } else {
        v = medialets.storage.cookie.read(name);
      }
      return v;
    },
    /**
     * Delete the name from storage
     * @method del
     * @param {String} name
     * The name of the storage block
     */
    del: function(name) {
      name = medialets.storage.nameFixed(name);
      medialets.storage.cookie.erase(name);
      if (window.localStorage && !isAndroid) {
        medialets.storage.lStorage.erase(name);
      }
    }
  };
}(window, document, (typeof medialets !== 'undefined') ? medialets : false));