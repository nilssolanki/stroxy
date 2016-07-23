import { ADD, REMOVE, isStreamable, getStreamable, addStreamable } from 'util/streamable';
import { getAlias, addAlias } from 'util/alias';
import { isObject, isFunction, isNumber, isIterable } from 'util/type';

import { createStream } from 'stream';

/**
 * A symbol to mark all stroxified objects
 * @type {Symbol}
 */
const $$stroxy = Symbol('stroxy');

/**
 * Is called when `get` property name is one of the event handler ones
 * @param {Object} target - The dom node on which the listener sits
 * @param {string} property - The event function name (e.g. addEventListener)
 * @returns {Object|undefined} The stream for the current event or nothing in a removal event
 */
function applyListener(target, property) {
  const targetIterable = isIterable(target);
  const fn = targetIterable ? target[0][property] : target[property];

  if (!isFunction(fn)) {
    return target[property];
  }
  
  return function (...args) {
    let stream, value;
    const { type, callbackIndex } = getStreamable(property);

    // Splice the stream into the arguments list
    // If a callbackIndex is defined
    if (isNumber(callbackIndex)) {
      if (type === ADD) {
        stream = createStream();
      } else {
        [stream] = args.splice(callbackIndex, 1);

        if (stream.parent) {
          stream.parent.remove(stream);
          return;
        }
      }

      const event = stream.event().hasOwnProperty('valueOf') ? stream.event().valueOf() : stream.event();

      args.splice(callbackIndex, null, event);
    }

    // Apply for all targets entries if it is a NodeList or an Array
    if (targetIterable) {
      Array.from(target).forEach((node) => {
        Reflect.apply(node[property], node, args);
      });
    } else {
      value = Reflect.apply(target[property], target, args);

      if (stream && value != null) {
        stream.event().valueOf = x => value;
      }
    }

    return stream;
  }
}

/**
 * The core wrapper function
 * Pass in an object (e.g. document) and the event will be
 * @param {Object|Function} obj - The object or function which should be stroxified
 * @param {string} prop - The property name to be used on the object, mainly used for recursive calls
 * @returns {Object|Function} The stroxified object or function
 */
function stroxy(obj, prop) {
  return new Proxy(prop ? obj[prop] : obj, {
    get(target, property) {
      const result = target[property];
      const name = getAlias(property);
      
      if (isStreamable(name)) {
        return applyListener(target, name);
      }

      // Confirm that this is a stroxified object
      if (property === $$stroxy) {
        return true;
      }

      if (isObject(result)) {
        return stroxy(target, property);
      }

      return result;
    },
    apply(target, context, args) {
      const res = Reflect.apply(target, obj, args);

      if (isObject(res)) {
        return stroxy(res);
      }

      return res;
    },
  });
}

stroxy = Object.assign(stroxy, {
  addStreamable,
  addAlias,
  ADD,
  REMOVE,
});

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = exports.default = stroxy;
} else if (typeof window === 'object') {
  window.stroxy = stroxy;
}