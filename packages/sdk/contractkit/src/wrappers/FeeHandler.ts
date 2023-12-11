import { FeeHandler } from '@celo/abis/web3/FeeHandler'
import { Address } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { BaseWrapper, proxyCall, proxySend } from './BaseWrapper'

export enum ExchangeProposalState {
  None,
  Proposed,
  Approved,
  Executed,
  Cancelled,
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
}

export type FeeHandlerType = FeeHandlerWrapper
