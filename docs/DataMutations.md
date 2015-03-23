# Mutating Parse Data

With Parse + React, data shared with Parse is modified through
[Mutations](/docs/api/Mutation.md). These are messages that, when dispatched,
tell both the Parse API and the client application to update data in some way.

To generate a Mutation, you must first call the appropriate constructor. These
methods are found in the [Mutations API](/docs/api/Mutation.md). Once a
Mutation has been created, it can be executed by calling `.dispatch()`.

```js
// Create a new Pizza object
var creator = ParseReact.Mutation.Create('Pizza', {
  toppings: [ 'sausage', 'peppers' ],
  crust: 'deep dish'
});

// ...and execute it
creator.dispatch();
```

Most Mutations rely on you to pass in a specific object to be changed. This
should be an object received from a
[Query Subscription](/docs/Subscriptions.md). The following example shows how to
update objects received by a query.

```js
React.createClass({
  mixins: [ParseReact.Mixin],
  observe: function() {
    return {
      counters: new Parse.Query('Counter');
    };
  },

  // ...

  // Assume that _myClickHandler is called whenever the component is clicked.
  // When this happens, we want to increment the value of every Counter object.
  _myClickHandler: function() {
    this.data.counters.map(function(counter) {
      ParseReact.Mutation.Increment(counter, 'value').dispatch();
    });
  }
})
```

It's easy to modify the objects a component has received, either from
subscribing to a query or receiving props from a parent. You can look at the
demo applications for more examples of this.

It's also possible to modify an object that you haven't directly seen. If you
know the `className` and `objectId` of an object, you can modify it by passing
an object containing those fields to a Mutation.

```js
// If we know that we want to destroy the Counter with an objectId of 'c123',
// we can do so by explicitly passing this information to the Mutation.
var target = {
  className: 'Counter',
  objectId: 'c123'
};

ParseReact.Mutation.Destroy(target).dispatch();
```

One reason that dispatching a Mutation is a separate action is so that they can
be stored for later execution, or issued multiple times.

```js
var creator = ParseReact.Mutation.Create('Pizza', {
  toppings: [ 'sausage', 'peppers' ],
  crust: 'deep dish'
});

// Create three new Pizzas with these toppings
creator.dispatch();
creator.dispatch();
creator.dispatch();
```

The `dispatch()` call returns a `Parse.Promise`, so that you can respond when
server request succeeds or fails. In case of failure, you may want to update
the state of your application to display a message to the user, and possibly
give them a click-to-retry option.