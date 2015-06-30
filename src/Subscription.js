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

var Id = require('./Id');
var ObjectStore = require('./ObjectStore');

import type {
  IdWithOrderingInfo,
  OrderingInfo,
} from './ObjectStore';

type ParseObject = {
  id: Id
};

export type Subscriber = {
  onNext: (value: any) => void;
  onError?: (error: any) => void;
};

/**
 * A Subscription represents the relationship between components and the results
 * of their queries. For each unique query, a Subscription stores pointers
 * to the latest results of that query, as well as methods to push the result
 * data to subscribed components.
 * When data is added to, removed from, or updated within the result set, the
 * Subscription will push the latest data to all subscribed components.
 */

/**
 * When we store ordering information alongside Ids, this method can map over
 * the array to extract each Id.
 */
function extractId(result: Id | IdWithOrderingInfo): Id {
  return result instanceof Id ? result : result.id;
}

/**
 * Using a query ordering array, compare object to the index represented by
 * orderInfo. If object should come before the current index, return -1; if
 * it should come after, return 1. If the two are equivalent in ordering, the
 * function returns 0.
 */
function compareObjectOrder(
  queryOrder: Array<string>,
  object: ParseObject,
  orderInfo: OrderingInfo
): number {
  for (var i = 0; i < queryOrder.length; i++) {
    var column = queryOrder[i];
    var multiplier = 1;
    if (column[0] === '-') {
      column = column.substring(1);
      multiplier = -1;
    }
    if (object[column] < orderInfo[column]) {
      return multiplier * -1;
    }
    if (object[column] > orderInfo[column]) {
      return multiplier;
    }
    // if equal, continue to the next column
  }
  return 0;
}

class Subscription {
  originalQuery: ParseQuery;
  pending: boolean;
  subscribers: { [key: string]: Subscriber };
  resultSet: Array<Id | IdWithOrderingInfo>;
  resultCount: ?number;
  observationCount: number;

  constructor(query: ParseQuery) {
    // The query used to fetch results for this Subscription
    this.originalQuery = query;
    // Whether there is an outstanding AJAX request for results
    this.pending = false;
    // The data used to push results back to components
    this.subscribers = {};
    // The Ids of the objects returned by this Subscription's query
    this.resultSet = [];
    this.resultCount = null;

    this.observationCount = 0;

    this.issueQuery();
  }

  /**
   * Registers a subscriber with this subscription.
   *
   * `callbacks` is an observer/subscriber that will be notified when
   * new data is available.
   */
  addSubscriber(callbacks: Subscriber): string {
    var oid = 'o' + this.observationCount++;
    this.subscribers[oid] = callbacks;

    if (this.originalQuery._observeCount) {
      callbacks.onNext(this.resultCount);
    } else {
      var resultSet = this.resultSet.map(extractId);
      var data = resultSet.length ? ObjectStore.getDataForIds(resultSet) : [];
      callbacks.onNext(this.originalQuery._observeOne ? data[0] : data);
    }

    return oid;
  }

  /**
   * Removes a subscriber from this subscription.
   */
  removeSubscriber(observationId: string): number {
    delete this.subscribers[observationId];
    return Object.keys(this.subscribers).length;
  }

  _forEachSubscriber(callable: (subscriber: Subscriber) => void) {
    for (var oid in this.subscribers) {
      callable.call(this, this.subscribers[oid]);
    }
  }

  /**
   * Executes the query for this subscription. When the results are returned,
   * they are cached in the ObjectStore and then pushed to all subscribed
   * components.
   */
  issueQuery() {
    this.pending = true;
    var errorHandler = (err) => {
      this.pending = false;
      this.pushError(err);
    };

    if (this.originalQuery._observeCount) {
      this.originalQuery.count().then((result) => {
        this.pending = false;
        this.resultCount = result;
        this._forEachSubscriber((subscriber) => subscriber.onNext(result));
      }, errorHandler);
      return;
    }
    this.originalQuery.find().then((results) => {
      this.pending = false;
      this.resultSet = ObjectStore.storeQueryResults(
        results,
        this.originalQuery
      );
      this.pushData();
    }, errorHandler);
  }

  /**
   * Add an object to the result set. This does not guarantee uniqueness.
   * If silent is truthy, this operation will not trigger a push of data to
   * the subscribed components.
   */
  addResult(object: ParseObject, silent: boolean) {
    if (this.originalQuery._order) {
      // We need to insert the object into the appropriate location
      if (this.originalQuery._skip) {
        // Can't reliably insert when skip and ordering are both applied
        return;
      }
      var index = 0;
      var orderColumns = this.originalQuery._order;
      while (index < this.resultSet.length) {
        // Satisfy Flow by ensuring that the current result is indeed of the
        // IdWithOrderingInfo type, and not a plain Id.
        var result = this.resultSet[index];
        if (result instanceof Id) {
          throw new Error('Encountered result without ordering info.');
        }
        var compare = compareObjectOrder(
          orderColumns,
          object,
          result.ordering
        );
        if (compare <= 0) {
          break;
        }
        index++;
      }
      var ordering = {};
      for (var i = 0; i < orderColumns.length; i++) {
        var column = orderColumns[i];
        if (column[0] === '-') {
          column = column.substring(1);
        }
        ordering[column] = object[column];
      }
      this.resultSet.splice(index, 0, { id: object.id, ordering: ordering });
    } else {
      this.resultSet.push(object.id);
    }

    if (!silent) {
      this.pushData();
    }
  }

  removeResult(id: Id, silent: boolean) {
    var idString = id.toString();
    for (var i = 0; i < this.resultSet.length; i++) {
      var curId = this.resultSet[i];
      if (!(curId instanceof Id)) {
        curId = curId.id;
      }
      if (curId.toString() === idString) {
        this.resultSet.splice(i, 1);
        if (!silent) {
          this.pushData();
        }
        return;
      }
    }
  }

  /**
   * Fetches the full data for the latest result set, and passes it to each
   * component subscribed to this query.
   */
  pushData() {
    var results = this.resultSet;
    // Fetch a subset of results if the query has a limit
    if (this.originalQuery._limit > -1) {
      results = results.slice(0, this.originalQuery._limit);
    }
    var resultSet = results.map(extractId);
    var data = ObjectStore.getDataForIds(resultSet);
    if (this.originalQuery._observeOne) {
      data = data[0];
    }
    this._forEachSubscriber((subscriber) => subscriber.onNext(data));
  }

  /**
   * Pass the specified error to each component subscribed to this query.
   */
  pushError(error: any) {
    this._forEachSubscriber((subscriber) => {
      subscriber.onError && subscriber.onError(error);
    });
  }
};

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  // Expose the object comparator for testing
  Subscription.compareObjectOrder = compareObjectOrder;
}

module.exports = Subscription;
