# Local Subscriptions

In addition to subscribing to Parse Queries, components can also subscribe to
more abstract local concepts. Passing a local subscription as one of the values
in the object returned by `observe()` makes that object available on
`this.data`.

### `ParseReact.currentUser`

Subscribe to the currently logged in user. When logged in, a copy of the current
user &mdash; as a plain JavaScript object &mdash; will be attached to
`this.data`, the same as query results. Whenever the current user is changed by
signing up, logging in, or logging out, or whenever that User Object is
modified, the component will be updated.

With this, it is simple to gate application behavior on whether the user is
logged in or not. For instance, if the value on `this.data` is `null`, render a
log in dialog; if the value is not `null`, render the application functionality
that requires a user.