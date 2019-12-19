import * as admin from 'firebase-admin'
import { FIREBASE_DB, getFirebaseAdminCreds } from './config'

/**
 * Initialize Firebase Admin SDK
 */
console.info('Initializing Firebase')
admin.initializeApp({
  credential: getFirebaseAdminCreds(admin),
  databaseURL: FIREBASE_DB,
  projectId: 'celo-org-mobile',
})

export const database = admin.database()
