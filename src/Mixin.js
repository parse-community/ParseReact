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

var LocalSubscriptions = require('./LocalSubscriptions');
var Parse = require('./StubParse');
var SubscriptionManager = require('./SubscriptionManager');

var queryHash = require('./QueryTools').queryHash;
var warning = require('./warning');

var Mixin = {
  componentWillMount: function() {
    this._lastQueryHash = {};
    this._outstandingQueries = {};
    this._localQueries = {};
    this._queryErrors = {};
    this.data = this.data || {};

    if (!this.observe) {
      throw new Error('Components using ParseReact.Mixin must declare an ' +
        'observe() method.');
    }
    this._subscribeObservables(this.props, this.state);
  },

  componentWillUnmount: function() {
    this._revokeQueries();
  },

  /**
   * If the component is about to update, recalculate the queries on observe()
   * and update this.data
   */
  componentWillUpdate: function(nextProps, nextState) {
    this._subscribeObservables(nextProps, nextState);
  },

  pendingQueries: function() {
    var pending = [];
    for (var q in this._outstandingQueries) {
      if (this._outstandingQueries[q]) {
        pending.push(q);
      }
    }
    return pending;
  },

  queryErrors: function() {
    if (Object.keys(this._queryErrors).length < 1) {
      return null;
    }
    var errors = {};
    for (var e in this._queryErrors) {
      errors[e] = this._queryErrors[e];
    }
    return errors;
  },

  refreshQueries: function(queries) {
    var queryNames = {};
    var name;
    if (typeof queries === 'undefined') {
      for (name in this._lastQueryHash) {
        queryNames[name] = this._lastQueryHash[name];
      }
    } else if (typeof queries === 'string') {
      queryNames[queries] = this._lastQueryHash[queries];
    } else if (Array.isArray(queries)) {
      for (var i = 0; i < queries.length; i++) {
        if (this._lastQueryHash[queries[i]]) {
          queryNames[queries[i]] = this._lastQueryHash[queries[i]];
        } else {
          warning('Cannot refresh unknown query name: ' + queries[i]);
        }
      }
    } else {
      throw new TypeError('refreshQueries must receive a query name or an ' +
        'array of query names');
    }

    for (name in queryNames) {
      var hash = queryNames[name];
      var subscription = SubscriptionManager.getSubscription(hash);
      if (!subscription.pending) {
        subscription.issueQuery();
      }
    }
  },

  _subscribeObservables: function(props, state) {
    var observables = this.observe(props, state);
    if (typeof observables !== 'object') {
      warning('observe() must return an object map');
      return;
    }
    for (var name in observables) {
      this.data[name] = observables[name].subscribe(this, name);
    }
  },

  _registerQuery: function(name, query, force) {
    if (!(query instanceof Parse.Query)) {
      warning('Query function ' + name + ' did not return a valid Parse ' +
        'Query object. Make sure you are returning the Query, and not ' +
        'fetching it yourself.');
      return;
    }
    var hash = queryHash(query);
    if (hash === this._lastQueryHash[name] &&
        !force) {
      // The query has not changed, so there is no need to re-register it
      return;
    }
    if (this._lastQueryHash[name] && hash !== this._lastQueryHash[name]) {
      // We were previously associated with a different version of this query.
      // We need to unregister first before moving forward.
      SubscriptionManager.unsubscribeQuery(
        this._lastQueryHash[name],
        this._receiveQueryResults
      );
    }
    if (this._queryErrors[name]) {
      delete this._queryErrors[name];
    }
    this._lastQueryHash[name] = hash;
    this._outstandingQueries[name] = true;
    SubscriptionManager.subscribeQuery(
      this._receiveQueryResults,
      name,
      query,
      hash
    );
  },

  _registerLocalQuery: function(name, type) {
    if (this._localQueries[name] !== type) {
      if (LocalSubscriptions[this._localQueries[name]]) {
        LocalSubscriptions[this._localQueries[name]]
          .removeSubscriber(this, name);
      }
      LocalSubscriptions[type].addSubscriber(this, name);
    }
    this._localQueries[name] = type;
  },

  _receiveQueryResults: function(name, results) {
    if (!Array.isArray(results)) {
      if (results.error) {
        this._queryErrors[name] = results.error;
      }
    } else {
      this.data[name] = results;
    }
    this._outstandingQueries[name] = false;
    if (this.pendingQueries().length) {
      return;
    }
    // All queries have completed; force a render update
    this.forceUpdate();
  },

  _revokeQueries: function() {
    var name;
    for (name in this._lastQueryHash) {
      SubscriptionManager.unsubscribeQuery(this._lastQueryHash[name],
        this._receiveQueryResults);
    }
    for (name in this._localQueries) {
      LocalSubscriptions[this._localQueries[name]].removeSubscriber(this, name);
    }
  }
};

module.exports = Mixin;
