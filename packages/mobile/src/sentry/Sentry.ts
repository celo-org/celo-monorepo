import * as Sentry from '@sentry/react-native'
import DeviceInfo from 'react-native-device-info'
import { select } from 'redux-saga/effects'
import { SENTRY_URL } from 'src/config'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'sentry/Sentry'

// This should be called as early in the lifecycle of the app as possible.
export async function installSentry() {
  if (!SENTRY_URL) {
    Logger.info(TAG, 'installSentry', 'Sentry URL not found, skiping instalation')
    return
  }
  Sentry.init({ dsn: SENTRY_URL, environment: DeviceInfo.getBundleId() })
  Logger.info(TAG, 'installSentry', 'Sentry installation complete')
}

// This should not be called at cold start since it can slow down the cold start.
export function* initializeSentryUserContext() {
  const account = yield select(currentAccountSelector)

  if (!account) {
    return
  }
  Logger.debug(
    TAG,
    'initializeSentryUserContext',
    `Setting Sentry user context to account "${account}"`
  )
  Sentry.setUser({
    username: account,
  })
}
