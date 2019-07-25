import { BigNumber } from 'bignumber.js'
import Web3 from 'web3'
import { getSortedOraclesContract } from './contracts'
import { getLesserAndGreaterKeys } from './sortedlinkedlist'

interface FractionElements {
  0: string[]
  1: string[]
  2: string[]
  3: string[]
}

/**
 * Zips up arrays returned from SortedOracles getRates() for easy use.
 * @param keys Key array returned from getRates
 * @param numerators Numerators array returned from getRates
 * @param denominators Denominators array return from getRates
 */
function getValuesFromFractions(fractionElements: FractionElements) {
  const { 0: keys, 1: numerators, 2: denominators } = fractionElements
  return keys.map((key, i) => ({
    key: key.toLowerCase(),
    value: new BigNumber(numerators[i]).div(new BigNumber(denominators[i])),
  }))
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
  from: string,
  tokenAddress: string,
  numerator: BigNumber,
  denominator: BigNumber
) {
  const rate = numerator.div(denominator)

  const oracles = await getSortedOraclesContract(web3)
  const sortedFractions = await oracles.methods.getRates(tokenAddress).call()
  const sortedValues = getValuesFromFractions(sortedFractions)

  const { lesserKey, greaterKey } = await getLesserAndGreaterKeys(
    { key: from, value: rate },
    sortedValues
  )
  return oracles.methods.report(
    tokenAddress,
    numerator.toString(),
    denominator.toString(),
    lesserKey,
    greaterKey
  )
}
