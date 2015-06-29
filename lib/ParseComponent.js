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

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var React = require('./StubReact');
var Parse = require('./StubParse');
var ParsePatches = require('./ParsePatches');
var warning = require('./warning');

// It's possible that this is the only entry point used for ParseReact, so we
// need to ensure the SDK is patched here as well.
ParsePatches.applyPatches();

/**
 * Provide observability and query-specific functionality on a subclass of
 * React.Component. Part or all of this will be deprecated when observability
 * is officially released within React.
 */

var ParseComponent = (function (_React$Component) {
  function ParseComponent(props) {
    _classCallCheck(this, ParseComponent);

    _get(Object.getPrototypeOf(ParseComponent.prototype), 'constructor', this).call(this, props);
    this._subscriptions = {};
    this.data = {};

    this._pendingQueries = {};
    this._queryErrors = {};

    if (!this.observe) {
      throw new Error('Components extending ParseComponent must declare an ' + 'observe() method.');
    }
  }

  _inherits(ParseComponent, _React$Component);

  _createClass(ParseComponent, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this._subscribe(this.props, this.state);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this._unsubscribe();
    }
  }, {
    key: 'componentWillUpdate',
    value: function componentWillUpdate(nextProps, nextState) {
      // Only subscribe if props or state changed
      if (nextProps !== this.props || nextState !== this.state) {
        this._subscribe(nextProps, nextState);
      }
    }
  }, {
    key: 'pendingQueries',

    /**
     * Query-specific public methods
     */

    value: function pendingQueries() {
      var pending = [];
      for (var q in this._subscriptions) {
        if (this._subscriptions[q].pending && this._subscriptions[q].pending()) {
          pending.push(q);
        }
      }
      return pending;
    }
  }, {
    key: 'queryErrors',
    value: function queryErrors() {
      if (Object.keys(this._queryErrors).length < 1) {
        return null;
      }
      var errors = {};
      for (var e in this._queryErrors) {
        errors[e] = this._queryErrors[e];
      }
      return errors;
    }
  }, {
    key: 'refreshQueries',
    value: function refreshQueries(queries) {
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
    }
  }, {
    key: '_subscribe',

    /**
     * Private subscription methods
     */

    value: function _subscribe(props, state) {
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
    }
  }, {
    key: '_unsubscribe',
    value: function _unsubscribe() {
      for (var name in this._subscriptions) {
        this._subscriptions[name].dispose();
      }
      this._subscriptions = {};
    }
  }, {
    key: '_receiveData',
    value: function _receiveData(name, value) {
      this.data[name] = value;
      delete this._pendingQueries[name];
      delete this._queryErrors[name];
      this.forceUpdate();
    }
  }, {
    key: '_receiveError',
    value: function _receiveError(name, error) {
      this._queryErrors[name] = error;
      this.forceUpdate();
    }
  }]);

  return ParseComponent;
})(React.Component);

exports['default'] = ParseComponent;
module.exports = exports['default'];