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

export interface GrandaMentoExchangeProposal {}

export interface GrandaMentoConfig {
  approver: string
  spread: BigNumber // seconds
  vetoPeriodSeconds: BigNumber
  stableTokenExchangeLimits: any //{ id: string : IPerson; }
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

  stableTokenExchangeLimits = proxyCall(this.contract.methods.stableTokenExchangeLimits)

  // stableTokenExchangeLimits
  // exchangeProposals

  getContract() {
    return this.contract
  }

  /**
   * Returns current configuration parameters.
   */

  async getConfig(): Promise<GrandaMentoConfig> {
    const res = await Promise.all([
      this.approver(),
      this.spread(),
      this.vetoPeriodSeconds(),
      this.stableTokenExchangeLimits(''), // not sure why it needs a string here
    ])
    return {
      approver: res[0],
      spread: res[1],
      vetoPeriodSeconds: res[2],
      stableTokenExchangeLimits: res[3], // TODO format and test this
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

  // async getParticipationParameters(): Promise<ParticipationParameters> {
  //   const res = await this.contract.methods.getParticipationParameters().call()
  //   return {
  //     baseline: fromFixed(new BigNumber(res[0])),
  //     baselineFloor: fromFixed(new BigNumber(res[1])),
  //     baselineUpdateFactor: fromFixed(new BigNumber(res[2])),
  //     baselineQuorumFactor: fromFixed(new BigNumber(res[3])),
  //   }
  // }
  async getActiveProposals() {
    const ids = await this.contract.methods.getActiveProposalIds().call()
    return ids.map(valueToBigNumber)
  }
}
