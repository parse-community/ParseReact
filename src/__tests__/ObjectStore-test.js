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

var Parse = require('parse');

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

  it('stores the results of inclusion queries', function() {
    var Item = Parse.Object.extend('Item');
    var results = [
      new Item({
        id: 'I1',
        value: 11,
        child: new Item({
          id: 'I2',
          value: 12
        })
      })
    ];
    var query = new Parse.Query(Item).include('child');
    ObjectStore.storeQueryResults(results, query);
    var expectedHash = queryHash(query);
    var expectedSubscribers = {};
    expectedSubscribers[expectedHash] = true;
    expect(ObjectStore._rawStore).toEqual({
      'Item:I1': {
        data: {
          id: new Id('Item', 'I1'),
          className: 'Item',
          objectId: 'I1',
          value: 11,
          child: {
            __type: 'Pointer',
            className: 'Item',
            objectId: 'I2'
          }
        },
        queries: expectedSubscribers
      },
      'Item:I2': {
        data: {
          id: new Id('Item', 'I2'),
          className: 'Item',
          objectId: 'I2',
          value: 12
        },
        queries: {}
      }
    });
    query.include('child.child');
    results[0].get('child').set('child', new Item({ id: 'I3', value: 13 }));
    ObjectStore.storeQueryResults(results, query);
    expectedHash = queryHash(query);
    expectedSubscribers[expectedHash] = true;
    expect(ObjectStore._rawStore).toEqual({
      'Item:I1': {
        data: {
          id: new Id('Item', 'I1'),
          className: 'Item',
          objectId: 'I1',
          value: 11,
          child: {
            __type: 'Pointer',
            className: 'Item',
            objectId: 'I2'
          }
        },
        queries: expectedSubscribers
      },
      'Item:I2': {
        data: {
          id: new Id('Item', 'I2'),
          className: 'Item',
          objectId: 'I2',
          value: 12,
          child: {
            __type: 'Pointer',
            className: 'Item',
            objectId: 'I3'
          }
        },
        queries: {}
      },
      'Item:I3': {
        data: {
          id: new Id('Item', 'I3'),
          className: 'Item',
          objectId: 'I3',
          value: 13
        },
        queries: {}
      }
    });

    query.include('children');
    results[0].set('children', [
      new Item({ id: 'I4', value: 14 }),
      new Item({ id: 'I5', value: 15 })
    ]);
    ObjectStore.storeQueryResults(results, query);
    expectedHash = queryHash(query);
    expectedSubscribers[expectedHash] = true;
    expect(ObjectStore._rawStore).toEqual({
      'Item:I1': {
        data: {
          id: new Id('Item', 'I1'),
          className: 'Item',
          objectId: 'I1',
          value: 11,
          child: {
            __type: 'Pointer',
            className: 'Item',
            objectId: 'I2'
          },
          children: [
            {
              __type: 'Pointer',
              className: 'Item',
              objectId: 'I4'
            },
            {
              __type: 'Pointer',
              className: 'Item',
              objectId: 'I5'
            }
          ]
        },
        queries: expectedSubscribers
      },
      'Item:I2': {
        data: {
          id: new Id('Item', 'I2'),
          className: 'Item',
          objectId: 'I2',
          value: 12,
          child: {
            __type: 'Pointer',
            className: 'Item',
            objectId: 'I3'
          }
        },
        queries: {}
      },
      'Item:I3': {
        data: {
          id: new Id('Item', 'I3'),
          className: 'Item',
          objectId: 'I3',
          value: 13
        },
        queries: {}
      },
      'Item:I4': {
        data: {
          id: new Id('Item', 'I4'),
          className: 'Item',
          objectId: 'I4',
          value: 14
        },
        queries: {}
      },
      'Item:I5': {
        data: {
          id: new Id('Item', 'I5'),
          className: 'Item',
          objectId: 'I5',
          value: 15
        },
        queries: {}
      }
    });

  });

  it('fetches objects to fill pointer values', function() {
    var Item = Parse.Object.extend('Item');
    var results = [
      new Item({
        id: 'I1',
        value: 11,
        child: new Item({
          id: 'I2',
          value: 12
        })
      })
    ];
    var query = new Parse.Query(Item).include('child');
    ObjectStore.storeQueryResults(results, query);
    expect(ObjectStore.deepFetch(new Id('Item', 'I1'))).toEqual({
      id: new Id('Item', 'I1'),
      className: 'Item',
      objectId: 'I1',
      value: 11,
      child: {
        id: new Id('Item', 'I2'),
        className: 'Item',
        objectId: 'I2',
        value: 12
      }
    });

    var child = new Item({
      id: 'I2',
      value: 12
    });
    var parent = new Item({
      id: 'I1',
      value: 11,
      child: child
    });
    child.set('parent', parent);
    query = new Parse.Query(Item).include('child.parent');
    ObjectStore.storeQueryResults([parent], query);
    expect(ObjectStore.deepFetch(new Id('Item', 'I1'))).toEqual({
      id: new Id('Item', 'I1'),
      className: 'Item',
      objectId: 'I1',
      value: 11,
      child: {
        id: new Id('Item', 'I2'),
        className: 'Item',
        objectId: 'I2',
        value: 12,
        parent: {
          __type: 'Pointer',
          className: 'Item',
          objectId: 'I1'
        }
      }
    });

    results = new Item({
      id: 'I1',
      value: 11,
      children: [
        new Item({
          id: 'I2',
          value: 12
        }),
        new Item({
          id: 'I3',
          value: 13
        })
      ]
    });
    query = new Parse.Query(Item).include('children');
    ObjectStore.storeQueryResults(results, query);
    expect(ObjectStore.deepFetch(new Id('Item', 'I1'))).toEqual({
      id: new Id('Item', 'I1'),
      className: 'Item',
      objectId: 'I1',
      value: 11,
      children: [
        {
          id: new Id('Item', 'I2'),
          className: 'Item',
          objectId: 'I2',
          value: 12
        },
        {
          id: new Id('Item', 'I3'),
          className: 'Item',
          objectId: 'I3',
          value: 13
        }
      ]
    });

  });

  it('supplies data for all pointers that exist at the same depth', function() {
    var Item = Parse.Object.extend('Item');
    var child = new Item({
      id: 'I2',
      value: 12
    });
    var parent = new Item({
      id: 'I1',
      value: 11,
      childA: child,
      childB: child
    });
    var query = new Parse.Query(Item).include('childA,childB');
    ObjectStore.storeQueryResults([parent, child], query);
    expect(ObjectStore.deepFetch(new Id('Item', 'I1'), [])).toEqual({
      id: new Id('Item', 'I1'),
      className: 'Item',
      objectId: 'I1',
      value: 11,
      childA: {
        id: new Id('Item', 'I2'),
        className: 'Item',
        objectId: 'I2',
        value: 12
      },
      childB: {
        id: new Id('Item', 'I2'),
        className: 'Item',
        objectId: 'I2',
        value: 12
      }
    });
  });

  it('handles empty pointers when queries include multiple layers', function() {
    var Item = Parse.Object.extend('Item');
    var results = [
      new Item({
        id: 'I1',
        value: 11
      })
    ];
    var query = new Parse.Query(Item).include('child.child');
    ObjectStore.storeQueryResults(results, query);
    expect(ObjectStore.deepFetch(new Id('Item', 'I1'))).toEqual({
      id: new Id('Item', 'I1'),
      className: 'Item',
      objectId: 'I1',
      value: 11
    });
  });

  it('handles `null` values', function() {
    var Item = Parse.Object.extend('Item');
    var results = [
      new Item({
        id: 'I1',
        value: null
      })
    ];
    var query = new Parse.Query(Item);
    ObjectStore.storeQueryResults(results, query);
    expect(ObjectStore.deepFetch(new Id('Item', 'I1'))).toEqual({
      id: new Id('Item', 'I1'),
      className: 'Item',
      objectId: 'I1',
      value: null
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
