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

var Parse = require('./StubParse');

import type { ParseRequestOptions } from './MutationExecutor';

class MutationBatch {
  static maxBatchSize: number;

  _requests: Array<ParseRequestOptions>;
  _promises: Array<Parse.Promise>;
  addRequest: (options: ParseRequestOptions) => Parse.Promise;

  constructor() {
    this._requests = [];
    this._promises = [];
    this.addRequest = this.addRequest.bind(this);
  }

  getNumberOfRequests(): number {
    return this._requests.length;
  }

  addRequest(options: ParseRequestOptions): Parse.Promise {
    if (this.getNumberOfRequests() === MutationBatch.maxBatchSize) {
      throw new Error('Cannot batch more than ' + MutationBatch.maxBatchSize +
        ' requests at a time.');
    }
    var promise = new Parse.Promise();
    this._requests.push(options);
    this._promises.push(promise);
    return promise;
  }

  dispatch(): Parse.Promise {
    var requests = this._requests.map((req) => {
      var path = '/1/' + req.route;
      if (req.className) {
        path += '/' + req.className;
      }
      if (req.objectId) {
        path += '/' + req.objectId
      }
      return {
        method: req.method,
        path: path,
        body: req.data,
      };
    });
    var batchRequest = {
      method: 'POST',
      route: 'batch',
      data: {requests},
    };
    return Parse._request(batchRequest).then((response) => {
      this._requests.forEach((req, i) => {
        var result = response[i];
        var promise = this._promises[i];
        if (result.success) {
          promise.resolve(result.success);
        } else if (result.error) {
          promise.reject(result.error);
        }
      });
    }, (error) => {
      this._promises.forEach((promise) => promise.reject(error));
      return Parse.Promise.error(error);
    });
  }
}
MutationBatch.maxBatchSize = 50;

module.exports = MutationBatch;
