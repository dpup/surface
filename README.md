Surface JS Library
==================

Surface is a JS library intended to help manage single-page applications (or "Ajaxy" apps).  It promotes decoupling of components and provides tools for navigating between "screens" and integrating with the browser history.

It is intended to be used in conjunction with the [Closure Tools](http://code.google.com/closure/) but can be used as a stand-alone bundle -- at some compromise to code size (~10KB).

Overview
--------

At the core, a `surf.App` is responsible for managing multiple surfaces -- elements in the page -- and provides an interface for navigating between "screens".  A screen is a configuration of the application's surfaces for a given state, the active screen defines the visible contents for each surface.  Navigations are based on paths and should contain enough information to render a screen, this bakes perma-linking into the core of the API.

A simple application might contain only a single surface.  Another app may contain surfaces for the main area, the sidebar, and the footer.

Screens are given various affordances to enable reasonably complex control flows.  A screen can block navigations away from it (for example, if there is unsaved content) and can tell the app to wait before displaying it (for example, if data needs to be loaded before the screen can be rendered).

Since the same screen class can be used multiple times (e.g. an instance for multiple photo albums), screen factories are used to construct screens for the navigation.  Some apps will have a factory for each screen, others may have a single screen factory that knows how to construct all screens.

Nomenclature
------------

To ensure clarity, it may help to define some terms.

*page* - a HTML document that the browser loads.

*single-page application (SPA)* - a website that avoids full page loads, instead performing partial updates when new information is displayed.  See [wikipedia](http://en.wikipedia.org/wiki/Single-page_application).

*application* - the root JavaScript construct, responsible for managing navigation and the current display.

*surface* - an area of the page that can have information rendered into it.  An application manages multiple surfaces.

*screen* - a configuration of surfaces, along with a JavaScript object to manage the lifetime.  A screen corresponds to a navigation path and is equivalent to a *page* in the traditional web model.

*screen factory* - factories are used to constructs screens, since multiple instances of the same screen may be rendered.  For example, a product page can be rendered for many products.  The screen factories are registered at application start up and will be called to with the navigation path.  The first factory that can handle the navigation path will be used to construct the screen.  (See API docs below for more details.)

*navigation* & *navigation path* - a navigation causes the transition to a new screen, flipping the content of the surfaces to display the content for the new screen.  While a navigation is handled without a page load, navigation paths are used that mirror traditional browser navigation.  The browser's location will be updated to match the navigation path.


Life Cycle
----------

_Initialization:_

1. Create an application object.
2. Define surfaces that screens can render in, these correspond to elements on the page.
3. Register screen factories that will be called when navigations occur.
4. Call `app.init(opt_path)` with an optional path for initial navigation.

_Navigation:_

A navigation occurs when either `app.navigate('/somepath/')` is called directly or when a link is clicked whose `href` is a path underneath the base URL specified when the application was constructed.  When either of these things happen:

1. `surf.App.Topics.START` is dispatched to any subscribers.
2. If there is an active screen its `beforeDeactivate()` method is called, if false is returned then the navigation is canceled.
3.
    a. If there is a cached screen which matches the navigation path exactly, then it will be used as the destination screen.
    b. If there is no cached screen, each `matchesPath()` will be called on each screen factory until one returns true, indicating it can handle the navigation.  `create()` will then be called on the factory which should return a new `Screen` instance.  The new screen will then have `getSurfaceContent()` called for each surface in the application.
4. If there was a previously started navigation, it will be canceled at this stage.
5. `beforeFlip` will be called on the destination screen.  This can return a deferred, which will pause the navigation until it is resolved.
6. The surfaces will now be switched, if there is a transition function that was passed to `defineSurface` and it returns a deferred, the navigation will be paused until all surfaces' deferred have completed.  This is useful for animations.
7. Next, the page's title is updated and the browser location updated.
8. `afterFlip()` is called on the new active screen.
9. If the old screen is not cacheable, then it will be removed and its `dispose()` method called.


If there are any errors the navigation will be canceled.  `surf.App.Topics.END` will always be dispatched at the end of the navigation, regardless of whether it successfully executed all 9 steps above.


Basic Usage
-----------

```
var app = new surf.App('/myapp/');
app.defineSurface('mainarea', 'Mainarea');
app.defineSurface('sidebar', 'Sidebar');
app.registerScreenFactory(new surf.RegExpScreenFactory(/.*/, HomeScreen));
app.init();

function HomeScreen(matches) {
  goog.base(this);
  this.matches = matches;
}
goog.inherits(HomeScreen, surf.NullScreen);

HomeScreen.prototype.getSurfaceContent = function(surface) {
  return 'Content for ' + surface + ' for ' + this.matches[0];
};

setTimeout(function() {
  app.navigate('/home/');
}, 2000);
```

Examples
--------

`bin/serve-js.sh` will set up a [Plovr](http://www.plovr.com/) server on localhost:9810 that will serve compiled JS.  The examples don't work well from a local file system, so you can either run them from a local apache/IIS installation, or if you have node installed try `node bin/static-file-server.js`, which will set up a server on `localhost:9800` to serve the HTML.

`example/sample-app.html` is a really minimal example of a multi-surface app where a screen can set the content of multiple surfaces.  The code is in `example/sample-app.js`.

`example/slideshow.html` shows a single-surface app that allows you to page through photos, deep link, and use history.   The code is in `example/slideshow.js`.

`example/bundle.html` a simple page that uses the pre-compiled bundle and uses pre-rendered content.


API Reference
-------------

The code is fully documented with expected parameters, type information, and features.  This section provides a general overview of the API and extra information about usage and behavior.

### surf.App #

The main class that is responsible for managing navigations and history.

`new surf.App(basePath, opt_defaultTitle)`
Constructs a new app.  The basePath should be the root of the application, any paths that the app can handle must be subpaths.  The default title is an optional fallback if the active screen doesn't specify its own title, if blank the app will fallback to document.title.

`#defineSurface(id, opt_defaultContent, opt_transitionFn)`
Defines a surface which the app should manage.  The `id` should correspond to an element in the DOM.  You can optionally specify default content that will be displayed if a screen doesn't provide content for the surface, and a transition function that will be used to flip a surface's children (default uses display='none' to hide the element).  If you don't provide default content here, you can specify an element already in the DOM with the id of the surface plus '-default', e.g. 'mainarea-default', if neither are specified the surface will be blank unless the screen provides content.

`#registerScreenFactory(factory)`
Registers a screen factory with the app.  When looking for a matching factory, they will be called in the order they were registered and the first to return true for `matchesPath()` will be used.

`#init(opt_initialPath)`
Initializes the application.  If a path is specified an initial navigation is performed, replacing the current history state.  Before calling `init()`, surfaces should have been defined and screen factories registered.  Init must be called.

`#navigate(path, opt_replaceHistory)`
Starts a navigation to the given path.  If a matching, cached screen is found it will be navigated too, otherwise a screen factory is looked for.  If opt_replaceHistory is true, the navigation will replace the current entry on the history stack rather than pushing a new entry.  `app.navigate()` returns a Deferred that will be called back once the navigation finishes, if the navigation fails its errback will be called.

`#getActiveScreen()`
Returns a reference to the currently active screen.  If called during a navigation it refers to the screen being navigated _from_.

### surf.ScreenFactory #

Interface used by the app to construct screens.  Multiple screen factories can be registered with an app.  When navigating the app looks for the first factory that matches the requested path, and asks the factory to construct a `surf.Screen`.

A concrete implementation is provided in `surf.RegExpScreenFactory(regExp, screenCtor)` that matches the path with a regular expression, and returns an instance of a Screen whose constructor was provided.  An app may have a single screen factory that knows how to construct all possible screens, a screen factory for every screen type, or somewhere in between.

`#matchesPath(path)`
Whether to construct a screen for the path.

`#create(path)`
Create a new screen for the given path.


### surf.Screen #

Interface for individual screens.  A screen class is responsible for controlling the visible surfaces in the app and managing the lifecycle. The lifecycle of the screen is as follows:

1. New screen constructed.
2. Screen asked to render content for each surface via `getSurfaceContent(surface)`.
3. `beforeFlip` called, screen can pause navigation using a deferred, e.g. for loading data.
4. Screen's surfaces are made visible.
5. `afterFlip` is called.

When another navigation occurs:

1. `beforeDeactivate` called, if true is returned then the navigation is cancelled, otherwise...
2. `deactivate` called.
3. If the screen is not cacheable it will be disposed and its elements removed from the DOM.  Otherwise it will be left active and if navigated to again will enter the lifecycle at step (3) above.

A concrete implementation is provided in `surf.NullScreen` that can be inherited from (for convenience) and individual methods overridden.

`#isCacheable()`
Whether the screen should be cached by the app.  If false the screen will be disposed once it is deactivated.  If true, the screen and its DOM will be kept around and can be flipped to quickly if navigated to again.

`#getTitle()`
Gets the title which should be shown in the browser's title bar and in the history drop down.

`#getSurfaceContent(surfaceId)`
Will be called for each surface in the app, the return value can be a string, an element, or null if the screen doesn't want to show anything for that surface.

`#beforeFlip()`
Called before the screen is navigated to, whether it was just constructed or cached.  If beforeFlip() returns a Deferred, the application won't finalize the navigation until the Deferred is resolved.  This allows you to load data, for example, before the screen is made visible.

`#afterFlip()`
Called immediately after the screen has been navigated to.  You know that the screen's elements are in the DOM and visible, should you need to do any initialization that requires measuring of elements.

`#beforeDeactivate()`
Gives the screen a chance to cancel the navigation and stop itself from being deactivated. Can be used, for example, if the screen has unsaved state.  Clean-up should not be preformed here, since the navigation may still be cancelled.

`#deactivate()`
Called before the screen is navigated away from.

`#dispose()`
Called when the screen is being destroyed.  Should do cleanup of event listeners, timers, requests, etc.

Licence
-------

```
// Copyright 2011 Daniel Pupius  https://github.com/dpup/surface
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
```
