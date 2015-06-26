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
 *  
 */

'use strict';

var Parse = require('./StubParse');
var warning = require('./warning');

var Mixin = {
  /**
   * Lifecycle methods
   */

  componentWillMount: function componentWillMount() {
    this._subscriptions = {};
    this.data = this.data || {};

    this._pendingQueries = {};
    this._queryErrors = {};

    if (!this.observe) {
      throw new Error('Components using ParseReact.Mixin must declare an ' + 'observe() method.');
    }

    this._subscribe(this.props, this.state);
  },

  componentWillUnmount: function componentWillUnmount() {
    this._unsubscribe();
  },

  componentWillUpdate: function componentWillUpdate(nextProps, nextState) {
    // only subscribe if props or state changed
    if (nextProps !== this.props || nextState !== this.state) {
      this._subscribe(nextProps, nextState);
    }
  },

  /**
   * Query-specific public methods
   */

  pendingQueries: function pendingQueries() {
    var pending = [];
    for (var q in this._subscriptions) {
      if (this._subscriptions[q].pending && this._subscriptions[q].pending()) {
        pending.push(q);
      }
    }
    return pending;
  },

  queryErrors: function queryErrors() {
    if (Object.keys(this._queryErrors).length < 1) {
      return null;
    }
    var errors = {};
    for (var e in this._queryErrors) {
      errors[e] = this._queryErrors[e];
    }
    return errors;
  },

  refreshQueries: function refreshQueries(queries) {
    var queryNames = {};
    var name;
    if (typeof queries === 'undefined') {
      for (name in this._subscriptions) {
        queryNames[name] = this._subscriptions[name];
      }
    } else if (typeof queries === 'string') {
      if (this._subscriptions[queries]) {
        queryNames[queries] = this._subscriptions[queries];
      } else {
        warning('Cannot refresh unknown query name: ' + queries);
      }
    } else if (Array.isArray(queries)) {
      for (var i = 0; i < queries.length; i++) {
        if (this._subscriptions[queries[i]]) {
          queryNames[queries[i]] = this._subscriptions[queries[i]];
        } else {
          warning('Cannot refresh unknown query name: ' + queries[i]);
        }
      }
    } else {
      throw new TypeError('refreshQueries must receive a query name or an ' + 'array of query names');
    }

    for (name in queryNames) {
      this._pendingQueries[name] = true;
      queryNames[name].refresh();
    }
    this.forceUpdate();
  },

  /**
   * Private subscription methods
   */

  _subscribe: function _subscribe(props, state) {
    var observed = this.observe(props, state);
    var newSubscriptions = {};
    for (var name in observed) {
      if (!observed[name].subscribe) {
        warning('The observation value "' + name + '" is not subscribable. ' + 'Make sure you are returning the Query, and not fetching it yourself.');
        continue;
      }
      newSubscriptions[name] = observed[name].subscribe({
        onNext: this._receiveData.bind(this, name),
        onError: observed[name] instanceof Parse.Query ? this._receiveError.bind(this, name) : function () {}
      });
      this._pendingQueries[name] = true;
    }
    this._unsubscribe();
    this._subscriptions = newSubscriptions;
  },

  _unsubscribe: function _unsubscribe() {
    for (var name in this._subscriptions) {
      this._subscriptions[name].dispose();
    }
    this._subscriptions = {};
  },

  _receiveData: function _receiveData(name, value) {
    this.data[name] = value;
    delete this._pendingQueries[name];
    delete this._queryErrors[name];
    this.forceUpdate();
  },

  _receiveError: function _receiveError(name, error) {
    this._queryErrors[name] = error;
    this.forceUpdate();
  }
};

module.exports = Mixin;