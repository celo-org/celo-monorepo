import BigNumber from 'bignumber.js'
import { StableTokenContract } from '../base'
import { StableToken as StableTokenEnum, stableTokenInfos } from '../celo-tokens'
import { GrandaMento } from '../generated/GrandaMento'
import { newStableToken } from '../generated/StableToken'
import {
  BaseWrapper,
  fixidityValueToBigNumber,
  proxyCall,
  proxySend,
  valueToBigNumber,
} from './BaseWrapper'
import { StableTokenWrapper } from './StableTokenWrapper'

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

export class GrandaMentoWrapper extends BaseWrapper<GrandaMento> {
  owner = proxyCall(this.contract.methods.owner)

  approver = proxyCall(this.contract.methods.approver)
  setApprover = proxySend(this.connection, this.contract.methods.setApprover)

  maxApprovalExchangeRateChange = proxyCall(
    this.contract.methods.maxApprovalExchangeRateChange,
    undefined,
    fixidityValueToBigNumber
  )
  setMaxApprovalExchangeRateChange = proxySend(
    this.connection,
    this.contract.methods.setMaxApprovalExchangeRateChange
  )

  spread = proxyCall(this.contract.methods.spread, undefined, fixidityValueToBigNumber)
  setSpread = proxySend(this.connection, this.contract.methods.setSpread)

  vetoPeriodSeconds = proxyCall(
    this.contract.methods.vetoPeriodSeconds,
    undefined,
    valueToBigNumber
  )
  setVetoPeriodSeconds = proxySend(this.connection, this.contract.methods.setVetoPeriodSeconds)

  exchangeProposalCount = proxyCall(
    this.contract.methods.exchangeProposalCount,
    undefined,
    valueToBigNumber
  )

  async getActiveProposalIds() {
    const unfilteredIds = await this.contract.methods.getActiveProposalIds().call()
    // '0' is given to signify an ID that is no longer active, so we filter them out.
    return unfilteredIds.filter((id) => id !== '0')
  }

  setStableTokenExchangeLimits = proxySend(
    this.connection,
    this.contract.methods.setStableTokenExchangeLimits
  )

  approveExchangeProposal = proxySend(
    this.connection,
    this.contract.methods.approveExchangeProposal
  )

  executeExchangeProposal = proxySend(
    this.connection,
    this.contract.methods.executeExchangeProposal
  )
  cancelExchangeProposal = proxySend(this.connection, this.contract.methods.cancelExchangeProposal)

  async createExchangeProposal(
    stableTokenRegistryId: StableTokenContract,
    sellAmount: BigNumber,
    sellCelo: boolean
  ) {
    const createExchangeProposalInner = proxySend(
      this.connection,
      this.contract.methods.createExchangeProposal
    )
    return createExchangeProposalInner(stableTokenRegistryId, sellAmount.toFixed(), sellCelo)
  }

  async exchangeProposalExists(exchangeProposalID: string | number) {
    const result = await this.contract.methods.exchangeProposals(exchangeProposalID).call()
    const state = parseInt(result.state, 10)
    return !(state === ExchangeProposalState.None)
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
      vetoPeriodSeconds: new BigNumber(result.vetoPeriodSeconds),
      approvalTimestamp: new BigNumber(result.approvalTimestamp),
      sellCelo: result.sellCelo,
      state,
      id: exchangeProposalID,
    }
  }

  async getHumanReadableExchangeProposal(
    exchangeProposalID: string | number
  ): Promise<ExchangeProposalReadable> {
    const proposal = await this.getExchangeProposal(exchangeProposalID)

    const stableTokenContract = new StableTokenWrapper(
      this.connection,
      newStableToken(this.connection.web3, proposal.stableToken)
    )

    return {
      ...proposal,
      stableToken: `${await stableTokenContract.name()} (${await stableTokenContract.symbol()}) at ${
        proposal.stableToken
      }`,
      implictPricePerCelo: proposal.sellCelo
        ? proposal.buyAmount.div(proposal.sellAmount)
        : proposal.sellAmount.div(proposal.buyAmount),
      state: ExchangeProposalState[proposal.state],
    }
  }

  async stableTokenExchangeLimits(
    stableTokenSymbol: StableTokenEnum
  ): Promise<StableTokenExchangeLimits> {
    const stableTokenRegistryId = stableTokenInfos[stableTokenSymbol].contract
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
      Object.values(StableTokenEnum).map((key) => this.stableTokenExchangeLimits(key))
    )

    Object.values(StableTokenEnum).map((key, index) =>
      out.set(stableTokenInfos[key].contract, res[index])
    )

    return out
  }

  async getBuyAmount(
    celoStableTokenOracleRate: BigNumber, // Note this is intended to be a fixed point number
    sellAmount: BigNumber,
    sellCelo: boolean
  ): Promise<BigNumber> {
    const result = await this.contract.methods
      .getBuyAmount(celoStableTokenOracleRate.toFixed(), sellAmount.toFixed(), sellCelo)
      .call()
    return new BigNumber(result)
  }

  async getConfig(): Promise<GrandaMentoConfig> {
    const res = await Promise.all([
      this.approver(),
      this.spread(),
      this.vetoPeriodSeconds(),
      this.maxApprovalExchangeRateChange(),
      this.getAllStableTokenLimits(),
    ])
    return {
      approver: res[0],
      spread: res[1],
      vetoPeriodSeconds: res[2],
      maxApprovalExchangeRateChange: res[3],
      exchangeLimits: res[4],
    }
  }
}

export type GrandaMentoWrapperType = GrandaMentoWrapper
