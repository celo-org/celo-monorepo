import * as functions from 'firebase-functions'
import fetch from 'node-fetch'

export const proxyReveal = functions.https.onCall(async (data, context) => {
  // refuse requests that do not have basic auth
  checkAuth(context)

  const { attestationServiceUrl, account, phoneNumber, issuer, salt, smsRetrieverAppSig } = data
  const requestBody = {
    account,
    phoneNumber,
    issuer,
    salt,
    smsRetrieverAppSig,
  }
  try {
    const res = await fetch(attestationServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    return {
      status: res.status,
      data: await res.text(),
    }
  } catch (error) {
    // Firebase callable functions should throw errors of this type
    // to be fed back to the user
    throw new functions.https.HttpsError('unknown', error.message)
  }
})

export const proxyRevealStatus = functions.https.onCall(async (data, context) => {
  // refuse requests that do not have basic auth
  checkAuth(context)

  const { attestationServiceUrl, phoneNumber, account, issuer, pepper } = data
  try {
    const urlParams = new URLSearchParams({
      phoneNumber,
      salt: pepper ?? '',
      issuer,
      account,
    })

    const res = await fetch(attestationServiceUrl + '?' + urlParams, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return {
      status: res.status,
      data: await res.text(),
    }
  } catch (error) {
    // Firebase callable functions should throw errors of this type
    // to be fed back to the user
    throw new functions.https.HttpsError('unknown', error.message)
  }
})

function checkAuth(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }
}
