import BigNumber from 'bignumber.js'
import { Address, CeloContract } from '../base'
import { SortedOracles } from '../generated/types/SortedOracles'
import { BaseWrapper, proxyCall, proxySend, toBigNumber } from './BaseWrapper'

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

  report = proxySend(this.kit, this.contract.methods.report)
  // async report(
  //   token: Address,
  //   numerator: string | number,
  //   denominator: string | number
  // ): Promise<CeloTransactionObject<boolean>> {
  //   this.contract.methods.report()
  // }

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
}
