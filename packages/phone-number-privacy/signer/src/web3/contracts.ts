import { newKitFromWeb3 } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { RETRY_COUNT, RETRY_DELAY_IN_MS } from '@celo/phone-number-privacy-common'
import { retryAsyncWithBackOff } from '@celo/utils/lib/async'
import Web3 from 'web3'
import logger from '../common/logger'
import config from '../config'

const contractKit = newKitFromWeb3(new Web3(config.blockchain.provider))

export function getContractKit() {
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

export async function isVerified(account: string, hashedPhoneNumber: string): Promise<boolean> {
  return retryAsyncWithBackOff(
    async () => {
      const attestationsWrapper: AttestationsWrapper = await getContractKit().contracts.getAttestations()
      const {
        isVerified: _isVerified,
        completed,
        numAttestationsRemaining,
        total,
      } = await attestationsWrapper.getVerifiedStatus(hashedPhoneNumber, account)

      logger.debug(
        `Account ${account} is verified=${_isVerified} with ${completed} completed attestations, ${numAttestationsRemaining} remaining, total of ${total} requested.`
      )
      return _isVerified
    },
    RETRY_COUNT,
    [],
    RETRY_DELAY_IN_MS
  )
}

export async function getDataEncryptionKey(address: string): Promise<string> {
  return retryAsyncWithBackOff(
    async () => {
      const accountWrapper: AccountsWrapper = await getContractKit().contracts.getAccounts()
      return accountWrapper.getDataEncryptionKey(address)
    },
    RETRY_COUNT,
    [],
    RETRY_DELAY_IN_MS
  )
}
