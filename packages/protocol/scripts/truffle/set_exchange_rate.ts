/* tslint:disable:no-console */
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { BigNumber } from 'bignumber.js'
import { SortedOraclesInstance, StableTokenInstance } from 'types'

const fs = require('fs')
const parse = require('csv-parser')

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
const parseElements = (
  keys: string[],
  numerators: BigNumber[],
  denominators: BigNumber[]
): SortedElement[] =>
  keys.map((key, i) => ({
    key: key.toLowerCase(),
    numerator: numerators[i],
    denominator: denominators[i],
  }))

/**
 * Returns the two keys around element
 * @param element Element in the middle of lesser and greater keys
 * @param elements Sorted list of all reports from the SortedOracles contract for a currency pairing
 */
const getLesserAndGreater = (
  element: SortedElement,
  elements: SortedElement[]
): { lesserKey: string; greaterKey: string } => {
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

/*
 * A simple script to set the exchange rate.
 *
 * Expects the following flags:
 * csv: Filepath to csv of (timestamp, stableValue, goldValue) tuples
 * network: name of the network defined in truffle-config.js to set the exchange rate on
 * stableValue: StableToken component of exchange rate
 * goldValue: GoldToken component of exchange rate
 *
 * Run using truffle exec, e.g.:
 * truffle exec scripts/truffle/set_exchange_rate.js --network development \
 *   --stableValue 10 --goldValue 1
 *
 */
module.exports = async (callback: (error?: any) => number) => {
  try {
    const argv = require('minimist')(process.argv.slice(2), {
      string: ['network', 'csv', 'goldValue', 'stableValue'],
    })

    const oracles = await getDeployedProxiedContract<SortedOraclesInstance>(
      'SortedOracles',
      artifacts
    )
    const stableToken = await getDeployedProxiedContract<StableTokenInstance>(
      'StableToken',
      artifacts
    )
    // Takes numerator/denominator from passed value or from CSV file.
    let numerator, denominator
    if (argv.goldValue && argv.stableValue) {
      numerator = new BigNumber(argv.stableValue)
      denominator = new BigNumber(argv.goldValue)
    } else if (argv.csv) {
      let goldValue: string
      let stableValue: string
      const now = Math.floor(Date.now() / 1000)
      // Read the CSV
      await new Promise((resolve) => {
        fs.createReadStream(argv.csv)
          .pipe(parse())
          .on('data', (csvrow: any) => {
            if (new BigNumber(csvrow.timestamp).isLessThan(now)) {
              goldValue = csvrow.goldValue
              stableValue = csvrow.stableValue
            }
          })
          .on('finish', () => resolve())
      })
      if (!stableValue || !goldValue) {
        throw new Error('CSV file empty or all timestamps are in the future')
      }
      numerator = new BigNumber(stableValue)
      denominator = new BigNumber(goldValue)
    } else {
      callback(
        new Error('Not passed exchange rate nor could read a given CSV file to set exchange rate')
      )
    }
    // Find the keys to either side of our new oracle report
    const [keys, numerators, denominators] = await oracles.getRates(stableToken.address)
    const nodeAddress = (await web3.eth.getAccounts())[0]
    // Pick out lesser and greater based upon new list without our old report.
    const elements = parseElements(keys, numerators, denominators).filter(
      (e) => e.key !== nodeAddress
    )
    const { lesserKey, greaterKey } = await getLesserAndGreater(
      { key: nodeAddress, numerator, denominator },
      elements
    )
    // Report it
    await oracles.report(stableToken.address, numerator, denominator, lesserKey, greaterKey)
    callback()
  } catch (error) {
    callback(error)
  }
}
