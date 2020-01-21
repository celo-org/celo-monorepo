/**
 * Used to assure switch case exhaustiveness in TypeScript
 */
export const assertUnreachable = (x: never): never => {
  throw new Error("Didn't expect to get here")
}

/**
 * Utility type to infer the Props of a ComponentType
 * Inspired by https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react-navigation/index.d.ts
 */
export type InferProps<T extends React.ComponentType<any>> = T extends React.ComponentType<infer P>
  ? P
  : never

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
