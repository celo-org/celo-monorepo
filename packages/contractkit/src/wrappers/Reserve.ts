import BigNumber from 'bignumber.js'
import { EventLog } from 'web3-core'
import { Address } from '../base'
import { Reserve } from '../generated/Reserve'
import { BaseWrapper, proxyCall, proxySend, valueToBigNumber } from './BaseWrapper'

export interface ReserveConfig {
  tobinTaxStalenessThreshold: BigNumber
}

/**
 * Contract for handling reserve for stable currencies
 */
export class ReserveWrapper extends BaseWrapper<Reserve> {
  /**
   * Query Tobin tax staleness threshold parameter.
   * @returns Current Tobin tax staleness threshold.
   */
  tobinTaxStalenessThreshold = proxyCall(
    this.contract.methods.tobinTaxStalenessThreshold,
    undefined,
    valueToBigNumber
  )
  isSpender: (account: string) => Promise<boolean> = proxyCall(this.contract.methods.isSpender)
  transferGold = proxySend(this.kit, this.contract.methods.transferGold)
  getOrComputeTobinTax = proxySend(this.kit, this.contract.methods.getOrComputeTobinTax)

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<ReserveConfig> {
    return {
      tobinTaxStalenessThreshold: await this.tobinTaxStalenessThreshold(),
    }
  }

  isOtherReserveAddress = proxyCall(this.contract.methods.isOtherReserveAddress)

  async getSpenders(): Promise<Address[]> {
    const spendersAdded = (
      await this.getPastEvents('SpenderAdded', {
        fromBlock: 0,
        toBlock: 'latest',
      })
    ).map((eventlog: EventLog) => eventlog.returnValues.spender)
    const spendersRemoved = (
      await this.getPastEvents('SpenderRemoved', {
        fromBlock: 0,
        toBlock: 'latest',
      })
    ).map((eventlog: EventLog) => eventlog.returnValues.spender)
    return spendersAdded.filter((spender) => !spendersRemoved.includes(spender))
  }
}
