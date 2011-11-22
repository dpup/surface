/**
 * @fileoverview Class that manages a single "surface", which corresponds to an element in the DOM.
 * Screens provide content that should be displayed when they are active.
 */
 
goog.provide('surf.Surface');

goog.require('surf');



/**
 * @param {string} id
 * @param {surf.Content=} opt_defaultContent
 * @param {(function(Element, Element) : goog.async.Deferred)=} opt_transitionFn
 * @constructor
 */
surf.Surface = function(id, opt_defaultContent, opt_transitionFn) {
  this.id = id;
  this.el = surf.byId(id);
  this.transitionFn = opt_transitionFn || surf.Surface.defaultTransition;
  this.activeChild = this.addContent(surf.Surface.DEFAULT, opt_defaultContent);
};


surf.Surface.DEFAULT = 'default';


/**
 * @param {Element} from
 * @param {Element} to
 * @return {goog.async.Deferred}
 */
surf.Surface.defaultTransition = function(from, to) {
  if (from) from.style.display = 'none';
  if (to) to.style.display = 'block';
  return null;
};


/**
 * Adds content to a surface.
 * @param {string} id The screen id the content belongs too.
 * @param {surf.Content=} opt_content The content to add.
 * @return {Element} The div that wraps the content.
 */
surf.Surface.prototype.addContent = function(id, opt_content) {
  // If content hasn't been passed, see if an element exists in the DOM that matches the id.
  // By convention, the element should already be nested in the right element and should have an
  // id that is a concatentation of the surface id + '-' + the screen id.
  if (!opt_content) {
    return surf.byId(this.makeId_(id)) || null;

  } else {
    var div = surf.dom('div', {id: this.makeId_(id)});
    this.transitionFn(div, null);
    surf.append(this.el, div);
    surf.append(div, opt_content);
    return div;  
  }
};


/**
 * @param {string} id The screen id to show.
 * @return {goog.async.Deferred}
 */
surf.Surface.prototype.show = function(id) {
  var child = surf.byId(this.makeId_(id));
  if (!child) {
    child = surf.byId(this.makeId_(surf.Surface.DEFAULT));
  }
  var d = this.transitionFn(this.activeChild, child);
  this.activeChild = child;
  return d;
};


/**
 * @param {string} id The scren id to remove.
 */
surf.Surface.prototype.remove = function(id) {
  var child = surf.byId(this.makeId_(id));
  if (child) {
    surf.remove(child);
  }  
};


/**
 * @param {string} id
 * @return {string}
 */
surf.Surface.prototype.makeId_ = function(id) {
  return this.id + '-' + id;
};
