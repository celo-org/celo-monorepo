import { PhoneNumberUtils } from '@celo/utils'
import { Request, Response } from 'firebase-functions'
import { ErrorMessages, respondWithError } from '../common/error-utils'
import { authenticateUser } from '../common/identity'
import { incrementQueryCount } from '../database/wrappers/account'
import { computeBlindedSignature } from './bls-signature'
import QueryQuota from './query-quota'

// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getBlindedMessageSignature" -d '{"queryPhoneNumber": "xfVo/qxqTXWE8AXzev8KcqJ2CG8sMqNQfn/0X2ch7dKGJyBGG8YjhFyNSmX1e1cB9n4ARdq6kYr0vZTAebx1Nudl3zR9ij0aIJY5wzhsR89uLPj/31H0Ks4FMf42oD4A/5ny0+AA1As0oUFvTpVr99Uk4+GxbRjX/iHgTa2qkM15ih/3Qot/tw/vt9LmDZAByogwM3EAHZFC+BLyYfgt8Tws/2jwiie61wET0Ms/JLOVZjiTZafwJJ74Wqlk/IgAAA==", "account":"0x117ea45d497ab022b85494ba3ab6f52969bf6813", "phoneNumber":"+15555555555"}' -H 'Content-Type: application/json'
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
    const salt = computeBlindedSignature(request.body.queryPhoneNumber)
    await incrementQueryCount(request.body.account)
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
