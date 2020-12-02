import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { RETRY_COUNT, RETRY_DELAY_IN_MS } from '@celo/phone-number-privacy-common'
import { retryAsyncWithBackOff } from '@celo/utils/lib/async'
import Web3 from 'web3'
import config from '../config'

const contractKit = newKitFromWeb3(new Web3(config.blockchain.provider))

export function getContractKit(): ContractKit {
  return contractKit
}

export async function getBlockNumber(): Promise<number> {
  return retryAsyncWithBackOff(
    () => getContractKit().connection.getBlockNumber(),
    RETRY_COUNT,
    [],
    RETRY_DELAY_IN_MS
  )
}
