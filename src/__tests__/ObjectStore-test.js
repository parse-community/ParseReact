'use strict';

jest.dontMock('parse');

jest.dontMock('../flatten');
jest.dontMock('../Id');
jest.dontMock('../Mutation');
jest.dontMock('../ObjectStore');
jest.dontMock('../QueryTools');
jest.dontMock('../StubParse');

var Id = require('../Id');
var Mutation = require('../Mutation');
var ObjectStore = require('../ObjectStore');
var queryHash = require('../QueryTools').queryHash;

var Parse = require('parse').Parse;

describe('Object storage', function() {
  afterEach(function() {
    var keys = Object.keys(ObjectStore._rawStore);
    for (var i = 0; i < keys.length; i++) {
      delete ObjectStore._rawStore[keys[i]];
    }
  });

  it('can store individual objects', function() {
    var id = ObjectStore.storeObject({
      id: new Id('Item', 'O1'),
      value: 11
    });
    expect(id).toEqual(new Id('Item', 'O1'));
    expect(ObjectStore._rawStore).toEqual({
      'Item:O1': {
        data: {
          id: new Id('Item', 'O1'),
          value: 11
        },
        queries: {}
      }
    });

    id = ObjectStore.storeObject({
      id: new Id('Item', 'O2'),
      value: 12
    });
    expect(id).toEqual(new Id('Item', 'O2'));
    expect(ObjectStore._rawStore).toEqual({
      'Item:O1': {
        data: {
          id: new Id('Item', 'O1'),
          value: 11
        },
        queries: {}
      },
      'Item:O2': {
        data: {
          id: new Id('Item', 'O2'),
          value: 12
        },
        queries: {}
      }
    });

    id = ObjectStore.storeObject({
      id: new Id('Item', 'O1'),
      value: 21,
      message: 'Blackjack!'
    });
    expect(id).toEqual(new Id('Item', 'O1'));
    expect(ObjectStore._rawStore).toEqual({
      'Item:O1': {
        data: {
          id: new Id('Item', 'O1'),
          value: 21,
          message: 'Blackjack!'
        },
        queries: {}
      },
      'Item:O2': {
        data: {
          id: new Id('Item', 'O2'),
          value: 12
        },
        queries: {}
      }
    });
  });

  it('can remove individual objects', function() {
    var id = ObjectStore.storeObject({
      id: new Id('Item', 'O1'),
      value: 11
    });
    expect(ObjectStore._rawStore).toEqual({
      'Item:O1': {
        data: {
          id: new Id('Item', 'O1'),
          value: 11
        },
        queries: {}
      }
    });
    var sub = ObjectStore.removeObject(new Id('Item', 'O2'));
    expect(sub).toEqual([]);
    expect(ObjectStore._rawStore).toEqual({
      'Item:O1': {
        data: {
          id: new Id('Item', 'O1'),
          value: 11
        },
        queries: {}
      }
    });
    sub = ObjectStore.removeObject(id);
    expect(sub).toEqual([]);
    expect(ObjectStore._rawStore).toEqual({});
  });

  it('can add subscribers to an object', function() {
    var id = ObjectStore.storeObject({
      id: new Id('Item', 'O1'),
      value: 11
    });
    ObjectStore.addSubscriber(id, 'hash');
    expect(ObjectStore._rawStore).toEqual({
      'Item:O1': {
        data: {
          id: new Id('Item', 'O1'),
          value: 11
        },
        queries: {
          hash: true
        }
      }
    });
    expect(ObjectStore.fetchSubscribers(id)).toEqual(['hash']);

    id = new Id('Item', 'O1');
    ObjectStore.addSubscriber(id, 'hash2');
    expect(ObjectStore._rawStore).toEqual({
      'Item:O1': {
        data: {
          id: new Id('Item', 'O1'),
          value: 11
        },
        queries: {
          hash: true,
          hash2: true,
        }
      }
    });
    expect(ObjectStore.fetchSubscribers(id)).toEqual(['hash', 'hash2']);
    id = new Id('Item', 'O2');
    expect(ObjectStore.fetchSubscribers(id)).toEqual([]);
  });

  it('can remove subscribers from an object', function() {
    var id = ObjectStore.storeObject({
      id: new Id('Item', 'O1'),
      value: 11
    });
    ObjectStore.addSubscriber(id, 'hash');
    ObjectStore.addSubscriber(id, 'hash2');
    ObjectStore.addSubscriber(id, 'hash3');
    expect(ObjectStore._rawStore).toEqual({
      'Item:O1': {
        data: {
          id: new Id('Item', 'O1'),
          value: 11
        },
        queries: {
          hash: true,
          hash2: true,
          hash3: true
        }
      }
    });

    ObjectStore.removeSubscriber(id, 'hash3');
    expect(ObjectStore.fetchSubscribers(id)).toEqual(['hash', 'hash2']);

    expect(ObjectStore.removeSubscriber.bind(null, id, 'hash4')).not.toThrow();
  });

  it('can store Parse Objects', function() {
    var Item = Parse.Object.extend('Item');
    var items = [
      new Item({ id: 'O1', value: 11 }),
      new Item({ id: 'O2', value: 12 }),
      new Item({ id: 'O3', value: 13 })
    ];
    var ids = ObjectStore.storeQueryResults(items, new Parse.Query(Item));
    var expectedHash = queryHash(new Parse.Query(Item));
    var expectedSubscribers = {};
    expectedSubscribers[expectedHash] = true;
    expect(ids).toEqual([
      new Id('Item', 'O1'),
      new Id('Item', 'O2'),
      new Id('Item', 'O3')
    ]);
    expect(ObjectStore._rawStore).toEqual({
      'Item:O1': {
        data: {
          id: new Id('Item', 'O1'),
          className: 'Item',
          objectId: 'O1',
          value: 11
        },
        queries: expectedSubscribers
      },
      'Item:O2': {
        data: {
          id: new Id('Item', 'O2'),
          className: 'Item',
          objectId: 'O2',
          value: 12
        },
        queries: expectedSubscribers
      },
      'Item:O3': {
        data: {
          id: new Id('Item', 'O3'),
          className: 'Item',
          objectId: 'O3',
          value: 13
        },
        queries: expectedSubscribers
      }
    });
  });

  it('can fetch multiple objects as shallow copies', function() {
    var Item = Parse.Object.extend('Item');
    var items = [
      new Item({ id: 'O1', value: 11 }),
      new Item({ id: 'O2', value: 12 }),
      new Item({ id: 'O3', value: 13 })
    ];
    var ids = ObjectStore.storeQueryResults(items, new Parse.Query(Item));
    ids.shift();
    expect(ObjectStore.getDataForIds(ids)).toEqual([
      {
        id: new Id('Item', 'O2'),
        className: 'Item',
        objectId: 'O2',
        value: 12
      },
      {
        id: new Id('Item', 'O3'),
        className: 'Item',
        objectId: 'O3',
        value: 13
      }
    ]);
  });
});

describe('Mutation storage', function() {
  afterEach(function() {
    var keys = Object.keys(ObjectStore._rawStore);
    var i;
    for (i = 0; i < keys.length; i++) {
      delete ObjectStore._rawStore[keys[i]];
    }
    keys = Object.keys(ObjectStore._rawMutations);
    for (i = 0; i < keys.length; i++) {
      delete ObjectStore._rawMutations[keys[i]];
    }
  });

  it('can stack and apply Mutations for an object', function() {
    var id = new Id('Player', 'O1');
    ObjectStore.storeObject({
      id: id,
      name: 'Player 1'
    });
    var updatedAt = new Date();
    ObjectStore.stackMutation(id, Mutation.Set(id, { score: 12 }), updatedAt);
    ObjectStore.stackMutation(id, Mutation.Set(id, { score: 14 }), updatedAt);
    ObjectStore.stackMutation(id, Mutation.Set(id, {
      score: 16, message: 'High score'
    }), updatedAt);

    expect(ObjectStore._rawMutations[id]).toEqual([
      {
        payloadId: 0,
        date: updatedAt,
        mutation: Mutation.Set(id, { score: 12 })
      },
      {
        payloadId: 1,
        date: updatedAt,
        mutation: Mutation.Set(id, { score: 14 })
      },
      {
        payloadId: 2,
        date: updatedAt,
        mutation: Mutation.Set(id, {
          score: 16, message: 'High score'
        })
      },
    ]);

    expect(ObjectStore.getLatest(id)).toEqual({
      id: id,
      name: 'Player 1',
      score: 16,
      message: 'High score',
      updatedAt: updatedAt
    });

    id = ObjectStore.storeObject({
      id: new Id('Player', 'O2'),
      name: 'Player 2',
      score: 0,
      updatedAt: updatedAt
    });
    expect(ObjectStore.getLatest(id)).toEqual({
      id: id,
      name: 'Player 2',
      score: 0,
      updatedAt: updatedAt
    });
  });

  it('can handle a Create Mutation on a stack', function() {
    var id = new Id('Player', 'local-0');
    var createdAt = new Date();
    ObjectStore.stackMutation(
      id,
      Mutation.Create('Player', { score: 12 }),
      createdAt
    );
    expect(ObjectStore._rawMutations[id]).toEqual([
      {
        payloadId: 3,
        mutation: Mutation.Create('Player', { score: 12 }),
        date: createdAt
      }
    ]);
  });

  it('can handle a stack containing a Destroy Mutation', function() {
    var id = new Id('Player', 'O1');
    ObjectStore.storeObject({
      id: id,
      name: 'Player 1'
    });
    
    var updatedAt = new Date();
    ObjectStore.stackMutation(
      id,
      Mutation.Destroy(id, { score: 12 }),
      updatedAt
    );
    expect(ObjectStore._rawMutations[id]).toEqual([
      {
        payloadId: 4,
        mutation: Mutation.Destroy(id, { score: 12 }),
        date: updatedAt
      }
    ]);
    expect(ObjectStore.getLatest(id)).toBe(null);
  });
});