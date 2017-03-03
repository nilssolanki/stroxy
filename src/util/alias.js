import { create } from 'util/create';

/**
 * The list of shorthand aliases for functions
 */
export const aliasRegistry = create({
  add: 'addEventListener',
  remove: 'removeEventListener',
});

/**
 * Seek the function name for an alias
 * @param {String} alias - The alias to be sought
 * @return {String} The real function name
 */
export const getAlias = alias => aliasRegistry[alias] ? aliasRegistry[alias] : alias;

/**
 * Add an alias for an existing function name
 * @param {String} alias - The alias to add
 * @param {String} name - The original function name
 * @return {Boolean} Success or failure
 */
export const addAlias = (alias, name) => !aliasRegistry[alias] ? !!(aliasRegistry[alias] = name) : false;
