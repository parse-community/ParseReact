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

import type { Mutation } from './Mutation';
import type * as MutationBatch from './MutationBatch';

var localCount = 0;

/**
 * issueMutation performs two important actions: it optimistically applies a
 * Mutation to the current local state (if this option is not turned off), and
 * issues the Mutation to the server. If the server request is successful, the
 * changes are committed to the local state; if not, the optimistic changes are
 * rolled back.
 */
export function issueMutation(mutation: Mutation, options: { [key: string]: boolean }) {
  var executionId;
  var target = (mutation.target instanceof Id) ? mutation.target :
    new Id(mutation.target, 'local-' + (localCount++));

  if (!options.waitForServer) {
    return performOptimisticMutation(target, mutation, options.batch);
  }

  return MutationExecutor.execute(mutation, options.batch).then((result) => {
    var subscribers = ObjectStore.fetchSubscribers(target);
    var delta = mutation.generateDelta(result);
    // Apply it to the data store
    var changes = ObjectStore.commitDelta(delta);
   return pushUpdates(subscribers, changes);
  });
}

function performOptimisticMutation(
  target: Id,
  mutation: Mutation,
  batch: ?MutationBatch
) {
  var executionId = ObjectStore.stackMutation(target, mutation);

  var subscribers = [];
  if (mutation.action !== 'CREATE') {
    subscribers = ObjectStore.fetchSubscribers(target);
  }
  var latest = null;
  if (mutation.action !== 'DESTROY') {
    latest = ObjectStore.getLatest(target);
  }

  // Push the latest object to matching queries
  var updates = {
    id: target,
    latest,
    fields: latest ? Object.keys(latest) : []
  };
  pushUpdates(subscribers, updates);

  var p = new Parse.Promise();
  MutationExecutor.execute(mutation, batch).then((result) => {
    var subscribers = ObjectStore.fetchSubscribers(target);
    var delta = mutation.generateDelta(result);
    // Replace the current entry with a Delta
    var changes = ObjectStore.resolveMutation(target, executionId, delta);
    p.resolve(pushUpdates(subscribers, changes));
  }, (err) => {
    // Roll back optimistic changes by deleting the entry from the queue
    var subscribers = ObjectStore.fetchSubscribers(target);
    if (mutation.action === 'CREATE') {
      // Make sure the local object is removed from any result sets
      subscribers.forEach((subscriber) => {
        var subscription = SubscriptionManager.getSubscription(subscriber);
        subscription.removeResult(target);
      });
      ObjectStore.destroyMutationStack(target);
    } else {
      var noop = new Delta(target, {});
      var changes = ObjectStore.resolveMutation(
        target,
        executionId,
        noop
      );
      pushUpdates(subscribers, changes);
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
function pushUpdates(subscribers: Array<string>, changes: { id: Id; latest: any; fields?: Array<string> }) {
  var i;
  if (changes.latest === null) {
    // Pushing a Destroy action. Remove it from all current subscribers
    subscribers.forEach((subscriber) => {
      var subscription = SubscriptionManager.getSubscription(subscriber);
      if (!subscription) {
        throw new Error('Object is attached to a nonexistent subscription');
      }
      subscription.removeResult(changes.id);
    });
    return null;
  }
  // For all current subscribers, check if the object still matches the query.
  // Then, using the changed keys, find any queries we might now match.
  var visited = {};
  subscribers.forEach((subscriber) => {
    visited[subscriber] = true;
    var subscription = SubscriptionManager.getSubscription(subscriber);
    if (QueryTools.matchesQuery(changes.latest, subscription.originalQuery)) {
      if (changes.id.toString() !== changes.latest.id.toString()) {
        // It's a Create method
        subscription.removeResult(changes.id, true);
        ObjectStore.removeSubscriber(changes.id, subscriber);
        subscription.addResult(changes.latest);
        ObjectStore.addSubscriber(changes.latest.id, subscriber);
      } else {
        subscription.pushData();
      }
    } else {
      subscription.removeResult(changes.id);
      ObjectStore.removeSubscriber(changes.id, subscriber);
    }
  });
  SubscriptionManager.queriesForFields(
    changes.latest.id.className,
    changes.fields
  ).forEach((potential) => {
    if (visited[potential]) {
      return;
    }
    var subscription = SubscriptionManager.getSubscription(potential);
    if (QueryTools.matchesQuery(changes.latest, subscription.originalQuery)) {
      subscription.addResult(changes.latest);
      ObjectStore.addSubscriber(changes.latest.id, potential);
    }
  });
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
