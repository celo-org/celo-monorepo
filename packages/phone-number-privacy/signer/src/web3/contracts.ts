import { retryAsyncWithBackOffAndTimeout } from '@celo/base'
import { ContractKit, newKit } from '@celo/contractkit'
import {
  FULL_NODE_TIMEOUT_IN_MS,
  RETRY_COUNT,
  RETRY_DELAY_IN_MS,
} from '@celo/phone-number-privacy-common'
import { Counters, Histograms, Labels } from '../common/metrics'
import config from '../config'

const contractKit = newKit(config.blockchain.provider)

export function getContractKit(): ContractKit {
  return contractKit
}

export async function getBlockNumber(): Promise<number> {
  const getBlockNumberMeter = Histograms.getBlindedSigInstrumentation
    .labels('getBlockNumber')
    .startTimer()
  const res = retryAsyncWithBackOffAndTimeout(
    () => getContractKit().connection.getBlockNumber(),
    RETRY_COUNT,
    [],
    RETRY_DELAY_IN_MS,
    undefined,
    FULL_NODE_TIMEOUT_IN_MS
  )
    .catch((err) => {
      Counters.blockchainErrors.labels(Labels.read).inc()
      throw err
    })
    .finally(getBlockNumberMeter)

  return res
}
