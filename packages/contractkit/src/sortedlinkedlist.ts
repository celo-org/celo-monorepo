import { BigNumber } from 'bignumber.js'

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export interface ListElement {
  key: string
  value: BigNumber
}

/**
 * Returns the two keys around element
 * @param elem Element to find lesser and greater keys for
 * @param sorted Descending sorted list
 */
export function getLesserAndGreaterKeys(elem: ListElement, sorted: ListElement[]) {
  const lesserElem = sorted.find((e) => e.value.lt(elem.value) && e.key !== elem.key)
  const lesserKey = lesserElem === undefined ? NULL_ADDRESS : lesserElem.key
  const greaterElem = sorted.reverse().find((e) => e.value.gt(elem.value) && e.key !== elem.key)
  const greaterKey = greaterElem === undefined ? NULL_ADDRESS : greaterElem.key
  return { lesserKey, greaterKey }
}
