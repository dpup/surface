/**
 * @fileoverview The main application class for managing multiple surfaces and navigating between
 * screens.
 */

goog.provide('surf.App');

goog.require('surf');
goog.require('surf.Surface');
goog.require('goog.pubsub.PubSub');
goog.require('goog.string');



/**
 * Application class that manages navigations between screens.  The app is a pubsub channel and
 * offers several topics that can be subscribed to.
 *
 * For subscriptions {@see goog.pubsub.PubSub} and {@see surf.App.Topics}.
 *
 * The app will try to handle clicks on anchor tags.  It'll resolve navigation path by splitting
 * the href on the configured base path.  If no matching screen is found the browser is allowed to
 * handle the click.
 *
 * @param {string} basePath The base path used to prefix history tokens.  Relative to host.
 * @param {string=} opt_defaultTitle Optional title to use if a screen doesn't have one of its own.
 * @extends {goog.pubsub.PubSub}
 * @constructor
 */
surf.App = function(basePath, opt_defaultTitle) {
  goog.base(this);
  
  /** @type {string} */
  this.basePath_ = basePath;
  
  /** @type {string} */
  this.defaultTitle_ = opt_defaultTitle || document.title;
  
  /** @type {?surf.Screen} */
  this.activeScreen_ = null;
  
  /** @type {?string} */
  this.activePath_ = null;
  
  /** @type {goog.async.Deferred} */
  this.pendingNavigate_ = null;
  
  /** @type {!Array.<surf.ScreenFactory>} */
  this.factories_ = [];
  
  /** @type {!Object.<string, surf.Screen>} */
  this.screens_ = {};
  
  /** @type {!Object.<string, surf.Surface>} */
  this.surfaces_ = {};
};
goog.inherits(surf.App, goog.pubsub.PubSub);


/**
 * Topics that the App publishes.  They can be subscribed to via App#subscribe().
 *
 * {@see goog.pubsub.PubSub} for PubSub interface.
 *
 * @enum {string}
 */
surf.App.Topics = {
  /** Published when a navigation starts.  Args: path */
  START: 'start-navigate',
  
  /** Published when a navigation ends.  Args: path, isSuccess, opt_err */
  END: 'end-navigate'
};


/**
 * @type {number}
 * @private
 */
surf.App.uniqueIdCounter_ = Date.now();


/**
 * Defines a surface that screens can render to.  The default content will be used when the
 * active screen doesn't provide any of its own content.  The transition function is used to
 * move between elements, at present it must execute synchronously, but CSS3 transitions can
 * still allow for fancy effects.
 * @param {string} id
 * @param {surf.Content=} opt_defaultContent
 * @param {function(Element, Element)=} opt_transitionFn
 */
surf.App.prototype.defineSurface = function(id, opt_defaultContent, opt_transitionFn) {
  this.surfaces_[id] = new surf.Surface(id, opt_defaultContent, opt_transitionFn);
};


/**
 * @param {!surf.ScreenFactory} factory
 */
surf.App.prototype.registerScreenFactory = function(factory) {
  this.factories_.push(factory);
};


/**
 * @param {string=} opt_path Optional path to navigate to first.
 * @return {!goog.async.Deferred} A deferred corresponding to the initial navigation.
 */
surf.App.prototype.init = function(opt_path) {
  document.body.addEventListener('click', goog.bind(this.handleDocClick_, this), false);
  window.addEventListener('popstate', goog.bind(this.handlePopState_, this), false);
    
  if (opt_path) {
    var d = this.navigate(opt_path, true);
    // If we can't navigate to the initial view, redirect to the base path.
    // TODO : Raise a warning event or some such.
    //d.addErrback(goog.bind(this.navigate, this, ''));
    return d;
  } else {
    
    // Replace the history state so we can always navigate back to the start screen.
    try {
      window.history.replaceState({'path': this.basePath_, 'isNavigate': true},
          this.defaultTitle_, this.basePath_);
    } catch (e) {
      surf.log('Unable to set initial history token.', this.basePath_, e);
    }

    // Set title after updating history.
    document.title = this.defaultTitle_;

    for (var surface in this.surfaces_) {
      this.surfaces_[surface].show(surf.Surface.DEFAULT);
    }
    
    return goog.async.Deferred.succeed(null);
  }
};


/**
 * @param {string} path The path to navigate to.
 * @param {boolean=} opt_replaceHistory Whether to replace the history entry, instead of adding
 *     to the stack.  (Internal, used for history triggered navigations and initial screen.)
 * @return {!goog.async.Deferred} Deferred that returns when the navigation is finished.  The
 *     errback will be called if an error occurred or the navigation was cancelled.
 */
surf.App.prototype.navigate = function(path, opt_replaceHistory) {  
  // TODO : Consider implementing refresh or not performing navigation if the screen is already
  // active, for now we just deactivate and reactivate the screen.
  if (path == this.activePath_) {
    surf.log('Not navigating, already at destination.');
    return goog.async.Deferred.succeed(this.activeScreen_);
  }
    
  this.publish(surf.App.Topics.START, path);
  
  // Offer the active screen the chance to cancel the navigation.
  if (this.activeScreen_ && this.activeScreen_.beforeDeactivate()) {
    // TODO : Sync up history if this was a navigation caused by the browser.
    // TODO : Allow async beforeDeactivate for dialogs and what-not.
    surf.log('Navigation cancelled by active screen');

    // Return a cancelled deferred.
    var d = new goog.async.Deferred();
    d.addErrback(goog.bind(this.publishForDeferred_, this, surf.App.Topics.END, path, false));
    d.cancel();
    return d;
  }
  
  surf.log('Navigating to', path);
  
  // See if there is a cached screen that matches the path.
  var nextScreen = null;
  if (this.screens_[path]) {
    surf.log('Cached screen found');
    nextScreen = this.screens_[path];

  // Otherwise, see if there is a valid factory.
  } else {
    for (var i = 0; i < this.factories_.length; i++) {
      if (this.factories_[i].matchesPath(path)) {
        surf.log('Factory found');
        // Create the screen and set up its surfaces.
        // TODO : If factories are ever intended to load the code async, then this seem needs to
        // use a deferred.
        nextScreen = this.factories_[i].create(path);
        var uid = nextScreen.uid = '_surf._screen_' + surf.App.uniqueIdCounter_++;
        for (var surface in this.surfaces_) {
          this.surfaces_[surface].addContent(uid, nextScreen.getSurfaceContent(surface));
        }
        break;
      }
    }
  }
  
  // If no screen has been found, exit.
  if (!nextScreen) {
    surf.log('No screen or factory found for', path, '. Cancelling navigation');
    var err = Error('No screen or factory for ' + path);
    this.publish(surf.App.Topics.END, path, false, err);
    return goog.async.Deferred.fail(err);  
  }
  
  // If there is a pending navigation, cancel it.
  if (this.pendingNavigate_) {
    this.pendingNavigate_.cancel();
    this.pendingNavigate_ = null;
  }
  
  // Tell the new screen to get ready.  If a deferred is returned, we wait until its done.
  var d = nextScreen.beforeFlip();
  if (d) {
    d.addCallback(goog.bind(this.updateSurfaces_, this, path, nextScreen, !!opt_replaceHistory));
    d.addErrback(goog.bind(this.handleNavError_, this, path, nextScreen));

  } else {
    d = this.updateSurfaces_(path, nextScreen, !!opt_replaceHistory);
  }
  this.pendingNavigate_ = d;
  
  // Publish the END topic once the navigation finally completes.
  d.addCallback(goog.bind(this.publishForDeferred_, this, surf.App.Topics.END, path, true));
  d.addErrback(goog.bind(this.publishForDeferred_, this, surf.App.Topics.END, path, false));
  
  return d;
};


/**
 * @return {surf.Screen} Returns the active screen. If a navigation is in progress this will be
 *     the screen that is being navigated FROM.
 */
surf.App.prototype.getActiveScreen = function() {
  return this.activeScreen_;
};


/**
 * @param {string} path
 * @param {surf.Screen} nextScreen
 * @param {boolean} replaceHistory
 * @return {goog.async.Deferred}
 * @private
 */
surf.App.prototype.updateSurfaces_ = function(path, nextScreen, replaceHistory) {
  surf.log('Updating surfaces for navigation');
  
  // Deactivate the active screen.
  if (this.activeScreen_) {
    this.activeScreen_.deactivate();
  }
  
  // Flip each surface to show the new screen's content.
  var d = new goog.async.Deferred();
  d.callback(nextScreen);
  
  for (var surface in this.surfaces_) {
    var sd = this.surfaces_[surface].show(nextScreen.uid);
    if (sd) {
      d.awaitDeferred(sd);
    }
  }
  
  d.addCallback(goog.bind(this.finalizeNavigate_, this, path, nextScreen, replaceHistory));
  
  return d;
};


/**
 * @param {string} path
 * @param {surf.Screen} nextScreen
 * @param {boolean} replaceHistory
 * @return {surf.Screen} The screen, for when the method is used as a deffered callback, so the
 *    screen gets passed on to the chain.
 * @private
 */
surf.App.prototype.finalizeNavigate_ = function(path, nextScreen, replaceHistory) {
  surf.log('Finalizing navigation');
  
  // Update the history token.
  var title = nextScreen.getTitle() || this.defaultTitle_;
  var historyParams = {'path': path, 'isNavigate': true};
  var historyPath = (this.basePath_ + path).replace('//', '/');
  try {
    if (replaceHistory) {
      window.history.replaceState(historyParams, title, historyPath);      
    } else {
      window.history.pushState(historyParams, title, historyPath);
    }
  } catch (e) {
    // Don't fail out entirely if history.pushState fails.
    surf.log('Unable to update history token.', historyPath, e);
  }

  // Update the title after the history so that it is associated with the right entry.
  document.title = title;

  // Allow the screen to do any post-flip processing.
  nextScreen.afterFlip();

  // Delete the old screen if it wasn't cacheable.
  if (this.activePath_ && !this.activeScreen_.isCacheable()) {
    this.removeScreen_(this.activePath_, this.activeScreen_);
  }
    
  // Flip the active screen variables.
  this.screens_[path] = nextScreen;
  this.activeScreen_ = nextScreen;
  this.activePath_ = path;
  
  return nextScreen;
};


/**
 * @param {string} path
 * @param {surf.Screen} nextScreen
 * @param {Error} err
 * @return {Error}
 * @private
 */
surf.App.prototype.handleNavError_ = function(path, nextScreen, err) {
  surf.log('Navigation error for', path, err);
  // TODO : Sync up history in the case of an error.
  this.removeScreen_(path, nextScreen);
  return err;
};


/**
 * @param {string} path
 * @param {surf.Screen} screen
 * @private
 */
surf.App.prototype.removeScreen_ = function(path, screen) {
  screen.dispose();
  delete this.screens_[path];
  for (var surface in this.surfaces_) {
    this.surfaces_[surface].remove(screen.uid);
  }
};


/**
 * Handles the browser navigation changing.
 * @param {Event} e
 * @private
 */
surf.App.prototype.handlePopState_ = function(e) {
  // Only do a navigation if the history change looks like it came from us.
  if (e.state && e.state['isNavigate']) {
    var path = e.state['path'];
    surf.log('History navigation to', path);
    this.navigate(path, true);
  }
};


/**
 * Handles clicks on the document, specifically anchor tags.
 * @param {Event} e
 * @private
 */
surf.App.prototype.handleDocClick_ = function(e) {
  var el = e.target;
  while (el && el.tagName != 'A') {
    el = el.parentNode;
  }
  
  if (el) {
    var path = el.pathname + el.search;
    if (goog.string.startsWith(path, this.basePath_)) {
      path = path.substr(this.basePath_.length);
      var navigateFailed = false;
      this.navigate(path).addErrback(function(err) { navigateFailed = true; });
      // If the navigation failed synchronously then we don't prevent default and let the browser
      // handle the click.  This would happen for URLs that aren't meant to be managed by the App.
      if (!navigateFailed) {
        e.preventDefault();
      }
    }
  }
};


/**
 * Publishes to the pubsub channel without a return type that might confuse a deferred chain.
 * @param {surf.App.Topics} topic
 * @param {*} var_args
 * @private
 */
surf.App.prototype.publishForDeferred_ = function(topic, var_args) {
  this.publish.apply(this, arguments);
};
