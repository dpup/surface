Surface JS Library
==================

Surface is a JS library intended to help manage single-page applications (or "Ajaxy" apps).  It promotes decoupling of components and provides tools for navigating between "screens" and integrating with the browser history.

It is intended to be used in conjunction with the [Closure Tools](http://code.google.com/closure/) but can be used as a stand-alone bundle -- at some compromise to code size.

Overview
--------

At the core, a `surf.App` is responsible for managing multiple surfaces -- elements in the page -- and provides an interface for navigating between "screens".  An active screen controls the visible contents of the surfaces.  Navigations are based on paths and should contain enough information to render a screen, this bakes perma-linking into the core of the API.

A simple application may contain only a single surface.  Another app may contain surfaces for the main area, the sidebar, and the footer.

Screens are given various affordances to enable reasonably complex control flows.  A screen can block navigations away from it (for example, if there is unsaved content) and can tell the app to wait before displaying it (for example, if data needs to be loaded before the screen can be rendered).

Since the same screen class can be used multiple times (e.g. an instance for multiple photo albums), screen factories are used to construct screens for the navigation.  Some apps will have a factory for each screen, others may have a single screen factory that knows how to construct all screens.

Examples
-------

`bin/serve-js.sh` will set up a [Plovr](http://www.plovr.com/) server on localhost:9810 that will serve compiled JS.  The examples don't work well from a local file system, so you can either run them from a local apache/IIS installation, or if you have node installed try `node bin/static-file-server.js`, which will set up a server on localhost:9800 to serve the HTML.

`example/sample-app.html` is a really minimal example of a multi-surface app where a screen can set the content of multiple surfaces.

`example/slideshow.html` shows a single-surface app that allows you to page through photos, deep link, and use history. 


API Reference
-------------

### surf.App #

The main class that is responsible for managing navigations and history.

`new surf.App(basePath, opt_defaultTitle)`  
Constructs a new app.  The basePath should be the root of the application, any paths that the app can handle should be subpaths.  The default title is an optional fallback if the active screen doesn't specify its own title, if blank the app will fallback to document.title.

`#defineSurface(id, opt_defaultContent, opt_transitionFn)`  
Defines a surface which the app should manage.  The `id` should correspond to an element in the DOM.  You can optionally specify default content that will be displayed if a screen doesn't provide content for the surface, and a transition function that will be used to flip surfaces (default uses display).  You can specify default content in the HTML by having an element with the id of the surface plus '-default', e.g. 'mainarea-default'.

`#registerScreenFactory(factory)`  
Registers a screen factory with the app, the factories will be called in the order they were added.

`#init(opt_initialPath)`  
Initializes the application.  If a path is specified an initial navigation is performed, replacing the current history state.

`#navigate(path, opt_replaceHistory)`  
Starts a navigation to the given path.  If a matching, cached screen is found it will navigated too, otherwise a screen factory is looked for.  If opt_replaceHistory is true, the navigation will replace the current entry on the history stack rather than pushing a new entry.  `app.navigate()` returns a Deferred that will be called back once the navigation finishes, if the navigation fails its errback will be called.

`#getActiveScreen()`  
Returns a reference to the currently active screen.  If called during a navigation it refers to the screen being navigated _from_. 

### surf.ScreenFactory #

Interface used by the app to construct screens.  Multiple screen factories can be registered with an app.  When navigating the app looks for the first factory that matches the requested path, and asks the factory to construct a `surf.Screen`. 

A concrete implementation is provided in `surf.RegExpScreenFactory` that matches the path with a regular expression, and returns an instance of a Screen whose constructor was provided at initialization.  An app may have a single screen factory that knows how to construct all possible screens, a screen factory for every screen type, or somewhere in between.

`#matchesPath(path)`  
Whether to construct a screen for the path.  

`#create(path)`  
Create a new screen for the given path.


### surf.Screen #

Interface for individual screens.  A screen class is responsible for controlling the visible surfaces in the app and managing the lifecycle. The lifecycle of the screen is as follows:

1. New screen constructed.
2. Screen asked to render content for each surface.
3. beforeFlip called, screen can pause navigation using a deferred, e.g. for loading data.
4. Screen's surfaces are made visible.
5. afterFlip is called.

When another navigation occurs:

1. beforeDeactivate called, if true is returned then the navigation is cancelled, otherwise...
2. deactivate called.
3. If the screen is not cacheable it will be disposed and its elements removed from the DOM.  Otherwise it will be left active and if navigated to again will enter the lifecycle at step (3) above.

A concrete implementation is provided in `surf.NullScreen` that can be inherited from (for convenience) and individual methods overridden.

`#isCacheable()`  
Whether the screen should be cached by the app.  If false the screen will be disposed once it is navigated away from.  If true, the screen and its DOM will be kept around and can be flipped to quickly if navigated to again.

`#getTitle()`  
Gets the title which should be shown in the browser's title bar and in the history drop down.

`#getSurfaceContent(surfaceId)`  
Will be called for each surface in the app, the return value can be a string, an element, or null if the screen doesn't want to show anything for that surface.