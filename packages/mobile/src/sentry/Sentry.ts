import { anonymizedPhone } from '@celo/utils/src/phoneNumbers'
import DeviceInfo from 'react-native-device-info'
import * as RNFS from 'react-native-fs'
import { Sentry } from 'react-native-sentry'
import { e164NumberSelector } from 'src/account/reducer'
import { SENTRY_URL } from 'src/config'
import { DispatchType, GetStateType } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'sentry/Sentry'

// This should be called as early in the lifecycle of the app as possible.
export const installSentry = () => {
  if (!SENTRY_URL) {
    Logger.info(TAG, 'installSentry', 'Sentry URL not found, skiping instalation')
    return
  }
  Sentry.config(SENTRY_URL).install()
  Sentry.setTagsContext({
    environment: DeviceInfo.getBundleId(),
    react: true,
  })
  uploadNdkCrashesIfAny()
  Logger.info(TAG, 'installSentry', 'Sentry installation complete')
}

// This should not be called at cold start since it can slow down the cold start.
export const initializeSentryUserContext = () => async (
  dispatch: DispatchType,
  getState: GetStateType
) => {
  const state = getState()
  const account = currentAccountSelector(state)
  if (!account) {
    return
  }
  const phoneNumber =
    e164NumberSelector(state) || (await DeviceInfo.getPhoneNumber()) || 'unknownPhoneNumber'
  Logger.debug(
    TAG,
    'initializeSentryUserContext',
    `Setting Sentry user context to "${phoneNumber}" and "${account}"`
  )
  Sentry.setUserContext({
    username: anonymizedPhone(phoneNumber.slice(0, -4)),
    extra: {
      Address: account,
    },
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
