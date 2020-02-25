import { eqAddress } from '@celo/utils/lib/address'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { Address, CeloContract, CeloToken, NULL_ADDRESS } from '../base'
import { SortedOracles } from '../generated/types/SortedOracles'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  toTransactionObject,
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

export interface MedianRate {
  rate: BigNumber
}

/**
 * Currency price oracle contract.
 */
export class SortedOraclesWrapper extends BaseWrapper<SortedOracles> {
  /**
   * Gets the number of rates that have been reported for the given token
   * @param token The CeloToken token for which the Celo Gold exchange rate is being reported.
   * @return The number of reported oracle rates for `token`.
   */
  async numRates(token: CeloToken): Promise<number> {
    const tokenAddress = await this.kit.registry.addressFor(token)
    const response = await this.contract.methods.numRates(tokenAddress).call()
    return valueToInt(response)
  }

  /**
   * Returns the median rate for the given token
   * @param token The CeloToken token for which the Celo Gold exchange rate is being reported.
   * @return The median exchange rate for `token`, expressed as:
   *   amount of that token / equivalent amount in Celo Gold
   */
  async medianRate(token: CeloToken): Promise<MedianRate> {
    const tokenAddress = await this.kit.registry.addressFor(token)
    const response = await this.contract.methods.medianRate(tokenAddress).call()
    return {
      rate: valueToFrac(response[0], response[1]),
    }
  }

  /**
   * Checks if the given address is whitelisted as an oracle for the token
   * @param token The CeloToken token
   * @param oracle The address that we're checking the oracle status of
   * @returns boolean describing whether this account is an oracle
   */
  async isOracle(token: CeloToken, oracle: Address): Promise<boolean> {
    const tokenAddress = await this.kit.registry.addressFor(token)
    return this.contract.methods.isOracle(tokenAddress, oracle).call()
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
   * Updates an oracle value and the median.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @param value The amount of `token` equal to one Celo Gold.
   */
  async report(
    token: CeloToken,
    value: BigNumber.Value,
    oracleAddress: Address
  ): Promise<CeloTransactionObject<void>> {
    const tokenAddress = await this.kit.registry.addressFor(token)
    const fixedValue = toFixed(valueToBigNumber(value))

    const { lesserKey, greaterKey } = await this.findLesserAndGreaterKeys(
      token,
      valueToBigNumber(value),
      oracleAddress
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.report(tokenAddress, fixedValue.toFixed(), lesserKey, greaterKey),
      { from: oracleAddress }
    )
  }

  /**
   * Updates an oracle value and the median.
   * @param value The amount of US Dollars equal to one Celo Gold.
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
   * Helper function to get the rates for StableToken, by passing the address
   * of StableToken to `getRates`.
   */
  getStableTokenRates = async (): Promise<OracleRate[]> => this.getRates(CeloContract.StableToken)

  /**
   * Gets all elements from the doubly linked list.
   * @param token The CeloToken representing the token for which the Celo
   *   Gold exchange rate is being reported. Example: CeloContract.StableToken
   * @return An unpacked list of elements from largest to smallest.
   */
  async getRates(token: CeloToken): Promise<OracleRate[]> {
    const tokenAddress = await this.kit.registry.addressFor(token)
    const response = await this.contract.methods.getRates(tokenAddress).call()
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

  private async findLesserAndGreaterKeys(
    token: CeloToken,
    value: BigNumber.Value,
    oracleAddress: Address
  ): Promise<{ lesserKey: Address; greaterKey: Address }> {
    const currentRates: OracleRate[] = await this.getRates(token)
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
}
