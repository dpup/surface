// Copyright (c)2011 Daniel Pupius <pupius.co.uk>

goog.provide('surf');

goog.require('goog.async.Deferred');

var surf = {

  /**
   * @param {string} id
   * @return {Element}
   */
  byId: function(id) {
    return document.getElementById(id);
  },
  
  /**
   * @param {*} el
   * @return {boolean}
   */
  isElement: function(el) {
    return typeof el == 'object' && el.nodeType == 1;
  },
  
  /**
   * @param {*} text
   * @return {Node}
   */
  text: function(text) {
    return document.createTextNode(String(text));
  },
  
  /**
   * @param {Element} el
   */
  remove: function(el) {
    el.parentNode.removeChild(el);
  },
  
  /**
   * @param {Element} parent
   * @param {*} child
   * @return {*}
   */
  append: function(parent, child) {
    if (surf.isElement(child)) {
      parent.appendChild(/** @type {Element} */ (child));
    } else if (goog.isArray(child)) {
      child.forEach(function(a) {
        surf.append(parent, a);          
      });
    } else {
      parent.appendChild(surf.text(child));
    } 
    return child;
  },
  
  /**
   * @param {...*} var_args
   * @return {!Element}
   */
  dom: function(var_args) {
    var args = Array.prototype.splice.call(arguments, 0);
    
    if (typeof args[0] == 'string') {
      var el = document.createElement(args[0]);
      args.shift();
    } else {
      var el = document.createElement('div');
    }
    
    if (args[0] == null) {
      args.shift();
    } else if (typeof args[0] == 'string') {
      el.className = args[0];
      args.shift();
    } else if (!surf.isElement(args[0])) {
      for (var key in args[0]) {
        el.setAttribute(key, args[0][key]);
      }
      args.shift();
    }
    
    for (var i = 0; i < args.length; i++) {
      surf.append(el, args[i]);
    }
    return el;
  },
  
  /**
   * @param {...*} var_args
   */
  log: function(var_args) {
    var c = window['console'];
    if (c) {
      c.log.apply(c, arguments);
    }
  },
  
  
  // NOTE: Methods below here aren't actually used by the library, but were left over from when
  // this was a file of helpers for the apps that use the library.  They'll be removed once I
  // figure out somewhere to put them.
  
  
  /**
   * @param {Node} parent
   * @param {Node} child
   * @return {boolean}
   */
  contains: function(parent, child) {
    while (child) {
      if (child == parent) return true;
      child = child.parentNode;
    }
    return false;
  },
  
  /**
   * @param {Element} parent
   * @param {*} child
   * @return {*}
   */
  prepend: function(parent, child) {
    if (surf.isElement(child)) {
      parent.insertBefore(/** @type {Element} */ (child), parent.firstChild);
    } else if (goog.isArray(child)) {
      child.forEach(function(a) {
        parent.insertBefore(a, parent.firstChild);
      });
    } else {
      parent.insertBefore(surf.text(child), parent.firstChild);
    } 
    return child;
  },
  
  /**
   * @param {string} url
   * @param {*} data
   * @return {goog.async.Deferred}
   */
  postJson: function(url, data) {
    var deferred = new goog.async.Deferred();
    deferred.addCallback(surf.parseXhrAsJson);
    var xhr = surf.newXhr(deferred);
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(window.JSON.stringify(data));
    return deferred;
  },
  
  /**
   * @param {string} url
   * @return {goog.async.Deferred}
   */
  getJson: function(url) {
    var deferred = new goog.async.Deferred();
    deferred.addCallback(surf.parseXhrAsJson);
    var xhr = surf.newXhr(deferred);
    xhr.open('GET', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(null);
    return deferred;
  },

  /**
   * @param {string} url
   * @return {goog.async.Deferred}
   */
  getRaw: function(url) {
    var deferred = new goog.async.Deferred();
    var xhr = surf.newXhr(deferred);
    xhr.open('GET', url);
    xhr.send(null);
    return deferred;
  },

  /**
   * @param {goog.async.Deferred} deferred
   * @return {XMLHttpRequest}
   */
  newXhr: function(deferred) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status == 200) {
        deferred.callback(xhr);
      } else {
        // Create error objects for known error types.
        var error = Error('Request error, status: ' + xhr.status);
        error.status = xhr.status;
        error.xhr = xhr;
        deferred.errback(error);
      }
    };
    xhr.onerror = function() {
      var error = Error('Request error, status: ' + xhr.status);
      error.status = 0;
      error.xhr = xhr;
      deferred.errback(error);
    };
    // Add a timeout
    return xhr;
  },
  
  /**
   * @param {XMLHttpRequest} xhr
   * @return {*}
   */
  parseXhrAsJson: function(xhr) {
    try {
      return window.JSON.parse(xhr.responseText);
    } catch (e) {
      surf.log('Bad response', xhr.responseText);
      e.status = 200;
      e.xhr = xhr;
      throw e;
    }
  }

};
