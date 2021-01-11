import { ensureLeading0x } from '@celo/base'
import { eqAddress, NULL_ADDRESS } from '@celo/base/lib/address'
import { Address, CeloTransactionObject, toTransactionObject } from '@celo/connect'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { keccak256 } from 'ethereumjs-util'
import { Branded } from 'io-ts'
import { CeloContract, CeloToken } from '../base'
import { SortedOracles } from '../generated/SortedOracles'
import {
  BaseWrapper,
  proxyCall,
  secondsToDurationString,
  valueToBigNumber,
  valueToFrac,
  valueToInt,
} from './BaseWrapper'

export enum MedianRelation {
  Undefined,
  Lesser,
  Greater,
  Equal,
}

export interface SortedOraclesConfig {
  reportExpirySeconds: BigNumber
}

export interface OracleRate {
  address: Address
  rate: BigNumber
  medianRelation: MedianRelation
}

export interface OracleTimestamp {
  address: Address
  timestamp: BigNumber
  medianRelation: MedianRelation
}

export interface OracleReport {
  address: Address
  rate: BigNumber
  timestamp: BigNumber
}

export interface MedianRate {
  rate: BigNumber
}

export type CurrencyPairIdentifier = Branded<Address, 'PairIdentifier'>

/**
 * Used to construct the pair identifier from a pair label (e.g. CELO/BTC)
 * The pair identifier needs to be a valid ethereum address, thus we
 * truncate a keccak of the pair label.
 * This function returns a branded type which can be fed into the wrapper.
 * @param pair a string
 */
export const pairIdentifier = (pair: string): CurrencyPairIdentifier => {
  return ensureLeading0x(
    keccak256(pair)
      .slice(0, 20)
      .toString('hex')
  ) as CurrencyPairIdentifier
}

/**
 * This will act as an enum of common pairs.
 * We can't use a straight enum because we want the value
 * to be a ReportTarget
 *
 * E.g. usage: sortedOracles.getRates(OracleCurrencyPair.CELOBTC)
 */
type defaultPairs = 'CELOBTC' | 'CELOUSD'
export const OracleCurrencyPair: Record<defaultPairs, ReportTarget> = {
  CELOBTC: pairIdentifier('CELO/BTC'),
  CELOUSD: CeloContract.StableToken,
}

export type ReportTarget = CeloToken | CurrencyPairIdentifier

/**
 * Disambiguate a ReportTarget to a CeloToken
 * @param target ReportTarget
 */
const isCeloToken = (target: ReportTarget): target is CeloToken => {
  return target === CeloContract.StableToken || target === CeloContract.GoldToken
}

/**
 * Currency price oracle contract.
 */
export class SortedOraclesWrapper extends BaseWrapper<SortedOracles> {
  /**
   * Gets the number of rates that have been reported for the given target
   * @param target The ReportTarget, either CeloToken or currency pair
   * @return The number of reported oracle rates for `token`.
   */
  async numRates(target: ReportTarget): Promise<number> {
    const identifier = await this.toCurrencyPairIdentifier(target)
    const response = await this.contract.methods.numRates(identifier).call()
    return valueToInt(response)
  }

  /**
   * Returns the median rate for the given target
   * @param target The ReportTarget, either CeloToken or currency pair
   * @return The median exchange rate for `token`, expressed as:
   *   amount of that token / equivalent amount in CELO
   */
  async medianRate(target: ReportTarget): Promise<MedianRate> {
    const identifier = await this.toCurrencyPairIdentifier(target)
    const response = await this.contract.methods.medianRate(identifier).call()
    return {
      rate: valueToFrac(response[0], response[1]),
    }
  }

  /**
   * Checks if the given address is whitelisted as an oracle for the target
   * @param target The ReportTarget, either CeloToken or currency pair
   * @param oracle The address that we're checking the oracle status of
   * @returns boolean describing whether this account is an oracle
   */
  async isOracle(target: ReportTarget, oracle: Address): Promise<boolean> {
    const identifier = await this.toCurrencyPairIdentifier(target)
    return this.contract.methods.isOracle(identifier, oracle).call()
  }

  /**
   * Returns the list of whitelisted oracles for a given target
   * @param target The ReportTarget, either CeloToken or currency pair
   * @returns The list of whitelisted oracles for a given token.
   */
  async getOracles(target: ReportTarget): Promise<Address[]> {
    const identifier = await this.toCurrencyPairIdentifier(target)
    return this.contract.methods.getOracles(identifier).call()
  }

  /**
   * Returns the report expiry parameter.
   * @returns Current report expiry.
   */
  reportExpirySeconds = proxyCall(
    this.contract.methods.reportExpirySeconds,
    undefined,
    valueToBigNumber
  )

  /**
   * Returns the expiry for the target if exists, if not the default.
   * @param target The ReportTarget, either CeloToken or currency pair
   * @return The report expiry in seconds.
   */
  async getTokenReportExpirySeconds(target: ReportTarget): Promise<BigNumber> {
    const identifier = await this.toCurrencyPairIdentifier(target)
    const response = await this.contract.methods.getTokenReportExpirySeconds(identifier).call()
    return valueToBigNumber(response)
  }

  /**
   * Checks if the oldest report for a given target is expired
   * @param target The ReportTarget, either CeloToken or currency pair
   */
  async isOldestReportExpired(target: ReportTarget): Promise<[boolean, Address]> {
    const identifier = await this.toCurrencyPairIdentifier(target)
    const response = await this.contract.methods.isOldestReportExpired(identifier).call()
    return response as [boolean, Address]
  }

  /**
   * Removes expired reports, if any exist
   * @param target The ReportTarget, either CeloToken or currency pair
   * @param numReports The upper-limit of reports to remove. For example, if there
   * are 2 expired reports, and this param is 5, it will only remove the 2 that
   * are expired.
   */
  async removeExpiredReports(
    target: ReportTarget,
    numReports?: number
  ): Promise<CeloTransactionObject<void>> {
    const identifier = await this.toCurrencyPairIdentifier(target)
    if (!numReports) {
      numReports = (await this.getReports(target)).length - 1
    }
    return toTransactionObject(
      this.kit.connection,
      this.contract.methods.removeExpiredReports(identifier, numReports)
    )
  }

  /**
   * Updates an oracle value and the median.
   * @param target The ReportTarget, either CeloToken or currency pair
   * @param value The amount of `token` equal to one CELO.
   */
  async report(
    target: ReportTarget,
    value: BigNumber.Value,
    oracleAddress: Address
  ): Promise<CeloTransactionObject<void>> {
    const identifier = await this.toCurrencyPairIdentifier(target)
    const fixedValue = toFixed(valueToBigNumber(value))

    const { lesserKey, greaterKey } = await this.findLesserAndGreaterKeys(
      target,
      valueToBigNumber(value),
      oracleAddress
    )

    return toTransactionObject(
      this.kit.connection,
      this.contract.methods.report(identifier, fixedValue.toFixed(), lesserKey, greaterKey),
      { from: oracleAddress }
    )
  }

  /**
   * Updates an oracle value and the median.
   * @param value The amount of US Dollars equal to one CELO.
   */
  async reportStableToken(
    value: BigNumber.Value,
    oracleAddress: Address
  ): Promise<CeloTransactionObject<void>> {
    return this.report(CeloContract.StableToken, value, oracleAddress)
  }

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<SortedOraclesConfig> {
    return {
      reportExpirySeconds: await this.reportExpirySeconds(),
    }
  }

  /**
   * @dev Returns human readable configuration of the sortedoracles contract
   * @return SortedOraclesConfig object
   */
  async getHumanReadableConfig() {
    const config = await this.getConfig()
    return {
      reportExpiry: secondsToDurationString(config.reportExpirySeconds),
    }
  }

  /**
   * Helper function to get the rates for StableToken, by passing the address
   * of StableToken to `getRates`.
   */
  getStableTokenRates = async (): Promise<OracleRate[]> => this.getRates(CeloContract.StableToken)

  /**
   * Gets all elements from the doubly linked list.
   * @param target The ReportTarget, either CeloToken or currency pair in question
   * @return An unpacked list of elements from largest to smallest.
   */
  async getRates(target: ReportTarget): Promise<OracleRate[]> {
    const identifier = await this.toCurrencyPairIdentifier(target)
    const response = await this.contract.methods.getRates(identifier).call()
    const rates: OracleRate[] = []
    for (let i = 0; i < response[0].length; i++) {
      const medRelIndex = parseInt(response[2][i], 10)
      rates.push({
        address: response[0][i],
        rate: fromFixed(valueToBigNumber(response[1][i])),
        medianRelation: medRelIndex,
      })
    }
    return rates
  }

  /**
   * Gets all elements from the doubly linked list.
   * @param target The ReportTarget, either CeloToken or currency pair in question
   * @return An unpacked list of elements from largest to smallest.
   */
  async getTimestamps(target: ReportTarget): Promise<OracleTimestamp[]> {
    const identifier = await this.toCurrencyPairIdentifier(target)
    const response = await this.contract.methods.getTimestamps(identifier).call()
    const timestamps: OracleTimestamp[] = []
    for (let i = 0; i < response[0].length; i++) {
      const medRelIndex = parseInt(response[2][i], 10)
      timestamps.push({
        address: response[0][i],
        timestamp: valueToBigNumber(response[1][i]),
        medianRelation: medRelIndex,
      })
    }
    return timestamps
  }

  async getReports(target: ReportTarget): Promise<OracleReport[]> {
    const [rates, timestamps] = await Promise.all([
      this.getRates(target),
      this.getTimestamps(target),
    ])
    const reports: OracleReport[] = []
    for (const rate of rates) {
      const match = timestamps.filter((t: OracleTimestamp) => eqAddress(t.address, rate.address))
      reports.push({ address: rate.address, rate: rate.rate, timestamp: match[0].timestamp })
    }
    return reports
  }

  private async findLesserAndGreaterKeys(
    target: ReportTarget,
    value: BigNumber.Value,
    oracleAddress: Address
  ): Promise<{ lesserKey: Address; greaterKey: Address }> {
    const currentRates: OracleRate[] = await this.getRates(target)
    let greaterKey = NULL_ADDRESS
    let lesserKey = NULL_ADDRESS

    // This leverages the fact that the currentRates are already sorted from
    // greatest to lowest value
    for (const rate of currentRates) {
      if (!eqAddress(rate.address, oracleAddress)) {
        if (rate.rate.isLessThanOrEqualTo(value)) {
          lesserKey = rate.address
          break
        }
        greaterKey = rate.address
      }
    }

    return { lesserKey, greaterKey }
  }

  private async toCurrencyPairIdentifier(target: ReportTarget): Promise<Address> {
    if (isCeloToken(target)) {
      return this.kit.registry.addressFor(target)
    } else {
      return target
    }
  }
}
