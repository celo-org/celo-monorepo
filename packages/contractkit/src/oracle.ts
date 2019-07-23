import { BigNumber } from 'bignumber.js'
import { getSortedOraclesContract } from 'src/contracts'
import Web3 from 'web3'

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

interface SortedElement {
  key: string
  numerator: BigNumber
  denominator: BigNumber
}

/**
 * Zips up arrays returned from SortedOracles getRates() for easy use.
 * @param keys Key array returned from getRates
 * @param numerators Numerators array returned from getRates
 * @param denominators Denominators array return from getRates
 */
function parseElements(
  keys: string[],
  numerators: string[],
  denominators: string[]
): SortedElement[] {
  return keys.map((key, i) => ({
    key: key.toLowerCase(),
    numerator: new BigNumber(numerators[i]),
    denominator: new BigNumber(denominators[i]),
  }))
}

/**
 * Returns the two keys around element
 * @param element Element in the middle of lesser and greater keys
 * @param elements Sorted list of all reports from the SortedOracles contract for a currency pairing
 */
function getLesserAndGreater(
  element: SortedElement,
  elements: SortedElement[]
): { lesserKey: string; greaterKey: string } {
  let lesserKey = NULL_ADDRESS
  let greaterKey = NULL_ADDRESS
  const value = element.numerator.div(element.denominator)
  // Iterate from each end of the list towards the other end, saving the key with the
  // smallest value >= `value` and the key with the largest value <= `value`.
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].key !== element.key.toLowerCase()) {
      if (elements[i].numerator.div(elements[i].denominator).gte(value)) {
        greaterKey = elements[i].key
      }
    }
    const j = elements.length - i - 1

    if (elements[j].key !== element.key.toLowerCase()) {
      if (elements[j].numerator.div(elements[j].denominator).lte(value)) {
        lesserKey = elements[j].key
      }
    }
  }
  return { lesserKey, greaterKey }
}

/**
 * Makes an oracle exchange rate report TX object. Calls but does not send transactions.
 * Handles figuring out where to insert the report in the sorted linked list.
 * @param web3 Web3 provider of the node the TX will be sent from.
 * @param tokenAddress Token address to make the report on.
 * @param numerator Token's portion of the exchange rate.
 * @param denominator Gold's portion of the exchange rate.
 */
export async function makeReportTx(
  web3: Web3,
  tokenAddress: string,
  numerator: BigNumber,
  denominator: BigNumber
) {
  const oracles = await getSortedOraclesContract(web3)
  // Find the keys to either side of our new oracle report. Destructuring is a little hacky.
  const { 0: keys, 1: numerators, 2: denominators } = await oracles.methods
    .getRates(tokenAddress)
    .call()
  const nodeAddress = (await web3.eth.getAccounts())[0]
  // Pick out lesser and greater based upon new list without our old report.
  const elements = parseElements(keys, numerators, denominators).filter(
    (e) => e.key !== nodeAddress
  )
  const { lesserKey, greaterKey } = await getLesserAndGreater(
    { key: nodeAddress, numerator, denominator },
    elements
  )
  return oracles.methods.report(
    tokenAddress,
    numerator.toString(),
    denominator.toString(),
    lesserKey,
    greaterKey
  )
}
