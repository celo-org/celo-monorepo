import { CeloTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { GrandaMento } from '../generated/GrandaMento'
import {
  BaseWrapper,
  fixidityValueToBigNumber,
  identity,
  proxyCall,
  proxySend,
  tupleParser,
  valueToBigNumber,
  valueToString,
} from './BaseWrapper'

export interface GrandaMentoConfig {
  approver: string
  spread: BigNumber // seconds
  vetoPeriodSeconds: BigNumber
  // stableTokenExchangeLimits
  // exchangeProposals
}

// TODO update comments to match the contracts

export class GrandaMentoWrapper extends BaseWrapper<GrandaMento> {
  approver = proxyCall(this.contract.methods.approver)

  spread = proxyCall(this.contract.methods.spread, undefined, fixidityValueToBigNumber)

  vetoPeriodSeconds = proxyCall(
    this.contract.methods.vetoPeriodSeconds,
    undefined,
    valueToBigNumber
  )

  // stableTokenExchangeLimits
  // exchangeProposals

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<GrandaMentoConfig> {
    const res = await Promise.all([this.approver(), this.spread(), this.vetoPeriodSeconds()])
    return {
      approver: res[0],
      spread: res[1],
      vetoPeriodSeconds: res[2],
    }
  }

  createExchangeProposal: (
    stableTokenRegistryId: string,
    sellAmount: BigNumber.Value,
    sellCelo: boolean
  ) => CeloTransactionObject<string> = proxySend(
    this.kit,
    this.contract.methods.createExchangeProposal,
    tupleParser(identity, valueToString, identity)
  )
}
