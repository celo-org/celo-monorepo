import { Request, Response } from 'firebase-functions'
import { ErrorMessages, respondWithError } from '../common/error-utils'
import { authenticateUser } from '../common/identity'
import { getDidMatchmaking, setDidMatchmaking } from '../database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from '../database/wrappers/number-pairs'

// TODO (amyslawson) consider pagination or streaming of contacts?
export async function handleGetContactMatches(request: Request, response: Response) {
  try {
    if (!isValidGetContactMatchesInput(request.body)) {
      respondWithError(response, 400, ErrorMessages.INVALID_INPUT)
      return
    }
    authenticateUser()
    if (await getDidMatchmaking(request.body.account)) {
      console.warn(ErrorMessages.DUPLICATE_REQUEST_TO_MATCHMAKE)
      respondWithError(response, 403, ErrorMessages.DUPLICATE_REQUEST_TO_MATCHMAKE)
      return
    }
    const matchedContacts: ContactMatch[] = (
      await getNumberPairContacts(request.body.userPhoneNumber, request.body.contactPhoneNumbers)
    ).map((numberPair) => ({ phoneNumber: numberPair }))
    await setNumberPairContacts(request.body.userPhoneNumber, request.body.contactPhoneNumbers)
    await setDidMatchmaking(request.body.account)
    response.json({ success: true, matchedContacts })
  } catch (e) {
    console.error(ErrorMessages.UNKNOWN_ERROR + ' Failed to getContactMatches', e)
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

interface ContactMatch {
  phoneNumber: string
}

function isValidGetContactMatchesInput(requestBody: any): boolean {
  return (
    hasValidAccountParam(requestBody) &&
    hasValidUserPhoneNumberParam(requestBody) &&
    hasValidContractPhoneNumbersParam(requestBody)
  )
}

function hasValidAccountParam(requestBody: any): boolean {
  return requestBody.account && (requestBody.account as string).startsWith('0x')
}

function hasValidUserPhoneNumberParam(requestBody: any): boolean {
  return requestBody.userPhoneNumber
}

function hasValidContractPhoneNumbersParam(requestBody: any): boolean {
  return requestBody.contactPhoneNumbers && Array.isArray(requestBody.contactPhoneNumbers)
}
