
goog.require('surf.App');

goog.exportSymbol('surf.App', surf.App);
goog.exportSymbol('surf.App.prototype.defineSurface', surf.App.prototype.defineSurface);
goog.exportSymbol('surf.App.prototype.registerScreenFactory', surf.App.prototype.registerScreenFactory);
goog.exportSymbol('surf.App.prototype.init', surf.App.prototype.init);
goog.exportSymbol('surf.App.prototype.navigate', surf.App.prototype.navigate);
goog.exportSymbol('surf.App.prototype.getActiveScreen', surf.App.prototype.getActiveScreen);

// From PubSub.
goog.exportSymbol('surf.App.prototype.subscribe', surf.App.prototype.subscribe);
goog.exportSymbol('surf.App.prototype.subscribeOnce', surf.App.prototype.subscribeOnce);
goog.exportSymbol('surf.App.prototype.unsubscribe', surf.App.prototype.unsubscribe);
goog.exportSymbol('surf.App.prototype.unsubscribeByKey', surf.App.prototype.unsubscribeByKey);


// Export the public methods that can be used on goog.async.Deferred.
goog.exportProperty(goog.async.Deferred.prototype, 'addCallback', goog.async.Deferred.prototype.addCallback);
goog.exportProperty(goog.async.Deferred.prototype, 'addErrback', goog.async.Deferred.prototype.addErrback);
goog.exportProperty(goog.async.Deferred.prototype, 'cancel', goog.async.Deferred.prototype.cancel);
