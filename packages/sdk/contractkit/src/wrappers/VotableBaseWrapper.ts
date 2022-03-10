import { Connection, Contract } from '@celo/connect'
import VoteSet from '../contract-sets/vote-set'
import { BaseWrapper } from './BaseWrapper'

export class VotableBaseWrapper<T extends Contract> extends BaseWrapper<T> {
  constructor(
    protected readonly connection: Connection,
    protected readonly contract: T,
    protected readonly contracts: VoteSet
  ) {
    super(connection, contract)
  }
}
