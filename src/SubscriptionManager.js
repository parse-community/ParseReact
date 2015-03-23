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
function subscribeQuery(callback, name, query, hash) {
  if (!hash) {
    hash = queryHash(query);
  }
  var subscription = subscriptions[hash];
  if (!subscription) {
    subscription = new Subscription(query);
    subscriptions[hash] = subscription;
    indexQuery(query, hash);
  }
  subscription.addSubscriber(callback, name);
}

/**
 * Remove a component from a query's subscription set.
 */
function unsubscribeQuery(hash, callback) {
  var subscription = subscriptions[hash];
  if (!subscription) {
    return;
  }
  if (subscription.removeSubscriber(callback) < 1) {
    // There are no more components subscribed to this hash
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
  subscribeQuery: subscribeQuery,
  unsubscribeQuery: unsubscribeQuery,
  getSubscription: getSubscription,
  queriesForFields: queriesForFields
};

if (process.env.NODE_ENV === 'test') {
  SubscriptionManager.indexQuery = indexQuery;
  SubscriptionManager.subscriptions = subscriptions;
  SubscriptionManager.queryFamilies = queryFamilies;
}

module.exports = SubscriptionManager;
