'use strict';

jest.dontMock('../Id');

var Id = require('../Id');

describe('Id', function() {
  it('can be rendered as a string', function() {
    var id = new Id('MyClass', 'O1');
    expect(id.toString()).toBe('MyClass:O1');
  });

  it('can be parsed from a string', function() {
    expect(Id.fromString('Klass:id')).toEqual(new Id('Klass', 'id'));
  });

  it('throws an error when parsing an invalid string', function() {
    expect(Id.fromString.bind(null, 'Not an Id string')).toThrow();
  });
});