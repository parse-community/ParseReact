'use strict';

jest.dontMock('../Delta');
jest.dontMock('../Id');

var Delta = require('../Delta');
var Id = require('../Id');

describe('Delta', function() {
  it('requires a valid Id', function() {
    var trap = function() {
      return new Delta('Not an Id', {});
    };
    expect(trap).toThrow();
  });

  it('copies over all changes', function() {
    var delta = new Delta(new Id('Klass', 'D'), { count: { set: 5 } });
    expect(delta.map).toEqual({
      count: {
        set: 5
      }
    });
  });

  it('maps DESTROY actions at the top level', function() {
    var delta = new Delta(new Id('Klass', 'D'), 'DESTROY');
    expect(delta.map).toBe('DESTROY');
  });

  it('merges with changes from another delta', function() {
    var deltaA = new Delta(new Id('Klass', 'A'), { count: { set: 5 } });
    var deltaB = new Delta(new Id('Klass', 'A'), { name: { set: 'Fido' } });
    deltaA.merge(deltaB);
    expect(deltaA.map).toEqual({
      count: {
        set: 5
      },
      name: {
        set: 'Fido'
      }
    });
  });

  it('can only merge with another Delta', function() {
    var delta = new Delta(new Id('Klass', 'D'), { count: { set: 5 } });
    expect(delta.merge.bind(delta, 'Not a Delta')).toThrow();
  });

  it('uses the other value when merging a matching field', function() {
    var deltaA = new Delta(new Id('Klass', 'A'), {
      count: {
        set: 5
      },
      name: {
        set: 'Alexander'
      }
    });
    var deltaB = new Delta(new Id('Klass', 'A'), { name: { set: 'Fido' } });
    deltaA.merge(deltaB);
    expect(deltaA.map).toEqual({
      count: {
        set: 5
      },
      name: {
        set: 'Fido'
      }
    });
  });

  it('overrides with a DESTROY', function() {
    var deltaA = new Delta(new Id('Klass', 'A'), { name: { set: 'Fido' } });
    var deltaB = new Delta(new Id('Klass', 'A'), 'DESTROY');
    deltaB.merge(deltaA);
    expect(deltaB.map).toBe('DESTROY');

    deltaA.merge(deltaB);
    expect(deltaA.map).toBe('DESTROY');
  });

  it('will not merge Deltas for different objects', function() {
    var deltaA = new Delta(new Id('Klass', 'A'), { count: { set: 5 } });
    var deltaB = new Delta(new Id('Klass', 'B'), { count: { set: 7 } });

    expect(deltaA.merge.bind(deltaA, deltaB)).toThrow();
  });
});