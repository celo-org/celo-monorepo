import { Connection, Contract } from '@celo/connect'
import { WrapperCache } from '../contract-cache'
import { BaseWrapper } from './BaseWrapper'

export class BaseWrapperWithContracts<T extends Contract> extends BaseWrapper<T> {
  constructor(
    protected readonly connection: Connection,
    protected readonly contract: T,
    protected readonly contracts: WrapperCache
  ) {
    super(connection, contract)
  }
}
