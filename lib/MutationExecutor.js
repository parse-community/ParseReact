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
var Parse = require('./StubParse');

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
    return data.map(function (val) {
      return encode(val, seen);
    });
  }
  if (toString.call(data) === '[object Date]') {
    return { __type: 'Date', iso: data.toJSON() };
  }
  if (data instanceof Id || data instanceof Parse.Object) {
    var id = data instanceof Id ? data.objectId : data.id;
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
  return Parse._request(options).then(function (result) {
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
  var className = typeof target === 'string' ? target : target.className;
  var objectId = typeof target === 'string' ? '' : target.objectId;
  var payload;
  switch (action) {
    case 'CREATE':
      return request({
        method: 'POST',
        route: 'classes',
        className: className,
        data: encode(data)
      });
    case 'DESTROY':
      return request({
        method: 'DELETE',
        route: 'classes',
        className: className,
        objectId: objectId
      });
    case 'SET':
      return request({
        method: 'PUT',
        route: 'classes',
        className: className,
        objectId: objectId,
        data: encode(data)
      });
    case 'UNSET':
      payload = {};
      payload[data] = { __op: 'Delete' };
      return request({
        method: 'PUT',
        route: 'classes',
        className: className,
        objectId: objectId,
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
        className: className,
        objectId: objectId,
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
        className: className,
        objectId: objectId,
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
        className: className,
        objectId: objectId,
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
        className: className,
        objectId: objectId,
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
        className: className,
        objectId: objectId,
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
        className: className,
        objectId: objectId,
        data: payload
      });
  }
  throw new TypeError('Invalid Mutation action: ' + action);
}

var MutationExecutor = {
  execute: execute };

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  MutationExecutor.encode = encode;
}

module.exports = MutationExecutor;