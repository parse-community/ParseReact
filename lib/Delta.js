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

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var Id = require('./Id');

/**
 * A Delta represents a change that has been verified by the server, but has
 * not yet been merged into the "Last True State" (typically because some
 * outstanding Mutation preceeded it).
 * Deltas are stacked on top of State to determine the copies of objects that
 * are pushed to components.
 */

var Delta = (function () {
  function Delta(id, data, options) {
    _classCallCheck(this, Delta);

    this.__initializeProperties();

    if (!(id instanceof Id)) {
      throw new TypeError('Cannot create a Delta with an invalid target Id');
    }
    this.id = id;
    if (options && options.destroy) {
      this.map = {};
      this.destroy = true;
    } else {
      this.map = {};
      for (var attr in data) {
        if (attr !== 'objectId') {
          this.map[attr] = data[attr];
        }
      }
    }
  }

  _createClass(Delta, [{
    key: 'merge',

    /**
     * Merge changes from another Delta into this one, overriding where necessary
     */
    value: function merge(source) {
      if (!(source instanceof Delta)) {
        throw new TypeError('Only Deltas can be merged');
      }
      if (this.id.toString() !== source.id.toString()) {
        throw new Error('Only Deltas for the same Object can be merged');
      }
      if (source.destroy) {
        this.map = {};
        this.destroy = true;
      }
      if (this.destroy) {
        return;
      }
      for (var attr in source.map) {
        this.map[attr] = source.map[attr];
      }

      return this;
    }
  }, {
    key: '__initializeProperties',
    value: function __initializeProperties() {
      this.id = undefined;
      this.map = undefined;
      this.destroy = undefined;
    }
  }]);

  return Delta;
})();

module.exports = Delta;