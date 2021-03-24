import { ContractKit, newKit } from '@celo/contractkit'
import { RETRY_COUNT, RETRY_DELAY_IN_MS } from '@celo/phone-number-privacy-common'
import { retryAsyncWithBackOff } from '@celo/utils/lib/async'
import config from '../config'

const contractKit = newKit(config.blockchain.provider)

export function getContractKit(): ContractKit {
  return contractKit
}

export async function getBlockNumber(): Promise<number> {
  // TODO(Alec): suppress console.info statements from these calls
  return retryAsyncWithBackOff(
    () => getContractKit().connection.getBlockNumber(),
    RETRY_COUNT,
    [],
    RETRY_DELAY_IN_MS
  )
}
