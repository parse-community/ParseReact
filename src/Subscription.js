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

/**
 * A Subscription represents the relationship between components and the results
 * of their queries. For each unique query, a Subscription stores pointers
 * to the latest results of that query, as well as methods to push the result
 * data to subscribed components.
 * When data is added to, removed from, or updated within the result set, the
 * Subscription will push the latest data to all subscribed components.
 */

'use strict';

var Id = require('./Id');
var ObjectStore = require('./ObjectStore');

/**
 * When we store ordering information alongside Ids, this method can map over
 * the array to extract each Id.
 */
function extractId(result) {
  return result.id;
}

/**
 * Using a query ordering array, compare object to the index represented by
 * orderInfo. If object should come before the current index, return -1; if
 * it should come after, return 1. If the two are equivalent in ordering, the
 * function returns 0.
 */
function compareObjectOrder(queryOrder, object, orderInfo) {
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

var Subscription = function(query) {
  // The query used to fetch results for this Subscription
  this.originalQuery = query;
  // Whether there is an outstanding AJAX request for results
  this.pending = false;
  // The data used to push results back to components
  this.subscribers = [];
  // The Ids of the objects returned by this Subscription's query
  this.resultSet = [];
};

Subscription.prototype = {
  /**
   * Registers a component with this subscription. When new data is available,
   * `callback` will be called to send that data back to the component. `name`
   * determines the prop to which that data is attached.
   */
  addSubscriber: function(callback, name) {
    for (var i = 0; i < this.subscribers.length; i++) {
      if (this.subscribers[i].callback === callback) {
        // This component has already subscribed
        return;
      }
    }
    this.subscribers.push({
      callback: callback,
      name: name
    });
    if (!this.pending) {
      this.issueQuery();
    }
  },

  /**
   * Removes a component from this subscription. The callback passed into the
   * function will be dissociated from the query, and the function will return
   * the remaining number of subscribers.
   */
  removeSubscriber: function(callback) {
    for (var i = 0; i < this.subscribers.length; i++) {
      if (this.subscribers[i].callback === callback) {
        this.subscribers.splice(i, 1);
        return this.subscribers.length;
      }
    }
    return this.subscribers.length;
  },

  /**
   * Executes the query for this subscription. When the results are returned,
   * they are cached in the ObjectStore and then pushed to all subscribed
   * components.
   */
  issueQuery: function() {
    var self = this;
    this.pending = true;
    this.originalQuery.find().then(function(results) {
      self.pending = false;
      self.resultSet = ObjectStore.storeQueryResults(
        results,
        self.originalQuery
      );
      self.pushData();
    }, function(err) {
      self.pending = false;
      self.pushData({ error: err });
    });
  },

  /**
   * Add an object to the result set. This does not guarantee uniqueness.
   * If silent is truthy, this operation will not trigger a push of data to
   * the subscribed components.
   */
  addResult: function(object, silent) {
    if (this.originalQuery._order) {
      // We need to insert the object into the appropriate location
      if (this.originalQuery._skip) {
        // Can't reliably insert when skip and ordering are both applied
        return;
      }
      var index = 0;
      var orderColumns = this.originalQuery._order;
      while (index < this.resultSet.length) {
        var compare = compareObjectOrder(
          orderColumns,
          object,
          this.resultSet[index].ordering
        );
        if (compare > 0) {
          index++;
        } else {
          break;
        }
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
  },

  removeResult: function(id, silent) {
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
  },

  /**
   * Fetches the full data for the latest result set, and passes it to each
   * component subscribed to this query.
   * If override is provided, it will be directly passed to the components,
   * rather than fetching the latest data from the ObjectStore. This is ideal
   * if you already have calculated the result data, or wish to send an
   * alternative payload.
   */
  pushData: function(override) {
    var data = override;
    var results = this.resultSet;
    // Fetch a subset of results if the query has a limit
    if (this.originalQuery.limit > -1) {
      results = results.slice(0, this.originalQuery.limit);
    }
    if (results[0] && !(results[0] instanceof Id)) {
      results = results.map(extractId);
    }
    if (typeof override === 'undefined') {
      var resultSet = this.resultSet;
      if (resultSet[0] && !(resultSet[0] instanceof Id)) {
        resultSet = resultSet.map(extractId);
      }
      data = ObjectStore.getDataForIds(resultSet);
    }
    for (var i = 0; i < this.subscribers.length; i++) {
      this.subscribers[i].callback(this.subscribers[i].name, data);
    }
  }
};

if (process.env.NODE_ENV === 'test') {
  // Expose the object comparator for testing
  Subscription.compareObjectOrder = compareObjectOrder;
}

module.exports = Subscription;