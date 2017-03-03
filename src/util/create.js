/**
 * Create a dictionary object, by default without a preexisting prototype chain
 * @param {Object} obj - An object with properties to assign to the empty object
 * @return {Object} The empty object with the assigned properties
 */
export const create = (obj, proto = null) => Object.assign(Object.create(proto), obj);
