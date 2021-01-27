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

// Mock Animated Views this way otherwise we get a
// `JavaScript heap out of memory` error when a ref is set (?!)
// See https://github.com/callstack/react-native-testing-library/issues/539
jest.mock('react-native/Libraries/Animated/src/components/AnimatedView.js', () => 'View')
jest.mock(
  'react-native/Libraries/Animated/src/components/AnimatedScrollView.js',
  () => 'RCTScrollView'
)
