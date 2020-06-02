import { ContractKit, newKit } from '@celo/contractkit'
import CacheDataSource from './cacheDataSource'

export default class ContractKitDataSouce extends CacheDataSource<any> {
  kit: ContractKit

  constructor(nodeUrl: string) {
    super()
    this.kit = newKit(nodeUrl)
  }
}
