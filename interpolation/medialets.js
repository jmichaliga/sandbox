/**
 * @class medialets
 * The core Medialets JavaScript library contains methods that help solve common JavaScript problems.  
 * A "medialets" namespace is created in which all methods and plugins will be sandboxed.  A "$m" namespace is also created as a shortcut for "medialets."  "$m" and "medialets" can be used interchangeably.  
 * All Medialets plugins make use of methods in this file.   
 * @namespace medialets
 * @singleton
 * @author ali.hasan@medialets.com
 * @source http://creative.medialytics.com/javascript/medialets.js
 * @compressed http://creative.medialytics.com/javascript/medialets.min.js
 * @version 4.1
 */

/* scoping fix */
Function.prototype.delegate = function( scope ) {
    var fn = this;

	return function() {
        // Forward to the original function using 'scope' as 'this'.
        return fn.apply(scope, arguments);
    };
};

/* nodeList fix*/
NodeList.prototype.toArray = function() {
	var array = [], i = 0, l = this.length;
	for(; i < l; i++) {
		array.push(this[i]);
	}
	return array;
};

/**
 * Wrapper for for getElementById
 * @method medialets
 * @param {String} selector A DOM Element ID to select.
 */
var medialets = function(selector) {
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
	touchstart : ('ontouchstart' in document) ? 'touchstart' : 'mousedown',
	touchmove : ('ontouchmove' in document) ? 'touchmove' : 'mousemove',
	touchend : ('ontouchend' in document) ? 'touchend' : 'mouseup',
	tap : ('ontouchstart' in document) ? 'touchstart' : 'click'
};

/**
 * Wrapper function for querySelectorAll.
 * @method medialets.find
 * @param {String} query A selector expression to match elements against.
 * @param {DOMElement} context (optional) A DOM Element within which a matching element may be found. If no context is passed in then 'document' be used instead.
 * @return {NodeList} A collection of DOM Elements that match the specified query selector.
 */
medialets.find = function(query, context){
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
	var type = toString.call(domElement);

	if (type === '[object Array]' || type === '[object NodeList]') {
		var i;
		for (i in domElement) {
			if (domElement.hasOwnProperty(i)) {
				medialets.addClass(domElement[i], className);
			}
		}
	}
	else {
		domElement = medialets(domElement);
		if (domElement) {
			var classes = domElement.className, classesArray;
			
			if(classes !== '') {
				classesArray = classes.split(' ');
				if (medialets.arraySearch(classesArray,className) === false) {
					classesArray.push(className);
					domElement.className = classesArray.join(' ');
				}
			}
			else {
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
	var type = toString.call(domElement);

	if (type === '[object Array]' || type === '[object NodeList]') {
		var i;
		for (i in domElement) {
			if (domElement.hasOwnProperty(i)) {		
				medialets.removeClass(domElement[i], className);
			}
		}
	}
	else {
		domElement = medialets(domElement);
		if (domElement) {
			var classes = domElement.className, classesArray, matched;
			
			if(classes !== '') {
				classesArray = classes.split(' ');
				
				matched = medialets.arraySearch(classesArray,className);
				if (matched !== false) {
					classesArray.splice(matched,1);
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
	var type = toString.call(domElement);

	if (type === '[object Array]' || type === '[object NodeList]') {
		if (type === '[object NodeList]') {
			domElement = domElement.toArray();
		}
		
		var i, domElementArray = [];
		for (i in domElement) {
			if (medialets.hasClass(domElement[i], className)){
				domElementArray.push(domElement[i]);	
			}
		}
		
		return domElementArray;
	}
	else {
		domElement = medialets(domElement);
		
		if (domElement) {
			var classes = domElement.className, classesArray;
			
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
					}
					else {
						$el.setAttribute(i,_attributes[i]);
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
				switch (toString.call(src)) {
					case '[object Object]':
						target[i] = medialets.deepCopy(src, {});
					break;
					case '[object Array]':
						target[i] = medialets.deepCopy(src, []);
					break;
					default :
						target[i] = src;
					break;
				}
			}
			else {
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
medialets.arraySearch = function(_array,_value) {
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
	var type = toString.call(domElement);

	if (type === '[object Array]' || type === '[object NodeList]') {
		var i;
		for (i in domElement) {
			if (domElement.hasOwnProperty(i)) {
				medialets.bind(domElement[i], evtName, fn);
			}
		}
	}
	else {
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
	var type = toString.call(domElement);

	if (type === '[object Array]' || type === '[object NodeList]') {
		var i;
		for (i in domElement) {
			if (domElement.hasOwnProperty(i)) {
				medialets.unbind(domElement[i], evtName, fn);
			}
		}
	}
	else {
		domElement = medialets(domElement);
		
		if (domElement) {
			var events = domElement.events[evtName], match;
			
			if (fn) {
				domElement.removeEventListener(evtName, fn);
				
				if (events) {
					match = medialets.arraySearch(events, fn);
					if (match !== false) {
						events.splice(match, 1);
					}
				}
			}
			else if (events) {
				while (events.length > 0) {
					domElement.removeEventListener(evtName, events.shift());
				}
			}
		}
	}	
};

/* friendly name */
if (typeof window.medialets === "undefined") {
	window.medialets = medialets;
}	
if(typeof window.$m === "undefined") { 
	window.$m = medialets; 
}