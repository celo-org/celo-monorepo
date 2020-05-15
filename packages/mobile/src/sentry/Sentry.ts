import * as Sentry from '@sentry/react-native'
import DeviceInfo from 'react-native-device-info'
import * as RNFS from 'react-native-fs'
import { select } from 'redux-saga/effects'
import { SENTRY_URL } from 'src/config'
import { currentAccountSelector } from 'src/geth/selectors'
import Logger from 'src/utils/Logger'

const TAG = 'sentry/Sentry'

// This should be called as early in the lifecycle of the app as possible.
export async function installSentry() {
  if (!SENTRY_URL) {
    Logger.info(TAG, 'installSentry', 'Sentry URL not found, skiping instalation')
    return
  }
  Sentry.init({ dsn: SENTRY_URL, environment: DeviceInfo.getBundleId() })
  await uploadNdkCrashesIfAny()
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

const uploadNdkCrashesIfAny = async () => {
  // This file path should be same here and in MainApplication.java
  const ndkCrashLogsFilePath = RNFS.CachesDirectoryPath + '/ndk_crash_logs.txt'
  const ndkCrashLogcatLogsFilePath = RNFS.CachesDirectoryPath + '/ndk_crash_logcat_logs.txt'

  if (!(await RNFS.exists(ndkCrashLogsFilePath))) {
    Logger.debug(
      'Sentry@uploadNdkCrashesIfAny',
      `crash log file ${ndkCrashLogsFilePath} not found, no native crashes recorded`
    )
    return
  }

  const fileSize = parseInt((await RNFS.stat(ndkCrashLogsFilePath)).size, 10)
  Logger.info(
    'Sentry@uploadNdkCrashesIfAny',
    `crash log file ${ndkCrashLogsFilePath} found (${fileSize} bytes), capturing it via Sentry`
  )
  const msg1 = (await RNFS.exists(ndkCrashLogcatLogsFilePath))
    ? await RNFS.readFile(ndkCrashLogcatLogsFilePath)
    : 'Logcat logs not available'
  const msg2 = await RNFS.readFile(ndkCrashLogsFilePath)

  Sentry.captureMessage(`NDK crash\n${msg1}\n${msg2}`)
  await RNFS.unlink(ndkCrashLogsFilePath)

  if (!(await RNFS.exists(ndkCrashLogcatLogsFilePath))) {
    await RNFS.unlink(ndkCrashLogcatLogsFilePath)
  }
}
