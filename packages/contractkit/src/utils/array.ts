/**
 * Returns an array [0, 1, ..., to - 1]
 *
 * @param to the exclusive limit of the array.
 */
// TODO: move this to @celo/base when that package is in master
export function zeroRange(to: number): number[] {
  return Array.from(Array(to).keys())
}
