import { concurrentMap, sleep } from '@celo/base'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { ErrorMessages } from '@celo/identity/lib/odis/query'
import { rootLogger as logger } from '@celo/phone-number-privacy-common'
import { queryOdisForSalt } from './query'
export const runTest = async () => {
  logger.info('Performing test query')
  try {
    const odisResponse: PhoneNumberHashDetails = await queryOdisForSalt()
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

export const loop = async () => {
  while (true) {
    const reqs = []
    for (let i = 0; i < 100; i++) {
      reqs.push(i)
    }

    await concurrentMap(100, reqs, async (i) => {
      await sleep(i * 10)
      try {
        while (true) {
          await runTest()
        }
      } catch {} // tslint:disable-line:no-empty
    })
  }
}

loop() // tslint:disable-line:no-floating-promises

