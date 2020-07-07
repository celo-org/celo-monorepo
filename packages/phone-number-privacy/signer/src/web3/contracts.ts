import { newKit } from '@celo/contractkit'
import config from '../config'
import { retryAsyncWithBackOff } from '@celo/utils/lib/async'

const contractKit = newKit(config.blockchain.provider)
const retryCount: number = 5
const retryDelayInMs: number = 100

function getContractKit() {
  return contractKit
}

export async function getTransactionCountFromAccount(account: string): Promise<number> {
  return await retryAsyncWithBackOff(
    () => getContractKit().web3.eth.getTransactionCount(account),
    retryCount,
    [],
    retryDelayInMs
  )
}

export async function getBlockNumber(): Promise<number> {
  return await retryAsyncWithBackOff(
    () => getContractKit().web3.eth.getBlockNumber(account),
    retryCount,
    [],
    retryDelayInMs
  )
}

export async function getDollarBalance(account: string): Promise<BigNumber> {
  await retryAsyncWithBackOff(
    () =>
      getContractKit()
        .contracts.getStableToken()
        .balanceOf(account),
    retryCount,
    [],
    retryDelayInMs
  )
}

export async function getDollarBalance(account: string): Promise<BigNumber> {
  await retryAsyncWithBackOff(
    () =>
      getContractKit()
        .contracts.getStableToken()
        .balanceOf(account),
    retryCount,
    [],
    retryDelayInMs
  )
}
