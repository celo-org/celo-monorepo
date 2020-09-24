import { Platform } from 'react-native'

export function deviceIsIos14OrNewer() {
  const iosVersion = parseFloat(Platform.Version.toString())
  return Platform.OS === 'ios' && iosVersion >= 14
}
