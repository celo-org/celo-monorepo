import * as firebase from 'firebase/app'
import 'firebase/database'
import getConfig from 'next/config'
import { NETWORK, RequestRecord, RequestStatus } from '../src/fauceting/FaucetInterfaces'
// Code in this file is sent to the browser.
// Code in FirebaseServerSide.ts is not sent to the browser.

async function getFirebase() {
  if (!firebase.apps.length) {
    const { publicRuntimeConfig } = getConfig()
    // These variables are defined in `env-config.js` file in the parent directory.
    firebase.initializeApp(publicRuntimeConfig.FIREBASE_CONFIG)
  }
  return firebase
}

async function getDB(): Promise<firebase.database.Database> {
  return (await getFirebase()).database()
}

// Don't do this. It hangs next.js build process: https://github.com/zeit/next.js/issues/6824
// const db = firebase.database()

export default async function subscribeRequest(
  key: string,
  onChange: (record: RequestRecord) => void
) {
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
