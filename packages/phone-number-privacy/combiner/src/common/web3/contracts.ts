import { ContractKit } from '@celo/contractkit'
import { getDataEncryptionKey } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import config from '../../config'

export async function getDEK(kit: ContractKit, logger: Logger, account: string): Promise<string> {
  return getDataEncryptionKey(
    account,
    kit,
    logger,
    config.phoneNumberPrivacy.fullNodeTimeoutMs,
    config.phoneNumberPrivacy.fullNodeRetryCount,
    config.phoneNumberPrivacy.fullNodeRetryDelayMs
  ).catch((err) => {
    logger.error({ err, account }, 'failed to get on-chain DEK for account')
    throw err
  })
}
