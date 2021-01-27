import { cleanup } from 'react-native-testing-library'
// @ts-ignore
const svgMock = require('react-native-svg-mock')

jest.useFakeTimers()

if (typeof window !== 'object') {
  // @ts-ignore
  global.window = global
  // @ts-ignore
  global.window.navigator = {}
}

// @ts-ignore
global.fetch = require('jest-fetch-mock')

// Makes sure components are unmounted after each test
// TODO: remove once https://github.com/callstack/react-native-testing-library/pull/238 is merged and we upgrade
afterEach(cleanup)

// Mock LayoutAnimation as it's done not automatically
jest.mock('react-native/Libraries/LayoutAnimation/LayoutAnimation.js')

// Mock Animated Views this way otherwise we get a
// `JavaScript heap out of memory` error when a ref is set (?!)
// See https://github.com/callstack/react-native-testing-library/issues/539
jest.mock('react-native/Libraries/Animated/src/components/AnimatedView.js', () => 'View')
jest.mock(
  'react-native/Libraries/Animated/src/components/AnimatedScrollView.js',
  () => 'RCTScrollView'
)
