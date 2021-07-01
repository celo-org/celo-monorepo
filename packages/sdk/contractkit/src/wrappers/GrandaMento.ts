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

export interface ExchangeProposal {
  exchanger: string
  stableToken: string
  sellAmount: BigNumber
  buyAmount: BigNumber
  approvalTimestamp: BigNumber
  state: number // TODO replace with enum
  sellCelo: boolean
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

  setStableTokenExchangeLimits = proxySend(
    this.kit,
    this.contract.methods.setStableTokenExchangeLimits
  )

  createExchangeProposal = proxySend(this.kit, this.contract.methods.createExchangeProposal)

  approveExchangeProposal = proxySend(this.kit, this.contract.methods.approveExchangeProposal)

  executeExchangeProposal = proxySend(this.kit, this.contract.methods.executeExchangeProposal)
  cancelExchangeProposal = proxySend(this.kit, this.contract.methods.cancelExchangeProposal)

  // getContract() {
  //   return this.contract
  // }

  // exchangeProposals = proxyCall(this.contract.methods.exchangeProposals)

  async getExchangeProposal(exchangeProposalID: string): Promise<ExchangeProposal> {
    const result = await this.contract.methods.exchangeProposals(exchangeProposalID).call()
    return {
      exchanger: result['exchanger'],
      stableToken: result['stableToken'],
      sellAmount: new BigNumber(result['sellAmount']),
      buyAmount: new BigNumber(result['buyAmount']),
      approvalTimestamp: new BigNumber(result['approvalTimestamp']),
      state: parseInt(result['state']), // TODO replace with enum
      sellCelo: result['sellCelo'],
    }
  }

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

  async getActiveProposalIds() {
    // TODO move this to proxy call
    // const ids = await this.contract.methods.getActiveProposalIds().call()
    return await this.contract.methods.getActiveProposalIds().call()
    //return ids.map(valueToBigNumber)
  }
}
