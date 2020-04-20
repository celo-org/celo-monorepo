import { PhoneNumberUtils } from '@celo/utils'
import * as functions from 'firebase-functions'
import { authenticateUser } from './common/identity'
import { incrementQueryCount } from './database/wrappers/account'
import { getNumberPairContacts, setNumberPairContacts } from './database/wrappers/number-pairs'
import { BLSCryptographyClient } from './salt-generation/bls-cryptography-client'
import QueryQuota from './salt-generation/query-quota'

export const getSalt = functions.https.onRequest(async (request, response) => {
  // TODO (amyslawson) refactor this internal logic and input validation to its own file
  // when adding error handling
  try {
    const queryQuota: QueryQuota = new QueryQuota()
    if (!isValidGetSaltInput(request.body)) {
      response.status(400).send('Invalid input parameters')
      return
    }
    authenticateUser()
    const remainingQueryCount = await queryQuota.getRemainingQueryCount(
      request.body.account,
      request.body.phoneNumber
    )
    if (remainingQueryCount <= 0) {
      response.status(400).send('Requester exceeded salt service query quota')
      return
    }
    const salt = await BLSCryptographyClient.computeBLSSalt(request.body.queryPhoneNumber)
    await incrementQueryCount(request.body.account).catch((error) => {
      // TODO [amyslawson] think of failure case here
      console.error(error)
    })
    response.json({ success: true, salt })
  } catch (e) {
    console.log('Failed to getSalt', e)
    response.status(500).send(e)
  }
})

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

// TODO (amyslawson) consider pagination or streaming of contacts?
export const getContactMatches = functions.https.onRequest(async (request, response) => {
  // TODO (amyslawson) refactor this internal logic and input validation to its own file
  // when adding error handling
  try {
    if (!isValidGetContactMatchesInput(request.body)) {
      response.status(400).send('Invalid input parameters')
      return
    }
    authenticateUser()
    const matchedContacts: ContactMatch[] = await Promise.all(
      (
        await getNumberPairContacts(request.body.userPhoneNumber, request.body.contactPhoneNumbers)
      ).map(async (numberPair) => ({
        phoneNumber: numberPair,
        salt: await BLSCryptographyClient.computeBLSSalt(numberPair),
      }))
    )
    await setNumberPairContacts(request.body.userPhoneNumber, request.body.contactPhoneNumbers)
    // TODO (amyslawson) return salts with contact
    response.json({ success: true, matchedContacts })
  } catch (e) {
    console.log('Failed to getContactMatches', e)
    response.status(500).send(e)
  }
})

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
