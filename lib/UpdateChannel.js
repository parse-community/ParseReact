'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

/**
 * issueMutation performs two important actions: it optimistically applies a
 * Mutation to the current local state (if this option is not turned off), and
 * issues the Mutation to the server. If the server request is successful, the
 * changes are committed to the local state; if not, the optimistic changes are
 * rolled back.
 */
exports.issueMutation = issueMutation;
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

var Delta = require('./Delta');
var Id = require('./Id');
var LocalSubscriptions = require('./LocalSubscriptions');
var MutationExecutor = require('./MutationExecutor');
var ObjectStore = require('./ObjectStore');
var Parse = require('./StubParse');
var QueryTools = require('./QueryTools');
var SubscriptionManager = require('./SubscriptionManager');

var localCount = 0;
function issueMutation(mutation, options) {
  var executionId;
  var target = mutation.target instanceof Id ? mutation.target : new Id(mutation.target, 'local-' + localCount++);

  if (!options.waitForServer) {
    // Set up the optimistic mutation
    var subscribers = [];
    var updates;
    var latest;

    if (mutation.action === 'CREATE') {
      executionId = ObjectStore.stackMutation(target, mutation);
      latest = ObjectStore.getLatest(target);
      updates = {
        id: target,
        latest: latest,
        fields: Object.keys(latest)
      };
    } else {
      executionId = ObjectStore.stackMutation(target, mutation);
      subscribers = ObjectStore.fetchSubscribers(target);
      if (mutation.action === 'DESTROY') {
        updates = {
          id: target,
          latest: null,
          fields: []
        };
      } else {
        latest = ObjectStore.getLatest(target);
        updates = {
          id: target,
          latest: latest,
          fields: Object.keys(latest)
        };
      }
    }

    // Push the latest object to matching queries
    pushUpdates(subscribers, updates);
  }

  var p = new Parse.Promise();
  MutationExecutor.execute(mutation.action, mutation.target, mutation.data).then(function (result) {
    var changes;
    var subscribers;
    var delta = mutation.generateDelta(result);
    if (!options.waitForServer) {
      // Replace the current entry with a Delta
      subscribers = ObjectStore.fetchSubscribers(target);
      changes = ObjectStore.resolveMutation(target, executionId, delta);
      p.resolve(pushUpdates(subscribers, changes));
    } else {
      // Apply it to the data store
      subscribers = ObjectStore.fetchSubscribers(target);
      changes = ObjectStore.commitDelta(delta);
      p.resolve(pushUpdates(subscribers, changes));
    }
  }, function (err) {
    if (!options.waitForServer) {
      // Roll back optimistic changes by deleting the entry from the queue
      var subscribers;
      if (mutation.action === 'CREATE') {
        // Make sure the local object is removed from any result sets
        subscribers = ObjectStore.fetchSubscribers(target);
        for (var i = 0; i < subscribers.length; i++) {
          var subscriber = SubscriptionManager.getSubscription(subscribers[i]);
          subscriber.removeResult(target);
        }
        ObjectStore.destroyMutationStack(target);
      } else {
        var noop = new Delta(target, {});
        subscribers = ObjectStore.fetchSubscribers(target);
        var changes = ObjectStore.resolveMutation(target, executionId, noop);
        pushUpdates(subscribers, changes);
      }
    }
    p.reject(err);
  });

  return p;
}

/**
 * When an object has changed, push that object to all subscribers. First, look
 * at the list of current subscribers to determine which ones still match. Then,
 * fetch a list of potential new subscribers using the changed fields, and add
 * the object to the result sets of any queries that now match.
 */
function pushUpdates(subscribers, changes) {
  var i;
  var subscriber;
  if (changes.latest === null) {
    // Pushing a Destroy action. Remove it from all current subscribers
    for (i = 0; i < subscribers.length; i++) {
      subscriber = SubscriptionManager.getSubscription(subscribers[i]);
      if (!subscriber) {
        throw new Error('Object is attached to a nonexistant subscription');
      }
      subscriber.removeResult(changes.id);
    }
    return null;
  }
  // For all current subscribers, check if the object still matches the query.
  // Then, using the changed keys, find any queries we might now match.
  var visited = {};
  for (i = 0; i < subscribers.length; i++) {
    visited[subscribers[i]] = true;
    subscriber = SubscriptionManager.getSubscription(subscribers[i]);
    if (QueryTools.matchesQuery(changes.latest, subscriber.originalQuery)) {
      if (changes.id.toString() !== changes.latest.id.toString()) {
        // It's a Create method
        subscriber.removeResult(changes.id, true);
        ObjectStore.removeSubscriber(changes.id, subscribers[i]);
        subscriber.addResult(changes.latest);
        ObjectStore.addSubscriber(changes.latest.id, subscribers[i]);
      } else {
        subscriber.pushData();
      }
    } else {
      subscriber.removeResult(changes.id);
      ObjectStore.removeSubscriber(changes.id, subscribers[i]);
    }
  }
  var potentials = SubscriptionManager.queriesForFields(changes.latest.id.className, changes.fields);
  for (i = 0; i < potentials.length; i++) {
    if (visited[potentials[i]]) {
      continue;
    }
    subscriber = SubscriptionManager.getSubscription(potentials[i]);
    if (QueryTools.matchesQuery(changes.latest, subscriber.originalQuery)) {
      subscriber.addResult(changes.latest);
      ObjectStore.addSubscriber(changes.latest.id, potentials[i]);
    }
  }
  if (changes.latest.id.className === '_User') {
    var currentUser = Parse.User.current();
    if (currentUser && changes.latest.id.objectId === currentUser.id) {
      LocalSubscriptions.currentUser.update(changes.latest);
    }
  }
  return changes.latest;
}

module.exports = {
  issueMutation: issueMutation
};