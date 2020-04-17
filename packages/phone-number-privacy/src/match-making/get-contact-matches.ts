import { Request, Response } from 'firebase-functions'
import { authenticateUser } from '../common/identity'
import { ErrorMessages, respondWithError } from '../common/utils'
import { getNumberPairContacts, setNumberPairContacts } from '../database/wrappers/number-pairs'
import { computeBLSSalt } from '../salt-generation/bls-salt'

// TODO (amyslawson) consider pagination or streaming of contacts?
export async function handleGetContactMatches(request: Request, response: Response) {
  // TODO (amyslawson) refactor this internal logic and input validation to its own file
  // when adding error handling
  try {
    if (!isValidGetContactMatchesInput(request.body)) {
      respondWithError(response, 400, ErrorMessages.INVALID_INPUT)
      return
    }
    authenticateUser()
    const matchedContacts: ContactMatch[] = (
      await getNumberPairContacts(request.body.userPhoneNumber, request.body.contactPhoneNumbers)
    ).map((numberPair) => ({ phoneNumber: numberPair, salt: computeBLSSalt(numberPair) }))
    await setNumberPairContacts(request.body.userPhoneNumber, request.body.contactPhoneNumbers)
    // TODO (amyslawson) return salts with contact
    response.json({ success: true, matchedContacts })
  } catch (e) {
    console.error('Failed to getContactMatches', e)
    respondWithError(response, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}

interface ContactMatch {
  phoneNumber: string
  salt: Buffer
}

function isValidGetContactMatchesInput(requestBody: any): boolean {
  return hasValidUserPhoneNumberParam(requestBody) && hasValidContractPhoneNumbersParam(requestBody)
}

function hasValidUserPhoneNumberParam(requestBody: any): boolean {
  return requestBody.userPhoneNumber
}

function hasValidContractPhoneNumbersParam(requestBody: any): boolean {
  return requestBody.contactPhoneNumbers && Array.isArray(requestBody.contactPhoneNumbers)
}
