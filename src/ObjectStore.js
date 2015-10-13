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
var queryHash = require('./QueryTools').queryHash;

import type * as Delta from './Delta';
import type { Mutation } from './Mutation';

export type OrderingInfo = { [key: string]: any };
export type IdWithOrderingInfo = {
  id: Id;
  ordering: OrderingInfo;
};
export type FlattenedObjectData = { [attr: string]: any };
export type ObjectChangeDescriptor = {
  id: Id;
  latest: any;  // TODO: this should really be FlattenedObjectData
  fields?: Array<string>;
};

/**
 * ObjectStore is a local cache for Parse Objects. It stores the last known
 * server version of each object it has seen, as well as a stack of pending
 * mutations for each object.
 * ObjectStore is a singleton object, as it is meant to be a unique global
 * store for all Parse-connected components in an application.
 */

// Stores the last known true state of each object, as well as the hashes of
// queries subscribed to the object.
var store: {
  [id: Id]: {
    data: FlattenedObjectData;
    queries: { [hash: string]: boolean }
  }
} = {};

// Stores the queries subscribed to local-only objects
var localSubscribers: { [id: Id]: { [hash: string]: boolean } } = {};

// Stores a stack of pending mutations for each object
var pendingMutations: { [id: Id]: Array<{
  payloadId: number;
  date: Date;
  mutation: Mutation;
  delta?: Delta
}> } = {};

var mutationCount = 0;

/**
 * Simple store and remove functions for publicly accessing the Store:
 *
 * storeObject: takes a flattened object as the single argument, and places it
 * in the Store, indexed by its Id.
 */
function storeObject(data: FlattenedObjectData): Id {
  if (!(data.id instanceof Id)) {
    throw new Error('Cannot store an object without an Id');
  }
  var queries = {};
  if (store[data.id]) {
    queries = store[data.id].queries;
  }
  store[data.id] = { data: data, queries: queries };
  return data.id;
}
/**
 * removeObject: takes an object Id, deletes it from the Store, and returns the
 * list of hashes of subscribed queries.
 */
function removeObject(id: Id): Array<string> {
  if (!(id instanceof Id)) {
    throw new TypeError('Argument must be a valid object Id');
  }
  if (!store[id]) {
    return [];
  }
  var subscribed = Object.keys(store[id].queries);
  delete store[id];
  return subscribed;
}
/**
 * addSubscriber: takes an object Id and a query hash, and associates the hash
 * with the object to indicate that the object matches the query.
 */
function addSubscriber(id: Id, hash: string): void {
  if (store[id]) {
    store[id].queries[hash] = true;
  } else if (localSubscribers[id]) {
    localSubscribers[id][hash] = true;
  } else {
    var subs = {};
    subs[hash] = true;
    localSubscribers[id] = subs;
  }
}
/**
 * removeSubscriber: takes an object Id and a query hash, and dissociates the
 * hash from the object.
 */
function removeSubscriber(id: Id, hash: string): void {
  if (store[id]) {
    delete store[id].queries[hash];
  } else if (localSubscribers[id]) {
    delete localSubscribers[id][hash];
    if (Object.keys(localSubscribers[id]).length < 1) {
      delete localSubscribers[id];
    }
  }
}
/**
 * fetchSubscribers: return the set of hashes for queries matching this object
 */
function fetchSubscribers(id: Id): Array<string> {
  if (store[id]) {
    return Object.keys(store[id].queries);
  }
  if (localSubscribers[id]) {
    return Object.keys(localSubscribers[id]);
  }
  return [];
}

/**
 * Methods for stacking, modifying, and condensing Mutations
 *
 * stackMutation: adds a Mutation to the stack for a given target, returns a
 * unique identifier for that operation.
 */
function stackMutation(target: Id, mutation: Mutation, date?: Date): number {
  var payloadId = mutationCount++;
  var payload = {
    payloadId: payloadId,
    date: date || new Date(),
    mutation: mutation
  };
  if (!pendingMutations[target]) {
    pendingMutations[target] = [payload];
  } else {
    pendingMutations[target].push(payload);
  }
  return payloadId;
}

/**
 * Completely remove the mutation stack for an object
 */
function destroyMutationStack(target: Id) {
  pendingMutations[target] = [];
}

/**
 * Replace an optimistic mutation with a delta, and attempt to consolidate
 * the mutation stack for that object.
 * Returns the latest object state and an array of keys that changed, or null
 * in the case of a Destroy
 */
function resolveMutation(
  target: Id,
  payloadId: number,
  delta: Delta
): ObjectChangeDescriptor {
  var stack = pendingMutations[target];
  var i;
  for (i = 0; i < stack.length; i++) {
    if (stack[i].payloadId === payloadId) {
      delete stack[i].mutation;
      stack[i].delta = delta;
      break;
    }
  }
  if (i >= stack.length) {
    // This shouldn't happen
    throw new Error('Optimistic Mutation completed, but was not found in ' +
      'the pending stack.');
  }
  var changed = Object.keys(delta.map);
  // Consolidate Deltas above and below, where available
  if (i + 1 < stack.length) {
    var above = stack[i + 1].delta;
    if (typeof above !== 'undefined') {
      delta.merge(above);
      stack.splice(i + 1, 1);
    }
  }
  if (i > 0) {
    var below = stack[i - 1].delta;
    if (typeof below !== 'undefined') {
      below.merge(delta);
      stack.splice(i, 1);
    }
  }
  var bottom = stack[0].delta;
  if (bottom) {
    // Squash the bottom of the stack into the data store
    stack.shift();
    var result = commitDelta(bottom);
    result.id = target; // For cases where we're squashing an optimistic commit
    return result;
  }
  return {
    id: target,
    latest: getLatest(delta.id),
    fields: changed
  };
}

/**
 * Apply a Delta to the stored version of an object
 * Returns the latest object state and an array of keys that changed, or null
 * in the case of a Destroy
 */
function commitDelta(delta: Delta): ObjectChangeDescriptor {
  var id = delta.id;
  if (delta.destroy) {
    if (store[id]) {
      delete store[id];
      return {
        id: id,
        latest: null
      };
    }
  }
  var refresh = {};
  var source = store[id] && store[id].data;
  var changed = [];
  var attr;
  if (source) {
    for (attr in source) {
      refresh[attr] = source[attr];
    }
  } else {
    refresh.id = id;
    refresh.objectId = id.objectId;
    refresh.className = id.className;
    changed.push('objectId');
  }
  for (attr in delta.map) {
    changed.push(attr);
    var change = delta.map[attr];
    if (change.hasOwnProperty('unset')) {
      delete refresh[attr];
    } else if (change.hasOwnProperty('set')) {
      refresh[attr] = change.set;
    }
  }
  if (source) {
    store[id].data = refresh;
  } else {
    store[id] = {
      data: refresh,
      queries: {}
    };
  }
  return {
    id: id,
    latest: refresh,
    fields: changed
  };
}

/**
 * Flattens a set of Parse Query results, storing them in the Object Store.
 * Returns an array of object Ids, or an array of maps containing Ids and query-
 * specific ordering information.
 */
function storeQueryResults(
  results: Array<ParseObject> | ParseObject,
  query: ParseQuery
): Array<Id | IdWithOrderingInfo> {
  var hash = queryHash(query);
  if (!Array.isArray(results)) {
    results = [results];
  }
  var i;
  var orderColumns;
  if (query._order) {
    orderColumns = {};
    for (i = 0; i < query._order.length; i++) {
      var column = query._order[i];
      if (column[0] === '-') {
        column = column.substring(1);
      }
      orderColumns[column] = true;
    }
  }
  var includes = [];
  if (query._include.length) {
    for (i = 0; i < query._include.length; i++) {
      includes.push(query._include[i].split('.'));
    }
  }
  var ids = [];
  for (i = 0; i < results.length; i++) {
    var flat = flatten(results[i]);
    var id = storeObject(flat);
    if (includes.length) {
      var flattenAndStoreValue = (val) => storeObject(flatten(val));
      for (var inclusion = 0; inclusion < includes.length; inclusion++) {
        var inclusionChain = includes[inclusion];
        var cur = results[i];
        for (var col = 0; cur && col < inclusionChain.length; col++) {
          cur = cur.get(inclusionChain[col]);
          if (cur) {
            // An array from an inclusion needs it's children stored.
            if (Array.isArray(cur)) {
              cur.forEach(flattenAndStoreValue);
            } else {
              flattenAndStoreValue(cur);
            }
          }
        }
      }
    }
    var resultItem = id;
    if (orderColumns) {
      // Fetch and store ordering info
      var ordering = {};
      for (var c in orderColumns) {
        ordering[c] = flat[c];
      }
      resultItem = {
        id: id,
        ordering: ordering
      };
    }
    ids.push(resultItem);
    addSubscriber(flat.id, hash);
  }
  return ids;
}

/**
 * Given a list of object Ids, fetches the latest data for each object
 * and returns the results as an array of shallow copies.
 */
function getDataForIds(ids: Id | Array<Id>): Array<FlattenedObjectData> {
  if (!Array.isArray(ids)) {
    ids = [ids];
  }
  var data = [];
  for (var i = 0; i < ids.length; i++) {
    var object = getLatest(ids[i]);
    var clone = {};
    for (var attr in object) {
      clone[attr] = object[attr];
    }
    Object.freeze(clone);
    data.push(clone);
  }
  return data;
}

/**
 * Fetch objects from the store, converting pointers to objects where possible
 */
function deepFetch(id: Id, seen?: Array<string>): ?FlattenedObjectData {
  if (!store[id]) {
    return null;
  }
  if (typeof seen === 'undefined') {
    seen = [id.toString()];
  }
  var source = store[id].data;
  var obj = {};
  var seenChildren = [];
  var populatePointer = function(val) {
    if (val && typeof val === 'object' && val.__type === 'Pointer') {
      var childId = new Id(val.className, val.objectId);
      if (seen.indexOf(childId.toString()) < 0 && store[childId]) {
        seenChildren = seenChildren.concat([childId.toString()]);
        return deepFetch(childId, seen.concat(seenChildren));
      }
    }

    return val;
  };

  for (var attr in source) {
    var sourceVal = source[attr];

    // Arrays of pointers may need to be populated
    if (Array.isArray(sourceVal)) {
      sourceVal = sourceVal.map(populatePointer);
    } else {
      sourceVal = populatePointer(sourceVal);
    }

    obj[attr] = sourceVal;
  }
  return obj;
}

/**
 * Calculate the result of applying all Mutations to an object.
 */
function getLatest(id: Id): ?FlattenedObjectData {
  if (pendingMutations[id] && pendingMutations[id].length > 0) {
    var base = {};
    var mutation;
    var attr;
    // If there is a Create Mutation on the stack, it must be the only one.
    if (pendingMutations[id][0].mutation.action === 'CREATE') {
      mutation = pendingMutations[id][0].mutation;
      var changes = mutation.data;
      for (attr in changes) {
        base[attr] = changes[attr];
      }
      var className = (mutation.target instanceof Id) ?
        mutation.target.className : mutation.target;
      base.id = (id instanceof Id) ? id : new Id(className, id);
      base.className = className;
      base.createdAt = base.updatedAt = pendingMutations[id][0].date;
      return base;
    }
    if (store[id]) {
      var source = deepFetch(id);
      for (attr in source) {
        base[attr] = source[attr];
      }
    }
    for (var i = 0; i < pendingMutations[id].length; i++) {
      mutation = pendingMutations[id][i].mutation;
      if (mutation.action === 'DESTROY') {
        return null;
      }
      mutation.applyTo(base);
      base.updatedAt = pendingMutations[id][i].date;
    }
    return base;
  }
  // If there are no mutations, just return the stored object
  return store[id] ? deepFetch(id) : null;
}

module.exports.storeObject = storeObject;
module.exports.removeObject = removeObject;
module.exports.addSubscriber = addSubscriber;
module.exports.removeSubscriber = removeSubscriber;
module.exports.fetchSubscribers = fetchSubscribers;
module.exports.stackMutation = stackMutation;
module.exports.destroyMutationStack = destroyMutationStack;
module.exports.resolveMutation = resolveMutation;
module.exports.commitDelta = commitDelta;
module.exports.storeQueryResults = storeQueryResults;
module.exports.getDataForIds = getDataForIds;
module.exports.deepFetch = deepFetch;
module.exports.getLatest = getLatest;

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  // Expose the raw storage
  module.exports._rawStore = store;
  module.exports._rawMutations = pendingMutations;
}
