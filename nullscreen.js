/**
 * @fileoverview Implementation of the screen interface that retruns null content for all surfaces.
 * Can be used as an base class or for reverting to defaults.
 */
 
goog.provide('surf.NullScreen');

goog.require('surf');
goog.require('surf.Screen'); // Interface
goog.require('goog.Disposable');


/**
 * An implementation of Screen that returns null content.
 * @param {*} unused
 * @constructor
 * @implements {surf.Screen}
 * @extends {goog.Disposable}
 */
surf.NullScreen = function(unused) {
  goog.Disposable.call(this);
};
goog.inherits(surf.NullScreen, goog.Disposable);


/** @inheritDoc */
surf.NullScreen.prototype.isCacheable = function() {
  return false;
};


/** @inheritDoc */
surf.NullScreen.prototype.getTitle = function() {
  return null;  
};


/** @inheritDoc */
surf.NullScreen.prototype.getSurfaceContent = function(surface) {
  return null;
};


/** @inheritDoc */
surf.NullScreen.prototype.beforeDeactivate = function() {};


/** @inheritDoc */
surf.NullScreen.prototype.deactivate = function() {};


/** @inheritDoc */
surf.NullScreen.prototype.beforeFlip = function() {
  return null;
};


/** @inheritDoc */
surf.NullScreen.prototype.afterFlip = function() {};
