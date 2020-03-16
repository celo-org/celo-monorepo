/**
 * Used to assure switch case exhaustiveness in TypeScript
 */
export const assertUnreachable = (x: never): never => {
  throw new Error("Didn't expect to get here")
}

/**
 * Utility type to extract external Props of a component (respecting defaultProps)
 * See https://github.com/Microsoft/TypeScript/issues/26704
 * Usage: ExtractProps<typeof SomeComponent>
 */
export type ExtractProps<
  T extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>
> = JSX.LibraryManagedAttributes<T, React.ComponentProps<T>>

/**
 * Utility to workaround TypeScript not inferring a non nullable type when filtering null objects:
 * array.filter(x => !!x) should refine Array<T|null> to Array<T>, but it doesn't for now.
 *
 * Usage: array.filter(isPresent)
 * See https://github.com/microsoft/TypeScript/issues/16069#issuecomment-565658443
 */

export function isPresent<T>(t: T | undefined | null | void): t is T {
  return t !== undefined && t !== null
}

// As per https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
export function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + x)
}
