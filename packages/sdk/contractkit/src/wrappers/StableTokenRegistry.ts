import Web3 from 'web3'
import { StableTokenRegistry } from '../generated/StableTokenRegistry'
import { BaseWrapper, proxyCall } from './BaseWrapper'

/**
 * Splits a string with concatenated contract names into each individual name.
 * @param contractHex concatenated contract names
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
   * Returns a stringified array of stable token contracts
   * @return string array containing contract names
   */
  async getContractInstances(): Promise<string[]> {
    const values = await this.contract.methods.getContractInstances().call()
    const concatenatedContracts = values[0]
    const contractLengths = values[1]
    return splitContractNamesByLength(concatenatedContracts, contractLengths)
  }

  async getFiatTickers(): Promise<string[]> {
    const convertedToHex: string[] = []
    let index = 0
    while (true) {
      let fiatTicker
      try {
        fiatTicker = await this.fiatTickers(index)
      } catch (error) {
        return convertedToHex
      }
      convertedToHex.push(Web3.utils.hexToUtf8(fiatTicker))
      index++
    }
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
