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

// Don't do this. It hangs next.js build process: https://github.com/zeit/next.js/issues/6824
// const db = firebase.database()

const NETWORK = 'alfajores'

export type Address = string

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
  beneficiary: Address
  status: RequestStatus
  txHash?: string
  type: RequestType
}

const noop = () => {
  /* noop*/
}

async function sendRequest(
  beneficiary: Address,
  type: RequestType,
  onChange: (request: RequestRecord) => void
) {
  const newRequest: RequestRecord = {
    beneficiary,
    status: RequestStatus.Pending,
    type,
  }

  onChange(newRequest)
  const ref = await getFirebase()
    .database()
    .ref(`${NETWORK}/requests`)
    .push(newRequest)

  return new Promise<RequestRecord>((resolve) => {
    const listener = ref.on('value', (snap) => {
      const record = snap.val() as RequestRecord
      onChange(record)

      if (record.status === RequestStatus.Done || record.status === RequestStatus.Failed) {
        ref.off('value', listener)
        resolve(record)
      }
    })
  })
}

export async function startFundRequest(
  beneficiary: Address,
  onChange: (request: RequestRecord) => void = noop
) {
  return sendRequest(beneficiary, RequestType.Faucet, onChange)
}

export async function startInviteRequest(
  beneficiary: Address, // This is actually a phone number
  onChange: (request: RequestRecord) => void = noop
) {
  return sendRequest(beneficiary, RequestType.Invite, onChange)
}
