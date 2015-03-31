'use strict';

jest.dontMock('parse');

jest.dontMock('../flatten.js');
jest.dontMock('../Id.js');
jest.dontMock('../StubParse.js');

var warning = require('../warning');
var flatten = require('../flatten');
var Id = require('../Id.js');

var Parse = require('parse').Parse;
var Item = Parse.Object.extend('Item');

describe('flatten', function() {
  it('should flatten a simple Parse Object', function() {
    var item = new Item();
    item.id = 'O1';
    item.set('name', 'Arbitrary');
    expect(flatten(item)).toEqual({
      id: new Id('Item', 'O1'),
      className: 'Item',
      objectId: 'O1',
      name: 'Arbitrary'
    });
  });

  it('copies over all special attributes', function() {
    var item = new Item();
    item.id = 'O2';
    var creation = new Date();
    item.createdAt = creation;
    item.updatedAt = creation;
    expect(flatten(item)).toEqual({
      id: new Id('Item', 'O2'),
      className: 'Item',
      objectId: 'O2',
      createdAt: creation,
      updatedAt: creation
    });
  });

  it('does nothing to a non Parse Object', function() {
    expect(flatten('A string')).toBe('A string');
    expect(flatten(44)).toBe(44);
    expect(flatten(null)).toBe(null);
    expect(warning.mock.calls.length).toBe(3);
  });

  it('can flatten an array of objects', function() {
    var sandwich = [
      new Item({ id: 'Bread' }),
      new Item({ id: 'Ham' }),
      new Item({ id: 'Cheese' }),
      new Item({ id: 'MoreBread' })
    ];
    expect(flatten(sandwich)).toEqual([
      {
        id: new Id('Item', 'Bread'),
        className: 'Item',
        objectId: 'Bread'
      }, {
        id: new Id('Item', 'Ham'),
        className: 'Item',
        objectId: 'Ham'
      }, {
        id: new Id('Item', 'Cheese'),
        className: 'Item',
        objectId: 'Cheese'
      }, {
        id: new Id('Item', 'MoreBread'),
        className: 'Item',
        objectId: 'MoreBread'
      }
    ]);

    var stooge = new Item({
        id: 'O1',
        name: 'Larry',
        friends: [
          new Item({ id: 'O2', name: 'Moe' }),
          new Item({ id: 'O3', name: 'Curly'})
        ]
    });
    expect(flatten(stooge)).toEqual({
      id: new Id('Item', 'O1'),
      className: 'Item',
      objectId: 'O1',
      name: 'Larry',
      friends: [
        {
          id: new Id('Item', 'O2'),
          className: 'Item',
          objectId: 'O2',
          name: 'Moe'
        }, {
          id: new Id('Item', 'O3'),
          className: 'Item',
          objectId: 'O3',
          name: 'Curly'
        }
      ]
    });
  });

  it('detects circular dependencies', function() {
    var A = new Item();
    var B = new Item();
    A.set('partner', B);
    B.set('partner', A);
    expect(flatten.bind(null, A)).toThrow();
  });
});
