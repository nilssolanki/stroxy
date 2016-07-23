/**
 * A symbol to mark all stream instances
 * @type {Symbol}
 */
export const $$stream = Symbol('stroxy-stream');


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
export const streamProto = {
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
      const instance = Object.assign(Object.create(this), {
        _value: this._value,
        parent: this,
        pipes: [fn],
        valueOf: null,
      });

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
export function createStream() {
  return Object.assign(Object.create(streamProto), {
    instances: [],
    valueListeners: [],
  });
}