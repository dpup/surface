/**
 * Externs files for when surface is used as a bundle.  This defines the interface for things the
 * app will need to call on externally provided objects.  surface.App is exported via goog.exportSymbol
 *
 * TODO: This isn't done right but seems to work.  This would imply surf.App expects surface.* as
 * its arguments.
 */


/** @type {!Object} */
var surface = {};


/**
 * @interface
 */
surface.ScreenFactory = function() {};

/**
 * @param {string} path
 * @return {boolean}
 */
surface.ScreenFactory.prototype.matchesPath = function(path) {};

/**
 * @param {string} path
 * @return {!surface.Screen}
 */
surface.ScreenFactory.prototype.create = function(path) {};


/**
 * @interface
 */
surface.Screen = function() {};

/**
 * @return {boolean} If false, the screen will be disposed after being deactivated.  If true, the
 *     surface content will be left in the DOM with display:none.
 */
surface.Screen.prototype.isCacheable = function() {};

/**
 * @return {?string} The document.title to set when the screen is active.  Null, if the title should
 *     be set to the default.
 */
surface.Screen.prototype.getTitle = function() {};

/**
 * @param {string} surface
 * @return {!Element|string}
 */
surface.Screen.prototype.getSurfaceContent = function(surface) {};

/** @return {goog.async.Deferred} */
surface.Screen.prototype.beforeFlip = function() {};

surface.Screen.prototype.afterFlip = function() {};

/** @return {boolean} */
surface.Screen.prototype.beforeDeactivate = function() {};

surface.Screen.prototype.deactivate = function() {};

surface.Screen.prototype.dispose = function() {};
