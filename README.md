> ## WARNING ⚠️ - this project is not maintained, if you wish to maintain this project make yourself known ⚠️

# Parse + React

Seamlessly bringing Parse data into your React applications.

**NOTE**: Parse + React only supports the Parse JS SDK up to version 1.6.14. Behavior with 1.7.* is unpredictable, and 1.8.* breaks functionality with the new LiveQueries feature.
As developers, we want to encourage patterns that integrate easily into both the server and the client, and are working on a new low-level SDK that works well with Redux and React Native. When that codebase is ready for production apps, we will publish a new recommended starter kit for apps built on Parse & React.

[![Build Status](https://travis-ci.org/ParsePlatform/ParseReact.svg?branch=master)](https://travis-ci.org/ParsePlatform/ParseReact) [![npm version](https://badge.fury.io/js/parse-react.svg)](http://badge.fury.io/js/parse-react)

## Overview

Parse + React is an interface layer on top of the
[Parse JS SDK](https://parse.com/docs/js_guide) that provides simple access to
the Parse API from [React](http://facebook.github.io/react/). It lets React
components subscribe to Parse queries, and allows data mutations to be
dispatched in a Flux-style manner. In the background, these subscriptions are
managed in a way that lets these components automatically update as objects are
created and modified, allowing user interfaces to be snappy and responsive.

### [Full API](/docs/api/)

## Example

To add Parse data to a component, it simply needs to subscribe to a standard
Parse Query. This is done through an implementation of the [newly-proposed
`observe()` API](https://github.com/facebook/react/issues/3398) for React. The
ParseReact Mixin allows a version of this new lifecycle method to be used today
with Parse Queries.

If you're using React with ES6 classes, we also provide a [subclass of
`React.Component`](/docs/api/ES6.md) that allows you to use the
`observe()` and Query-specific APIs.

```js
var CommentBlock = React.createClass({
  mixins: [ParseReact.Mixin], // Enable query subscriptions

  observe: function() {
    // Subscribe to all Comment objects, ordered by creation date
    // The results will be available at this.data.comments
    return {
      comments: (new Parse.Query('Comment')).ascending('createdAt')
    };
  },

  render: function() {
    // Render the text of each comment as a list item
    return (
      <ul>
        {this.data.comments.map(function(c) {
          return <li>{c.text}</li>;
        })}
      </ul>
    );
  }
});
```

Whenever this component mounts, it will issue the query and the results will be
attached to `this.data.comments`. Each time the query is re-issued, or objects
are modified locally that match the query, it will update itself to reflect
these changes.

Mutations are dispatched in the manner of
[Flux](http://facebook.github.io/flux/) Actions, allowing updates to be
synchronized between many different components without requiring views to talk
to each other. All of the standard Parse data mutations are supported, and you
can read more about them in the [Data Mutation](/docs/DataMutations.md) guide.

```js
// Create a new Comment object with some initial data
ParseReact.Mutation.Create('Comment', {
  text: 'Parse <3 React'
}).dispatch();
```

## Getting Started

Parse + React  is available from [our CDN](https://www.parsecdn.com/js/parse-react.js)
([minified](https://www.parsecdn.com/js/parse-react.min.js)), and 
[npm](https://www.npmjs.com/package/parse-react).

If you're not familiar with React, we recommend you first walk through their
[tutorials](http://facebook.github.io/react/docs/tutorial.html) before adding
Parse data to your React applications.

Parse + React adds new functionality when React and the Parse JS SDK are used
together, and it requires that those libraries be in place before it is
initialized. The easiest way to do this is to load them on your page before
loading the Parse + React library:

```html
<html>
  <head>
    <script src="http://fb.me/react-0.13.3.min.js"></script>
    <script src="https://www.parsecdn.com/js/parse-latest.js"></script>
    <!-- Now include parse-react.js -->
    <script src="https://www.parsecdn.com/js/parse-react.js"></script>

    ...
```

If you're using a tool like Webpack or Browserify to enable Common JS `require`
statements, you need to make sure you also include the `'parse'` npm package
in your dependencies.

```js
var React = require('react');
var Parse = require('parse');
var ParseReact = require('parse-react');

// ...
```

As of version 1.6, the Parse JS SDK has a different build for React Native.
If you're using Parse+React on React Native, you'll need to require the
`'parse-react/react-native'` package instead.

```js
// For React Native apps
var React = require('react-native');
var Parse = require('parse/react-native');
var ParseReact = require('parse-react/react-native');
```

Now that you've included all of the necessary libraries, you're ready to start
[subscribing to Parse data](/docs/Subscriptions.md) and
[mutating it](/docs/DataMutations.md).

## Contributing

See the CONTRIBUTING file for information on how to help out.
