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
