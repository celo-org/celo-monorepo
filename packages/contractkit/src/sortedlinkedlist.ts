import { BigNumber } from 'bignumber.js'

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

interface ListElement {
  key: string
  value: BigNumber
}

/**
 * Returns the two keys around element
 * @param newElement Element to find lesser and greater keys for
 * @param sortedElements Descending sorted list
 */
export function getLesserAndGreaterKeys(newElement: ListElement, sortedElements: ListElement[]) {
  const lesserElem = sortedElements.find((elem) => elem.value < newElement.value)
  const lesserKey = lesserElem === undefined ? NULL_ADDRESS : lesserElem.key
  const greaterElem = sortedElements.reverse().find((elem) => elem.value > newElement.value)
  const greaterKey = greaterElem === undefined ? NULL_ADDRESS : greaterElem.key
  return { lesserKey, greaterKey }
}
