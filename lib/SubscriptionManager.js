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

var QueryTools = require('./QueryTools');
var keysFromHash = QueryTools.keysFromHash;
var queryHash = QueryTools.queryHash;
var Subscription = require('./Subscription');

// Mapping of query hashes to subscriptions
var subscriptions = {};
// Tree of the attributes queries depend on, leading to their hashes
var queryFamilies = {};

/**
 * Queues up a Query, and subscribes the component to its results. It also sets
 * up the component to receive any locally-modified objects that fit the
 * query criteria.
 */
function subscribeToQuery(query, callbacks) {
  var hash = queryHash(query);
  var subscription = subscriptions[hash];
  if (!subscription) {
    subscription = new Subscription(query);
    subscriptions[hash] = subscription;
    indexQuery(query, hash);
  }
  var observationId = subscription.addSubscriber(callbacks);
  return {
    refresh: function refresh() {
      if (!subscription.pending) {
        subscription.issueQuery();
      }
    },
    pending: function pending() {
      return subscription.pending;
    },
    dispose: function dispose() {
      disposeSubscription(subscription, hash, observationId);
    }
  };
}

/**
 * Remove a component from a query's subscription set.
 */
function disposeSubscription(subscription, hash, observationId) {
  if (subscription.removeSubscriber(observationId) < 1) {
    // There are no more subscribed components
    delete subscriptions[hash];
    var indexDetails = keysFromHash(hash);
    var classTree = queryFamilies[indexDetails.className];
    if (!classTree) {
      return;
    }
    for (var i = 0; i < indexDetails.keys.length; i++) {
      delete classTree[indexDetails.keys[i]][hash];
    }
  }
}

/**
 * Fetch a Subscription object by query hash
 */
function getSubscription(hash) {
  return subscriptions[hash] || null;
}

/**
 * Indexes a query by the fields it depends upon. This lets us quickly find a
 * query that might match an object that has just modified a specific field.
 */
function indexQuery(query, hash) {
  var fields = keysFromHash(hash).keys;
  if (fields.length < 1) {
    fields = ['']; // Empty string is the key for no WHERE conditions
  }
  var classTree = queryFamilies[query.className];
  if (!classTree) {
    classTree = queryFamilies[query.className] = {};
  }
  for (var i = 0; i < fields.length; i++) {
    if (!classTree[fields[i]]) {
      classTree[fields[i]] = {};
    }
    classTree[fields[i]][hash] = true;
  }
}

/**
 * Gets all queries that depend on the specified fields
 */
function queriesForFields(className, fields) {
  var classTree = queryFamilies[className];
  if (!classTree) {
    return [];
  }
  var queries = {};
  fields = fields.concat('');
  for (var i = 0; i < fields.length; i++) {
    if (classTree[fields[i]]) {
      for (var hash in classTree[fields[i]]) {
        queries[hash] = true;
      }
    }
  }
  return Object.keys(queries);
}

var SubscriptionManager = {
  subscribeToQuery: subscribeToQuery,
  getSubscription: getSubscription,
  queriesForFields: queriesForFields
};

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  SubscriptionManager.indexQuery = indexQuery;
  SubscriptionManager.disposeSubscription = disposeSubscription;
  SubscriptionManager.subscriptions = subscriptions;
  SubscriptionManager.queryFamilies = queryFamilies;
}

module.exports = SubscriptionManager;