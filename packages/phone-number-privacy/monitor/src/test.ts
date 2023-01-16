import { concurrentMap, sleep } from '@celo/base'
import { Result } from '@celo/base/lib/result'
import { BackupError } from '@celo/encrypted-backup'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { ErrorMessages, OdisContextName } from '@celo/identity/lib/odis/query'
import { CombinerEndpointPNP, rootLogger } from '@celo/phone-number-privacy-common'
import { queryOdisDomain, queryOdisForSalt } from './query'

const logger = rootLogger('odis-monitor')

export async function testPNPQuery(
  blockchainProvider: string,
  contextName: OdisContextName,
  endpoint: CombinerEndpointPNP.LEGACY_PNP_SIGN | CombinerEndpointPNP.PNP_SIGN
) {
  logger.info(`Performing test PNP query for ${endpoint}`)
  try {
    const odisResponse: PhoneNumberHashDetails = await queryOdisForSalt(
      blockchainProvider,
      contextName,
      endpoint
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

export async function testDomainsQuery(contextName: OdisContextName) {
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
    | CombinerEndpointPNP.LEGACY_PNP_SIGN
    | CombinerEndpointPNP.PNP_SIGN = CombinerEndpointPNP.LEGACY_PNP_SIGN
) {
  for (let i = 0; i < n; i++) {
    try {
      await testPNPQuery(blockchainProvider, contextName, endpoint)
    } catch {} // tslint:disable-line:no-empty
  }
}

export async function concurrentLoadTest(
  workers: number,
  blockchainProvider: string,
  contextName: OdisContextName,
  endpoint:
    | CombinerEndpointPNP.LEGACY_PNP_SIGN
    | CombinerEndpointPNP.PNP_SIGN = CombinerEndpointPNP.LEGACY_PNP_SIGN
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
          await testPNPQuery(blockchainProvider, contextName, endpoint)
        } catch {} // tslint:disable-line:no-empty
      }
    })
  }
}
