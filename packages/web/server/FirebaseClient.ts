import * as firebase from 'firebase/app'
import 'firebase/database'
import getConfig from 'next/config'

function getFirebase() {
  if (!firebase.apps.length) {
    const { publicRuntimeConfig } = getConfig()
    firebase.initializeApp(publicRuntimeConfig.FIREBASE_CONFIG)
  }
  return firebase
}

function getDB() {
  return getFirebase().database()
}

// Don't do this. It hangs next.js build process: https://github.com/zeit/next.js/issues/6824
// const db = firebase.database()

const NETWORK = 'alfajores'

export type Address = string
type E164Number = string

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
  const ref = await getDB()
    .ref(`${NETWORK}/requests`)
    .push(newRequest)

  return ref.key
}

export async function subscribeRequest(key: string, onChange: (record: RequestRecord) => void) {
  const ref = await getDB().ref(`${NETWORK}/requests/${key}`)

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
