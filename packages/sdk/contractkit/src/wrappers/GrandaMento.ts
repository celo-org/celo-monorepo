import BigNumber from 'bignumber.js'
import { StableTokenContract } from '../base'
import { StableToken } from '../celo-tokens'
import { GrandaMento } from '../generated/GrandaMento'
import {
  BaseWrapper,
  fixidityValueToBigNumber,
  proxyCall,
  proxySend,
  valueToBigNumber,
} from './BaseWrapper'

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
  approvalTimestamp: BigNumber
  state: ExchangeProposalState
  sellCelo: boolean
}

type AllStableConfig = Map<StableTokenContract, StableTokenExchangeLimits>

export class GrandaMentoWrapper extends BaseWrapper<GrandaMento> {
  approver = proxyCall(this.contract.methods.approver)

  spread = proxyCall(this.contract.methods.spread, undefined, fixidityValueToBigNumber)

  vetoPeriodSeconds = proxyCall(
    this.contract.methods.vetoPeriodSeconds,
    undefined,
    valueToBigNumber
  )

  owner = proxyCall(this.contract.methods.owner)

  async getActiveProposalIds() {
    const unfilteredIds = await this.contract.methods.getActiveProposalIds().call()
    // '0' is given to signify an ID that is no longer active, so we filter them out.
    return unfilteredIds.filter((id) => id !== '0')
  }

  setStableTokenExchangeLimits = proxySend(
    this.kit,
    this.contract.methods.setStableTokenExchangeLimits
  )

  approveExchangeProposal = proxySend(this.kit, this.contract.methods.approveExchangeProposal)

  executeExchangeProposal = proxySend(this.kit, this.contract.methods.executeExchangeProposal)
  cancelExchangeProposal = proxySend(this.kit, this.contract.methods.cancelExchangeProposal)

  async createExchangeProposal(
    stableTokenRegistryId: StableTokenContract,
    sellAmount: BigNumber,
    sellCelo: boolean
  ) {
    const createExchangeProposalInner = proxySend(
      this.kit,
      this.contract.methods.createExchangeProposal
    )
    return createExchangeProposalInner(stableTokenRegistryId, sellAmount.toFixed(), sellCelo)
  }

  async getExchangeProposal(exchangeProposalID: string | number): Promise<ExchangeProposal> {
    const result = await this.contract.methods.exchangeProposals(exchangeProposalID).call()
    const state = parseInt(result.state, 10)

    if (state === ExchangeProposalState.None) {
      throw new Error("Proposal doesn't exist")
    }

    return {
      exchanger: result.exchanger,
      stableToken: result.stableToken,
      sellAmount: new BigNumber(result.sellAmount),
      buyAmount: new BigNumber(result.buyAmount),
      approvalTimestamp: new BigNumber(result.approvalTimestamp),
      sellCelo: result.sellCelo,
      state,
    }
  }

  async stableTokenExchangeLimits(
    stableTokenTymbol: StableToken
  ): Promise<StableTokenExchangeLimits> {
    const stableTokenRegistryId = this.kit.celoTokens.getContract(stableTokenTymbol)
    const result = await this.contract.methods
      .stableTokenExchangeLimits(stableTokenRegistryId.toString())
      .call()
    return {
      minExchangeAmount: new BigNumber(result.minExchangeAmount),
      maxExchangeAmount: new BigNumber(result.maxExchangeAmount),
    }
  }

  async getAllStableTokenLimits(): Promise<AllStableConfig> {
    const out: AllStableConfig = new Map()

    const res = await Promise.all(
      Object.values(StableToken).map((key) => this.stableTokenExchangeLimits(key))
    )

    Object.values(StableToken).map((key, index) =>
      out.set(this.kit.celoTokens.getContract(key), res[index])
    )

    return out
  }

  async getConfig(): Promise<GrandaMentoConfig> {
    const res = await Promise.all([
      this.approver(),
      this.spread(),
      this.vetoPeriodSeconds(),
      this.getAllStableTokenLimits(),
    ])
    return {
      approver: res[0],
      spread: res[1],
      vetoPeriodSeconds: res[2],
      exchangeLimits: res[3],
    }
  }
}
