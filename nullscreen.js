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
