import { concurrentMap, sleep } from '@celo/base'
import { Result } from '@celo/base/lib/result'
import { BackupError } from '@celo/encrypted-backup'
import { IdentifierHashDetails } from '@celo/identity/lib/odis/identifier'
import { ErrorMessages, OdisContextName } from '@celo/identity/lib/odis/query'
import { PnpClientQuotaStatus } from '@celo/identity/lib/odis/quota'
import { CombinerEndpointPNP, rootLogger } from '@celo/phone-number-privacy-common'
import { queryOdisDomain, queryOdisForQuota, queryOdisForSalt } from './query'

const logger = rootLogger('odis-monitor')

export async function testPNPSignQuery(
  blockchainProvider: string,
  contextName: OdisContextName,
  endpoint: CombinerEndpointPNP.PNP_SIGN,
  timeoutMs?: number
) {
  logger.info(`Performing test PNP query for ${endpoint}`)
  try {
    const odisResponse: IdentifierHashDetails = await queryOdisForSalt(
      blockchainProvider,
      contextName,
      endpoint,
      timeoutMs
    )
    logger.info({ odisResponse }, 'ODIS salt request successful. System is healthy.')
  } catch (err) {
    if ((err as Error).message === ErrorMessages.ODIS_QUOTA_ERROR) {
      logger.info(
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

export async function serialLoadTest(
  n: number,
  blockchainProvider: string,
  contextName: OdisContextName,
  endpoint:
    | CombinerEndpointPNP.PNP_QUOTA
    | CombinerEndpointPNP.PNP_SIGN = CombinerEndpointPNP.PNP_SIGN,
  timeoutMs?: number
) {
  for (let i = 0; i < n; i++) {
    try {
      switch (endpoint) {
        case CombinerEndpointPNP.PNP_SIGN:
          await testPNPSignQuery(blockchainProvider, contextName, endpoint, timeoutMs)
          break
        case CombinerEndpointPNP.PNP_QUOTA:
          await testPNPQuotaQuery(blockchainProvider, contextName, timeoutMs)
      }
    } catch {} // tslint:disable-line:no-empty
  }
}

export async function concurrentLoadTest(
  workers: number,
  blockchainProvider: string,
  contextName: OdisContextName,
  endpoint:
    | CombinerEndpointPNP.PNP_QUOTA
    | CombinerEndpointPNP.PNP_SIGN = CombinerEndpointPNP.PNP_SIGN,
  timeoutMs?: number
) {
  while (true) {
    const reqs = []
    for (let i = 0; i < workers; i++) {
      reqs.push(i)
    }
    await concurrentMap(workers, reqs, async (i) => {
      await sleep(i * 10)
      while (true) {
        try {
          switch (endpoint) {
            case CombinerEndpointPNP.PNP_SIGN:
              await testPNPSignQuery(blockchainProvider, contextName, endpoint, timeoutMs)
              break
            case CombinerEndpointPNP.PNP_QUOTA:
              await testPNPQuotaQuery(blockchainProvider, contextName, timeoutMs)
          }
        } catch {} // tslint:disable-line:no-empty
      }
    })
  }
}
