import { Platform } from 'react-native'
import ConfirmDeviceCredentials from 'react-native-confirm-device-credentials'
import { UNLOCK_DURATION } from 'src/geth/consts'
import i18n from 'src/i18n'
import Logger from 'src/utils/Logger'

const TAG = 'pincode/PincodeUtils'
const keyName = 'celo_key_name'

export function isPhoneAuthSupported() {
  // only support on API 23 and above.
  return Platform.Version >= 23
}

export const setPin = async (pin: string) => {
  Logger.debug(TAG + '@setPin', 'Setting pin in phone keystore')

  if (!isPhoneAuthSupported()) {
    throw Error('Keystore not supported on this device')
  }
  const humanReadableMessage: string = i18n.t('nuxNamePin1:enableScreenLockMessage')
  const securitySettingsButtonLabel: string = i18n.t(
    'nuxNamePin1:goToSystemSecuritySettingsActionLabel'
  )

  const isDeviceSecure: boolean = await ConfirmDeviceCredentials.isDeviceSecure()

  if (!isDeviceSecure) {
    try {
      await ConfirmDeviceCredentials.makeDeviceSecure(
        humanReadableMessage,
        securitySettingsButtonLabel
      )
    } catch (e) {
      Logger.showError(i18n.t('nuxNamePin1:EnableSystemScreenLockFailed'))
      throw e
    }
  }

  const keystoreInitResult: boolean = await ConfirmDeviceCredentials.keystoreInit(
    keyName,
    UNLOCK_DURATION,
    false
  )
  if (!keystoreInitResult) {
    Logger.showError(i18n.t('nuxNamePin1:initKeystoreFailureMessage'))
    throw Error('Failed to initialize keystore')
  }

  try {
    await ConfirmDeviceCredentials.storePin(keyName, pin)
    Logger.debug(TAG + '@setPin', 'Pin set in phone keystore')
  } catch (e) {
    Logger.error(TAG + '@setPin', 'Failed to set pin in keystore', e)
    throw e
  }
}

export const getPin = async () => {
  Logger.debug(TAG + '@getPin', 'Getting pin from phone keystore')

  if (!isPhoneAuthSupported()) {
    throw Error('Keystore not supported on this device')
  }

  const isDeviceSecure: boolean = await ConfirmDeviceCredentials.isDeviceSecure()
  if (!isDeviceSecure) {
    throw Error('No pin found, phone is not secured')
  }

  return ConfirmDeviceCredentials.retrievePin(keyName)
}
