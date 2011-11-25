/**
 * @fileoverview Interfaces for implementing individual screens.  A screen factory is used by the
 * app to construct Screen instances for a given navigation.  The screen is then responsible for
 * managing the lifecycle of its associated surfaces.
 */

goog.provide('surf.Content');
goog.provide('surf.ScreenFactory');
goog.provide('surf.Screen');

goog.require('surf');



/**
 * Type-def for things that can be used as surface content.
 *
 * @typedef {string|Element}
 */
surf.Content;



/**
 * Interface defining the ScreenFactory.  Instances will be used to dynamically construct screens
 * based on the navigation params.
 *
 * For example, a screen factory may match paths /albums/([a-z0-9]+)/ and create a different screen
 * for multiple albums.
 *
 * @interface
 */
surf.ScreenFactory = function() {};


/**
 * Returns true if the screen factory handles navigations for the given path.
 * @param {string} path
 * @return {boolean}
 */
surf.ScreenFactory.prototype.matchesPath = function(path) {};


/**
 * Creates a new screen for the given path.
 * @param {string} path
 * @return {!surf.Screen}
 */
surf.ScreenFactory.prototype.create = function(path) {};



/**
 * Interface defining an individual screen.
 * 
 * A screen is responsible for managing multiple surfaces on the application.  The lifecycle of a
 * screen is as follows:
 *
 * - New screen constructed.
 * - Screen asked to render content for each surface.
 * - beforeFlip called, screen can pause navigation using a deferred, e.g. for loading data.
 * - Screen's surfaces are made visible.
 * - afterFlip is called.
 *
 * When a screen is navigated away from, it is given a chance to cancel the navigation in
 * beforeNavigate().  Other factors may also halt the navigation, so deactivate() is called when
 * the screen is actually deactivated.  If the view is not cacehable then it will also be disposed
 * at this stage.
 *
 * @interface
 */
surf.Screen = function() {};


/**
 * @return {boolean} If false, the screen will be disposed after being deactivated.  If true, the
 *     surface content will be left in the DOM with display:none.
 */
surf.Screen.prototype.isCacheable = function() {};


/**
 * @return {?string} The document.title to set when the screen is active.  Null, if the title should
 *     be set to the default.
 */
surf.Screen.prototype.getTitle = function() {};


/**
 * Returns the content for the given surface, or null if the surface isn't used by this screen.
 *
 * This will only be called when a screen is initially constructed.  If a screen is cacheable and
 * navigated to sometime later, then 
 * 
 * @param {string} surface
 * @return {surf.Content}
 */
surf.Screen.prototype.getSurfaceContent = function(surface) {};


/**
 * Allows a screen to perform any setup immediately before the DOM is made visible.
 * @return {goog.async.Deferred}
 */
surf.Screen.prototype.beforeFlip = function() {};


/**
 * Allows a screen to perform any setup that requires its DOM to be visible.
 */
surf.Screen.prototype.afterFlip = function() {};


/**
 * Gives the Screen a chance to cancel the navigation and stop itself from being deactivated.
 * Can be used, for example, if the screen has unsaved state.
 *
 * Clean-up should not be preformed here, since the navigation may still be cancelled.  Do clean-up
 * in #deactivate.
 *
 * @return {boolean}
 */
surf.Screen.prototype.beforeDeactivate = function() {};


/**
 * Allows a screen to do any cleanup necessary after it has been deactivated, for example
 * cancelling outstanding XHRs or stopping timers. 
 */
surf.Screen.prototype.deactivate = function() {};


/**
 * Disposes a screen, either after it is deactivated (in the case of a non-cacheable view) or when
 * the App is itself disposed for whatever reason.
 */
surf.Screen.prototype.dispose = function() {};
