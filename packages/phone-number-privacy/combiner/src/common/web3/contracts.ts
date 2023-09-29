import { ContractKit } from '@celo/contractkit'
import { getDataEncryptionKey } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import config from '../../config'
import { Counters, Histograms, newMeter } from '../metrics'

export async function getDEK(kit: ContractKit, logger: Logger, account: string): Promise<string> {
  const _meter = newMeter(Histograms.fullNodeLatency, 'getDataEncryptionKey')
  return _meter(() =>
    getDataEncryptionKey(
      account,
      kit,
      logger,
      config.phoneNumberPrivacy.fullNodeTimeoutMs,
      config.phoneNumberPrivacy.fullNodeRetryCount,
      config.phoneNumberPrivacy.fullNodeRetryDelayMs
    ).catch((err) => {
      logger.error({ err, account }, 'failed to get on-chain DEK for account')
      Counters.blockchainErrors.inc()
      throw err
    })
  )
}
