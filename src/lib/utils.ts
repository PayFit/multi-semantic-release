/**
 * Lifted and tweaked from semantic-release because we follow how they bump their packages/dependencies.
 * https://github.com/semantic-release/semantic-release/blob/master/lib/utils.js
 */

/**
 * Check if a value is defined or not
 *
 * @param value
 * @returns
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

/**
 * Check if a value is not null
 *
 * @param value
 * @returns
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null
}
