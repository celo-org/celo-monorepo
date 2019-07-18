import { BigNumber } from 'bignumber.js'
import Web3 from 'web3'

export const getGasPrice = async (web3: Web3, currencyAddress?: string) => {
  return new BigNumber(100000000000)
}
