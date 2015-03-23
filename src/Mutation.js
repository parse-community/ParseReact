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

var Id = require('./Id');
var Delta = require('./Delta');
var UpdateChannel = require('./UpdateChannel');

var warning = require('./warning');

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
