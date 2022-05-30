import Web3 from 'web3'
import { StableTokenRegistry } from '../generated/StableTokenRegistry'
import { BaseWrapper, proxyCall } from './BaseWrapper'

const returnSTContractNames = (contractsHex: string, lengths: string[]): string[] => {
  const contracts = Web3.utils.hexToUtf8(contractsHex)
  let currentIndex = 0
  const contractsArr = []
  for (let i = 0; i < lengths.length - 1; i++) {
    const contract = contracts.slice(currentIndex, currentIndex + Number(lengths[i]))
    currentIndex += Number(lengths[i])
    contractsArr.push(contract)
  }
  return contractsArr
}

export class StableTokenRegistryWrapper extends BaseWrapper<StableTokenRegistry> {
  owner = proxyCall(this.contract.methods.owner)
  fiatTickers = proxyCall(this.contract.methods.fiatTickers)
  stableTokens = proxyCall(this.contract.methods.stableTokens)

  /**
   * Returns the contatenated contracts and each of their lengths
   * @return string array containing contract names
   */
  async getContractInstances(): Promise<string[]> {
    const ret = await Promise.resolve(this.contract.methods.getContractInstances())
    const concatenatedContracts = Object.keys(ret)[0]
    const contractLengths = Object.keys(ret)
    return returnSTContractNames(concatenatedContracts, contractLengths)
  }

  /**
   * Queries the mapping using a fiatTicker
   * @return queried stableTokenContractName
   */
  async queryStableTokenContractNames(fiatTicker: string): Promise<string> {
    return Promise.resolve(this.stableTokens(fiatTicker))
  }
}
