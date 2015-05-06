# Mixin API

When you add the `ParseReact.Mixin` object to your component's list of mixins,
it adds support for the `observe()` lifecycle function.

### `observe(props, state)`
Called whenever the component will update, before it renders.
At mount time, the initial `props` and `state` are passed as function parameters.
Each successive time, the upcoming `props` and `state` are passed as parameters.
This is because the method is called from `componentWillUpdate`.
This method should return an object of key/value pairs, where each key denotes
the name of a subscription, and each value is a Parse Query or
[Local Subscription](/docs/api/LocalSubscriptions.md).

Additionally, it adds the following methods to the component:

### `pendingQueries()`
Returns an array containing the names of queries that are currently waiting for
results.

### `queryErrors()`
Returns a map of query names to the error they encountered on the last request,
if there was one.

### `refreshQueries([queryNames])`
Forces a query to fetch new results. If `queryNames` is not provided, it will
check the status of every query attached to this object.

- `queryNames` (optional): A query name, or array of query names. The queries
with those names will be refreshed.
