import BigNumber from 'bignumber.js'
import { GrandaMento } from '../generated/GrandaMento'
import {
  BaseWrapper,
  fixidityValueToBigNumber,
  proxyCall,
  proxySend,
  valueToBigNumber,
} from './BaseWrapper'

// export interface GrandaMentoExchangeProposal {}

export interface GrandaMentoConfig {
  approver: string
  spread: BigNumber // seconds
  vetoPeriodSeconds: BigNumber
}

export interface StableTokenExchangeLimits {
  minExchangeAmount: BigNumber
  maxExchangeAmount: BigNumber
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

  owner = proxyCall(this.contract.methods.owner)

  exchangeProposals = proxyCall(this.contract.methods.exchangeProposals)

  setStableTokenExchangeLimits = proxySend(
    this.kit,
    this.contract.methods.setStableTokenExchangeLimits
  )

  createExchangeProposal = proxySend(this.kit, this.contract.methods.createExchangeProposal)

  getActiveProposalIds = proxySend(this.kit, this.contract.methods.getActiveProposalIds)

  // getContract() {
  //   return this.contract
  // }

  async stableTokenExchangeLimits(
    stableTokenRegistryId: string
  ): Promise<StableTokenExchangeLimits> {
    const result = await this.contract.methods
      .stableTokenExchangeLimits(stableTokenRegistryId)
      .call()
    return {
      minExchangeAmount: new BigNumber(result.minExchangeAmount),
      maxExchangeAmount: new BigNumber(result.maxExchangeAmount),
    }
  }

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

  // async stableTokenExchangeLimits() {
  //   return await this.contract.methods.stableTokenExchangeLimits()
  // }

  // createExchangeProposal: (
  //   stableTokenRegistryId: string,
  //   sellAmount: BigNumber.Value,
  //   sellCelo: boolean
  // ) => CeloTransactionObject<string> = proxySend(
  //   this.kit,
  //   this.contract.methods.createExchangeProposal,
  //   tupleParser(identity, valueToString, identity)
  // )

  // async getParticipationParameters(): Promise<ParticipationParameters> {
  //   const res = await this.contract.methods.getParticipationParameters().call()
  //   return {
  //     baseline: fromFixed(new BigNumber(res[0])),
  //     baselineFloor: fromFixed(new BigNumber(res[1])),
  //     baselineUpdateFactor: fromFixed(new BigNumber(res[2])),
  //     baselineQuorumFactor: fromFixed(new BigNumber(res[3])),
  //   }
  // }
}
