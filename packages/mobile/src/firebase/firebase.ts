import firebase, { Firebase } from 'react-native-firebase'
import { RemoteMessage } from 'react-native-firebase/messaging'
import { Notification, NotificationOpen } from 'react-native-firebase/notifications'
import { Sentry } from 'react-native-sentry'
import { NotificationReceiveState, PaymentRequest } from 'src/account'
import { handleNotification } from 'src/firebase/notifications'
import { getReduxStore } from 'src/redux/store'
import Logger from 'src/utils/Logger'

const TAG = 'Firebase'

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

export const initializeCloudMessaging = async (app: Firebase, address: string) => {
  // TODO(cmcewen): remove once we move off thunk
  const store = getReduxStore()
  const language = store.getState().app.language
  const dispatch = store.dispatch

  Logger.info(TAG, 'Initializing Firebase Cloud Messaging')
  const enabled = await app.messaging().hasPermission()
  if (!enabled) {
    try {
      await app.messaging().requestPermission()
    } catch (error) {
      Logger.error(TAG, 'User has rejected messaging permissions', error)
      throw error
    }
  }

  const fcmToken = await app.messaging().getToken()
  if (fcmToken) {
    registerTokenToDb(app, address, fcmToken)
    // First time setting the fcmToken also set the language selection
    setUserLanguage(address, language)
  }

  // Monitor for future token refreshes
  app.messaging().onTokenRefresh((token) => {
    Logger.info(TAG, 'Cloud Messaging token refreshed')
    registerTokenToDb(app, address, token)
  })

  // Listen for notification messages while the app is open
  app.notifications().onNotification((notification: Notification) => {
    Logger.info(TAG, 'Notification received while open')
    dispatch(handleNotification(notification, NotificationReceiveState.APP_ALREADY_OPEN))
  })

  app.notifications().onNotificationOpened((notification: NotificationOpen) => {
    Logger.info(TAG, 'App opened via a notification')
    dispatch(
      handleNotification(notification.notification, NotificationReceiveState.APP_FOREGROUNDED)
    )
  })

  const initialNotification = await app.notifications().getInitialNotification()
  if (initialNotification) {
    Logger.info(TAG, 'App opened fresh via a notification')
    dispatch(
      handleNotification(
        initialNotification.notification,
        NotificationReceiveState.APP_OPENED_FRESH
      )
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

const registerTokenToDb = async (app: Firebase, address: string, fcmToken: string) => {
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
