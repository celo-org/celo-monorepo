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

// TODO update comments to match the contracts

export class GrandaMentWrapper extends BaseWrapper<GrandaMento> {
  approver = proxyCall(this.contract.methods.approver)

  spread = proxyCall(this.contract.methods.spread, undefined, fixidityValueToBigNumber)

  vetoPeriodSeconds = proxyCall(
    this.contract.methods.vetoPeriodSeconds,
    undefined,
    valueToBigNumber
  )

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
