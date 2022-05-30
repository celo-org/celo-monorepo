import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { StableTokenRegistry } from '../generated/StableTokenRegistry'
import { BaseWrapper, proxyCall } from './BaseWrapper'

const returnSTContractNames = (contractsHex: string, lengths: BigNumber[]): string[] => {
  const contracts = Web3.utils.hexToUtf8(contractsHex)
  let currentIndex = 0
  let contractsArr = []
  for (let i = 0; i < lengths.length; i++) {
    const contract = contracts.slice(currentIndex, currentIndex + lengths[i].toNumber())
    currentIndex += lengths[i].toNumber()
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
   * @return string array
   */
  async getContractInstances(): Promise<string[]> {
    const ret = await Promise.resolve(this.contract.methods.getContractInstances())
    let concatenatedContracts = Object.keys(ret)[0]
    let contractLengths = Object.keys(ret)[1]
    return returnSTContractNames(concatenatedContracts, contractLengths)
  }

  /**
   * Queries the mapping using a fiatTicker
   * @return queried stableTokenContractName
   */
  async queryStableTokenContractNames(fiatTicker: string): Promise<string> {
    return this.stableTokens[fiatTicker]
  }
}
