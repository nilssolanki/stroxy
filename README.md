# Stroxy

A simple streaming wrapper for native event functions using ES2015 proxies.

## Installation

    npm install -S stroxy

## Examples

### Simple click handler

    const doc = stroxy(document);
    const linkStream = doc.documentElement.addEventListener('click'); // or use .add('click'); shorthand
    
    linkStream.onValue(value => console.log('clicked in document'));


### Click handler to get classnames

    const doc = stroxy(document);
    const linkStream = doc
      .querySelectorAll('.link') // works on NodeLists as well!
      .addEventListener('click');
    
    // Check if link is 'primary'
    const isPrimary = linkStream
      .pipe(e => (e.preventDefault(), e.target.className));

    const listener = value => console.log('Classnames of clicked link:', value);

    isPrimary
      .onValue(listener);

### Remove value listener

    isPrimary
      .offValue(listener);

### Remove child stream

`isPrimary.onValue` will not be called anymore

    doc
      .querySelectorAll('.link')
      .removeEventListener('click', linkStream); // or use .remove('click', isPrimary);
    // or explicitly
    linkStream.remove(isPrimary);

### Remove handler

    doc
      .querySelectorAll('.link')
      .removeEventListener('click', linkStream); // or use .remove('click', linkStream);

## Stroxy API

### Stroxy

#### stroxy(obj);

Returns a stroxified object on which certain methods (see Streamable Methods) return a stream.

#### stroxy.addStreamable(name, config);

Add a method signature that should be streamed.

`name`: The name of the method property
`config.callbackIndex`: Which nth-parameter is the callback of the function
`config.type`: Is it an event-adder or an event remover. Values: (stroxy.ADD|stroxy.REMOVE)

#### stroxy.addAlias(alias, name);

Add an Alias for a method signature. E.g. `add` is an alias for `addEventListener`.

`alias`: The shorthand name
`name`: The streamable function name (has to be registered in the Streamable Methods as well)

### Stream

Streams are created when invoking a Streamable Method.
E.g. `const intervalStream = stroxy(window).setInterval(400);`

#### stream.pipe(fn);

Adds a function to the current stream. Pipes can be added to pipes. See Limitations about child streams though.
The `fn` arguments will be what either the streamable function passes into the callback, or what the last pipe returns.

#### stream.onValue(fn);

Adds a listener function to the current stream or child stream to listen for changes.

#### stream.offValue(fn);

Remove a listener function from the current stream/child stream.

#### stream.remove(childStream);

Remove a child stream from the parent: Pipes and value listeners of the child stream will be unregistered.

## Streamable Methods

Stroxy only works on certain methods and method signatures. Currently the following are supported:

* `addEventListener` (and `add` alias)
* `removeEventListener` (and `remove` alias)
* `setTimeout`
* `clearTimeout`
* `setInterval`
* `clearInterval`
* `on` (jQuery, EventEmitter)
* `off` (jQuery)
* `removeListener` (EventEmitter)

## Limitations

Currently it isn't possible to create multiple children of child streams.
Doing so will result in strange behavior:

    const linkStream = doc
      .querySelectorAll('.link') // works on NodeLists as well!
      .addEventListener('click'); // or use .add('click'); shorthand

    const childStream = linkStream.pipe(v => v);

    childStream
      .pipe(w => w);

    // Don't do this!
    childStream
      .pipe(x => x);

Ideas to resolve to this issue are always appreciated :)

## Source of Inspiration

The whole concept is heavily inspired by [bacon.js](https://baconjs.github.io/), although stroxy is a lot less versatile.

Special thanks to @gianlucaguarini for the inspiration.

## Name

The name is a very bland combination of the words `stream` and `proxy`.