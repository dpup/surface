
goog.require('surf.App');
goog.require('surf.NullScreen');
goog.require('surf.RegExpScreenFactory');
goog.require('goog.async.Deferred');

// NOTE: History integration doesn't work on the local file system, so the example.html file
// has fake links that we match to the screens.  We use 'file.html' instead of paths so that
// the example is more likely to run when hosted on any server.  In practice you need more
// knowledge about what the base URL is.

// Work out the basepath where example.html lives, in a real app try to come up with a more
// robust solution, such as having it written by a template param.
var fullPath = window.location.pathname;
var basePath = fullPath.substr(0, fullPath.lastIndexOf('/') + 1);

var app = new surf.App(basePath);
app.defineSurface('main');
app.defineSurface('sidebar');
app.defineSurface('header');
app.defineSurface('footer', 'This is the default footer, set from code.');

// Register a null screen on example.html so that clicking the link reverts the app to default.
app.registerScreenFactory(new surf.RegExpScreenFactory(/^example\.html$/, surf.NullScreen));

// Test screen is static and cacheable.
app.registerScreenFactory(new surf.RegExpScreenFactory(/^test\.html$/, TestScreen));

// Delayed screen accepts wildcards via the regexp.
app.registerScreenFactory(new surf.RegExpScreenFactory(/^delay\-([0-9])\.html$/, DelayedScreen));

// Initialize the app with the defaults.
app.init('example.html');



/**
 * Sample screen that shows text content in the 'main' and 'sidebar' surfaces and changes
 * the header.
 * @extends {surf.NullScreen}
 * @constructor
 */
function TestScreen(path) {};
goog.inherits(TestScreen, surf.NullScreen);


/** @inheritDoc */
TestScreen.prototype.isCacheable = function() {
  return true;
};


/** @inheritDoc */
TestScreen.prototype.getSurfaceContent = function(surface) {
  switch (surface) {
    case 'main': return 'This is a test screen that simply returns some plain text as the main ' +
        'surface\'s content.  Pretty simple; pretty boring.';
        
    case 'sidebar': return 'TestScreen';
    
    case 'header': return surf.dom('a', {'href': 'javascript:history.back();'}, '<< Back');
   
    default: return null;
  }
};



/**
 * Sample screen that shows a number from the path in the main area.  It takes the given number of
 * seconds to flip to the screen.
 * 
 * @extends {surf.NullScreen}
 * @constructor
 */
function DelayedScreen(matches) {
  this.num = matches[1]; 
};
goog.inherits(DelayedScreen, surf.NullScreen);


/** @inheritDoc */
DelayedScreen.prototype.isCacheable = function() {
  return false;
};


/** @inheritDoc */
DelayedScreen.prototype.getTitle = function() {
  return 'I was ' + this.num + ' seconds delayed.';
};


/** @inheritDoc */
DelayedScreen.prototype.getSurfaceContent = function(surface) {
  if (surface == 'main') {
    return surf.dom('h1', null, this.num);
  } else if (surface == 'sidebar') {
    return 'DelayedScreen';
  } else {
    return null;
  }
};


/** @inheritDoc */
DelayedScreen.prototype.beforeFlip = function() {
  // Before flip can return a deferred.  The navigation won't be completed until the deferred
  // returns.  But be careful to handle goog.async.Deferred.CancelledError errors which may
  // occur if the navigation is interrupted.
  var d = new goog.async.Deferred();
  var t = setTimeout(function() {
    d.callback();
  }, this.num * 1000);
  d.addErrback(function(err) {
    surf.log('Cancelling timeout', err);
    clearTimeout(t);
  });
  return d;
};
