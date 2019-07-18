import { Permission, PermissionsAndroid } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'

export async function requestSendSmsPermission(showMessage: boolean = true) {
  if (showMessage) {
    return requestPermission(
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      'Allow Celo to send SMS messages',
      'The Celo Rewards app needs to be able to send SMS messages to verify users on its network'
    )
  } else {
    return requestPermission(PermissionsAndroid.PERMISSIONS.SEND_SMS)
  }
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
      // TODO: Move logger to react-components or @celo/utils package?
      // tslint:disable-next-line:no-console
      console.log('Permission granted for: ' + permission)
      CeloAnalytics.track(CustomEventNames.sms_allow)
      return true
    } else {
      // TODO: Move logger to react-components or @celo/utils package?
      // tslint:disable-next-line:no-console
      console.log('Permission denied for: ' + permission)
      CeloAnalytics.track(CustomEventNames.sms_deny)
      return false
    }
  } catch (err) {
    // TODO: Move logger to react-components or @celo/utils package?
    // tslint:disable-next-line:no-console
    console.log('Error requesting permisison: ' + permission)
    return false
  }
}
