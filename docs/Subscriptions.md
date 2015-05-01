# Subscribing to Parse Data

The best way to bring Parse data into your React application is to subscribe a
component to a Query. Each time the component mounts, that query is changed, or
it is explicitly refreshed, new data will be fetched from Parse and passed to
the component, causing it to re-render.

A component subscribes to queries with a newly-proposed React lifecycle method:
`observe()`. The `observe` method is run each time the component updates,
immediately before it renders. Receiving the upcoming `props` and `state` as
parameters, `observe` constructs `Parse.Query` objects and returns a map of
strings to queries. The string keys are used as names for identifying each
query.

When the component mounts, each query is fetched. Whenever results are received
and attached to the component, it updates and re-renders. If props or state are
changed, the subscriptions will all be re-calculated. Any queries that have
changed as a result will be fetched again. Queries can also be explicitly
refreshed by calling [`this.refreshQueries()`](/docs/api/Mixin.md) at any time.

Subscriptions also mean that components can automatically respond to local data
changes. Any time a Parse Object is locally created, modified, or destroyed,
components that were previously subscribed or should now be subscribed to that
object receive an updated result set. This allows interfaces to immediately
respond to user actions without any need for developer intervention. You can
view practical examples of this behavior in the included demo apps.

```js
observe: function(props, state) {
  return {
    comments: (new Parse.Query('Comment'))
                .greaterThan('votes', 50)
                .ascending('createdAt')
  };
}
```

The above example subscribes a component to a query fetching Comment objects
with more than 50 votes, and orders them by creation date. Because it is
associated with the name `comments`, the result set is available at
`this.data.comments`. Before results have been fetched, this parameter will be
set to an empty array. When results do come back, it is as immutable,
plain-object copies of Parse Objects.

It's also possible to subscribe components to more localized concepts.
Components can subscribe to changes to the current user as it is logged in and
logged out, through the
[`ParseReact.currentUser`](/docs/api/LocalSubscriptions.md) local subscription.
In the following example, `this.data.user` will be equal to a copy of the
current user, and the component will be updated whenever that user is modified.

```js
observe: function() {
  return {
    user: ParseReact.currentUser
  };
}
```
# Subscribing to Complex Queries
Not all queries can be written in a single line of code.  To effectively subscribe a component to a complex Parse query it is recommended that you build them inside the observe method before constructing and returning your map of observations.  

```js
observe: function() {
    var userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo("objectId", id);

    var Comments = Parse.Object.extend("Comments");

    var commentQuery = new Parse.Query(Comments);
    commentQuery.matchesQuery("user_reference", userQuery);
    activityQuery.include("comment");
    commentQuery.descending("createdAt");

    return {
    	comments: commentQuery
    };
 }
 ```

The example above illustrates the need for multiple lines of code being used to create your map of observations.  The first query is setup to find a specific user based upon their ```objectId```. The second query is setup to match all of the comments for the user that will be returned in the first query.  The result of this relational query is then returned and associated with the name ```comments```.
