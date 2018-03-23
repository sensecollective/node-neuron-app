// @flow

/**
 * Checks if given variable is some class definition.
 *
 * @param v Variable to check
 * @return {Boolean}
 */
export function isClass(v: any): boolean {
  return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
}
