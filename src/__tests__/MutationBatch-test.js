'use strict';

jest.dontMock('parse');
jest.dontMock('../MutationBatch');
jest.dontMock('../StubParse');

var MutationBatch = require('../MutationBatch');
var Parse = require('parse').Parse;
Parse.initialize('testid', 'testkey');

var testXHR = function(urlTest, bodyTest, status, response) {
  var XHR = function() { };
  XHR.prototype = {
    open: function(method, url) {
      urlTest(method, url);
    },
    setRequestHeader: function() { },
    send: function(body) {
      bodyTest(body);
      this.status = status;
      this.responseText = JSON.stringify(response || {});
      this.readyState = 4;
      this.onreadystatechange();
    }
  };
  return XHR;
};

describe('MutationBatch', function() {

  it('reports number of requests being batched', function() {
    var batch = new MutationBatch();
    expect(batch.getNumberOfRequests()).toBe(0);
    batch.addRequest({
      method: 'DELETE',
      route: 'classes',
      className: 'MadeUpClassName',
      objectId: 'randomId',
    });
    expect(batch.getNumberOfRequests()).toBe(1);
  });

  it('accepts a maximum number of requests', function() {
    var batch = new MutationBatch();
    for (var i = 0; i < MutationBatch.maxBatchSize; i++) {
      batch.addRequest({
        method: 'DELETE',
        route: 'classes',
        className: 'MadeUpClassName',
        objectId: 'randomId_' + i,
      });
    }
    expect(function() {
      batch.addRequest({
        method: 'DELETE',
        route: 'classes',
        className: 'MadeUpClassName',
        objectId: 'onetoomany',
      });
    }).toThrow();
  });

  it('dispatches requests in one batch and resolves promises', function() {
    var batch = new MutationBatch();
    var firstPromise = batch.addRequest({
      method: 'DELETE',
      route: 'classes',
      className: 'MadeUpClassName',
      objectId: 'randomId',
    });
    var secondPromise = batch.addRequest({
      method: 'CREATE',
      route: 'classes',
      className: 'MadeUpClassName',
      data: {some: 'fields', and: 'stuff'},
    });
    var thirdPromise = batch.addRequest({
      method: 'SET',
      route: 'classes',
      className: 'MadeUpClassName',
      objectId: 'non_existent',
      data: {cant: 'touch', this_: 'duuh duhduhduh dummm duh duh'},
    });

    var firstPromiseResult = null;
    var secondPromiseResult = null;
    var thirdPromiseResult = null;
    var thirdPromiseError = null;
    var expectedFirstResult = {first: 'result'};
    var expectedSecondResult = {second: 'result'};
    var expectedThirdError = {why: 'did', you: 'touch this?'};
    firstPromise.then(
      function(result) { firstPromiseResult = result; },
      function(error) { throw error; }
    );
    secondPromise.then(
      function(result) { secondPromiseResult = result; },
      function(error) { throw error; }
    );
    thirdPromise.then(
      function(result) { thirdPromiseResult = result; },
      function(error) { thirdPromiseError = error; }
    );

    Parse.XMLHttpRequest = testXHR(function(method, url) {
      expect(method).toBe('POST');
      expect(url).toBe('https://api.parse.com/1/batch');
    }, function(body) {
      var requests = JSON.parse(body).requests;
      expect(requests).toEqual({
        0: {
          method: 'DELETE',
          path: '/1/classes/MadeUpClassName/randomId',
        },
        1: {
          method: 'CREATE',
          path: '/1/classes/MadeUpClassName',
          body: {
            some: 'fields',
            and: 'stuff',
          },
        },
        2: {
          method: 'SET',
          path: '/1/classes/MadeUpClassName/non_existent',
          body: {
            cant: 'touch',
            this_: 'duuh duhduhduh dummm duh duh',
          },
        },
      });
    }, 200, [
      {success: expectedFirstResult},
      {success: expectedSecondResult},
      {error: expectedThirdError},
    ]);
    var batchPromiseResolved = false;
    batch.dispatch().then(function() { batchPromiseResolved = true; });

    expect(firstPromiseResult).toEqual(expectedFirstResult);
    expect(secondPromiseResult).toEqual(expectedSecondResult);
    expect(thirdPromiseResult).toBe(null);
    expect(thirdPromiseError).toEqual(expectedThirdError);
    expect(batchPromiseResolved).toBe(true);

    // Once dispatched, the batch cannot be dispatched or aborted anymore.
    expect(function() { batch.dispatch(); }).toThrow();
    expect(function() { batch.abort(); }).toThrow();
  });

  it('rejects promises when the entire request fails', function() {
    Parse.XMLHttpRequest = testXHR(
      function() {},
      function() {},
      418
    );

    var batch = new MutationBatch();
    var firstPromise = batch.addRequest({
      method: 'DELETE',
      route: 'classes',
      className: 'MadeUpClassName',
      objectId: 'randomId',
    });
    var secondPromise = batch.addRequest({
      method: 'CREATE',
      route: 'classes',
      className: 'MadeUpClassName',
      data: {some: 'fields', and: 'stuff'},
    });

    var firstPromiseResult = null;
    var firstPromiseError = null;
    var secondPromiseResult = null;
    var secondPromiseError = null;
    firstPromise.then(
      function(result) { firstPromiseResult = result; },
      function(error) { firstPromiseError = error; }
    );
    secondPromise.then(
      function(result) { secondPromiseResult = result; },
      function(error) { secondPromiseError = error; }
    );
    var batchPromiseSuccess = false;
    var batchPromiseError = null;
    batch.dispatch().then(
      function() { batchPromiseSuccess = true; },
      function(error) { batchPromiseError = error; }
    );

    expect(firstPromiseResult).toBe(null);
    expect(secondPromiseResult).toBe(null);
    expect(firstPromiseError).toBe(secondPromiseError);
    expect(batchPromiseError).toBe(firstPromiseError);
    expect(batchPromiseSuccess).toBe(false);

    // Once dispatched, the batch cannot be dispatched or aborted anymore.
    expect(function() { batch.dispatch(); }).toThrow();
    expect(function() { batch.abort(); }).toThrow();
  });

  it('rejects promises when the mutation is aborted', function() {
    var batch = new MutationBatch();
    var firstPromise = batch.addRequest({
      method: 'DELETE',
      route: 'classes',
      className: 'MadeUpClassName',
      objectId: 'randomId',
    });
    var secondPromise = batch.addRequest({
      method: 'CREATE',
      route: 'classes',
      className: 'MadeUpClassName',
      data: {some: 'fields', and: 'stuff'},
    });

    var firstPromiseResult = null;
    var firstPromiseError = null;
    var secondPromiseResult = null;
    var secondPromiseError = null;
    firstPromise.then(
      function(result) { firstPromiseResult = result; },
      function(error) { firstPromiseError = error; }
    );
    secondPromise.then(
      function(result) { secondPromiseResult = result; },
      function(error) { secondPromiseError = error; }
    );
    batch.abort()

    expect(firstPromiseResult).toBe(null);
    expect(secondPromiseResult).toBe(null);
    expect(firstPromiseError instanceof Error).toBe(true);
    expect(secondPromiseError instanceof Error).toBe(true);

    // Once aborted, the batch cannot be dispatched or aborted anymore.
    expect(function() { batch.dispatch(); }).toThrow();
    expect(function() { batch.abort(); }).toThrow();
  });

});
