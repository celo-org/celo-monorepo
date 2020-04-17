import { PhoneNumberUtils } from '@celo/utils'
import { Request, Response } from 'firebase-functions'
import { authenticateUser } from '../common/identity'
import { ErrorMessages, respondWithError } from '../common/utils'
import { incrementQueryCount } from '../database/wrappers/account'
import { computeBLSSalt } from './bls-salt'
import QueryQuota from './query-quota'

export async function handleGetSalt(request: Request, response: Response) {
  try {
    const queryQuota: QueryQuota = new QueryQuota()
    if (!isValidGetSaltInput(request.body)) {
      respondWithError(response, 400, ErrorMessages.INVALID_INPUT)
      return
    }
    authenticateUser()
    const remainingQueryCount = await queryQuota.getRemainingQueryCount(
      request.body.account,
      request.body.phoneNumber
    )
    if (remainingQueryCount <= 0) {
      respondWithError(response, 400, ErrorMessages.EXCEEDED_QUOTA)
      return
    }
    const salt = computeBLSSalt(request.body.queryPhoneNumber)
    await incrementQueryCount(request.body.account).catch((error) => {
      console.error(ErrorMessages.DATABASE_UPDATE_FAILURE, error)
    })
    response.json({ success: true, salt })
  } catch (error) {
    console.error('Failed to getSalt', error)
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

function isValidGetSaltInput(requestBody: any): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidPhoneNumberParam(requestBody) &&
    hasValidQueryPhoneNumberParam(requestBody)
  )
}

function hasValidAccountParam(requestBody: any): boolean {
  return requestBody.account && (requestBody.account as string).startsWith('0x')
}

function hasValidPhoneNumberParam(requestBody: any): boolean {
  return requestBody.phoneNumber && PhoneNumberUtils.isE164Number(requestBody.phoneNumber)
}

function hasValidQueryPhoneNumberParam(requestBody: any): boolean {
  return requestBody.queryPhoneNumber
}
