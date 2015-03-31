'use strict';

jest.dontMock('parse');

jest.dontMock('../QueryTools');
jest.dontMock('../StubParse');
jest.dontMock('../Subscription');
jest.dontMock('../SubscriptionManager');

var QueryTools = require('../QueryTools');
var queryHash = QueryTools.queryHash;
var Subscription = require('../Subscription');
var SubscriptionManager = require('../SubscriptionManager');

var Parse = require('parse').Parse;

describe('SubscriptionManager', function() {
  it('can index or retrieve a query by its keys', function() {
    var q = new Parse.Query('Player');
    q.equalTo('name', 'Player 1');
    q.greaterThan('score', 50);
    var hash = queryHash(q);
    SubscriptionManager.indexQuery(q, hash);
    var hashValue = {};
    hashValue[hash] = true;
    expect(SubscriptionManager.queryFamilies).toEqual({
      Player: {
        name: hashValue,
        score: hashValue
      }
    });

    var mergedHashValue = {};
    mergedHashValue[hash] = true;
    q = new Parse.Query('Player');
    q.equalTo('name', 'Player 2');
    q.lessThan('createdAt', new Date());
    var secondHash = queryHash(q);
    var secondHashValue = {};
    secondHashValue[secondHash] = true;
    mergedHashValue[secondHash] = true;
    SubscriptionManager.indexQuery(q, secondHash);
    expect(SubscriptionManager.queryFamilies).toEqual({
      Player: {
        name: mergedHashValue,
        score: hashValue,
        createdAt: secondHashValue
      }
    });

    q = new Parse.Query('Player');
    var emptyHash = queryHash(q);
    var emptyHashValue = {};
    emptyHashValue[emptyHash] = true;
    SubscriptionManager.indexQuery(q, emptyHash);
    expect(SubscriptionManager.queryFamilies).toEqual({
      Player: {
        name: mergedHashValue,
        score: hashValue,
        createdAt: secondHashValue,
        '': emptyHashValue
      }
    });

    var queries = SubscriptionManager.queriesForFields('Item', ['createdAt']);
    expect(queries).toEqual([]);
    queries = SubscriptionManager.queriesForFields('Player', ['name']);
    var expected = [hash, secondHash, emptyHash];
    expected.sort();
    queries.sort();
    expect(expected).toEqual(queries);

    queries = SubscriptionManager.queriesForFields('Player', ['score']);
    expected = [hash, emptyHash];
    expected.sort();
    queries.sort();
    expect(expected).toEqual(queries);

    queries = SubscriptionManager.queriesForFields('Player', ['updatedAt']);
    expected = [emptyHash];
    expect(expected).toEqual(queries);

    SubscriptionManager.queryFamilies = {};
  });

  it('can subscribe or unsubscribe to a query', function() {
    Subscription.prototype.addSubscriber = jest.genMockFn();
    Subscription.prototype.removeSubscriber = function() {
      return 0;
    };
    var cb = jest.genMockFn();
    var q = new Parse.Query('Comment');
    SubscriptionManager.subscribeQuery(cb, 'comments', q);

    var sub = SubscriptionManager.getSubscription(queryHash(q));
    expect(sub).not.toBe(null);
    expect(sub.addSubscriber.mock.calls.length).toBe(1);

    SubscriptionManager.unsubscribeQuery(queryHash(q), cb);
    sub = SubscriptionManager.getSubscription(queryHash(q));
    expect(sub).toBe(null);
  });
});