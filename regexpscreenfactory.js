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
 * @fileoverview Sample screen factory interface that uses a regular expression to match the path
 * and returns an instance of the provided Screen constructor.
 */

goog.provide('surf.RegExpScreenFactory');

goog.require('surf');


/**
 * A basic screen factory that uses a regexp to match the path, then passes the matches to the
 * constructor of the screen.
 *
 * @param {RegExp} re
 * @param {function(new:surf.Screen, Array)} screenCtor
 *
 * @implements {surf.ScreenFactory}
 * @constructor
 */
surf.RegExpScreenFactory = function(re, screenCtor) {
  this.re_ = re;
  this.screenCtor_ = screenCtor;
};


/**
 * @param {string} path
 * @return {boolean}
 */
surf.RegExpScreenFactory.prototype.matchesPath = function(path) {
  return this.re_.test(path);
};


/** @return {!surf.Screen} */
surf.RegExpScreenFactory.prototype.create = function(path) {
  var matches = this.re_.exec(path);
  surf.log('Creating screen for', path, matches);
  return new this.screenCtor_(matches);
};
