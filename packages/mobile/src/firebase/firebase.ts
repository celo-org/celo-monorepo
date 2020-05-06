import firebase, { ReactNativeFirebase } from '@react-native-firebase/app'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
// We can't combine the 2 imports otherwise it only imports the type and fails at runtime
// tslint:disable-next-line: no-duplicate-imports
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import DeviceInfo from 'react-native-device-info'
import { eventChannel, EventChannel } from 'redux-saga'
import { call, put, select, spawn, take } from 'redux-saga/effects'
import { NotificationReceiveState } from 'src/account/types'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { FIREBASE_ENABLED } from 'src/config'
import { WritePaymentRequest } from 'src/firebase/actions'
import { handleNotification } from 'src/firebase/notifications'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'

const TAG = 'firebase/firebase'

// only exported for testing
export function* watchFirebaseNotificationChannel(
  channel: EventChannel<{
    message: FirebaseMessagingTypes.RemoteMessage
    stateType: NotificationReceiveState
  }>
) {
  try {
    Logger.info(`${TAG}/watchFirebaseNotificationChannel`, 'Started channel watching')
    while (true) {
      const data = yield take(channel)
      if (!data) {
        Logger.info(`${TAG}/watchFirebaseNotificationChannel`, 'Data in channel was empty')
        continue
      }
      Logger.info(`${TAG}/watchFirebaseNotificationChannel`, 'Notification received in the channel')
      yield call(handleNotification, data.message, data.stateType)
    }
  } catch (error) {
    Logger.error(
      `${TAG}/watchFirebaseNotificationChannel`,
      'Error proccesing notification channel event',
      error
    )
  } finally {
    Logger.info(`${TAG}/watchFirebaseNotificationChannel`, 'Notification channel terminated')
  }
}

export const initializeAuth = async (app: ReactNativeFirebase.Module, address: string) => {
  Logger.info(TAG, 'Initializing Firebase auth')
  const user = await app.auth().signInAnonymously()
  if (!user) {
    throw new Error('No Firebase user specified')
  }

  const userRef = app.database().ref('users')
  // Save some user data in DB if it's not there yet
  await userRef.child(user.user.uid).transaction((userData?: { address: string }) => {
    if (userData == null) {
      return { address }
    } else if (userData.address !== undefined && userData.address !== address) {
      // This shouldn't happen! If this is thrown it means the firebase user is reused
      // with different addresses (which we don't want) or the db was incorrectly changed remotely!
      throw new Error("User address in the db doesn't match persisted address")
    }
  })
  Logger.info(TAG, 'Firebase Auth initialized successfully')
}

export function* initializeCloudMessaging(app: ReactNativeFirebase.Module, address: string) {
  Logger.info(TAG, 'Initializing Firebase Cloud Messaging')

  // this call needs to include context: https://github.com/redux-saga/redux-saga/issues/27
  const enabled = yield call([app.messaging(), 'hasPermission'])
  if (!enabled) {
    try {
      yield call([app.messaging(), 'requestPermission'])
    } catch (error) {
      Logger.error(TAG, 'User has rejected messaging permissions', error)
      throw error
    }
  }

  // `registerDeviceForRemoteMessages` must be called before calling `getToken`
  // Note: `registerDeviceForRemoteMessages` is really only required for iOS and is a no-op on Android
  yield call([app.messaging(), 'registerDeviceForRemoteMessages'])
  const fcmToken = yield call([app.messaging(), 'getToken'])
  if (fcmToken) {
    yield call(registerTokenToDb, app, address, fcmToken)
    // First time setting the fcmToken also set the language selection
    const language = yield select(currentLanguageSelector)
    yield call(setUserLanguage, address, language)
  }

  app.messaging().onTokenRefresh(async (token) => {
    Logger.info(TAG, 'Cloud Messaging token refreshed')
    await registerTokenToDb(app, address, token)
  })

  // Listen for notification messages while the app is open
  const channelOnNotification: EventChannel<{
    message: FirebaseMessagingTypes.RemoteMessage
    stateType: NotificationReceiveState
  }> = eventChannel((emitter) => {
    const unsuscribe = () => {
      Logger.info(TAG, 'Notification channel closed, reseting callbacks. This is likely an error.')
      app.messaging().onMessage(() => null)
      app.messaging().onNotificationOpenedApp(() => null)
    }

    app.messaging().onMessage((message) => {
      Logger.info(TAG, 'Notification received while open')
      emitter({
        message,
        stateType: NotificationReceiveState.APP_ALREADY_OPEN,
      })
    })

    app.messaging().onNotificationOpenedApp((message) => {
      Logger.info(TAG, 'App opened via a notification')
      emitter({
        message,
        stateType: NotificationReceiveState.APP_FOREGROUNDED,
      })
    })
    return unsuscribe
  })
  yield spawn(watchFirebaseNotificationChannel, channelOnNotification)

  const initialNotification = yield call([app.messaging(), 'getInitialNotification'])
  if (initialNotification) {
    Logger.info(TAG, 'App opened fresh via a notification')
    yield call(
      handleNotification,
      initialNotification.notification,
      NotificationReceiveState.APP_OPENED_FRESH
    )
  }

  app.messaging().setBackgroundMessageHandler((remoteMessage) => {
    Logger.info(TAG, 'received Notification while app in Background')
    // Nothing to do while app is in background
    return Promise.resolve() // need to return a resolved promise so native code releases the JS context
  })
}

export const registerTokenToDb = async (
  app: ReactNativeFirebase.Module,
  address: string,
  fcmToken: string
) => {
  try {
    Logger.info(TAG, 'Registering Firebase client FCM token')
    const regRef = app.database().ref('registrations')
    // TODO(Rossy) add support for multiple tokens per address
    await regRef.child(address).update({ fcmToken })
    Logger.info(TAG, 'Firebase FCM token registered successfully', fcmToken)
  } catch (error) {
    Logger.error(TAG, 'Failed to register Firebase FCM token', error)
    throw error
  }
}

export function* paymentRequestWriter({ paymentInfo }: WritePaymentRequest) {
  try {
    Logger.info(TAG, `Writing pending request to database`)
    const pendingRequestRef = firebase.database().ref(`pendingRequests`)
    yield call(() => pendingRequestRef.push(paymentInfo))

    navigate(Screens.WalletHome)
  } catch (error) {
    Logger.error(TAG, 'Failed to write payment request to Firebase DB', error)
    yield put(showError(ErrorMessages.PAYMENT_REQUEST_FAILED))
  }
}

export function isVersionBelowMinimum(version: string, minVersion: string): boolean {
  const minVersionArray = minVersion.split('.')
  const versionArray = version.split('.')
  const minVersionLength = Math.min(minVersionArray.length, version.length)
  for (let i = 0; i < minVersionLength; i++) {
    if (minVersionArray[i] > versionArray[i]) {
      return true
    } else if (minVersionArray[i] < versionArray[i]) {
      return false
    }
  }
  if (minVersionArray.length > versionArray.length) {
    return true
  }
  return false
}

/*
Get the Version deprecation information.
Firebase DB Format: 
  (New) Add minVersion child to versions category with a string of the mininum version as string
*/
export async function isAppVersionDeprecated() {
  if (!FIREBASE_ENABLED) {
    return false
  }

  Logger.info(TAG, 'Checking version info')
  const version = DeviceInfo.getVersion()

  const versionsInfo = (
    await firebase
      .database()
      .ref('versions')
      .once('value')
  ).val()
  if (!versionsInfo || !versionsInfo.minVersion) {
    return false
  }
  const minVersion: string = versionsInfo.minVersion
  return isVersionBelowMinimum(version, minVersion)
}

export async function setUserLanguage(address: string, language: string) {
  try {
    Logger.info(TAG, `Setting language selection for user ${address}`)
    const regRef = firebase.database().ref('registrations')
    await regRef.child(address).update({ language })

    Logger.info(TAG, 'User Language synced successfully', language)
  } catch (error) {
    Logger.error(TAG, 'Failed to sync user language selection', error)
    throw error
  }
}
