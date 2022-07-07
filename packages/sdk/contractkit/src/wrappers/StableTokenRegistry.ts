import Web3 from 'web3'
import { StableTokenRegistry } from '../generated/StableTokenRegistry'
import { BaseWrapper, proxyCall } from './BaseWrapper'

/**
 * Returns the contatenated contracts and each of their lengths
 * @param contractHex concatenated contracts
 * @param lengths their lengths
 * @return string array containing contract names
 */
const splitContractNamesByLength = (contractsHex: string, lengths: string[]): string[] => {
  const contracts = Web3.utils.hexToUtf8(contractsHex)
  let currentIndex = 0
  const contractsArr = []
  for (const length of lengths) {
    const contract = contracts.slice(currentIndex, currentIndex + Number(length))
    currentIndex += Number(length)
    contractsArr.push(contract)
  }
  return contractsArr
}

export class StableTokenRegistryWrapper extends BaseWrapper<StableTokenRegistry> {
  fiatTickers = proxyCall(this.contract.methods.fiatTickers)
  stableTokens = proxyCall(this.contract.methods.stableTokens)

  /**
   * Returns the contatenated contracts and each of their lengths
   * @return string array containing contract names
   */
  async getContractInstances(): Promise<string[]> {
    const values = await this.contract.methods.getContractInstances().call()
    const concatenatedContracts = values[0]
    const contractLengths = values[1]
    return splitContractNamesByLength(concatenatedContracts, contractLengths)
  }

  async FiatTickers(): Promise<string[]> {
    const convertedToHex = []
    try {
      let index = 0
      while (await this.fiatTickers(index)) {
        convertedToHex.push(Web3.utils.hexToUtf8(await this.fiatTickers(index)))
        index++
      }
    } catch (error) {
      return convertedToHex
    }
    return convertedToHex
  }

  /**
   * Queries the mapping using a fiatTicker
   * @return queried stableTokenContractName
   */
  async queryStableTokenContractNames(fiatTicker: string): Promise<string> {
    const res = await this.stableTokens(Web3.utils.utf8ToHex(fiatTicker))
    return Web3.utils.hexToUtf8(res)
  }
}
