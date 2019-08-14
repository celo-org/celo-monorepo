import * as firebasePackage from 'firebase'
import * as firebase from 'firebase/app'
import 'firebase/database'
import getConfig from 'next/config'

async function getFirebase() {
  if (!firebase.apps.length) {
    const { publicRuntimeConfig } = getConfig()
    // These variables are defined in `env-config.js` file in the parent directory.
    firebase.initializeApp(publicRuntimeConfig.FIREBASE_CONFIG)
    const loginUsername = publicRuntimeConfig.LOGIN_USERNAME
    const loginPassword = publicRuntimeConfig.LOGIN_PASSWORD
    if (loginUsername === null || loginUsername.length === 0) {
      throw new Error('Login username is empty')
    }
    try {
      // Source: https://firebase.google.com/docs/auth
      await firebasePackage.auth().signInWithEmailAndPassword(loginUsername, loginPassword)
    } catch (e) {
      console.error(`Fail to login into Firebase with usern: ${e}`)
      throw e
    }
  }
  return firebase
}

async function getDB(): Promise<firebase.database.Database> {
  return (await getFirebase()).database()
}

// Don't do this. It hangs next.js build process: https://github.com/zeit/next.js/issues/6824
// const db = firebase.database()

const NETWORK = 'alfajores'

export type Address = string
export type E164Number = string

export enum RequestStatus {
  Pending = 'Pending',
  Working = 'Working',
  Done = 'Done',
  Failed = 'Failed',
}

export enum RequestType {
  Faucet = 'Faucet',
  Invite = 'Invite',
}

export interface RequestRecord {
  beneficiary: Address | E164Number
  status: RequestStatus
  type: RequestType
  dollarTxHash?: string
  goldTxHash?: string
  escrowTxHash?: string // only on Invites
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
    console.error(`Error while sendRequest: ${e}`)
    throw e
  }
}

export async function subscribeRequest(key: string, onChange: (record: RequestRecord) => void) {
  const ref: firebase.database.Reference = (await getDB()).ref(`${NETWORK}/requests/${key}`)

  const listener = ref.on('value', (snap) => {
    const record = snap.val() as RequestRecord

    if (record) {
      onChange(record)
    }

    if (record.status === RequestStatus.Done || record.status === RequestStatus.Failed) {
      ref.off('value', listener)
    }
  })
}
