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

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Parse = require('./StubParse');

var MutationBatch = (function () {
  function MutationBatch() {
    _classCallCheck(this, MutationBatch);

    this._aborted = false;
    this._dispatched = false;
    this._requests = [];
    this._promises = [];
  }

  _createClass(MutationBatch, [{
    key: 'getNumberOfRequests',
    value: function getNumberOfRequests() {
      return this._requests.length;
    }
  }, {
    key: 'addRequest',
    value: function addRequest(options) {
      if (this._aborted || this._dispatched) {
        throw new Error('Cannot add a request to aborted or dispatched batch.');
      }
      if (this.getNumberOfRequests() === MutationBatch.maxBatchSize) {
        throw new Error('Cannot batch more than ' + MutationBatch.maxBatchSize + ' requests at a time.');
      }
      var promise = new Parse.Promise();
      this._requests.push(options);
      this._promises.push(promise);
      return promise;
    }
  }, {
    key: 'dispatch',
    value: function dispatch() {
      var _this = this;

      if (this._aborted || this._dispatched) {
        throw new Error('Cannot dispatch an already dispatched or aborted batch.');
      }
      this._dispatched = true;
      var requests = this._requests.map(function (req) {
        var path = '/1/' + req.route;
        if (req.className) {
          path += '/' + req.className;
        }
        if (req.objectId) {
          path += '/' + req.objectId;
        }
        return {
          method: req.method,
          path: path,
          body: req.data };
      });
      var batchRequest = {
        method: 'POST',
        route: 'batch',
        data: { requests: requests } };
      return Parse._request(batchRequest).then(function (response) {
        _this._requests.forEach(function (req, i) {
          var result = response[i];
          var promise = _this._promises[i];
          if (result.success) {
            promise.resolve(result.success);
          } else if (result.error) {
            promise.reject(result.error);
          }
        });
      }, function (error) {
        _this._promises.forEach(function (promise) {
          return promise.reject(error);
        });
        return Parse.Promise.error(error);
      });
    }
  }, {
    key: 'abort',
    value: function abort() {
      this._aborted = true;
      var error = new Error('Batch was aborted.');
      this._promises.forEach(function (promise) {
        return promise.reject(error);
      });
    }
  }]);

  return MutationBatch;
})();

MutationBatch.maxBatchSize = 50;

module.exports = MutationBatch;