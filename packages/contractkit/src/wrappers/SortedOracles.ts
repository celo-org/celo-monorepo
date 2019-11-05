import { eqAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { Address, CeloContract, CeloToken, NULL_ADDRESS } from '../base'
import { SortedOracles } from '../generated/types/SortedOracles'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  toBigNumber,
  toTransactionObject,
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
    return toBigNumber(response).toNumber()
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
      rate: toBigNumber(response[0]).div(toBigNumber(response[1])),
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
  reportExpirySeconds = proxyCall(this.contract.methods.reportExpirySeconds, undefined, toBigNumber)

  /**
   * Updates an oracle value and the median.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @param numerator The amount of tokens equal to `denominator` Celo Gold.
   * @param denominator The amount of Celo Gold that the `numerator` tokens are equal to.
   */
  async report(
    token: CeloToken,
    numerator: number,
    denominator: number,
    oracleAddress: Address
  ): Promise<CeloTransactionObject<void>> {
    const tokenAddress = await this.kit.registry.addressFor(token)

    const { lesserKey, greaterKey } = await this.findLesserAndGreaterKeys(
      token,
      numerator,
      denominator,
      oracleAddress
    )

    return toTransactionObject(
      this.kit,
      this.contract.methods.report(tokenAddress, numerator, denominator, lesserKey, greaterKey),
      { from: oracleAddress }
    )
  }

  /**
   * Updates an oracle value and the median.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @param numerator The amount of tokens equal to `denominator` Celo Gold.
   * @param denominator The amount of Celo Gold that the `numerator` tokens are equal to.
   */
  async reportStableToken(
    numerator: number,
    denominator: number,
    oracleAddress: Address
  ): Promise<CeloTransactionObject<void>> {
    return this.report(CeloContract.StableToken, numerator, denominator, oracleAddress)
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
    const denominator = await this.getInternalDenominator()

    for (let i = 0; i < response[0].length; i++) {
      const medRelIndex = parseInt(response[2][i], 10)
      rates.push({
        address: response[0][i],
        rate: toBigNumber(response[1][i]).div(denominator),
        medianRelation: medRelIndex,
      })
    }
    return rates
  }

  private async getInternalDenominator(): Promise<BigNumber> {
    return toBigNumber(await this.contract.methods.DENOMINATOR().call())
  }

  private async findLesserAndGreaterKeys(
    token: CeloToken,
    numerator: number,
    denominator: number,
    oracleAddress: Address
  ): Promise<{ lesserKey: Address; greaterKey: Address }> {
    const currentRates: OracleRate[] = await this.getRates(token)

    // This is how the contract calculates the rate from the numerator and denominator.
    // To figure out where this new report goes in the list, we need to compare this
    // value with the other rates
    const value = toBigNumber(numerator.toString()).div(toBigNumber(denominator.toString()))

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
