import { BigNumber } from 'bignumber.js'

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

interface ListElement {
  key: string
  value: BigNumber
}

/**
 * Returns the two keys around element
 * @param elem Element to find lesser and greater keys for
 * @param sorted Descending sorted list
 */
export function getLesserAndGreaterKeys(elem: ListElement, sorted: ListElement[]) {
  const lesserElem = sorted.find((e) => e.value < elem.value && e.key !== elem.key)
  const lesserKey = lesserElem === undefined ? NULL_ADDRESS : lesserElem.key
  const greaterElem = sorted.reverse().find((e) => e.value > elem.value && e.key !== elem.key)
  const greaterKey = greaterElem === undefined ? NULL_ADDRESS : greaterElem.key
  return { lesserKey, greaterKey }
}
