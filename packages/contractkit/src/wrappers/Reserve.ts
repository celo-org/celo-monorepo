import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { Reserve } from '../generated/types/Reserve'
import {
  BaseWrapper,
  proxyCall,
  valueToBigNumber,
  valueToString,
  toTransactionObject,
} from './BaseWrapper'

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

  /**
   * Check is spender is a signatory of the multiSig spender address
   * TODO @amyslawson update this if we decide to continue to support other
   * non-multisig spenders
   * @param account
   */
  async isSpender(account: Address): Promise<boolean> {
    const multisig = await this.kit.contracts.getReserveSpenderMultiSig()
    return multisig.isowner(account)
  }

  async transferGold(to: Address, value: BigNumber.Value) {
    const multisig = await this.kit.contracts.getReserveSpenderMultiSig()
    const txData = this.contract.methods.transferGold(to, valueToString(value)).encodeABI()
    return toTransactionObject(
      this.kit,
      multisig.submitTransaction(this.contract._address, txData).txo
    )
  }

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<ReserveConfig> {
    return {
      tobinTaxStalenessThreshold: await this.tobinTaxStalenessThreshold(),
    }
  }
}
