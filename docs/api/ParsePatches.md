# Parse SDK Patches

Parse + React patches the Parse JS SDK in order to add extra, React-specific
functionality. In addition to making Parse Queries subscribable, it also adds
the following method to the prototype of `Parse.Object`:

### `object.toPlainObject()`

Creates a flattened, immutable copy of a Parse.Object. This is ideal for
converting the results of a Cloud Function into immutable, plain objects that
ParseReact is designed to handle.