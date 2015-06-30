'use strict';

jest.dontMock('parse');

jest.dontMock('../Id');
jest.dontMock('../ParsePatches');
jest.dontMock('../StubParse');

var Id = require('../Id');
var Parse = require('../StubParse');
var ParsePatches = require('../ParsePatches');

var mocks = {
  equalTo: jest.genMockFn(),
  notEqualTo: jest.genMockFn(),
  containedIn: jest.genMockFn(),
  notContainedIn: jest.genMockFn()
};

for (var m in mocks) {
  Parse.Query.prototype[m] = mocks[m];
}

ParsePatches.applyPatches();

describe('Parse SDK Patches', function() {
  it('converts flat objects to pointers for queries', function() {
    var q = new Parse.Query('Item').equalTo('count', 5);
    expect(mocks.equalTo.mock.calls[0][0]).toBe('count');
    expect(mocks.equalTo.mock.calls[0][1]).toBe(5);

    q = new Parse.Query('Item').equalTo('owner', {
      id: new Id('Owner', 'O1')
    });
    expect(mocks.equalTo.mock.calls[1][0]).toBe('owner');
    expect(mocks.equalTo.mock.calls[1][1]).toEqual({
      __type: 'Pointer',
      className: 'Owner',
      objectId: 'O1'
    });

    q = new Parse.Query('Item').notEqualTo('owner', {
      id: new Id('Owner', 'O2')
    });
    expect(mocks.notEqualTo.mock.calls[0][0]).toBe('owner');
    expect(mocks.notEqualTo.mock.calls[0][1]).toEqual({
      __type: 'Pointer',
      className: 'Owner',
      objectId: 'O2'
    });

    q = new Parse.Query('Item').containedIn('owner', [
      { id: new Id('Owner', 'O1') },
      { id: new Id('Owner', 'O2') }
    ]);
    expect(mocks.containedIn.mock.calls[0][0]).toBe('owner');
    expect(mocks.containedIn.mock.calls[0][1]).toEqual([
      { __type: 'Pointer', className: 'Owner', objectId: 'O1'},
      { __type: 'Pointer', className: 'Owner', objectId: 'O2'},
    ]);

    q = new Parse.Query('Item').notContainedIn('owner', [
      { id: new Id('Owner', 'O1') },
      { id: new Id('Owner', 'O2') }
    ]);
    expect(mocks.notContainedIn.mock.calls[0][0]).toBe('owner');
    expect(mocks.notContainedIn.mock.calls[0][1]).toEqual([
      { __type: 'Pointer', className: 'Owner', objectId: 'O1'},
      { __type: 'Pointer', className: 'Owner', objectId: 'O2'},
    ]);
  });
});
