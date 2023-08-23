import { DomainRequest, WarningMessage } from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { SignerResponse } from '../../common/io'

export function logDomainResponseDiscrepancies<R extends DomainRequest>(
  logger: Logger,
  responses: Array<SignerResponse<R>>
) {
  const parsedResponses: Array<{
    signerUrl: string
    values: {
      version: string
      counter: number
      disabled: boolean
      timer: number
    }
  }> = []
  responses.forEach((response) => {
    if (response.res.success) {
      const { version, status } = response.res
      parsedResponses.push({
        signerUrl: response.url,
        values: {
          version,
          counter: status.counter,
          disabled: status.disabled,
          timer: status.timer,
        },
      })
    }
  })
  if (parsedResponses.length === 0) {
    logger.warn('No successful signer responses found!')
    return
  }

  // log all responses if we notice any discrepancies to aid with debugging
  const first = JSON.stringify(parsedResponses[0].values)
  for (let i = 1; i < parsedResponses.length; i++) {
    if (JSON.stringify(parsedResponses[i].values) !== first) {
      logger.warn({ parsedResponses }, WarningMessage.SIGNER_RESPONSE_DISCREPANCIES)
      break
    }
  }

  // disabled
  const numDisabled = parsedResponses.filter((res) => res.values.disabled).length
  if (numDisabled > 0 && numDisabled < parsedResponses.length) {
    logger.error({ parsedResponses }, WarningMessage.INCONSISTENT_SIGNER_DOMAIN_DISABLED_STATES)
  }
}
