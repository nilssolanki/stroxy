import { createEmpty } from 'util/create-empty';

/**
 * This signifies that the streamable function registers an event listener
 * @type {number}
 */
export const ADD = 1;

/**
 * This signifies that the streamable function removes an event listener
 * @type {number}
 */
export const REMOVE = -1;

/**
 * The list of streamable properties with their corresponding callback index
 */
export const streamableRegistry = createEmpty({
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
export const isStreamable = name => !!streamableRegistry[name];

/**
 * Get an event function signature from the streamable list
 * @param {string} name - The name of the function
 * @return {Object} The function signature
 */
export const getStreamable = (name) => streamableRegistry[name];

/**
 * Add an event function to the streamable list
 * @param {string} name - The name of the function
 * @param {Object} config - The original function name
 * @param {number|null} config.callbackIndex - The nth parameter where the callback goes (zero-based)
 * @param {(ADD|REMOVE)} config.type - Is it an ADD or REMOVE action
 * @return {boolean} Success or failure
 */
export const addStreamable = (name, config) => !streamableRegistry[name] ? !!(streamableRegistry[name] = config) : false;