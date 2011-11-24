/**
 * @fileoverview Sample that uses 'Surface' to manage a slideshow of images.  Each slide is
 * directly linkable.  
 */

goog.require('surf.App');
goog.require('surf.NullScreen');
goog.require('surf.RegExpScreenFactory');
goog.require('goog.async.Deferred');


/**
 * Screen that renders an individual slide.
 * @extends {surf.NullScreen}
 * @constructor
 */
function SlideScreen(matches) {
  this.photoId_ = Number(matches[2]) || 0;
  this.el_ = surf.dom('div');
  
  
  if (this.photoId_ >= 0 && this.photoId_ < SlideScreen.photos.length) {
    // Trigger load of the image immediately after the screen is constructed.  But save a
    // deferred for tracking the load.  In #beforeFlip() the deferred is returned to the app,
    // which won't flip the screen until the image is loaded. 
    var d = this.imageDeferred_ = new goog.async.Deferred();
    var img = new Image();
    img.onload = function() { d.callback(null); };
    img.onerror = function() { d.errback(Error('Image failed to load.')); };
    img.src = SlideScreen.photos[this.photoId_];
    this.el_.appendChild(img);
  } else {
    surf.append(this.el_, 'Not found');
  }
};
goog.inherits(SlideScreen, surf.NullScreen);


/**
 * @type {!Array.<string>}
 */
SlideScreen.photos = [
  'http://farm4.static.flickr.com/3650/3537301643_6fd42cf399.jpg',
  'http://farm4.static.flickr.com/3268/4565116438_6e18c7a256.jpg',
  'http://farm4.static.flickr.com/3606/3583678354_0d4cf6b226.jpg',
  'http://farm6.static.flickr.com/5045/5378914915_ef352298aa.jpg',
  'http://farm5.static.flickr.com/4040/4279355789_8e68ce2708.jpg',
  'http://farm4.static.flickr.com/3443/3733789774_b4e7bd61c7.jpg',
  'http://farm2.static.flickr.com/1246/4610285126_0f7032ec5a.jpg',
  'http://farm5.static.flickr.com/4068/4586047858_0c03635e55.jpg',
  'http://farm3.static.flickr.com/2589/3760452404_5e9fa3cd9b.jpg'
];


/**
 * @type {number}
 * @private
 */
SlideScreen.prototype.photoId_;


/**
 * @type {!Element}
 * @private
 */
SlideScreen.prototype.el_;


/**
 * @type {goog.async.Deferred}
 * @private
 */
SlideScreen.prototype.imageDeferred_ = null;


/** @return {number} Returns this screen's photo. */
SlideScreen.prototype.getPhotoId = function() {
  return this.photoId_;
}


/** @inheritDoc */
SlideScreen.prototype.isCacheable = function() {
  // Cache the slides so moving back and forth is fast.
  return true;
};


/** @inheritDoc */
SlideScreen.prototype.getSurfaceContent = function(surface) {
  // Take a shortcut and ignore the surface id, since we know there's only one surface in
  // this app.  This could come back to bite you in a larger app though...
  return this.el_;
};


/** @inheritDoc */
SlideScreen.prototype.beforeFlip = function() {
  // Always return the image deferred, if it's already complete the app will flip the screen
  // immediately.
  return this.imageDeferred_;
};



// Create links for the slides.
var linkEl = surf.byId('links');
for (var i = 0; i < SlideScreen.photos.length; i++) {
  linkEl.appendChild(surf.dom('a', {href: 'slideshow.html?slide=' + i, id: 'link' + i}, i + 1));
}

// Create next/previous links.
var next = surf.dom('span', 'fake-link', 'Next');
var prev = surf.dom('span', 'fake-link', 'Back');
linkEl.appendChild(prev);
linkEl.appendChild(next);

next.addEventListener('click', function(e) {
  var curId = app.getActiveScreen().getPhotoId();
  if (curId < SlideScreen.photos.length - 1) {
    app.navigate('slideshow.html?slide=' + (curId + 1));
  }
}, false);

prev.addEventListener('click', function(e) {
  var curId = app.getActiveScreen().getPhotoId();
  if (curId > 0) {
    app.navigate('slideshow.html?slide=' + (curId - 1));
  }
}, false);



// Configure the app to navigate between slides.

var fullPath = window.location.pathname + window.location.search;
var lastSlash = fullPath.lastIndexOf('/');
var basePath = fullPath.substr(0, lastSlash + 1);
var currentPath = fullPath.substr(lastSlash + 1);

// Set up the app with a single factory that matches all the paths we want to handle.
var app = new surf.App(basePath);
app.defineSurface('slide');
app.registerScreenFactory(new surf.RegExpScreenFactory(/^slideshow\.html(\?slide=([0-9]+))?$/, SlideScreen));
app.subscribe(surf.App.Topics.END, onNavigate);
app.init(currentPath).addErrback(function(err) {
  alert('Sorry, unable to load slideshow.\n\n' + err.message);
});


// Subscribe to navigation-end and update the link corresponding to the active photo's.
var lastLink = null;
function onNavigate(path) {
  if (lastLink) lastLink.className = '';
  var curId = app.getActiveScreen().getPhotoId();
  var el = surf.byId('link' + curId);
  if (el) el.className = 'active';
  lastLink = el;
}
