/**
 * @fileoverview This example shows an app like page with multiple surfaces.  There are two
 * screen classes that demonstrate some of the different features.  Read the code and comments
 * to get a better idea of what's going on.
 */


goog.require('surf.App');
goog.require('surf.NullScreen');
goog.require('surf.RegExpScreenFactory');
goog.require('goog.async.Deferred');


// Scroll down to the end of the file to see the initialization code for the sample app.  The first
// two classes in this file and implementations for the screens in the sample app.


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
  // This screen will be constructed when it is first navigated to, but then its DOM will just
  // be hidden, rather than being removed.
  return true;
};


/** @inheritDoc */
TestScreen.prototype.getSurfaceContent = function(surface) {
  switch (surface) {
    // Set the text for the main area.
    case 'main': return 'This is a test screen that simply returns some plain text as the main ' +
        'surface\'s content.  Pretty simple; pretty boring.';
    
    // Update the sidebar's content with some text.
    case 'sidebar': return 'TestScreen';
    
    // Replace the header link with a 'back' link that uses JS history.  This won't work from the
    // local file system, so make sure to run the example from a server.
    case 'header': return surf.dom('a', {'href': 'javascript:history.back();'}, '<< Back');
   
     // Note, no content is returned for 'footer', the app will show the 'default content' instead.
   
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
  // After navigating away from this view, remove its element from the DOM and dispose its
  // screen object.
  return false;
};


/** @inheritDoc */
DelayedScreen.prototype.getTitle = function() {
  // The title will show in the title bar and in the browser's history drop down.
  return 'I was ' + this.num + ' seconds delayed.';
};


/** @inheritDoc */
DelayedScreen.prototype.getSurfaceContent = function(surface) {
  if (surface == 'main') {
    // Show a number in the main area.  This returns an element, as opposed to TestScreen above.
    return surf.dom('h1', null, this.num);
  } else if (surface == 'sidebar') {
    // Show the screen's name in the side bar.
    return 'DelayedScreen';
  } else {
    return null;
  }
};


/** @inheritDoc */
DelayedScreen.prototype.beforeFlip = function() {
  // beforeFlip can return a deferred.  The navigation won't be completed until the deferred
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




// NOTE: History integration doesn't work on the local file system.

// Work out the basepath where example.html lives, in a real app try to come up with a more
// robust solution, such as having it written by a template param.
//
// The sample uses the query-string to differentiate screens.  In practice you'd probably use
// paths and have the server be able to render on any supported path.
//

var fullPath = window.location.pathname + window.location.search;
var lastSlash = fullPath.lastIndexOf('/');
var basePath = fullPath.substr(0, lastSlash + 1);
var currentPath = fullPath.substr(lastSlash + 1);

var app = new surf.App(basePath);
app.defineSurface('main');
app.defineSurface('sidebar');
app.defineSurface('header');
app.defineSurface('footer', 'This is the default footer, set from code.');

// Register a null screen on example.html so that clicking the link reverts the app to default.
app.registerScreenFactory(new surf.RegExpScreenFactory(/^sample-app\.html$/, surf.NullScreen));

// Test screen is static and cacheable.
app.registerScreenFactory(new surf.RegExpScreenFactory(/^sample-app\.html\?screen=test$/, TestScreen));

// Delayed screen accepts wildcards via the regexp.
app.registerScreenFactory(new surf.RegExpScreenFactory(/^sample-app\.html\?screen=delay&n=([0-9])$/, DelayedScreen));

// Initialize the app with the defaults.
app.init(currentPath);
