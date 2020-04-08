import { PhoneNumberUtils } from '@celo/utils'
import * as functions from 'firebase-functions'
import { authenticateUser } from './common/identity'
import { incrementQueryCount } from './database/wrappers/account'
import { computeBLSSalt } from './salt-generation/bls-salt'
import { getRemainingQueryCount } from './salt-generation/query-quota'

export const getSalt = functions.https.onRequest(async (request, response) => {
  try {
    if (!isValidInput(request.body)) {
      response.status(400).send('Invalid input parameters')
      return
    }
    authenticateUser()
    const remainingQueryCount = await getRemainingQueryCount(
      request.body.account,
      request.body.phoneNumber
    )
    if (remainingQueryCount <= 0) {
      response.status(400).send('Requester exceeded salt service query quota')
      return
    }
    const salt = computeBLSSalt(request.body.queryPhoneNumber)
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

function isValidInput(requestBody: any): boolean {
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
