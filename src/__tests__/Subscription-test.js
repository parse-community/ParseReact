'use strict';

jest.mock('../ObjectStore');
var fakeStore = {};
jest.setMock('../ObjectStore', {
  getDataForIds: function(ids) {
    var data = [];
    for (var i = 0; i < ids.length; i++) {
      data.push(fakeStore[ids[i]]);
    }
    return data;
  },
  storeQueryResults: function(results) {
    var ids = [];
    for (var i = 0; i < results.length; i++) {
      var id = new Id(results[i].className, results[i].id);
      fakeStore[id] = {
        className: results[i].className,
        objectId: results[i].id,
        value: results[i].get('value')
      };
      ids.push(id);
    }
    return ids;
  }
});

jest.dontMock('../Id');
jest.dontMock('../QueryTools');
jest.dontMock('../StubParse');
jest.dontMock('../Subscription');
jest.dontMock('../ParsePatches');

jest.dontMock('parse');

var Id = require('../Id');
var Subscription = require('../Subscription');

var Parse = require('parse').Parse;
require('../ParsePatches').applyPatches();

describe('compareObjectOrder', function() {
  it('can compare a single condition', function() {
    var order = ['votes'];
    var object = {
      className: 'Candidate',
      objectId: 'C1',
      votes: 12
    };
    var orderInfo = {
      votes: 10
    };

    expect(Subscription.compareObjectOrder(order, object, orderInfo)).toBe(1);

    orderInfo.votes = 20;
    expect(Subscription.compareObjectOrder(order, object, orderInfo)).toBe(-1);

    order[0] = '-votes';
    expect(Subscription.compareObjectOrder(order, object, orderInfo)).toBe(1);

    object.votes = 20;
    expect(Subscription.compareObjectOrder(order, object, orderInfo)).toBe(0);
  });

  it('can compare multiple conditions', function() {
    var order = ['-votes', 'name'];
    var object = {
      className: 'Candidate',
      objectId: 'C1',
      votes: 12,
      name: 'Aaron'
    };
    var orderInfo = {
      votes: 10,
      name: 'Zander'
    };

    expect(Subscription.compareObjectOrder(order, object, orderInfo)).toBe(-1);

    orderInfo.votes = 20;
    expect(Subscription.compareObjectOrder(order, object, orderInfo)).toBe(1);

    orderInfo.votes = 12;
    expect(Subscription.compareObjectOrder(order, object, orderInfo)).toBe(-1);
  });
});

describe('Subscription', function() {
  it('begins to fetch the query on construction', function() {
    var q = new Parse.Query('Item');
    q.find = jest.genMockFn();
    q.find.mockReturnValue(new Parse.Promise());
    var sub = new Subscription(q);
    expect(sub.originalQuery).toBe(q);
    expect(q.find.mock.calls.length).toBe(1);
  });

  it('can add or remove unique subscribers', function() {
    var q = new Parse.Query('Item');
    q.find = jest.genMockFn();
    q.find.mockReturnValue(new Parse.Promise());
    var sub = new Subscription(q);

    expect(sub.subscribers).toEqual([]);
    var mockNext = jest.genMockFn();
    var oid1 = sub.addSubscriber({ onNext: mockNext });
    var expectedSubscribers = {};
    expectedSubscribers[oid1] = { onNext: mockNext };
    expect(sub.subscribers).toEqual(expectedSubscribers);

    var oid2 = sub.addSubscriber({ onNext: mockNext });
    expectedSubscribers[oid2] = { onNext: mockNext };
    expect(sub.subscribers).toEqual(expectedSubscribers);

    var remaining = sub.removeSubscriber('NOT_VALID_OID');
    expect(remaining).toBe(2);
    expect(sub.subscribers).toEqual(expectedSubscribers);

    remaining = sub.removeSubscriber(oid1);
    expect(remaining).toBe(1);
    delete expectedSubscribers[oid1];
    expect(sub.subscribers).toEqual(expectedSubscribers);

    remaining = sub.removeSubscriber(oid2);
    expect(remaining).toBe(0);
    expect(sub.subscribers).toEqual({});
  });

  it('can add and remove objects from the result set', function() {
    var q = new Parse.Query('Item');
    q.find = jest.genMockFn();
    q.find.mockReturnValue(new Parse.Promise());
    var sub = new Subscription(q);
    sub.pushData = jest.genMockFn();

    expect(sub.resultSet).toEqual([]);

    sub.addResult({ id: new Id('Item', 'I1') });
    expect(sub.resultSet).toEqual([new Id('Item', 'I1')]);
    expect(sub.pushData.mock.calls.length).toBe(1);

    sub.addResult({ id: new Id('Item', 'I2') }, true);
    expect(sub.resultSet).toEqual([
      new Id('Item', 'I1'),
      new Id('Item', 'I2')
    ]);
    expect(sub.pushData.mock.calls.length).toBe(1);

    sub.removeResult(new Id('Item', 'I3'));
    expect(sub.resultSet).toEqual([
      new Id('Item', 'I1'),
      new Id('Item', 'I2')
    ]);
    expect(sub.pushData.mock.calls.length).toBe(1);

    sub.removeResult(new Id('Item', 'I2'));
    expect(sub.resultSet).toEqual([new Id('Item', 'I1')]);
    expect(sub.pushData.mock.calls.length).toBe(2);

    sub.removeResult(new Id('Item', 'I1'), true);
    expect(sub.resultSet).toEqual([]);
    expect(sub.pushData.mock.calls.length).toBe(2);
  });

  it('can add and remove objects in an ordered set', function() {
    var q = new Parse.Query('Candidate').descending('votes');
    q.find = jest.genMockFn();
    q.find.mockReturnValue(new Parse.Promise());
    var sub = new Subscription(q);
    sub.pushData = jest.genMockFn();
    expect(sub.resultSet).toEqual([]);

    sub.addResult({
      id: new Id('Candidate', 'C1'),
      votes: 5
    });
    expect(sub.resultSet).toEqual([
      {
        id: new Id('Candidate', 'C1'),
        ordering: {
          votes: 5
        }
      }
    ]);

    sub.addResult({
      id: new Id('Candidate', 'C2'),
      votes: 12
    });
    expect(sub.resultSet).toEqual([
      {
        id: new Id('Candidate', 'C2'),
        ordering: {
          votes: 12
        }
      }, {
        id: new Id('Candidate', 'C1'),
        ordering: {
          votes: 5
        }
      }
    ]);

    sub.addResult({
      id: new Id('Candidate', 'C3'),
      votes: 7
    });
    expect(sub.resultSet).toEqual([
      {
        id: new Id('Candidate', 'C2'),
        ordering: {
          votes: 12
        }
      }, {
        id: new Id('Candidate', 'C3'),
        ordering: {
          votes: 7
        }
      }, {
        id: new Id('Candidate', 'C1'),
        ordering: {
          votes: 5
        }
      }
    ]);

    sub.addResult({
      id: new Id('Candidate', 'C4'),
      votes: 0
    });
    expect(sub.resultSet).toEqual([
      {
        id: new Id('Candidate', 'C2'),
        ordering: {
          votes: 12
        }
      }, {
        id: new Id('Candidate', 'C3'),
        ordering: {
          votes: 7
        }
      }, {
        id: new Id('Candidate', 'C1'),
        ordering: {
          votes: 5
        }
      }, {
        id: new Id('Candidate', 'C4'),
        ordering: {
          votes: 0
        }
      }
    ]);
  });

  it('pushes result sets to subscribers', function() {
    var q = new Parse.Query('Item');
    q.find = jest.genMockFn();
    var promise = new Parse.Promise();
    q.find.mockReturnValue(promise);
    var sub = new Subscription(q);

    var lastResult = {};
    sub.addSubscriber({ onNext: function(data) {
      lastResult.first = data;
    } });
    // Expect synchronous update
    expect(lastResult.first).toEqual([]);

    promise.resolve([
      new Parse.Object('Item', { objectId: 'I1', value: 12 })
    ]);

    expect(lastResult.first).toEqual([
      {
        className: 'Item',
        objectId: 'I1',
        value: 12
      }
    ]);

    sub.addSubscriber({ onNext: function(data) {
      lastResult.second = data;
    } });
    // It should immediately receive known results
    expect(lastResult.second).toEqual([
      {
        className: 'Item',
        objectId: 'I1',
        value: 12
      }
    ]);

    var i2 = new Id('Item', 'I2');
    fakeStore[i2] = {
      className: 'Item',
      objectId: 'I2',
      value: 44
    };
    sub.addResult({ id: new Id('Item', 'I2') });

    expect(lastResult).toEqual({
      first: [
        {
          className: 'Item',
          objectId: 'I1',
          value: 12
        }, {
          className: 'Item',
          objectId: 'I2',
          value: 44
        }
      ],
      second: [
        {
          className: 'Item',
          objectId: 'I1',
          value: 12
        }, {
          className: 'Item',
          objectId: 'I2',
          value: 44
        }
      ]
    });
  });

  it('respects query limits', function() {
    var q = new Parse.Query('Item').limit(1);
    q.find = jest.genMockFn();
    q.find.mockReturnValue(Parse.Promise.as([
      new Parse.Object('Item', { objectId: 'I1', value: 12 })
    ]));
    var sub = new Subscription(q);

    var lastResult = {};
    sub.addSubscriber({ onNext: function(data) {
      lastResult.first = data;
    } });

    var i2 = new Id('Item', 'I2');
    fakeStore[i2] = {
      className: 'Item',
      objectId: 'I2',
      value: 44
    };
    sub.addResult({ id: new Id('Item', 'I2') });

    expect(sub.resultSet.length).toBe(2);

    expect(lastResult).toEqual({
      first: [
        {
          className: 'Item',
          objectId: 'I1',
          value: 12
        }
      ]
    });
  });

  it('can query an object by ID', function() {
    var q = new Parse.Query('Item').observeOne('I1');
    q.find = jest.genMockFn();
    q.find.mockReturnValue(Parse.Promise.as([
      new Parse.Object('Item', { objectId: 'I1', value: 42 })
    ]));
    var sub = new Subscription(q);

    var result;
    sub.addSubscriber({ onNext: function(data) {
      result = data;
    } });

    expect(result).toEqual({
      className: 'Item',
      objectId: 'I1',
      value: 42,
    });

    // Re-issuing the query will push the new data to the subscriber as expected.
    q.find.mockReturnValue(Parse.Promise.as([
      new Parse.Object('Item', { objectId: 'I1', value: 123 })
    ]));
    sub.issueQuery();
    expect(result).toEqual({
      className: 'Item',
      objectId: 'I1',
      value: 123,
    });
  });
});
