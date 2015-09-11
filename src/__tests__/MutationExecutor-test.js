'use strict';

jest.mock('../UpdateChannel');
jest.setMock('../UpdateChannel', {
  issueMutation: function(mutation) {
    MutationExecutor.execute(mutation);
  }
});

jest.dontMock('parse');

jest.dontMock('../Mutation');
jest.dontMock('../MutationExecutor');
jest.dontMock('../Id');
jest.dontMock('../StubParse');

var Id = require('../Id');
var Mutation = require('../Mutation');
var MutationExecutor = require('../MutationExecutor');

var Parse = require('parse');

var testXHR = function(urlTest, bodyTest, response) {
  var XHR = function() { };
  XHR.prototype = {
    open: function(method, url) {
      urlTest(method, url);
    },
    setRequestHeader: function() { },
    send: function(body) {
      bodyTest(body);
      this.status = 200;
      this.responseText = JSON.stringify(response || {});
      this.readyState = 4;
      this.onreadystatechange();
    }
  };
  return XHR;
};

describe('MutationExecutor', function() {
  // Check to make sure we're running in NODE_ENV=test
  it('exports test libs', function() {
    expect(typeof MutationExecutor.encode).not.toBe('undefined');
  });

  it('can issue a Create command', function() {
    var called = false;
    Parse.CoreManager.getRESTController().request = function(method, path, body) {
      expect(method).toBe('POST');
      expect(path).toBe('classes/Klass');
      expect(body).toEqual({
        value: 12
      });
      called = true;
      return Parse.Promise.as({});
    };

    Mutation.Create('Klass', { value: 12 }).dispatch();
    expect(called).toBe(true);
  });

  it('can issue a Destroy command', function() {
    var called = false;
    Parse.CoreManager.getRESTController().request = function(method, path) {
      expect(method).toBe('DELETE');
      expect(path).toBe('classes/Klass/O1');
      called = true;
      return Parse.Promise.as({});
    };

    Mutation.Destroy(new Id('Klass', 'O1')).dispatch();
    expect(called).toBe(true);
  });

  it('can issue a Set request', function() {
    var called = false;
    Parse.CoreManager.getRESTController().request = function(method, path, body) {
      expect(method).toBe('PUT');
      expect(path).toBe('classes/Klass/O1');
      expect(body).toEqual({
        value: 12
      });
      called = true;
      return Parse.Promise.as({});
    };

    Mutation.Set(new Id('Klass', 'O1'), { value: 12 }).dispatch();
    expect(called).toBe(true);
  });

  it('can issue a Unset request', function() {
    var called = false;
    Parse.CoreManager.getRESTController().request = function(method, path, body) {
      expect(method).toBe('PUT');
      expect(path).toBe('classes/Klass/O1');
      expect(body).toEqual({
        no_more: { __op: 'Delete' }
      });
      called = true;
      return Parse.Promise.as({});
    };

    Mutation.Unset(new Id('Klass', 'O1'), 'no_more').dispatch();
    expect(called).toBe(true);
  });

  it('can issue an Increment request', function() {
    var called = false;
    Parse.CoreManager.getRESTController().request = function(method, path, body) {
      expect(method).toBe('PUT');
      expect(path).toBe('classes/Klass/O1');
      expect(body).toEqual({
        numeric: { __op: 'Increment', amount: 1 }
      });
      called = true;
      return Parse.Promise.as({
        numeric: 1
      });
    };

    Mutation.Increment(new Id('Klass', 'O1'), 'numeric').dispatch();
    expect(called).toBe(true);
  });

  it('can issue an array Add request', function() {
    var called = false;
    Parse.CoreManager.getRESTController().request = function(method, path, body) {
      expect(method).toBe('PUT');
      expect(path).toBe('classes/Klass/O1');
      expect(body).toEqual({
        tags: { __op: 'Add', objects: ['new'] }
      });
      called = true;
      return Parse.Promise.as({
        tags: ['new']
      });
    };

    Mutation.Add(new Id('Klass', 'O1'), 'tags', 'new').dispatch();
    expect(called).toBe(true);
  });

  it('can issue an array AddUnique request', function() {
    var called = false;
    Parse.CoreManager.getRESTController().request = function(method, path, body) {
      expect(method).toBe('PUT');
      expect(path).toBe('classes/Klass/O1');
      expect(body).toEqual({
        tags: { __op: 'AddUnique', objects: ['new'] }
      });
      called = true;
      return Parse.Promise.as({
        tags: ['new']
      });
    };

    Mutation.AddUnique(new Id('Klass', 'O1'), 'tags', 'new').dispatch();
    expect(called).toBe(true);
  });

  it('can issue an array Remove request', function() {
    var called = false;
    Parse.CoreManager.getRESTController().request = function(method, path, body) {
      expect(method).toBe('PUT');
      expect(path).toBe('classes/Klass/O1');
      expect(body).toEqual({
        tags: { __op: 'Remove', objects: ['new'] }
      });
      called = true;
      return Parse.Promise.as({
        tags: []
      });
    };

    Mutation.Remove(new Id('Klass', 'O1'), 'tags', 'new').dispatch();
    expect(called).toBe(true);
  });
});

var encode = MutationExecutor.encode;

describe('Parse encoder', function() {
  it('ignores primitives', function() {
    expect(encode(12)).toBe(12);
    expect(encode('hello')).toBe('hello');
  });

  it('properly translates Dates', function() {
    var d = new Date(Date.UTC(2015, 1, 1, 0, 0, 0));
    expect(encode(d)).toEqual({
      __type: 'Date',
      iso: '2015-02-01T00:00:00.000Z'
    });
  });

  it('properly translates Pointers', function() {
    var id = new Id('Klass', 'O1');
    expect(encode(id)).toEqual({
      __type: 'Pointer',
      className: 'Klass',
      objectId: 'O1'
    });
    expect(encode({
      count: 12,
      neighbor: id
    })).toEqual({
      count: 12,
      neighbor: {
        __type: 'Pointer',
        className: 'Klass',
        objectId: 'O1'
      }
    });

    var Item = Parse.Object.extend('Item');
    var obj = new Item();
    obj.id = 'I2';
    expect(encode({
      item: obj
    })).toEqual({
      item: {
        __type: 'Pointer',
        className: 'Item',
        objectId: 'I2'
      }
    });

    var user = new Parse.User();
    user.id = 'U2';
    expect(encode({
      owner: user
    })).toEqual({
      owner: {
        __type: 'Pointer',
        className: '_User',
        objectId: 'U2'
      }
    });

    var unsaved = new Item();
    expect(encode.bind(null, {
      item: unsaved
    })).toThrow(new Error('Tried to save a pointer to an unsaved Parse Object'));
  });

  it('properly translates Parse Files', function() {
    var f = new Parse.File();
    expect(encode.bind(null, f)).toThrow();

    f._name = 'file.txt';
    f._url = 'files.parsetfss.com/a/file.txt';

    expect(encode(f)).toEqual({
      __type: 'File',
      name: 'file.txt',
      url: 'files.parsetfss.com/a/file.txt'
    });
  });

  it('properly translates GeoPoints', function() {
    var g = new Parse.GeoPoint({ latitude: 37.484815, longitude: -122.148377 });
    expect(encode(g)).toEqual({
      __type: 'GeoPoint',
      latitude: 37.484815,
      longitude: -122.148377
    });
  });

  it('allows null values', function() {
    expect(encode(null)).toEqual(null);
  });

  it('maps over arrays', function() {
    var arr = [
      'string',
      new Parse.GeoPoint({ latitude: 37.484815, longitude: -122.148377 }),
      [new Id('Klass','O1')]
    ];
    expect(encode(arr)).toEqual([
      'string',
      {
        __type: 'GeoPoint',
        latitude: 37.484815,
        longitude: -122.148377
      },
      [{
        __type: 'Pointer',
        className: 'Klass',
        objectId: 'O1'
      }]
    ]);
  });

  it('maps over object properties', function() {
    var obj = {
      type: 'House',
      neighbor: new Id('House', '101')
    };
    expect(encode(obj)).toEqual({
      type: 'House',
      neighbor: {
        __type: 'Pointer',
        className: 'House',
        objectId: '101'
      }
    });
  });

  it('catches circular references', function() {
    var a = {};
    var b = { a: a };
    a.b = b;

    expect(encode.bind(null, a)).toThrow(new Error('Tried to encode circular reference'));

    a = {};
    b = { obj: { a : a } };
    a.b = b;

    expect(encode.bind(null, a)).toThrow(new Error('Tried to encode circular reference'));

    a = []
    b = [a];
    a.push(b);

    expect(encode.bind(null, a)).toThrow(new Error('Tried to encode circular reference'));
  });
});
