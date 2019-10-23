import firebase, { Firebase } from 'react-native-firebase'
import { RemoteMessage } from 'react-native-firebase/messaging'
import { Notification, NotificationOpen } from 'react-native-firebase/notifications'
import { Sentry } from 'react-native-sentry'
import { eventChannel, EventChannel } from 'redux-saga'
import { call, put, select, spawn, take } from 'redux-saga/effects'
import { NotificationReceiveState, PaymentRequest } from 'src/account'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { handleNotification } from 'src/firebase/notifications'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'

const TAG = 'firebase/firebase'

// only exported for testing
export function* watchFirebaseNotificationChannel(
  channel: EventChannel<{ notification: Notification; stateType: NotificationReceiveState }>
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
      yield call(handleNotification, data.notification, data.stateType)
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

export const initializeAuth = async (app: Firebase, address: string) => {
  Logger.info(TAG, 'Initializing Firebase auth')
  const user = await app.auth().signInAnonymously()
  if (!user) {
    throw new Error('No Firebase user specified')
  }

  const userRef = app.database().ref('users')
  // Save some user data in DB if it's not there yet
  await userRef.child(user.user.uid).transaction((userData) => {
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

export function* initializeCloudMessaging(app: Firebase, address: string) {
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
    notification: Notification
    stateType: NotificationReceiveState
  }> = eventChannel((emitter) => {
    const unsuscribe = () => {
      Logger.info(TAG, 'Notification channel closed, reseting callbacks. This is likely an error.')
      app.notifications().onNotification(() => null)
      app.notifications().onNotificationOpened(() => null)
    }

    app.notifications().onNotification((notification: Notification) => {
      Logger.info(TAG, 'Notification received while open')
      emitter({ notification, stateType: NotificationReceiveState.APP_ALREADY_OPEN })
    })

    app.notifications().onNotificationOpened((notification: NotificationOpen) => {
      Logger.info(TAG, 'App opened via a notification')
      emitter({
        notification: notification.notification,
        stateType: NotificationReceiveState.APP_FOREGROUNDED,
      })
    })
    return unsuscribe
  })
  yield spawn(watchFirebaseNotificationChannel, channelOnNotification)

  const initialNotification = yield call([app.notifications(), 'getInitialNotification'])
  if (initialNotification) {
    Logger.info(TAG, 'App opened fresh via a notification')
    yield call(
      handleNotification,
      initialNotification.notification,
      NotificationReceiveState.APP_OPENED_FRESH
    )
  }
}

export async function onBackgroundNotification(remoteMessage: RemoteMessage) {
  Logger.info(TAG, 'recieved Notification while app in Background')
  Sentry.captureMessage(`Received Unknown RNFirebaseBackgroundMessage `, {
    extra: remoteMessage,
  })
  // https://facebook.github.io/react-native/docs/0.44/appregistry#registerheadlesstask
  return Promise.resolve() // need to return a resolved promise so native code releases the JS context
}

export const registerTokenToDb = async (app: Firebase, address: string, fcmToken: string) => {
  try {
    Logger.info(TAG, 'Registering Firebase client FCM token')
    const regRef = app.database().ref('registrations')
    // TODO(Rossy) add support for multiple tokens per address
    await regRef.child(address).update({ fcmToken })
    Logger.info(TAG, 'Firebase FCM token registed successfully', fcmToken)
  } catch (error) {
    Logger.error(TAG, 'Failed to register Firebase FCM token', error)
    throw error
  }
}

export function* writePaymentRequest(paymentInfo: PaymentRequest) {
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

export async function getVersionInfo(version: string) {
  const versionFSPath = version.split('.').join('/')
  Logger.info(TAG, `Checking version info ${version}`)
  return (await firebase
    .database()
    .ref(`versions/${versionFSPath}`)
    .once('value')).val()
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
