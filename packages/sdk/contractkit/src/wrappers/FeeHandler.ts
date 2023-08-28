import { Address } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { StableTokenContract } from '../base'
import { FeeHandler } from '../generated/FeeHandler'
import { BaseWrapper, proxyCall, proxySend } from './BaseWrapper'

export enum ExchangeProposalState {
  None,
  Proposed,
  Approved,
  Executed,
  Cancelled,
}

export interface GrandaMentoConfig {
  approver: string
  spread: BigNumber
  vetoPeriodSeconds: BigNumber
  maxApprovalExchangeRateChange: BigNumber
  exchangeLimits: AllStableConfig
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
  vetoPeriodSeconds: BigNumber
  approvalTimestamp: BigNumber
  state: ExchangeProposalState
  sellCelo: boolean
  id: string | number
}

export interface ExchangeProposalReadable {
  exchanger: string
  stableToken: string
  sellAmount: BigNumber
  buyAmount: BigNumber
  approvalTimestamp: BigNumber
  state: string
  sellCelo: boolean
  id: string | number
  implictPricePerCelo: BigNumber
}

type AllStableConfig = Map<StableTokenContract, StableTokenExchangeLimits>

export class FeeHandlerWrapper extends BaseWrapper<FeeHandler> {
  owner = proxyCall(this.contract.methods.owner)

  handleAll = proxySend(this.connection, this.contract.methods.handleAll)
  burnCelo = proxySend(this.connection, this.contract.methods.burnCelo)

  async handle(tokenAddress: Address) {
    const createExchangeProposalInner = proxySend(this.connection, this.contract.methods.handle)
    return createExchangeProposalInner(tokenAddress)
  }

  async sell(tokenAddress: Address) {
    const innerCall = proxySend(this.connection, this.contract.methods.sell)
    return innerCall(tokenAddress)
  }

  async distribute(tokenAddress: Address) {
    const innerCall = proxySend(this.connection, this.contract.methods.distribute)
    return innerCall(tokenAddress)
  }

  distributeAll = proxySend(this.connection, this.contract.methods.distributeAll)
}
export type FeeHandlerType = FeeHandlerWrapper
