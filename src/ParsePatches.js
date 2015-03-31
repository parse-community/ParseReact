/*
 *  Copyright (c) 2015, Parse, LLC. All rights reserved.
 *
 *  You are hereby granted a non-exclusive, worldwide, royalty-free license to
 *  use, copy, modify, and distribute this software in source code or binary
 *  form for use in connection with the web services and APIs provided by Parse.
 *
 *  As with any software that integrates with the Parse platform, your use of
 *  this software is subject to the Parse Terms of Service
 *  [https://www.parse.com/about/terms]. This copyright notice shall be
 *  included in all copies or substantial portions of the software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 *  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 *  IN THE SOFTWARE.
 *
 */

'use strict';

/**
 * Patches for the Parse JS SDK
 */

var flatten = require('./flatten');
var LocalSubscriptions = require('./LocalSubscriptions');
var Parse = require('./StubParse');

var oldSignUp = Parse.User.prototype.signUp;
var oldLogIn = Parse.User.prototype.logIn;
var oldLinkWith = Parse.User.prototype._linkWith;
var oldLogOut = Parse.User.logOut;

var patches = {
  /**
   * Attaches to the prototype of Parse.Object
   * Returns a flattened, plain object representation of the current object
   */
  toPlainObject: function() {
    return flatten(this);
  },

  /**
   * Allows a Parse.Query to be observed by a React component
   */
  subscribe: function(component, name) {
    component._registerQuery(name, this);
    return component.data[name] || [];
  },

  /**
   * Patches for Parse.User to watch for user signup / login / logout
   */
  signUp: function(attrs, options) {
    return oldSignUp.call(this, attrs, options).then(function() {
      LocalSubscriptions.currentUser.triggerUpdate();
    });
  },
  logIn: function(options) {
    return oldLogIn.call(this, options).then(function() {
      LocalSubscriptions.currentUser.triggerUpdate();
    });
  },
  _linkWith: function(provider, options) {
    return oldLinkWith.call(this, provider, options).then(function() {
      LocalSubscriptions.currentUser.triggerUpdate();
    });
  },
  logOut: function() {
    var promise = oldLogOut();
    LocalSubscriptions.currentUser.triggerUpdate();
    return promise;
  },
};

var ParsePatches = {
  applyPatches: function() {
    if (!Parse.Object.prototype.toPlainObject) {
      Parse.Object.prototype.toPlainObject = patches.toPlainObject;
    }
    if (!Parse.Query.prototype.subscribe) {
      Parse.Query.prototype.subscribe = patches.subscribe;
    }
    Parse.User.prototype.signUp = patches.signUp;
    Parse.User.prototype.logIn = patches.logIn;
    Parse.User.prototype._linkWith = patches._linkWith;
    Parse.User.logOut = patches.logOut;
  }
};

module.exports = ParsePatches;
