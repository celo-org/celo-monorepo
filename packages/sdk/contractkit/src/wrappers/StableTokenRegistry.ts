import { string } from 'io-ts'
import { StableTokenRegistry } from '../generated/StableTokenRegistry'
import { BaseWrapper, proxyCall } from './BaseWrapper'

interface ContractInstance {
  concatenatedContracts: string
  contractLengths: string
}

export class StableTokenRegistryWrapper extends BaseWrapper<StableTokenRegistry> {
  owner = proxyCall(this.contract.methods.owner)
  fiatTickers = proxyCall(this.contract.methods.fiatTickers)
  stableTokens = proxyCall(this.contract.methods.stableTokens)

  /**
   * Returns the contatenated contracts and each of their lengths
   * @return concatenatedContract, ContractLengths
   */
  async getContractInstances(): Promise<ContractInstance> {
    const ret = await Promise.resolve(this.contract.methods.getContractInstances())
    return {
      concatenatedContracts: Object.keys(ret)[0],
      contractLengths: Object.keys(ret)[1],
    }
  }

  /**
   * Queries the mapping using a fiatTicker
   * @return queried stableTokenContractName
   */
  async queryStableTokenContractNames(fiatTicker: string): Promise<string> {
    return this.stableTokens[fiatTicker]
  }
}
