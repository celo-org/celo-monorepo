import { eqAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { Address, CeloContract, NULL_ADDRESS } from '../base'
import { SortedOracles } from '../generated/types/SortedOracles'
import { BaseWrapper, CeloTransactionObject, proxyCall, toBigNumber, wrapSend } from './BaseWrapper'

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
/**
 * Currency price oracle contract.
 */
export class SortedOraclesWrapper extends BaseWrapper<SortedOracles> {
  numRates = proxyCall(this.contract.methods.numRates)
  medianRate = proxyCall(this.contract.methods.medianRate)

  isOracle: (token: Address, oracle: Address) => Promise<boolean> = proxyCall(
    this.contract.methods.isOracle
  )

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
    token: Address,
    numerator: number,
    denominator: number
  ): Promise<CeloTransactionObject<void>> {
    const { lesserKey, greaterKey } = await this.findLesserAndGreaterAfterReport(
      token,
      numerator,
      denominator
    )

    return wrapSend(
      this.kit,
      this.contract.methods.report(token, numerator, denominator, lesserKey, greaterKey)
    )
  }

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<SortedOraclesConfig> {
    return {
      reportExpirySeconds: await this.reportExpirySeconds(),
    }
  }

  getUsdRates = async (): Promise<OracleRate[]> =>
    this.getRates(await this.kit.registry.addressFor(CeloContract.StableToken))

  /**
   * Gets all elements from the doubly linked list.
   * @param token The address of the token for which the Celo Gold exchange rate is being reported.
   * @return An unpacked list of elements from largest to smallest.
   */
  getRates: (token: Address) => Promise<any> = proxyCall(
    this.contract.methods.getRates,
    undefined,
    (out) => {
      const rates: OracleRate[] = []
      for (let i = 0; i < out[0].length; i++) {
        const medRelIndex = parseInt(out[2][i], 10)
        rates.push({
          address: out[0][i],
          rate: new BigNumber(out[1][i]),
          medianRelation: medRelIndex,
        })
      }
      return rates
    }
  )

  private async findLesserAndGreaterAfterReport(
    token: Address,
    numerator: number,
    denominator: number
  ): Promise<{ lesserKey: Address; greaterKey: Address }> {
    const currentRates: OracleRate[] = await this.getRates(token)
    const internalDenominator = new BigNumber(await this.contract.methods.DENOMINATOR().call())

    // This is how the contract calculates the rate from the numerator and denominator.
    // To figure out where this new report goes in the list, we need to compare this
    // value with the other rates
    const value = internalDenominator.times(numerator).div(denominator)
    let greaterKey = NULL_ADDRESS

    // This leverages the fact that the currentRates are already sorted from
    // greatest to lowest value
    for (const rate of currentRates) {
      if (!eqAddress(rate.address, this.kit.defaultAccount)) {
        if (rate.rate.isGreaterThanOrEqualTo(value)) {
          greaterKey = rate.address
        } else if (rate.rate.isLessThanOrEqualTo(value)) {
          return { lesserKey: rate.address, greaterKey }
        }
      }
    }

    return { lesserKey: NULL_ADDRESS, greaterKey }
  }
}
