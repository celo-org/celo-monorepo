import { Platform } from 'react-native'
import ConfirmDeviceCredentials from 'react-native-confirm-device-credentials'
import { UNLOCK_DURATION } from 'src/geth/consts'
import i18n from 'src/i18n'
import Logger from 'src/utils/Logger'

// Any key name works.
const keyName: string = 'celo_key_name'

export function isPhoneAuthSupported() {
  // only support on API 23 and above.
  return Platform.Version >= 23
}

export const setPin = async (pin: string) => {
  if (!isPhoneAuthSupported) {
    throw Error('Keystore not supported on this device')
  }
  const humanReadableMessage: string = i18n.t('nuxNamePin1:enableScreenLockMessage')
  const securitySettingsButtonLabel: string = i18n.t(
    'nuxNamePin1:goToSystemSecuritySettingsActionLabel'
  )

  const isDeviceSecure: boolean = await ConfirmDeviceCredentials.isDeviceSecure()

  if (!isDeviceSecure) {
    while (!(await ConfirmDeviceCredentials.isDeviceSecure())) {
      try {
        await ConfirmDeviceCredentials.makeDeviceSecure(
          humanReadableMessage,
          securitySettingsButtonLabel
        )
      } catch (e) {
        Logger.showError(i18n.t('nuxNamePin1:EnableSystemScreenLockFailed') + ' ' + e)
      }
    }
  }

  const keystoreInitResult: boolean = await ConfirmDeviceCredentials.keystoreInit(
    keyName,
    UNLOCK_DURATION,
    false
  )
  if (!keystoreInitResult) {
    Logger.showError(i18n.t('nuxNamePin1:initKeystoreFailureMessage'))
    throw Error('PincodeViaAndroidKeystore/Failed to initialize keystore')
  }
  let storePinResult: boolean = false
  try {
    storePinResult = await ConfirmDeviceCredentials.storePin(keyName, pin)
  } catch (e) {
    Logger.debug('PincodeViaAndroidKeystore@setPin', 'setpin failed with:' + e)
    storePinResult = false
  }
  return storePinResult
}

export const getPin = async () => {
  if (!isPhoneAuthSupported) {
    throw Error('Keystore not supported on this device')
  }
  const isDeviceSecure: boolean = await ConfirmDeviceCredentials.isDeviceSecure()
  if (!isDeviceSecure) {
    Logger.showError(i18n.t('nuxNamePin1:pinLostForeverMessage'))
    return null
  }
  return ConfirmDeviceCredentials.retrievePin(keyName)
}
