import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

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

configure({ adapter: new Adapter() })

jest.useFakeTimers()

if (typeof window !== 'object') {
  global.window = global
  global.window.navigator = {}
}
