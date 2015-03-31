'use strict';

jest.mock('../ObjectStore');
jest.setMock('../ObjectStore', {
  getDataForIds: function(ids) {
    var data = [];
    for (var i = 0; i < ids.length; i++) {
      data.push({
        objectId: ids[i].objectId,
        className: ids[i].className,
        data: 'value'
      });
    }
    return data;
  }
});

jest.dontMock('../Id');
jest.dontMock('../QueryTools');
jest.dontMock('../StubParse');
jest.dontMock('../Subscription');

jest.dontMock('parse');

var Id = require('../Id');
var Subscription = require('../Subscription');

var Parse = require('parse').Parse;

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
  it('can add or remove unique subscribers', function() {
    var q = new Parse.Query('Item');
    var sub = new Subscription(q);
    sub.issueQuery = jest.genMockFn();

    expect(sub.subscribers).toEqual([]);
    var mockCallback = function() { };
    sub.addSubscriber(mockCallback, 'items');
    expect(sub.subscribers).toEqual([
      {
        callback: mockCallback,
        name: 'items'
      }
    ]);

    sub.addSubscriber(mockCallback, 'moreItems');
    expect(sub.subscribers).toEqual([
      {
        callback: mockCallback,
        name: 'items'
      }
    ]);

    var mockOtherCallback = function() { };
    sub.addSubscriber(mockOtherCallback, 'otherItems');
    expect(sub.subscribers).toEqual([
      {
        callback: mockCallback,
        name: 'items'
      }, {
        callback: mockOtherCallback,
        name: 'otherItems'
      }
    ]);

    sub.removeSubscriber(function() { });
    expect(sub.subscribers).toEqual([
      {
        callback: mockCallback,
        name: 'items'
      }, {
        callback: mockOtherCallback,
        name: 'otherItems'
      }
    ]);

    sub.removeSubscriber(mockCallback);
    expect(sub.subscribers).toEqual([
      {
        callback: mockOtherCallback,
        name: 'otherItems'
      }
    ]);

    sub.removeSubscriber(mockOtherCallback);
    expect(sub.subscribers).toEqual([]);
  });

  it('can add and remove objects from the result set', function() {
    var q = new Parse.Query('Item');
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
    var sub = new Subscription(q);
    sub.issueQuery = jest.genMockFn();

    var cb = jest.genMockFn();
    sub.addSubscriber(cb, 'items');

    var override = [];
    sub.pushData(override);

    expect(cb.mock.calls.length).toBe(1);
    expect(cb.mock.calls[0][0]).toBe('items');
    expect(cb.mock.calls[0][1]).toBe(override);

    sub.addResult({ id: new Id('Item', 'I1') });

    expect(cb.mock.calls.length).toBe(2);
    expect(cb.mock.calls[1][0]).toBe('items');
    expect(cb.mock.calls[1][1]).toEqual([
      {
        objectId: 'I1',
        className: 'Item',
        data: 'value'
      }
    ]);
  });
});
