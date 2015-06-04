# ES6 Component Class

If you're writing an application with ES6 classes, it's not possible to
integrate the Parse + React Mixin. In those cases, you can extend
`ParseComponent`: a subclass of `React.Component` that allows the observation of
Parse Queries and Local Subscriptions.

By default, `ParseComponent` will not be loaded into your application. You can
include it by requiring the `'parse-react/class'` subpackage.

```js
var ParseComponent = require('parse-react/class');

class MyComponent extends ParseComponent {
  constructor() {
    super();
    // Initialize MyComponent
    // ...
  }

  // By extending ParseComponent, it is possible to observe queries
  observe(props, state) {
    return {
      items: new Parse.Query('Item')
    };
  }

  render() {
    // Render MyComponent
    // ...
  }
}
```

All of the methods available from `ParseReact.Mixin` are also available on
`ParseComponent`. A list of these supported methods is available in [the Mixin
documentation](/docs/api/Mixin.md).
