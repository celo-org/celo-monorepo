import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import getConfig from 'next/config'
import Sentry from '../fullstack/sentry'
import {
  Address,
  E164Number,
  NETWORK,
  RequestRecord,
  RequestStatus,
  RequestType,
} from './FirebaseClient'

async function getFirebase() {
  if (!firebase.apps.length) {
    const { publicRuntimeConfig, serverRuntimeConfig } = getConfig()
    // These variables are defined in `env-config.js` file in the parent directory.
    firebase.initializeApp(publicRuntimeConfig.FIREBASE_CONFIG)
    const loginUsername = serverRuntimeConfig.FIREBASE_LOGIN_USERNAME
    const loginPassword = serverRuntimeConfig.FIREBASE_LOGIN_PASSWORD
    if (loginUsername === undefined || loginUsername === null || loginUsername.length === 0) {
      throw new Error('Login username is empty')
    }
    try {
      // Source: https://firebase.google.com/docs/auth
      await firebase.auth().signInWithEmailAndPassword(loginUsername, loginPassword)
    } catch (e) {
      Sentry.withScope((scope) => {
        scope.setTag('Firebase', 'auth')
        Sentry.captureException(e)
      })
      console.error(`Fail to login into Firebase: ${e}`)
      throw e
    }
  }
  return firebase
}

async function getDB(): Promise<firebase.database.Database> {
  return (await getFirebase()).database()
}

export async function sendRequest(beneficiary: Address | E164Number, type: RequestType) {
  const newRequest: RequestRecord = {
    beneficiary,
    status: RequestStatus.Pending,
    type,
  }
  try {
    const db = await getDB()
    const ref: firebase.database.Reference = await db.ref(`${NETWORK}/requests`).push(newRequest)
    return ref.key
  } catch (e) {
    Sentry.withScope((scope) => {
      scope.setTag('Firebase', 'sendRequest')
      Sentry.captureException(e)
    })

    console.error(`Error while sendRequest: ${e}`)
    throw e
  }
}
