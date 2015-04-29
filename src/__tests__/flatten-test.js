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

  it('flattens a nested object to a pointer', function() {
    var parent = new Item({
      id: 'P',
      type: 'Father',
      child: new Item({ id: 'C' })
    });

    expect(flatten(parent)).toEqual({
      id: new Id('Item', 'P'),
      className: 'Item',
      objectId: 'P',
      type: 'Father',
      child: {
        __type: 'Pointer',
        className: 'Item',
        objectId: 'C'
      }
    });
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
        __type: 'Pointer',
        className: 'Item',
        objectId: 'Bread'
      }, {
        __type: 'Pointer',
        className: 'Item',
        objectId: 'Ham'
      }, {
        __type: 'Pointer',
        className: 'Item',
        objectId: 'Cheese'
      }, {
        __type: 'Pointer',
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
          __type: 'Pointer',
          className: 'Item',
          objectId: 'O2'
        }, {
          __type: 'Pointer',
          className: 'Item',
          objectId: 'O3'
        }
      ]
    });
  });
});
