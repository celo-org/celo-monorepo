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
