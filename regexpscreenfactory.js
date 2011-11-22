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
  return new this.screenCtor_(this.re_.exec(path));
};
