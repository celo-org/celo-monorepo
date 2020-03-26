import { Permission, PermissionsAndroid } from 'react-native'
import Logger from 'src/utils/Logger'

// TODO(Rossy) i18n in this file

const TAG = 'utils/permissions.android'

export async function requestPhoneStatePermission() {
  return requestPermission(
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    'Phone State',
    'Celo would like to read your phone state to retrieve your phone number.'
  )
}

export async function requestContactsPermission() {
  return requestPermission(
    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    'View Contacts',
    'Celo would like to view your contacts'
  )
}

export async function checkContactsPermission() {
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS)
}

async function requestPermission(permission: Permission, title?: string, message?: string) {
  try {
    const granted = await PermissionsAndroid.request(
      permission,
      title && message
        ? {
            title,
            message,
            buttonPositive: 'OK',
          }
        : undefined
    )

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      Logger.debug(TAG + '@requestPermission', 'Permission granted for: ' + permission)
      return true
    } else {
      Logger.debug(TAG + '@requestPermission', 'Permission denied for: ' + permission)
      return false
    }
  } catch (err) {
    Logger.showError('Error requesting permisison: ' + permission)
    return false
  }
}
