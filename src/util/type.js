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
export const isObject = obj => objectRegex.test(Object.prototype.toString.call(obj));

/**
 * Check if a value is a function
 * @param {*} fn - The value to be checked
 * @return {boolean}
 */
export const isFunction = fn => typeof fn === 'function';

/**
 * Check if a value is a number (only number primitives)
 * @param {*} number - The value to be checked
 * @return {boolean}
 */
export const isNumber = number => number === Number(number);

/**
 * Check if a value is a NodeList
 * @param {*} obj - The value to be checked
 * @return {boolean}
 */
export const isNodeList = obj => typeof NodeList !== 'undefined' ? NodeList.prototype.isPrototypeOf(obj) : false;

/**
 * Check if a value is a common iterable
 * @param {*} obj - The value to be check
 * @return {boolean}
 */
export const isIterable = obj => isNodeList(obj) || Array.isArray(obj) || isFunction(obj[Symbol.iterator]);