# ES6 Component Class

If you're writing an application with ES6 classes, it's not possible to
integrate the Parse + React Mixin. In those cases, you can extend
`ParseReact.Component`: a subclass of `React.Component` that allows the
observation of Parse Queries and Local Subscriptions.

Because `ParseReact.Component` depends on your `React` singleton, you need to
pass your instance of React to it. The class returned from calling
`ParseReact.Component()` will extend `React.Component`, and can be used anywhere
a standard Component can be used.

```js
var React = require('react');
var ParseReact = require('parse-react');
var ParseComponent = ParseReact.Component(React);

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
`ParseReact.Component`. A list of these supported methods is available in [the
Mixin documentation](/docs/api/Mixin.md).
