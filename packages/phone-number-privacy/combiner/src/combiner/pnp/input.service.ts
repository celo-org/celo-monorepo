import {
  authenticateUser,
  GetBlindedMessageSigRequest,
  hasValidAccountParam,
  hasValidBlindedPhoneNumberParam,
  identifierIsValidIfExists,
  isBodyReasonablySized,
} from '@celo/phone-number-privacy-common'
import Logger from 'bunyan'
import { Request } from 'express'
import { getContractKit } from '../../web3/contracts'
import { ICombinerInputService } from '../input.interface'

export class PnpInputService implements ICombinerInputService {
  validate(request: Request<{}, {}, GetBlindedMessageSigRequest>): boolean {
    return (
      hasValidAccountParam(request.body) &&
      hasValidBlindedPhoneNumberParam(request.body) &&
      identifierIsValidIfExists(request.body) &&
      isBodyReasonablySized(request.body)
    )
  }
  authenticate(
    request: Request<{}, {}, GetBlindedMessageSigRequest>,
    logger: Logger
  ): Promise<boolean> {
    return authenticateUser(request, getContractKit(), logger)
  }
}
