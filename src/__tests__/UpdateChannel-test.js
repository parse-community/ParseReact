'use strict';

var MockMutationExecutor = {
  reset: function () {
    this.result = undefined;
    this.error = undefined;
  },

  execute: function(mutation, batch) {
    var p = new Parse.Promise();
    if (this.result !== undefined) {
      return Parse.Promise.as(this.result);
    }
    if (this.error !== undefined) {
      return Parse.Promise.error(this.error);
    }
    return new Parse.Promise();
  },
};

jest.mock('../MutationExecutor');
jest.setMock('../MutationExecutor', MockMutationExecutor);

jest.dontMock('parse');
jest.dontMock('../UpdateChannel');
jest.dontMock('../Id');
jest.dontMock('../Delta');
jest.dontMock('../Mutation');
jest.dontMock('../ObjectStore');
jest.dontMock('../SubscriptionManager');

var UpdateChannel = require('../UpdateChannel');
var Mutation = require('../Mutation');

var Parse = require('parse');

describe('issueMutation (pessimistic)', function() {
  beforeEach(function() {
    MockMutationExecutor.reset();
  });

  it('resolves the promise when the mutation succeeds', function() {
    MockMutationExecutor.result = {objectId: 'blabla'};
    var mutation = Mutation.Create('Klass', { value: 12 });
    var promisedResult = null;
    mutation.dispatch({waitForServer: true}).then(function(result) {
      promisedResult = result;
    }, function (error) {
      throw new Error('Should not get here.');
    });
    expect(promisedResult).not.toEqual({
      className: 'Klass',
      objectId: 'blabla',
    });
  });

  it('rejects the promise when the mutation fails', function() {
    var expectedError = MockMutationExecutor.error
        = new Error('The mutation failed.');
    var promisedError = null;
    var mutation = Mutation.Create('Klass', { value: 42 });
    mutation.dispatch({waitForServer: true}).then(function(result) {
      throw new Error('Should not get here.');
    }, function (error) {
      promisedError = error;
    });
    expect(promisedError).toBe(expectedError);
  });
});
