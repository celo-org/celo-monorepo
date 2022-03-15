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
import { IInputService } from '../input.interface'

export class PnpInputService implements IInputService {
  validate(
    request: Request<{}, {}, unknown>
  ): request is Request<{}, {}, GetBlindedMessageSigRequest> {
    return (
      GetBlindedMessageSigRequestSchema.is(request.body),
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
