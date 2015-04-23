# AnyBudget: A Parse + React Demo

This demo is a bit more complex than the Todo demo, and includes concepts like
handling user login or adding ACLs to objects. It also demonstrates how multiple
components automatically respond when data is modified, and how multiple
components with the same queries will all wait on a single request.

When building an application like this, we would ideally have a single query for
fetching the expenses, and pass those objects to the different pieces of the app
that needed them. This would prevent the need to load data whenever switching
tabs. However, we wanted to demonstrate how components with the same query
cooperate, so we intentionally subscribed multiple sibling components to the
queries.

# Running the demo

First, you'll need to set up a new Parse app at [Parse.com](https://parse.com).
This is where we'll store the remote data for your Todo list demo. Once you've
done this, insert your app's Application Id and JavaScript Key into the Parse
initialization call in [`app.js`](js/app.js).

To run the application, you must have [`npm`](https://www.npmjs.org/) installed.
Once that is in place, you can build the app by running the following commands
from the `todo/` directory.

```
npm install
npm start
```

The first line installs the necessary tools, and the second starts a watcher
process that compiles the application any time files are changed. If you don't
intend on modifying the files in any way, you can kill it after it has built
`bundle.js` with `Ctrl-C`.

Open the `index.html` file, and you should see an empty Todo list. Try adding,
editing, and deleting entries. If you open the network activity tab on your
browser, you can see the updates happening before the network requests complete.