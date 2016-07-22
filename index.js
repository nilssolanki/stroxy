var stroxy = (function () {
  'use strict';

  const ADD = 1;
  const REMOVE = -1;

  const $$stream = Symbol('stream');

  const createEmpty = obj => Object.assign(Object.create(null), obj);

  /**
   * The list of shorthand aliases for functions
   */
  const aliasRegistry = createEmpty({
    add: 'addEventListener',
    remove: 'removeEventListener',
  });

  /**
   * The list of streamable properties with their corresponding callback index
   */
  const streamableRegistry = createEmpty({
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
    }, // jQuery
    off: {
      callbackIndex: 1,
      type: REMOVE,
    }, // EventEmitter
    removeListener: {
      callbackIndex: 1,
      type: REMOVE,
    },
  });

  const getAlias = alias => aliasRegistry[alias] ? aliasRegistry[alias] : alias;
  const addAlias = (alias, name) => !aliasRegistry[alias] ? aliasRegistry[alias] = name : false;

  const isStreamable = name => !!streamableRegistry[name];
  const addStreamable = (name, config) => !streamableRegistry[name] ? streamableRegistry[name] = config : false;

  const objectRegex = /^\[object/;
  const isObject = obj => objectRegex.test(Object.prototype.toString.call(obj));
  const isFunction = fn => typeof fn === 'function';
  const isNumber = number => number === Number(number);
  const isNodeList = obj => typeof NodeList !== 'undefined' ? NodeList.prototype.isPrototypeOf(obj) : false;

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
    instances.forEach((instance) => {
      instance._value = instance.pipes.reduce((val, fn) => {
        return fn(val, value);
      }, value);
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
   * The prototypal object for both parent and child streams
   */
  const streamProto = {
    [$$stream]: true,
    instances: [],
    valueListeners: [],
    /**
     * Add a pipe to the current stream
     * If there are no prior pipes, a child instance for the pipes is created
     * @param {Function} fn - The function to be called in the pipe
     * @returns {Object} The stream instance
     */
    pipe(fn) {
      if (!this.parent) {
        const instance = Object.create(this);
        instance.pipes = [fn];
        instance._value = this._value;
        instance.parent = this;
        instance.valueOf = null;
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
      const {valueListeners} = this.parent ? this.parent : this;

      valueListeners.push({
        listener,
        instance: this,
      });
    },
    /**
     * Remove a valuelistener
     * @param {Function} listener - The listener function
     */
    offValue(listener) {
      const {valueListeners} = this.parent ? this.parent : this;

      this.valueListeners = removeEntry(listener, this.valueListeners);
    },
    /**
     * Remove a child stream from the loop
     * @param {Object} object - The listener function
     */
    remove(instance) {
        this.instances = removeEntry(instance, this.instances);

        this.valueListeners = this.valueListeners.filter(({ instance: listenerInstance }) => {
          return listenerInstance !== instance;
        });
    },
    /**
     * Returns a function which is triggered by the JS event loop, whenever an event occurs
     * @returns {Function} The actual event listener
     */
    event() {
      if (this.eventFunction) {
        return this.eventFunction;
      }

      return this.eventFunction = (value) => {
        if (this.parent) {
          return;
        }

        this._value = value;

        runInstances(this.instances, value);

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
    return Object.assign(Object.create(streamProto), {
      instances: [],
      valueListeners: [],
    });
  }

  /**
   * Is called when `get` property name is one of the event handler ones
   * @param {Object} target - The dom node on which the listener sits
   * @param {string} property - The event function name (e.g. addEventListener)
   * @returns {Object|undefined} The stream for the current event or nothing in a removal event
   */
  function applyListener(target, property) {
    return function (...args) {
      let stream, value;
      const { type, callbackIndex } = streamableRegistry[property];

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
      if (isNodeList(target) || Array.isArray(target)) {
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
   * @param {String} prop - The property name to be used on the object, mainly used for recursive calls
   * @returns {Object|Function} The stroxified object or function
   */
  function stroxy(obj, prop) {
    return new Proxy(prop ? obj[prop] : obj, {
      get(target, property) {
        const result = target[property];

        const name = getAlias(property);

        if (isStreamable(name) && isFunction(result)) {
          return applyListener(target, name);
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

  if (isObject(module)) {
    module.exports = exports.default = stroxy;
  } else {
    return stroxy;
  }
})();