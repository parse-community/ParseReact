# Mutation API

## Methods

### `mutation.dispatch([options])`

Executes a Mutation to create, destroy, or modify a Parse Object by sending a
request to the Parse API. Unless waiting for the server response is explicitly
required, it will also optimistically update the object locally. When the object
is updated, the new version will be pushed to all subscribed components.

`dispatch` returns a `Parse.Promise` this is resolved with the modified object
when the server request completes. If an error occurs, the promise is rejected.

- `options` (optional): A plain JavaScript object of key/value pairs to
configure the dispatch.
  - `waitForServer` (default: `false`): If set to true, components won't update
  optimistically, and will wait for confirmation that the operation was
  successful before updating.
  - `batch`: Pass a `ParseReact.Mutation.Batch` instance to perform the mutation
  as part of that batch rather than individually.

## Mutation Generators

There are a number of methods for creating Mutation &mdash; one for each type.

### `ParseReact.Mutation.Create(className, data)`

Create a new instance of a Parse Object

- `className`: The Class name of the Parse Object to be created
- `data`: A key/value map used to initialize the attributes of the object

### `ParseReact.Mutation.Destroy(object)`

Destroy an instance of a Parse Object

- `object`: The object to destroy

### `ParseReact.Mutation.Set(object, changes)`

Set fields on an object

- `object`: The object to modify
- `changes`: A key/value map of attributes and their new values

### `ParseReact.Mutation.Unset(object, field)`

Remove a field from an object

- `object`: The object to modify
- `field`: The field to be removed from the object

### `ParseReact.Mutation.Increment(object, field [, amount])`

Atomically increments the value of a specified field. If no amount is specified,
the field will be incremented by 1.

- `object`: The object to modify
- `field`: The numeric field to increment
- `amount` (optional, default: `1`): A positive or negative amount to change the
field by

### Array Field Mutations

### `ParseReact.Mutation.Add(object, field, items)`

Atomically add an element or elements to the end of an array field

- `object`: The object to modify
- `field`: The array field to add elements to
- `items`: A single element, or an array of elements

### `ParseReact.Mutation.AddUnique(object, field, items)`

Atomically add elements to an array field, if they are not already present in
the array

- `object`: The object to modify
- `field`: The array field to add elements to
- `items`: A single element, or an array of elements

### `ParseReact.Mutation.Remove(object, field, items)`

Atomically remove elements from an array field

- `object`: The object to modify
- `field`: The array field to remove elements from
- `items`: A single element, or an array of elements

### Relation Field Mutations

Note that updates to relation fields do not automatically update components,
because we don't have access to the full join table locally. If you want to
update a component that is subscribed to a relation query, you should call
`refreshQueries()`.

### `ParseReact.Mutation.AddRelation(object, field, item)`

Add an object to a relation field

- `object`: The object to modify
- `field`: The relation field to add the item to
- `item`: The object to associate with the relation field

### `ParseReact.Mutation.RemoveRelation(object, field, item)`

Remove an object from a relation field

- `object`: The object to modify
- `field`: The relation field to remove the item from
- `item`: The object to remove from the relation field
