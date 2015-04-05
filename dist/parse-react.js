/*
 *  Parse + React
 *  v0.1.3
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ParseReact = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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

var LocalSubscriptions = _dereq_('./LocalSubscriptions');
var ParsePatches = _dereq_('./ParsePatches');

// Apply patches to the Parse JS SDK
ParsePatches.applyPatches();

module.exports = {
  currentUser: LocalSubscriptions.currentUser,
  Mixin: _dereq_('./Mixin'),
  Mutation: _dereq_('./Mutation'),
};

},{"./LocalSubscriptions":4,"./Mixin":5,"./Mutation":6,"./ParsePatches":9}],2:[function(_dereq_,module,exports){
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

var Id = _dereq_('./Id');

/**
 * A Delta represents a change that has been verified by the server, but has
 * not yet been merged into the "Last True State" (typically because some
 * outstanding Mutation preceeded it).
 * Deltas are stacked on top of State to determine the copies of objects that
 * are pushed to components.
 */

var Delta = function(id, data) {
  if (!(id instanceof Id)) {
    throw new TypeError('Cannot create a Delta with an invalid target Id');
  }
  this.id = id;
  this.map = {};
  if (data === 'DESTROY') {
    this.map = 'DESTROY';
  } else {
    for (var attr in data) {
      if (attr !== 'objectId') {
        this.map[attr] = data[attr];
      }
    }
  }
};

Delta.prototype = {
  /**
   * Merge changes from another Delta into this one, overriding where necessary
   */
  merge: function(source) {
    if (!(source instanceof Delta)) {
      throw new TypeError('Only Deltas can be merged');
    }
    if (this.id.toString() !== source.id.toString()) {
      throw new Error('Only Deltas for the same Object can be merged');
    }
    if (source.map === 'DESTROY') {
      this.map = 'DESTROY';
    }
    if (this.map === 'DESTROY') {
      return;
    }
    for (var attr in source.map) {
      this.map[attr] = source.map[attr];
    }

    return this;
  }
};

module.exports = Delta;

},{"./Id":3}],3:[function(_dereq_,module,exports){
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

/**
 * Id is used internally to provide a unique identifier for a specific Parse
 * Object. It automatically converts to a string for purposes like providing a
 * map key.
 */

var Id = function(className, objectId) {
  this.className = className;
  this.objectId = objectId;
};

Id.fromString = function(str) {
  var split = str.split(':');
  if (split.length !== 2) {
    throw new TypeError('Cannot create Id object from this string');
  }
  return new Id(split[0], split[1]);
};

Id.prototype = {
  toString: function() {
    return this.className + ':' + this.objectId;
  }
};

module.exports = Id;

},{}],4:[function(_dereq_,module,exports){
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

var flatten = _dereq_('./flatten');
var Id = _dereq_('./Id');
var ObjectStore = _dereq_('./ObjectStore');
var Parse = _dereq_('./StubParse');

/**
 * Local Subscriptions allow applications to subscribe to local objects, such
 * as the current user. React components can watch these for changes and
 * re-render when they are updated.
 */

var subscribers = [];

var currentUser = {
  subscribe: function(component, name) {
    var self = this;
    component._registerLocalQuery(name, 'currentUser');
    if (Parse.User.current()) {
      var id = new Id('_User', Parse.User.current().id);
      if (!ObjectStore.getLatest(id)) {
        ObjectStore.storeObject(flatten(Parse.User.current()));
      }
      return ObjectStore.getLatest(id);
    } else if (Parse.Storage.async) {
      // It's possible we haven't loaded the user from disk yet
      Parse.User._currentAsync().then(function(user) {
        if (user !== null) {
          self.triggerUpdate();
        }
      });
    }
    return null;
  },

  addSubscriber: function(component, name) {
    subscribers.push({
      name: name,
      component: component
    });
  },

  removeSubscriber: function(component, name) {
    for (var i = 0; i < subscribers.length; i++) {
      if (subscribers[i].name === name &&
          subscribers[i].component === component) {
        subscribers.splice(i, 1);
        return;
      }
    }
  },

  update: function(changes) {
    var current = Parse.User.current();
    for (var attr in changes) {
      if (attr !== 'id' &&
          attr !== 'objectId' &&
          attr !== 'className' &&
          attr !== 'sessionToken' &&
          attr !== 'createdAt' &&
          attr !== 'updatedAt') {
        current.set(attr, changes[attr]);
      }
    }
    Parse.User._saveCurrentUser(current);
    this.triggerUpdate();
  },

  triggerUpdate: function() {
    if (Parse.Storage.async) {
      return Parse.User._currentAsync().then(function() {
        for (var i = 0; i < subscribers.length; i++) {
          subscribers[i].component.forceUpdate();
        }
      });
    }

    for (var i = 0; i < subscribers.length; i++) {
      subscribers[i].component.forceUpdate();
    }
  }
};

var LocalSubscriptions = {
  currentUser: currentUser
};

module.exports = LocalSubscriptions;

},{"./Id":3,"./ObjectStore":8,"./StubParse":11,"./flatten":16}],5:[function(_dereq_,module,exports){
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

var LocalSubscriptions = _dereq_('./LocalSubscriptions');
var Parse = _dereq_('./StubParse');
var SubscriptionManager = _dereq_('./SubscriptionManager');

var queryHash = _dereq_('./QueryTools').queryHash;
var warning = _dereq_('./warning');

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

},{"./LocalSubscriptions":4,"./QueryTools":10,"./StubParse":11,"./SubscriptionManager":13,"./warning":17}],6:[function(_dereq_,module,exports){
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

var Id = _dereq_('./Id');
var Delta = _dereq_('./Delta');
var UpdateChannel = _dereq_('./UpdateChannel');

var warning = _dereq_('./warning');

/**
 * A Mutation is a generator for local and server-side data changes. It
 * represents an atomic update on a Parse Object that triggers data changes
 * when it is dispatched.
 * By default, when a Mutation is dispatched, it will optimistically update the
 * UI: the ObjectStore will act as though the change automatically succeeded
 * and will push it to subscribed components. If the server save fails, this
 * local update will be rolled back.
 * Optimistic updates can be prevented by passing an object containing the
 * key/value pair `waitForServer: true` to the dispatch() call.
 */

function normalizeTarget(obj) {
  if (obj instanceof Id) {
    return obj;
  }
  if (obj.className && obj.objectId) {
    return new Id(obj.className, obj.objectId);
  }
  throw new TypeError('Argument must be a plain Parse Object with a className' +
    ' and objectId');
}

function validateColumn(column) {
  if (!column ||
      typeof column !== 'string' ||
      column === 'objectId' ||
      column === 'createdAt' ||
      column === 'updatedAt') {
    throw new TypeError('Invalid column name for mutation: ' + column);
  }
}

function validateFields(data) {
  if (data.hasOwnProperty('objectId')) {
    warning('Ignoring reserved field: objectId');
    delete data.objectId;
  }
  if (data.hasOwnProperty('className')) {
    warning('Ignoring reserved field: className');
    delete data.className;
  }
  if (data.hasOwnProperty('createdAt')) {
    warning('Ignoring reserved field: createdAt');
    delete data.createdAt;
  }
  if (data.hasOwnProperty('updatedAt')) {
    warning('Ignoring reserved field: updatedAt');
    delete data.updatedAt;
  }
}

var Noop = {
  dispatch: function() { }
};

var Mutation = function(action, target, data) {
  this.action = action;
  this.target = target;
  this.data = data;
};
Mutation.prototype = {
  dispatch: function(options) {
    return UpdateChannel.issueMutation(this, options || {});
  },

  applyTo: function(base) {
    var self = this;
    switch (this.action) {
      case 'SET':
        for (var attr in this.data) {
          base[attr] = this.data[attr];
        }
        break;
      case 'UNSET':
        delete base[this.data];
        break;
      case 'INCREMENT':
        if (isNaN(base[this.data.column])) {
          base[this.data.column] = this.data.delta;
        } else {
          base[this.data.column] += this.data.delta;
        }
        break;
      case 'ADD':
        if (Array.isArray(base[this.data.column])) {
          base[this.data.column] =
            base[this.data.column].concat(this.data.value);
        } else {
          base[this.data.column] = this.data.value.concat([]);
        }
        break;
      case 'ADDUNIQUE':
        if (Array.isArray(base[this.data.column])) {
          this.data.value.map(function(el) {
            if (base[self.data.column].indexOf(el) < 0) {
              base[self.data.column].push(el);
            }
          });
        } else {
          base[this.data.column] = this.data.value.concat([]);
        }
        break;
      case 'REMOVE':
        if (!Array.isArray(base[this.data.column]) ||
            base[this.data.column].length < 1) {
          break;
        }
        this.data.value.map(function(el) {
          var index = base[self.data.column].indexOf(el);
          if (index > -1) {
            base[self.data.column].splice(index, 1);
          }
        });
        break;
    }
  },

  generateDelta: function(serverData) {
    if (this.action === 'DESTROY') {
      return new Delta(this.target, 'DESTROY');
    }
    var changes = {};
    if (this.action === 'UNSET') {
      changes[this.data] = { unset: true };
    }
    // All other Mutations result in set actions
    // For CREATE and SET, we use the Mutation data as a starting point, and
    // override with all fields we got back from the server
    // For other mutations, we rely on server data to give us the latest state
    var attr;
    var id = this.target;
    if (this.action === 'CREATE' || this.action === 'SET') {
      for (attr in this.data) {
        changes[attr] = { set: this.data[attr] };
      }
      if (this.action === 'CREATE') {
        id = new Id(this.target, serverData.objectId);
      }
    }
    for (attr in serverData) {
      if (attr !== 'objectId') {
        changes[attr] = { set: serverData[attr] };
      }
      if (attr === 'createdAt') {
        changes.updatedAt = { set: new Date(serverData.createdAt) };
      }
    }
    return new Delta(id, changes);
  }
};

module.exports = {
  // Basic Mutations
  Create: function(className, data) {
    data = data || {};
    validateFields(data);

    return new Mutation('CREATE', className, data);
  },

  Destroy: function(id) {
    return new Mutation('DESTROY', normalizeTarget(id), null);
  },

  Set: function(id, data) {
    if (!data || !Object.keys(data).length) {
      warning('Performing a Set mutation with no changes: dispatching this' +
        'will do nothing.');
      return Noop;
    }
    validateFields(data);
    return new Mutation('SET', normalizeTarget(id), data);
  },

  Unset: function(id, column) {
    validateColumn(column);
    return new Mutation('UNSET', normalizeTarget(id), column);
  },

  Increment: function(id, column, delta) {
    validateColumn(column);
    if (typeof delta !== 'undefined' && isNaN(delta)) {
      throw new TypeError('Cannot increment by a non-numeric amount');
    }
    var payload = {
      column: column,
      delta: (typeof delta === 'undefined') ? 1 : delta
    };

    return new Mutation('INCREMENT', normalizeTarget(id), payload);
  },

  // Array Mutations
  Add: function(id, column, value) {
    validateColumn(column);
    var payload = {
      column: column,
      value: Array.isArray(value) ? value : [value]
    };
    return new Mutation('ADD', normalizeTarget(id), payload);
  },

  AddUnique: function(id, column, value) {
    validateColumn(column);
    var payload = {
      column: column,
      value: Array.isArray(value) ? value : [value]
    };
    return new Mutation('ADDUNIQUE', normalizeTarget(id), payload);
  },

  Remove: function(id, column, value) {
    validateColumn(column);
    var payload = {
      column: column,
      value: Array.isArray(value) ? value : [value]
    };
    return new Mutation('REMOVE', normalizeTarget(id), payload);
  },

  // Relation Mutations
  AddRelation: function(id, column, target) {
    validateColumn(column);
    var targets = (Array.isArray(target) ? target : [target]);
    var payload = {
      column: column,
      targets: targets.map(normalizeTarget)
    };
    return new Mutation('ADDRELATION', normalizeTarget(id), payload);
  },

  RemoveRelation: function(id, column, target) {
    validateColumn(column);
    var targets = (Array.isArray(target) ? target : [target]);
    var payload = {
      column: column,
      targets: targets.map(normalizeTarget)
    };
    return new Mutation('REMOVERELATION', normalizeTarget(id), payload);
  }
};

},{"./Delta":2,"./Id":3,"./UpdateChannel":14,"./warning":17}],7:[function(_dereq_,module,exports){
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

var Id = _dereq_('./Id');
var Parse = _dereq_('./StubParse');

var toString = Object.prototype.toString;
// Special version of Parse._encode to handle our unique representations of
// pointers
function encode(data, seen) {
  if (!seen) {
    seen = [];
  }
  if (seen.indexOf(data) > -1) {
    throw new Error('Tried to encode circular reference');
  }
  if (Array.isArray(data)) {
    seen = seen.concat([data]);
    return data.map(function(val) {
      return encode(val, seen);
    });
  }
  if (toString.call(data) === '[object Date]') {
    return { __type: 'Date', iso: data.toJSON() };
  }
  if ((data instanceof Id) || (data instanceof Parse.Object)) {
    var id = (data instanceof Id) ? data.objectId : data.id;
    if (typeof id === 'undefined') {
      throw new Error('Tried to save a pointer to an unsaved Parse Object');
    }
    return {
      __type: 'Pointer',
      className: data.className,
      objectId: id
    };
  }
  if (data instanceof Parse.GeoPoint) {
    return data.toJSON();
  }
  if (data instanceof Parse.File) {
    if (!data.url()) {
      throw new Error('Tried to save a reference to an unsaved file');
    }
    return {
      __type: 'File',
      name: data.name(),
      url: data.url()
    };
  }
  if (typeof data === 'object') {
    if (data.objectId && data.className) {
      return {
        __type: 'Pointer',
        className: data.className,
        objectId: data.objectId
      };
    }

    seen = seen.concat(data);
    var output = {};
    for (var key in data) {
      output[key] = encode(data[key], seen);
    }
    return output;
  }
  return data;
}

function request(options) {
  return Parse._request(options).then(function(result) {
    if (result.createdAt) {
      result.createdAt = new Date(result.createdAt);
    }
    if (result.updatedAt) {
      result.updatedAt = new Date(result.updatedAt);
    }
    return Parse.Promise.as(result);
  });
}

function execute(action, target, data) {
  var payload;
  switch (action) {
    case 'CREATE':
      return request({
        method: 'POST',
        route: 'classes',
        className: target,
        data: encode(data)
      });
    case 'DESTROY':
      return request({
        method: 'DELETE',
        route: 'classes',
        className: target.className,
        objectId: target.objectId
      });
    case 'SET':
      return request({
        method: 'PUT',
        route: 'classes',
        className: target.className,
        objectId: target.objectId,
        data: encode(data)
      });
    case 'UNSET':
      payload = {};
      payload[data] = { __op: 'Delete' };
      return request({
        method: 'PUT',
        route: 'classes',
        className: target.className,
        objectId: target.objectId,
        data: payload
      });
    case 'INCREMENT':
      payload = {};
      payload[data.column] = {
        __op: 'Increment',
        amount: data.delta
      };
      return request({
        method: 'PUT',
        route: 'classes',
        className: target.className,
        objectId: target.objectId,
        data: payload
      });
    case 'ADD':
      payload = {};
      payload[data.column] = {
        __op: 'Add',
        objects: encode(data.value)
      };
      return request({
        method: 'PUT',
        route: 'classes',
        className: target.className,
        objectId: target.objectId,
        data: payload
      });
    case 'ADDUNIQUE':
      payload = {};
      payload[data.column] = {
        __op: 'AddUnique',
        objects: encode(data.value)
      };
      return request({
        method: 'PUT',
        route: 'classes',
        className: target.className,
        objectId: target.objectId,
        data: payload
      });
    case 'REMOVE':
      payload = {};
      payload[data.column] = {
        __op: 'Remove',
        objects: encode(data.value)
      };
      return request({
        method: 'PUT',
        route: 'classes',
        className: target.className,
        objectId: target.objectId,
        data: payload
      });
    case 'ADDRELATION':
      payload = {};
      payload[data.column] = {
        __op: 'AddRelation',
        objects: encode(data.targets)
      };
      return request({
        method: 'PUT',
        route: 'classes',
        className: target.className,
        objectId: target.objectId,
        data: payload
      });
    case 'REMOVERELATION':
      payload = {};
      payload[data.column] = {
        __op: 'RemoveRelation',
        objects: encode(data.targets)
      };
      return request({
        method: 'PUT',
        route: 'classes',
        className: target.className,
        objectId: target.objectId,
        data: payload
      });
  }
  throw new TypeError('Invalid Mutation action: ' + action);
}

var MutationExecutor = {
  execute: execute,
};

if ("development" === 'test') {
  MutationExecutor.encode = encode;
}

module.exports = MutationExecutor;

},{"./Id":3,"./StubParse":11}],8:[function(_dereq_,module,exports){
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

var flatten = _dereq_('./flatten');
var Id = _dereq_('./Id');
var queryHash = _dereq_('./QueryTools').queryHash;

/**
 * ObjectStore is a local cache for Parse Objects. It stores the last known
 * server version of each object it has seen, as well as a stack of pending
 * mutations for each object.
 * ObjectStore is a singleton object, as it is meant to be a unique global
 * store for all Parse-connected components in an application.
 */

// Stores the last known true state of each object, as well as the hashes of
// queries subscribed to the object.
var store = {};

// Stores the queries subscribed to local-only objects
var localSubscribers = {};

// Stores a stack of pending mutations for each object
var pendingMutations = {};

var mutationCount = 0;

/**
 * Simple store and remove functions for publicly accessing the Store:
 *
 * storeObject: takes a flattened object as the single argument, and places it
 * in the Store, indexed by its Id.
 */
function storeObject(data) {
  if (!(data.id instanceof Id)) {
    throw new Error('Cannot store an object without an Id');
  }
  store[data.id] = { data: data, queries: {} };
  return data.id;
}
/**
 * removeObject: takes an object Id, deletes it from the Store, and returns the
 * list of hashes of subscribed queries.
 */
function removeObject(id) {
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
function addSubscriber(id, hash) {
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
function removeSubscriber(id, hash) {
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
function fetchSubscribers(id) {
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
function stackMutation(target, mutation, date) {
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
function destroyMutationStack(target) {
  pendingMutations[target] = [];
}

/**
 * Replace an optimistic mutation with a delta, and attempt to consolidate
 * the mutation stack for that object.
 * Returns the latest object state and an array of keys that changed, or null
 * in the case of a Destroy
 */
function resolveMutation(target, payloadId, delta) {
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
  if (i + 1 < stack.length && stack[i + 1].delta) {
    delta.merge(stack[i + 1].delta);
    stack.splice(i + 1, 1);
  }
  if (i > 0 && stack[i - 1].delta) {
    stack[i - 1].delta.merge(delta);
    stack.splice(i, 1);
  }
  if (stack[0].delta) {
    // Squash the bottom of the stack into the data store
    var result = commitDelta(stack.shift().delta);
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
function commitDelta(delta) {
  var id = delta.id;
  if (delta.map === 'DESTROY') {
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
function storeQueryResults(results, query) {
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
  var ids = [];
  for (i = 0; i < results.length; i++) {
    var flat = flatten(results[i]);
    var id = storeObject(flat);
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
function getDataForIds(ids) {
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
 * Calculate the result of applying all Mutations to an object.
 */
function getLatest(id) {
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
      base.id = (id instanceof Id) ? id : new Id(mutation.target, id);
      base.className = mutation.target;
      base.createdAt = base.updatedAt = pendingMutations[id][0].date;
      return base;
    }
    if (store[id]) {
      var source = store[id].data;
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
  return store[id] ? store[id].data : null;
}

var ObjectStore = {
  storeObject: storeObject,
  removeObject: removeObject,
  addSubscriber: addSubscriber,
  removeSubscriber: removeSubscriber,
  fetchSubscribers: fetchSubscribers,
  stackMutation: stackMutation,
  destroyMutationStack: destroyMutationStack,
  resolveMutation: resolveMutation,
  commitDelta: commitDelta,
  storeQueryResults: storeQueryResults,
  getDataForIds: getDataForIds,
  getLatest: getLatest
};

if ("development" === 'test') {
  // Expose the raw storage
  ObjectStore._rawStore = store;
  ObjectStore._rawMutations = pendingMutations;
}

module.exports = ObjectStore;

},{"./Id":3,"./QueryTools":10,"./flatten":16}],9:[function(_dereq_,module,exports){
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

/**
 * Patches for the Parse JS SDK
 */

var flatten = _dereq_('./flatten');
var LocalSubscriptions = _dereq_('./LocalSubscriptions');
var Parse = _dereq_('./StubParse');

var oldSignUp = Parse.User.prototype.signUp;
var oldLogIn = Parse.User.prototype.logIn;
var oldLinkWith = Parse.User.prototype._linkWith;
var oldLogOut = Parse.User.logOut;

var patches = {
  /**
   * Attaches to the prototype of Parse.Object
   * Returns a flattened, plain object representation of the current object
   */
  toPlainObject: function() {
    return flatten(this);
  },

  /**
   * Allows a Parse.Query to be observed by a React component
   */
  subscribe: function(component, name) {
    component._registerQuery(name, this);
    return component.data[name] || [];
  },

  /**
   * Patches for Parse.User to watch for user signup / login / logout
   */
  signUp: function(attrs, options) {
    return oldSignUp.call(this, attrs, options).then(function() {
      LocalSubscriptions.currentUser.triggerUpdate();
    });
  },
  logIn: function(options) {
    return oldLogIn.call(this, options).then(function() {
      LocalSubscriptions.currentUser.triggerUpdate();
    });
  },
  _linkWith: function(provider, options) {
    return oldLinkWith.call(this, provider, options).then(function() {
      LocalSubscriptions.currentUser.triggerUpdate();
    });
  },
  logOut: function() {
    var promise = oldLogOut();
    LocalSubscriptions.currentUser.triggerUpdate();
    return promise;
  },
};

var ParsePatches = {
  applyPatches: function() {
    if (!Parse.Object.prototype.toPlainObject) {
      Parse.Object.prototype.toPlainObject = patches.toPlainObject;
    }
    if (!Parse.Query.prototype.subscribe) {
      Parse.Query.prototype.subscribe = patches.subscribe;
    }
    Parse.User.prototype.signUp = patches.signUp;
    Parse.User.prototype.logIn = patches.logIn;
    Parse.User.prototype._linkWith = patches._linkWith;
    Parse.User.logOut = patches.logOut;
  }
};

module.exports = ParsePatches;

},{"./LocalSubscriptions":4,"./StubParse":11,"./flatten":16}],10:[function(_dereq_,module,exports){
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

var equalObjects = _dereq_('./equalObjects');
var Id = _dereq_('./Id');
var Parse = _dereq_('./StubParse');

/**
 * Query Hashes are deterministic hashes for Parse Queries.
 * Any two queries that have the same set of constraints will produce the same
 * hash. This lets us reliably group components by the queries they depend upon,
 * and quickly determine if a query has changed.
 */

/**
 * Convert $or queries into an array of where conditions
 */
function flattenOrQueries(where) {
  if (!where.hasOwnProperty('$or')) {
    return where;
  }
  var accum = [];
  for (var i = 0; i < where.$or.length; i++) {
    accum = accum.concat(where.$or[i]);
  }
  return accum;
}

/**
 * Deterministically turns an object into a string. Disregards ordering
 */
function stringify(object) {
  if (typeof object !== 'object') {
    if (typeof object === 'string') {
      return '"' + object.replace(/\|/g, '%|') + '"';
    }
    return object;
  }
  if (Array.isArray(object)) {
    var copy = object.map(stringify);
    copy.sort();
    return '[' + copy.join(',') + ']';
  }
  var sections = [];
  var keys = Object.keys(object);
  keys.sort();
  for (var k = 0; k < keys.length; k++) {
    sections.push(stringify(keys[k]) + ':' + stringify(object[keys[k]]));
  }
  return '{' + sections.join(',') + '}';
}

/**
 * Generate a hash from a query, with unique fields for columns, values, order,
 * skip, and limit.
 */
function queryHash(query) {
  if (!(query instanceof Parse.Query)) {
    throw new TypeError('Only a Parse Query can be hashed');
  }
  var where = flattenOrQueries(query._where || {});
  var columns;
  var values = [];
  var i;
  if (Array.isArray(where)) {
    var uniqueColumns = {};
    for (i = 0; i < where.length; i++) {
      var subValues = {};
      var keys = Object.keys(where[i]);
      keys.sort();
      for (var j = 0; j < keys.length; j++) {
        subValues[keys[j]] = where[i][keys[j]];
        uniqueColumns[keys[j]] = true;
      }
      values.push(subValues);
    }
    columns = Object.keys(uniqueColumns);
    columns.sort();
  } else {
    columns = Object.keys(where);
    columns.sort();
    for (i = 0; i < columns.length; i++) {
      values.push(where[columns[i]]);
    }
  }

  var sections = [
    columns.join(','),
    stringify(values),
    stringify(query._include || []),
    stringify(query._order || []),
    query._limit,
    query._skip
  ];

  return query.className + ':' + sections.join('|');
}

/**
 * Extracts the className and keys from a query hash
 */
function keysFromHash(hash) {
  var classNameSplit = hash.indexOf(':');
  var className = hash.substring(0, classNameSplit);

  var columnSplit = hash.indexOf('|');
  var columnBlock = hash.substring(classNameSplit + 1, columnSplit);
  var columns = columnBlock.split(',');

  return {
    className: className,
    // When indexing a query, we place all queries without where clauses under
    // an empty string key
    keys: columns.length ? columns : ['']
  };
}

/**
 * matchesQuery -- Determines if an object would be returned by a Parse Query
 * It's a lightweight, where-clause only implementation of a full query engine.
 * Since we find queries that match objects, rather than objects that match
 * queries, we can avoid building a full-blown query tool.
 */
function matchesQuery(object, query) {
  if (query instanceof Parse.Query) {
    var className =
      (object.id instanceof Id) ? object.id.className : object.className;
    if (className !== query.className) {
      return false;
    }
    return matchesQuery(object, query._where);
  }
  for (var field in query) {
    if (!matchesKeyConstraints(object, field, query[field])) {
      return false;
    }
  }
  return true;
}

/**
 * Determines whether an object matches a single key's constraints
 */
function matchesKeyConstraints(object, key, constraints) {
  var i;
  if (key === '$or') {
    for (i = 0; i < constraints.length; i++) {
      if (matchesQuery(object, constraints[i])) {
        return true;
      }
    }
    return false;
  }
  if (key === '$relatedTo') {
    // Bail! We can't handle relational queries locally
    return false;
  }
  // Equality (or Array contains) cases
  if (typeof constraints !== 'object') {
    if (Array.isArray(object[key])) {
      return object[key].indexOf(constraints) > -1;
    }
    return object[key] === constraints;
  }
  var compareTo;
  if (constraints.__type) {
    if (constraints.__type === 'Pointer') {
      return (
        constraints.className === object[key].className &&
        constraints.objectId === object[key].objectId
      );
    }
    compareTo = Parse._decode(key, constraints);
    if (Array.isArray(object[key])) {
      for (i = 0; i < object[key].length; i++) {
        if (equalObjects(object[key][i], compareTo)) {
          return true;
        }
      }
      return false;
    }
    return equalObjects(object[key], compareTo);
  }
  // More complex cases
  for (var condition in constraints) {
    compareTo = constraints[condition];
    if (compareTo.__type) {
      compareTo = Parse._decode(key, compareTo);
    }
    switch (condition) {
      case '$lt':
        if (object[key] >= compareTo) {
          return false;
        }
        break;
      case '$lte':
        if (object[key] > compareTo) {
          return false;
        }
        break;
      case '$gt':
        if (object[key] <= compareTo) {
          return false;
        }
        break;
      case '$gte':
        if (object[key] < compareTo) {
          return false;
        }
        break;
      case '$ne':
        if (equalObjects(object[key], compareTo)) {
          return false;
        }
        break;
      case '$in':
        if (compareTo.indexOf(object[key]) < 0) {
          return false;
        }
        break;
      case '$nin':
        if (compareTo.indexOf(object[key]) > -1) {
          return false;
        }
        break;
      case '$all':
        for (i = 0; i < compareTo.length; i++) {
          if (object[key].indexOf(compareTo[i]) < 0) {
            return false;
          }
        }
        break;
      case '$exists':
        if (typeof object[key] === 'undefined') {
          return false;
        }
        break;
      case '$regex':
        if (typeof compareTo === 'object') {
          return compareTo.test(object[key]);
        }
        // JS doesn't support perl-style escaping
        var expString = '';
        var escapeEnd = -2;
        var escapeStart = compareTo.indexOf('\\Q');
        while (escapeStart > -1) {
          // Add the unescaped portion
          expString += compareTo.substring(escapeEnd + 2, escapeStart);
          escapeEnd = compareTo.indexOf('\\E', escapeStart);
          if (escapeEnd > -1) {
            expString += compareTo.substring(escapeStart + 2, escapeEnd)
              .replace(/\\\\\\\\E/g, '\\E').replace(/\W/g, '\\$&');
          }

          escapeStart = compareTo.indexOf('\\Q', escapeEnd);
        }
        expString += compareTo.substring(Math.max(escapeStart, escapeEnd + 2));
        var exp = new RegExp(expString, constraints.$options || '');
        if (!exp.test(object[key])) {
          return false;
        }
        break;
      case '$options':
        // Not a query type, but a way to add options to $regex. Ignore and
        // avoid the default
        break;
      case '$select':
        return false;
      case '$dontSelect':
        return false;
      default:
        return false;
    }
  }
  return true;
}

module.exports = {
  queryHash: queryHash,
  keysFromHash: keysFromHash,
  matchesQuery: matchesQuery
};

},{"./Id":3,"./StubParse":11,"./equalObjects":15}],11:[function(_dereq_,module,exports){
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

if ("development" === 'test') {
  require = _dereq_;
}

if (typeof Parse === 'undefined') {
  // After build, we replace `require` with `require`, so that it can use the
  // execution environment's version of require at runtime.
  if (typeof require !== 'function') {
    throw new Error('Parse + React: Parse is not defined.');
  }
  module.exports = require('parse').Parse;
} else {
  module.exports = Parse;
}
},{}],12:[function(_dereq_,module,exports){
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

var Id = _dereq_('./Id');
var ObjectStore = _dereq_('./ObjectStore');

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

if ("development" === 'test') {
  // Expose the object comparator for testing
  Subscription.compareObjectOrder = compareObjectOrder;
}

module.exports = Subscription;
},{"./Id":3,"./ObjectStore":8}],13:[function(_dereq_,module,exports){
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

var QueryTools = _dereq_('./QueryTools');
var keysFromHash = QueryTools.keysFromHash;
var queryHash = QueryTools.queryHash;
var Subscription = _dereq_('./Subscription');

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

if ("development" === 'test') {
  SubscriptionManager.indexQuery = indexQuery;
  SubscriptionManager.subscriptions = subscriptions;
  SubscriptionManager.queryFamilies = queryFamilies;
}

module.exports = SubscriptionManager;

},{"./QueryTools":10,"./Subscription":12}],14:[function(_dereq_,module,exports){
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

var Delta = _dereq_('./Delta');
var Id = _dereq_('./Id');
var LocalSubscriptions = _dereq_('./LocalSubscriptions');
var MutationExecutor = _dereq_('./MutationExecutor');
var ObjectStore = _dereq_('./ObjectStore');
var Parse = _dereq_('./StubParse');
var QueryTools = _dereq_('./QueryTools');
var SubscriptionManager = _dereq_('./SubscriptionManager');

var localCount = 0;

/**
 * issueMutation performs two important actions: it optimistically applies a
 * Mutation to the current local state (if this option is not turned off), and
 * issues the Mutation to the server. If the server request is successful, the
 * changes are committed to the local state; if not, the optimistic changes are
 * rolled back.
 */
function issueMutation(mutation, options) {
  var executionId;
  var localId;
  if (!options.waitForServer) {
    // Set up the optimistic mutation
    var subscribers = [];
    var updates;
    var latest;
    if (mutation.action === 'CREATE') {
      localId = new Id(mutation.target, 'local-' + (localCount++));
      executionId = ObjectStore.stackMutation(localId, mutation);
      latest = ObjectStore.getLatest(localId);
      updates = {
        id: localId,
        latest: latest,
        fields: Object.keys(latest)
      };
    } else {
      executionId = ObjectStore.stackMutation(mutation.target, mutation);
      subscribers = ObjectStore.fetchSubscribers(mutation.target);
      if (mutation.action === 'DESTROY') {
        updates = {
          id: mutation.target,
          latest: null,
          fields: []
        };
      } else {
        latest = ObjectStore.getLatest(mutation.target);
        updates = {
          id: mutation.target,
          latest: latest,
          fields: Object.keys(latest)
        };
      }
    }

    // Push the latest object to matching queries
    pushUpdates(subscribers, updates);
  }

  var p = new Parse.Promise();
  MutationExecutor.execute(
    mutation.action,
    mutation.target,
    mutation.data
  ).then(function(result) {
    var changes;
    var subscribers;
    var delta = mutation.generateDelta(result);
    if (!options.waitForServer) {
      // Replace the current entry with a Delta
      var stackId = (mutation.action === 'CREATE') ? localId : mutation.target;
      subscribers = ObjectStore.fetchSubscribers(stackId);
      changes = ObjectStore.resolveMutation(stackId, executionId, delta);
      p.resolve(pushUpdates(subscribers, changes));
    } else {
      // Apply it to the data store
      subscribers = ObjectStore.fetchSubscribers(mutation.target);
      changes = ObjectStore.commitDelta(delta);
      p.resolve(pushUpdates(subscribers, changes));
    }
  }, function(err) {
    if (!options.waitForServer) {
      // Roll back optimistic changes by deleting the entry from the queue
      var subscribers;
      if (mutation.action === 'CREATE') {
        // Make sure the local object is removed from any result sets
        subscribers = ObjectStore.fetchSubscribers(localId);
        for (var i = 0; i < subscribers.length; i++) {
          var subscriber = SubscriptionManager.getSubscription(subscribers[i]);
          subscriber.removeResult(localId);
        }
        ObjectStore.destroyMutationStack(localId);
      } else {
        var noop = new Delta(mutation.target, {});
        subscribers = ObjectStore.fetchSubscribers(mutation.target);
        var changes = ObjectStore.resolveMutation(
          mutation.target,
          executionId,
          noop
        );
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
  var potentials = SubscriptionManager.queriesForFields(
    changes.latest.id.className,
    changes.fields
  );
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
  issueMutation: issueMutation,
};

},{"./Delta":2,"./Id":3,"./LocalSubscriptions":4,"./MutationExecutor":7,"./ObjectStore":8,"./QueryTools":10,"./StubParse":11,"./SubscriptionManager":13}],15:[function(_dereq_,module,exports){
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

var toString = Object.prototype.toString;

/**
 * Determines whether two objects represent the same primitive, special Parse
 * type, or full Parse Object.
 */
function equalObjects(a, b) {
  if (typeof a !== typeof b) {
    return false;
  }
  if (typeof a !== 'object') {
    return (a === b);
  }
  if (a === b) {
    return true;
  }
  if (toString.call(a) === '[object Date]') {
    if (toString.call(b) === '[object Date]') {
      return (+a === +b);  
    }
    return false;
  }
  if (Array.isArray(a)) {
    if (Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }
      for (var i = 0; i < a.length; i++) {
        if (!equalObjects(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  if (Object.keys(a).length !== Object.keys(b).length) {
    return false;
  }
  for (var key in a) {
    if (!equalObjects(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

module.exports = equalObjects;

},{}],16:[function(_dereq_,module,exports){
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

var Id = _dereq_('./Id');
var Parse = _dereq_('./StubParse');

var warning = _dereq_('./warning');

/**
 * Convert a Parse Object or array of Parse Objects into a plain JS Object.
 */

function flatten(object, seen) {
  var mappedFlatten = function(el) {
    return flatten(el, seen);
  };
  if (Array.isArray(object)) {
    return object.map(mappedFlatten);
  }
  if (!(object instanceof Parse.Object)) {
    warning('Attempted to flatten something that is not a Parse Object');
    return object;
  }
  if (!Array.isArray(seen)) {
    seen = [];
  }

  seen.push(object);
  var flat = {
    id: new Id(object.className, object.id),
    className: object.className,
    objectId: object.id
  };
  if (object.createdAt) {
    flat.createdAt = object.createdAt;
  }
  if (object.updatedAt) {
    flat.updatedAt = object.updatedAt;
  }
  for (var attr in object.attributes) {
    var val = object.attributes[attr];
    if (val instanceof Parse.Object) {
      if (seen.indexOf(val) > -1) {
        throw new Error('Cannot flatten circular reference');
      }
      flat[attr] = flatten(val, seen);
    } else if (Array.isArray(val)) {
      flat[attr] = val.map(mappedFlatten);
    } else {
      flat[attr] = val;
    }
  }

  return flat;
}

module.exports = flatten;

},{"./Id":3,"./StubParse":11,"./warning":17}],17:[function(_dereq_,module,exports){
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

module.exports = ("development" === 'development') ?
  function(msg) { console.warn(msg); } : function() { };

},{}]},{},[1])(1)
});