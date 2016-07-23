# Stroxy

A simple streaming wrapper for native event functions using ES2015 proxies.

[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

## Installation

    npm i -S stroxy

## Examples

### Simple click handler
```js
const doc = stroxy(document);
const clicks = doc.documentElement.addEventListener('click'); // or use .add('click'); shorthand

clicks.onValue(value => console.log('clicked in document'));
```


### Click handler to get classnames
```js
const doc = stroxy(document);
const clicks = doc
  .querySelectorAll('.link') // works on NodeLists as well!
  .addEventListener('click');

// Check if link is 'primary'
const isPrimary = clicks.pipe(e => (e.preventDefault(), e.target.className));

const listener = value => console.log('Classnames of clicked link:', value);

isPrimary.onValue(listener);
```

### Remove value listener
```js
clicks.offValue(listener);
```

### Remove child stream

`isPrimary.onValue` will not be called anymore
```js
doc
  .querySelectorAll('.link')
  .removeEventListener('click', clicks); // or use .remove('click', isPrimary);
// or explicitly

clicks.remove(isPrimary);
```

### Remove handler
```js
doc
  .querySelectorAll('.link')
  .removeEventListener('click', linkStream); // or use .remove('click', linkStream);
```

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
```js
const clicks = doc
  .querySelectorAll('.link') // works on NodeLists as well!
  .addEventListener('click'); // or use .add('click'); shorthand

const childStream = clicks.pipe(v => v);

childStream.pipe(w => w);

// Don't do this!
childStream.pipe(x => x);
```

Ideas to resolve to this issue are highly appreciated :)

## Source of Inspiration

The whole concept is heavily inspired by [bacon.js](https://baconjs.github.io/), although stroxy is a lot less versatile.

Special thanks to @gianlucaguarini for the inspiration.

## Name

The name is a very bland combination of the words `stream` and `proxy`.


[travis-image]:https://img.shields.io/travis/nilssolanki/stroxy.svg?style=flat-square
[travis-url]:https://travis-ci.org/nilssolanki/stroxy

[license-image]:http://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:LICENSE.txt

[npm-version-image]:http://img.shields.io/npm/v/stroxy.svg?style=flat-square
[npm-downloads-image]:http://img.shields.io/npm/dm/stroxy.svg?style=flat-square
[npm-url]:https://npmjs.org/package/stroxy
