'use strict';

jest.dontMock('../Delta');
jest.dontMock('../Id');
jest.dontMock('../Mutation');

var Delta = require('../Delta');
var Id = require('../Id');
var Mutation = require('../Mutation');

describe('Mutation Generators', function() {
  it('generates a Create Mutation', function() {
    var m = Mutation.Create('Klass', {
      objectId: 'override me',
      value: 12,
      name: 'Jeff'
    });
    expect(m.action).toBe('CREATE');
    expect(m.target).toBe('Klass');
    expect(m.data).toEqual({ value: 12, name: 'Jeff' });
  });

  it('generates a Destroy Mutation', function() {
    var id = new Id('Klass', 'O1');
    var m = Mutation.Destroy(id);
    expect(m.action).toBe('DESTROY');
    expect(m.target).toBe(id);
    expect(m.data).toEqual(null);
  });

  it('generates a Set Mutation', function() {
    var id = new Id('Klass', 'O1');
    var m = Mutation.Set(id, {
      objectId: 'override me',
      value: 12,
      name: 'Jeff'
    });
    expect(m.action).toBe('SET');
    expect(m.target).toBe(id);
    expect(m.data).toEqual({ value: 12, name: 'Jeff' });

    m = Mutation.Set(id);
    expect(Object.keys(m)).toEqual(['dispatch']);
    expect(m.dispatch()).toBe(undefined);
  });

  it('generates an Unset Mutation', function() {
    var id = new Id('Klass', 'O1');
    var m = Mutation.Unset(id, 'no_more');
    expect(m.action).toBe('UNSET');
    expect(m.target).toBe(id);
    expect(m.data).toBe('no_more');
  });

  it('generates an Increment Mutation', function() {
    var id = new Id('Klass', 'O1');
    var m = Mutation.Increment(id, 'numeric');
    expect(m.action).toBe('INCREMENT');
    expect(m.target).toBe(id);
    expect(m.data).toEqual({
      column: 'numeric',
      delta: 1
    });

    m = Mutation.Increment(id, 'numeric', 5);
    expect(m.data).toEqual({
      column: 'numeric',
      delta: 5
    });

    expect(Mutation.Increment.bind(null, id, 'numeric', 'string')).toThrow();

    expect(Mutation.Increment.bind(null, id, 'objectId')).toThrow();
  });

  it('generates an array Add Mutation', function() {
    var id = new Id('Klass', 'O1');
    var m = Mutation.Add(id, 'tags', ['new', 'fresh']);
    expect(m.action).toBe('ADD');
    expect(m.target).toBe(id);
    expect(m.data).toEqual({
      column: 'tags',
      value: ['new', 'fresh']
    });

    m = Mutation.Add(id, 'tags', 'new');
    expect(m.data).toEqual({
      column: 'tags',
      value: ['new']
    });

    expect(Mutation.Add.bind(null, id, 'createdAt', 'date')).toThrow();
  });

  it('generates an array AddUnique Mutation', function() {
    var id = new Id('Klass', 'O1');
    var m = Mutation.AddUnique(id, 'tags', ['new', 'fresh']);
    expect(m.action).toBe('ADDUNIQUE');
    expect(m.target).toBe(id);
    expect(m.data).toEqual({
      column: 'tags',
      value: ['new', 'fresh']
    });

    m = Mutation.AddUnique(id, 'tags', 'new');
    expect(m.data).toEqual({
      column: 'tags',
      value: ['new']
    });

    expect(Mutation.AddUnique.bind(null, id, 'createdAt', 'date')).toThrow();
  });

  it('generates an array Remove Mutation', function() {
    var id = new Id('Klass', 'O1');
    var m = Mutation.Remove(id, 'tags', ['new', 'fresh']);
    expect(m.action).toBe('REMOVE');
    expect(m.target).toBe(id);
    expect(m.data).toEqual({
      column: 'tags',
      value: ['new', 'fresh']
    });

    m = Mutation.Remove(id, 'tags', 'new');
    expect(m.data).toEqual({
      column: 'tags',
      value: ['new']
    });

    expect(Mutation.Remove.bind(null, id, 'createdAt', 'date')).toThrow();
  });

  it('generates an array Remove Mutation', function() {
    var id = new Id('Klass', 'O1');
    var m = Mutation.Remove(id, 'tags', ['new', 'fresh']);
    expect(m.action).toBe('REMOVE');
    expect(m.target).toBe(id);
    expect(m.data).toEqual({
      column: 'tags',
      value: ['new', 'fresh']
    });

    m = Mutation.Remove(id, 'tags', 'new');
    expect(m.data).toEqual({
      column: 'tags',
      value: ['new']
    });

    expect(Mutation.Remove.bind(null, id, 'createdAt', 'date')).toThrow();
  });

  it('generates an AddRelation Mutation', function() {
    var id = new Id('Klass', 'O1');
    var postA = new Id('Post', 'P1');
    var postB = new Id('Post', 'P1');
    var m = Mutation.AddRelation(id, 'likes', [postA, postB]);
    expect(m.action).toBe('ADDRELATION');
    expect(m.target).toBe(id);
    expect(m.data).toEqual({
      column: 'likes',
      targets: [postA, postB]
    });

    m = Mutation.AddRelation(id, 'likes', postB);
    expect(m.data).toEqual({
      column: 'likes',
      targets: [postB]
    });

    expect(Mutation.AddRelation.bind(null, id, 'createdAt', 'date')).toThrow();
  });

  it('generates a RemoveRelation Mutation', function() {
    var id = new Id('Klass', 'O1');
    var postA = new Id('Post', 'P1');
    var postB = new Id('Post', 'P1');
    var m = Mutation.RemoveRelation(id, 'likes', [postA, postB]);
    expect(m.action).toBe('REMOVERELATION');
    expect(m.target).toBe(id);
    expect(m.data).toEqual({
      column: 'likes',
      targets: [postA, postB]
    });

    m = Mutation.RemoveRelation(id, 'likes', postB);
    expect(m.data).toEqual({
      column: 'likes',
      targets: [postB]
    });

    expect(Mutation.RemoveRelation.bind(null, id, 'createdAt', 'date'))
      .toThrow();
  });

  it('correctly normalizes target fields', function() {
    var id = new Id('Klass', 'O1');
    var m = Mutation.Set(id, { value: 12 });
    expect(m.target).toBe(id);

    m = Mutation.Set({ className: 'Klass', objectId: 'O1' }, { value: 12 });
    expect(m.target).toEqual(id);
  });
});

describe('Mutation', function() {
  it('can create a Delta representing its changes', function() {
    var id = new Id('Klass', 'O1');
    var m = Mutation.Destroy(id);
    var delta = m.generateDelta({});
    expect(delta instanceof Delta).toBe(true);
    expect(delta.id).toBe(id);
    expect(delta.map).toBe('DESTROY');

    m = Mutation.Create('Klass', { value: 12 });
    var editDate = new Date();
    delta = m.generateDelta({ objectId: 'AA', createdAt: editDate });
    expect(delta.id).toEqual(new Id('Klass', 'AA'));
    expect(delta.map).toEqual({
      value: { set: 12 },
      createdAt: { set: editDate },
      updatedAt: { set: editDate }
    });

    m = Mutation.Set(id, { value: 12 });
    delta = m.generateDelta({ updatedAt: editDate });
    expect(delta.id).toBe(id);
    expect(delta.map).toEqual({
      value: { set: 12 },
      updatedAt: { set: editDate }
    });

    m = Mutation.Unset(id, 'no_more');
    delta = m.generateDelta({ updatedAt: editDate });
    expect(delta.map).toEqual({
      no_more: { unset: true },
      updatedAt: { set: editDate }
    });

    m = Mutation.Add(id, 'tags', 'new');
    delta = m.generateDelta({
      tags: ['fresh', 'cool', 'new'],
      updatedAt: editDate
    });
    expect(delta.map).toEqual({
      tags: { set: ['fresh', 'cool', 'new'] },
      updatedAt: { set: editDate }
    });

    m = Mutation.Set(id, { value: 12 });
    // Simulate beforeSave result
    delta = m.generateDelta({ value: -12, updatedAt: editDate });
    expect(delta.map).toEqual({
      value: { set: -12 },
      updatedAt: { set: editDate }
    });
  });

  it('can be applied to a local object', function() {
    var id = new Id('Klass', 'O1');
    var m = Mutation.Set(id, { value: 12 });
    var base = {};
    m.applyTo(base);
    expect(base).toEqual({ value: 12 });

    base = { value: 16 };
    m.applyTo(base);
    expect(base).toEqual({ value: 12 });

    base = {
      name: 'Frank',
      tags: ['nofilter', 'selfie'],
      value: -3
    };
    m.applyTo(base);
    expect(base).toEqual({
      name: 'Frank',
      tags: ['nofilter', 'selfie'],
      value: 12
    });

    m = Mutation.Increment(id, 'value');
    m.applyTo(base);
    expect(base).toEqual({
      name: 'Frank',
      tags: ['nofilter', 'selfie'],
      value: 13
    });

    m = Mutation.Unset(id, 'value');
    m.applyTo(base);
    expect(base).toEqual({
      name: 'Frank',
      tags: ['nofilter', 'selfie']
    });

    m = Mutation.Add(id, 'tags', 'favorites');
    m.applyTo(base);
    expect(base).toEqual({
      name: 'Frank',
      tags: ['nofilter', 'selfie', 'favorites']
    });

    m = Mutation.AddUnique(id, 'tags', ['selfie', 'hashtag']);
    m.applyTo(base);
    expect(base).toEqual({
      name: 'Frank',
      tags: ['nofilter', 'selfie', 'favorites', 'hashtag']
    });

    m = Mutation.Remove(id, 'tags', ['selfie', 'hashtag']);
    m.applyTo(base);
    expect(base).toEqual({
      name: 'Frank',
      tags: ['nofilter', 'favorites']
    });
  });
});