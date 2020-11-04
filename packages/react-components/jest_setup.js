import * as ReactNative from 'react-native'

jest.doMock('react-native', () => {
  // Extend ReactNative
  return Object.setPrototypeOf(
    {
      ToastAndroid: {},
    },
    ReactNative
  )
})

jest.useFakeTimers()

if (typeof window !== 'object') {
  global.window = global
  global.window.navigator = {}
}
