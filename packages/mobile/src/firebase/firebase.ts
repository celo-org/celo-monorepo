import firebase, { Firebase } from 'react-native-firebase'
import { RemoteMessage } from 'react-native-firebase/messaging'
import { Notification, NotificationOpen } from 'react-native-firebase/notifications'
import { Sentry } from 'react-native-sentry'
import { eventChannel, EventChannel } from 'redux-saga'
import { call, select, spawn, take } from 'redux-saga/effects'
import { NotificationReceiveState, PaymentRequest } from 'src/account'
import { currentLanguageSelector } from 'src/app/reducers'
import { handleNotification } from 'src/firebase/notifications'
import Logger from 'src/utils/Logger'

const TAG = 'Firebase'

export function* watchFirebaseNotificationChannel(channel: EventChannel<Notification>) {
  Logger.info(`${TAG}/watchFirebaseNotificationChannel`, 'Started channel watching')
  while (true) {
    const { data } = yield take(channel)
    if (!data) {
      break
    }
    Logger.info(`${TAG}/startFirebaseOnRefresh`, 'Notification received in the channel')
    yield handleNotification(data.notification, NotificationReceiveState.APP_ALREADY_OPEN)
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
    }
  })
  Logger.info(TAG, 'Firebase Auth initialized successfully')
}

export function* initializeCloudMessaging(app: Firebase, address: string) {
  Logger.info(TAG, 'Initializing Firebase Cloud Messaging')

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

  // TODO type here
  // TODO test if this channel actually works
  const channelOnNotification: any = eventChannel((emitter) => {
    app.notifications().onNotification(
      (notification: Notification): any => {
        Logger.info(TAG, 'Notification received while open')
        emitter({ notification })
        // expected side effect:
        // yield handleNotification(notification.notification, NotificationReceiveState.APP_FOREGROUNDED)
      }
    )

    // Return an unsubscribe method
    return () => null
  })

  spawn(watchFirebaseNotificationChannel, channelOnNotification)
  // put(startFirebaseOnNotification(channelOnNotification))

  // Listen for notification messages while the app is open
  eventChannel((emitter) => {
    app.notifications().onNotificationOpened((notification: NotificationOpen) => {
      Logger.info(TAG, 'App opened via a notification')
      emitter({ notification: notification.notification })
      // expected side effect:
      // yield handleNotification(notification.notification, NotificationReceiveState.APP_FOREGROUNDED)
    })

    // Return an unsubscribe method
    return () => null
  })

  // TODO (not doing anything for the moment)
  // put(startFirebaseOnRefreshAction(channelOnNotificationOpened))

  const initialNotification = yield call([app.notifications(), 'getInitialNotification'])
  if (initialNotification) {
    Logger.info(TAG, 'App opened fresh via a notification')
    yield handleNotification(
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

export const writePaymentRequest = (paymentInfo: PaymentRequest) => async () => {
  try {
    Logger.info(TAG, `Writing pending request to database`)
    const pendingRequestRef = firebase.database().ref(`pendingRequests`)
    return pendingRequestRef.push(paymentInfo)
  } catch (error) {
    Logger.error(TAG, 'Failed to write payment request to Firebase DB', error)
    throw error
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
