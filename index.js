(function () {
  'use strict';

  /**
   * Create a dictionary object, by default without a preexisting prototype chain
   * @param {Object} obj - An object with properties to assign to the empty object
   * @return {Object} The empty object with the assigned properties
   */
  const create = (obj, proto = null) => Object.assign(Object.create(proto), obj);

  /**
   * This signifies that the streamable function registers an event listener
   * @type {number}
   */
  const ADD = 1;

  /**
   * This signifies that the streamable function removes an event listener
   * @type {number}
   */
  const REMOVE = -1;

  /**
   * The list of streamable properties with their corresponding callback index
   */
  const streamableRegistry = create({
    addEventListener: {
      callbackIndex: 1,
      type: ADD,
    },
    removeEventListener: {
      callbackIndex: 1,
      type: REMOVE,
    },
    setTimeout: {
      callbackIndex: 0,
      type: ADD,
    },
    clearTimeout: {
      callbackIndex: 0,
      type: REMOVE,
    },
    setInterval: {
      callbackIndex: 0,
      type: ADD,
    },
    clearInterval: {
      callbackIndex: 0,
      type: REMOVE,
    },
    on: { // jQuery, EventEmitter
      callbackIndex: 1,
      type: ADD,
    },
    off: { // jQuery
      callbackIndex: 1,
      type: REMOVE,
    }, // EventEmitter
    removeListener: {
      callbackIndex: 1,
      type: REMOVE,
    },
  });

  /**
   * Check if a function name is in the list of streamables
   * @param {string} name - The function name
   * @return {boolean} Whether it is in the list or not
   */
  const isStreamable = name => !!streamableRegistry[name];

  /**
   * Get an event function signature from the streamable list
   * @param {string} name - The name of the function
   * @return {Object} The function signature
   */
  const getStreamable = (name) => streamableRegistry[name];

  /**
   * Add an event function to the streamable list
   * @param {string} name - The name of the function
   * @param {Object} config - The original function name
   * @param {number|null} config.callbackIndex - The nth parameter where the callback goes (zero-based)
   * @param {(ADD|REMOVE)} config.type - Is it an ADD or REMOVE action
   * @return {boolean} Success or failure
   */
  const addStreamable = (name, config) => !streamableRegistry[name] ? !!(streamableRegistry[name] = config) : false;

  /**
   * The list of shorthand aliases for functions
   */
  const aliasRegistry = create({
    add: 'addEventListener',
    remove: 'removeEventListener',
  });

  /**
   * Seek the function name for an alias
   * @param {String} alias - The alias to be sought
   * @return {String} The real function name
   */
  const getAlias = alias => aliasRegistry[alias] ? aliasRegistry[alias] : alias;

  /**
   * Add an alias for an existing function name
   * @param {String} alias - The alias to add
   * @param {String} name - The original function name
   * @return {Boolean} Success or failure
   */
  const addAlias = (alias, name) => !aliasRegistry[alias] ? !!(aliasRegistry[alias] = name) : false;

  /**
   * The object recognition regex
   * @type {RegExp}
   */
  const objectRegex = /^\[object/;

  /**
   * Check if a value is an object (functions count as well)
   * @param {*} obj - The value to be checked
   * @return {boolean}
   */
  const isObject = obj => objectRegex.test(Object.prototype.toString.call(obj));

  /**
   * Check if a value is a function
   * @param {*} fn - The value to be checked
   * @return {boolean}
   */
  const isFunction = fn => typeof fn === 'function';

  /**
   * Check if a value is a number (only number primitives)
   * @param {*} number - The value to be checked
   * @return {boolean}
   */
  const isNumber = number => number === Number(number);

  /**
   * Check if a value is a common iterable
   * @param {*} obj - The value to be check
   * @return {boolean}
   */
  const isIterable = obj => isFunction(obj[Symbol.iterator]);

  /**
   * A symbol to mark all stream instances
   * @type {Symbol}
   */
  const $$stream = Symbol('stroxy-stream');


  /**
   * Remove an entry from an array
   * @param {*} entry - The entry to be removed from the array
   * @param {Array} array - The array from which to remove the entry
   * @returns {Array}
   */
  function removeEntry(entry, array) {
    array = array.slice();
    const index = array.indexOf(entry);
    array.splice(index, 1);
    return array;
  }

  /**
   * Run an array of stream instances
   * Should only be called from child instances (with pipes)
   * @param {Array} instances - The list of instances
   * @param {*} value - The current value of the parent
   */
  function runInstances(instances, value) {
    instances = instances.slice();
    return instances.map((instance) => {
      instance._value = instance.pipes.reduce((val, fn) => {
        return fn(val, value);
      }, value);
      return instance;
    });
  }

  /**
   * Run all value listeners in the same order as they were registered
   * @param {Object} stream - The stream (parent) instance
   */
  function runValueListeners(stream) {
    stream.valueListeners.forEach(({listener, instance}) => {
      listener(instance._value);
    });
  }

  /**
   * Get the current (parent) stream, from either a parent or a child stream
   * @param {Object} thisValue - The stream (parent) instance
   * @return { Object } - The correct context for managing instances and value listeners
   */
  function getContext(thisValue) {
    return thisValue.parent ? thisValue.parent : thisValue;
  }


  /**
   * The prototypal object for both parent and child streams
   */
  const streamProto = {
    /**
     * Mark every stream and child stream (through the prototype chain) as such
     */
    [$$stream]: true,
    /**
     * The list of instances on the parent
     */
    instances: [],
    /**
     * The list of value listeners on the parent and child streams
     */
    valueListeners: [],
    /**
     * Add a pipe to the current stream
     * If there are no prior pipes, a child instance for the pipes is created
     * @param {Function} fn - The function to be called in the pipe
     * @returns {Object} The stream instance
     */
    pipe(fn) {
      if (!this.parent) {
        const instance = create({
          _value: this._value,
          parent: this,
          pipes: [fn],
          valueOf: null,
        }, this);

        this.instances.push(instance);

        return instance;
      }

      this.pipes.push(fn);
      return this;
    },
    /**
     * Register a listener to be called when the event is triggered and the value thus changed
     * @param {Function} listener - The listener function
     */
    onValue(listener) {
      const context = getContext(this);

      context.valueListeners.push({
        listener,
        instance: this,
      });
    },
    /**
     * Remove a valuelistener
     * @param {Function} listener - The listener function
     */
    offValue(listener) {
      const context = getContext(this);

      context.valueListeners = removeEntry(listener, context.valueListeners);
    },
    /**
     * Remove a child stream from the loop
     * @param {Object} instance - The child stream to be removed
     */
    remove(instance) {
      if (this.parent) {
        console.warn('Cannot remove child stream from another child stream.'
        + 'Did you want to remove it from the parent stream?');
        return false;
      }

      this.instances = removeEntry(instance, this.instances);

      this.valueListeners = this.valueListeners.filter(({ instance: listenerInstance }) => {
        return listenerInstance !== instance;
      });
    },
    /**
     * Returns an event listener which can be registered by event registering functions
     * Could also be manually registered if so desired
     * @returns {Function} The actual event listener
     */
    event() {
      if (this.eventFunction) {
        return this.eventFunction;
      }

      return this.eventFunction = (value) => {
        if (this.parent) {
          console.warn(`Child streams can't have their own event listeners.`);
          return false;
        }

        this._value = value;

        this.instances = runInstances(this.instances, value);

        runValueListeners(this);
      };
    },
  };


  /**
   * Creates a new stream instance
   * Primarily used in the stroxy function
   * @returns {Object} The freshly created stream
   */
  function createStream() {
    return create({
      instances: [],
      valueListeners: [],
    }, streamProto);
  }

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

}());
//# sourceMappingURL=index.js.map