'use strict';

jest.dontMock('../equalObjects');
jest.dontMock('../Id');

var equalObjects = require('../equalObjects');
var Id = require('../Id');

describe('equalObjects', function() {
  it('works with primitives', function() {
    expect(equalObjects('a', 'a')).toBe(true);
    expect(equalObjects('a', 'b')).toBe(false);
    expect(equalObjects(12, 12)).toBe(true);
    expect(equalObjects(12, 4)).toBe(false);
    expect(equalObjects(true, true)).toBe(true);
    expect(equalObjects(true, false)).toBe(false);
    expect(equalObjects('a', 5)).toBe(false);
    expect(equalObjects('a', true)).toBe(false);
    expect(equalObjects(0, false)).toBe(false);
  });

  it('works when the arguments point to the same object', function() {
    var obj = {};
    expect(equalObjects(obj, obj)).toBe(true);
  });

  it('works with dates', function() {
    var a = new Date(2015, 1, 1);
    var b = new Date(2015, 1, 1);
    expect(equalObjects(a, b)).toBe(true);
    b.setMonth(10);
    expect(equalObjects(a, b)).toBe(false);
    expect(equalObjects(a, +a)).toBe(false);
  });

  it('works with arrays', function() {
    var a = [1, 2, 'three'];
    var b = [1, 2, 'three'];
    expect(equalObjects(a, b)).toBe(true);
    b[2] = 'four';
    expect(equalObjects(a, b)).toBe(false);
    a.splice(2, 1);
    expect(equalObjects(a, b)).toBe(false);
    a = ['a string', new Date(2015, 1, 1)];
    b = ['a string', new Date(2015, 1, 1)];
    expect(equalObjects(a, b)).toBe(true);
  });

  it('works with generic objects', function() {
    var a = {
      num: 12,
      str: 'string',
      arr: [1, 2, 'three'],
      date: new Date(2015, 1, 1)
    };
    var b = {
      num: 12,
      str: 'string',
      arr: [1, 2, 'three'],
      date: new Date(2015, 1, 1)
    };
    expect(equalObjects(a, b)).toBe(true);
    delete a.num;
    expect(equalObjects(a, b)).toBe(false);
    a.num = 11;
    expect(equalObjects(a, b)).toBe(false);
    a.num = 12;
    a.val = { deep: true };
    b.val = { deep: true };
    expect(equalObjects(a, b)).toBe(true);
  });

  it('works with flattened Parse Objects', function() {
    var a = {
      id: new Id('Klass', 'A'),
      name: 'Apple',
      neighbor: new Id('Klass', 'B')
    };
    var b = {
      id: new Id('Klass', 'A'),
      name: 'Apple',
      neighbor: new Id('Klass', 'B')
    };
    expect(equalObjects(a, b)).toBe(true);
    a.id.objectId = 'C';
    expect(equalObjects(a, b)).toBe(false);
  });
});
