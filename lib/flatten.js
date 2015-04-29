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
var Parse = require('./StubParse');
var warning = require('./warning');

function mappedFlatten(el) {
  if (el instanceof Parse.Object) {
    return {
      __type: 'Pointer',
      className: el.className,
      objectId: el.id
    };
  }
  return flatten(el);
}

/**
 * Convert a Parse Object or array of Parse Objects into a plain JS Object.
 */

function flatten(object) {
  if (Array.isArray(object)) {
    return object.map(mappedFlatten);
  }
  if (!(object instanceof Parse.Object)) {
    warning('Attempted to flatten something that is not a Parse Object');
    return object;
  }

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
      // We replace it with a pointer
      flat[attr] = mappedFlatten(val);
    } else if (Array.isArray(val)) {
      flat[attr] = val.map(mappedFlatten);
    } else {
      flat[attr] = val;
    }
  }

  return flat;
}

module.exports = flatten;