import firebase from 'react-native-firebase'
import { setAccountAddress } from 'src/app/actions'
import { store } from 'src/redux/store'
import { DEFAULT_TESTNET } from 'src/utils/config'
import logger from 'src/utils/logger'

const tag = 'FirebaseDb'

export interface Verifier {
  name: string
  phoneNum: string
  fcmToken: string
  supportedRegion: string
  isVerifying: boolean
  address?: string
}

let verifier: Verifier

export const initializeFirebase = async () => {
  try {
    logger.info(tag, 'Initializing Firebase for testnet:', DEFAULT_TESTNET)

    const user = await firebase.auth().signInAnonymously()
    if (!user) {
      throw new Error('No Firebase user specified')
    }

    const verifierRef = getVerifierRef(user.user.uid)
    verifierRef.on(
      'value',
      (snapshot) => {
        verifier = snapshot.val()
        if (verifier && verifier.address) {
          store.dispatch(setAccountAddress(verifier.address))
        }
      },
      (errorObject: any) => {
        logger.error(tag, 'User data read failed:', errorObject.code)
      }
    )
  } catch (error) {
    logger.error(tag, 'Firebase failed to initialize', error)
  }
}

const getUserUID = () => {
  const user = firebase.auth().currentUser
  if (!user) {
    throw new Error('No Firebase user specified')
  }
  return user.uid
}

export const setVerifier = (newVerifier: Verifier) => {
  try {
    const uid = getUserUID()
    const verifierRef = getVerifierRef(uid)
    logger.info(tag, 'Updating verifier in Firebase')
    verifierRef.set(newVerifier)
  } catch (error) {
    logger.error(tag, 'Failed to save verifier data to FirebaseDb', error)
  }
}

export const setIsVerifying = (isVerifying: boolean) => {
  if (!verifier) {
    return
  }
  setVerifier({ ...verifier, isVerifying })
}

export const setFcmToken = (fcmToken: string) => {
  if (!verifier) {
    return
  }
  setVerifier({ ...verifier, fcmToken })
}

const getVerifierRef = (uid: string) => {
  return firebase
    .database()
    .ref(`${DEFAULT_TESTNET}/mobileVerifiers`)
    .child(uid)
}
