/**
 * Create a dictionary object without a preexisting prototype chain
 * @param {Object} obj - An object with properties to assign to the empty object
 * @return {Object} The empty object with the assigned properties
 */
export const createEmpty = obj => Object.assign(Object.create(null), obj);