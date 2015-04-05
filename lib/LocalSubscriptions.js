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
 *  @flow
 */

'use strict';

var flatten = require('./flatten');
var Id = require('./Id');
var ObjectStore = require('./ObjectStore');
var Parse = require('./StubParse');

/**
 * Local Subscriptions allow applications to subscribe to local objects, such
 * as the current user. React components can watch these for changes and
 * re-render when they are updated.
 */

var currentUser = {
  subscribers: {},
  observerCount: 0,

  subscribe: function subscribe(callbacks) {
    var _this = this;

    var observerId = 'o' + this.observerCount++;
    this.subscribers[observerId] = callbacks;
    var id;

    if (Parse.User.current()) {
      id = new Id('_User', Parse.User.current().id);
      if (!ObjectStore.getLatest(id)) {
        ObjectStore.storeObject(flatten(Parse.User.current()));
      }
      callbacks.onNext(ObjectStore.getLatest(id));
    } else if (Parse.Storage.async) {
      // It's possible we haven't loaded the user from disk yet
      Parse.User._currentAsync().then(function (user) {
        if (user !== null) {
          id = new Id('_User', user.id);
          if (!ObjectStore.getLatest(id)) {
            ObjectStore.storeObject(flatten(user));
          }
          callbacks.onNext(ObjectStore.getLatest(id));
        }
      });
      callbacks.onNext(null);
    }
    return {
      dispose: function dispose() {
        delete _this.subscribers[observerId];
      }
    };
  },

  update: function update(changes) {
    var current = Parse.User.current();
    if (current !== null) {
      for (var attr in changes) {
        if (attr !== 'id' && attr !== 'objectId' && attr !== 'className' && attr !== 'sessionToken' && attr !== 'createdAt' && attr !== 'updatedAt') {
          current.set(attr, changes[attr]);
        }
      }
      Parse.User._saveCurrentUser(current);
    }
    for (var oid in this.subscribers) {
      var latest = null;
      if (current) {
        latest = ObjectStore.getLatest(new Id('_User', current.id));
        if (latest === null) {
          latest = flatten(current);
          ObjectStore.storeObject(latest);
        }
      }
      this.subscribers[oid].onNext(latest);
    }
  }
};

var LocalSubscriptions = {
  currentUser: currentUser
};

module.exports = LocalSubscriptions;