import { sleep } from '@celo/base'
import { Result } from '@celo/base/lib/result'
import { BackupError } from '@celo/encrypted-backup'
import { IdentifierHashDetails } from '@celo/identity/lib/odis/identifier'
import { ErrorMessages, OdisContextName } from '@celo/identity/lib/odis/query'
import { PnpClientQuotaStatus } from '@celo/identity/lib/odis/quota'
import { CombinerEndpointPNP, rootLogger } from '@celo/phone-number-privacy-common'
import { performance } from 'perf_hooks'
import { queryOdisDomain, queryOdisForQuota, queryOdisForSalt } from './query'

const logger = rootLogger('odis-monitor')

export async function testPNPSignQuery(
  blockchainProvider: string,
  contextName: OdisContextName,
  timeoutMs?: number,
  bypassQuota?: boolean,
  useDEK?: boolean
) {
  try {
    const odisResponse: IdentifierHashDetails = await queryOdisForSalt(
      blockchainProvider,
      contextName,
      timeoutMs,
      bypassQuota,
      useDEK
    )
    logger.debug({ odisResponse }, 'ODIS salt request successful. System is healthy.')
  } catch (err) {
    if ((err as Error).message === ErrorMessages.ODIS_QUOTA_ERROR) {
      logger.warn(
        { error: err },
        'ODIS salt request out of quota. This is expected. System is healthy.'
      )
    } else {
      logger.error('ODIS salt request failed.')
      logger.error({ err })
      throw err
    }
  }
}

export async function testPNPQuotaQuery(
  blockchainProvider: string,
  contextName: OdisContextName,
  timeoutMs?: number
) {
  logger.info(`Performing test PNP query for ${CombinerEndpointPNP.PNP_QUOTA}`)
  try {
    const odisResponse: PnpClientQuotaStatus = await queryOdisForQuota(
      blockchainProvider,
      contextName,
      timeoutMs
    )
    logger.info({ odisResponse }, 'ODIS quota request successful. System is healthy.')
  } catch (err) {
    logger.error('ODIS quota request failed.')
    logger.error({ err })
    throw err
  }
}

export async function testDomainSignQuery(contextName: OdisContextName) {
  logger.info('Performing test domains query')
  let odisResponse: Result<Buffer, BackupError>
  try {
    odisResponse = await queryOdisDomain(contextName)
    logger.info({ odisResponse }, 'ODIS response')
  } catch (err) {
    logger.error('ODIS key hardening request failed.')
    logger.error({ err })
    throw err
  }
  if (odisResponse.ok) {
    logger.info('System is healthy')
  } else {
    throw new Error('Received not ok response')
  }
}

export async function concurrentRPSLoadTest(
  rps: number,
  blockchainProvider: string,
  contextName: OdisContextName,
  endpoint:
    | CombinerEndpointPNP.PNP_QUOTA
    | CombinerEndpointPNP.PNP_SIGN = CombinerEndpointPNP.PNP_SIGN,
  duration: number = 0,
  bypassQuota?: boolean,
  useDEK?: boolean
) {
  const taskFn = async (i: number) => {
    const start = performance.now()
    await (endpoint === CombinerEndpointPNP.PNP_SIGN
      ? testPNPSignQuery(blockchainProvider, contextName, undefined, bypassQuota, useDEK)
      : testPNPQuotaQuery(blockchainProvider, contextName))
    const requestDuration = performance.now() - start
    if (requestDuration > 600) {
      logger.warn({ duration: Math.round(requestDuration), index: i }, 'SLOW Request')
    } else {
      logger.info({ duration: Math.round(requestDuration), index: i }, 'request finished')
    }
  }

  return doRPSTest(taskFn, rps, duration)
}

async function doRPSTest(
  testFn: (reqNumber: number) => Promise<void>,
  rps: number,
  duration: number = 0
): Promise<void> {
  const inFlightRequests: Array<Promise<void>> = []
  let shouldRun = true

  async function requestSender() {
    let reqCounter = 1
    while (shouldRun) {
      for (let i = 0; i < rps; i++) {
        inFlightRequests.push(testFn(reqCounter++))
      }
      await sleep(1000)
    }
  }

  async function requestEnder() {
    while (shouldRun || inFlightRequests.length > 0) {
      if (inFlightRequests.length > 0) {
        const req = inFlightRequests.shift()
        await req?.catch((err) => {
          console.error('some request failed', err)
        })
      } else {
        await sleep(1000)
      }
    }
  }

  async function durationChecker() {
    await sleep(duration)
    shouldRun = false
  }

  if (duration === 0) {
    await Promise.all([requestSender(), requestEnder()])
  } else {
    await Promise.all([durationChecker(), requestSender(), requestEnder()])
  }
}
