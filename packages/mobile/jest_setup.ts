import { configure } from 'enzyme'
// @ts-ignore TODO(cmcewen): remove enzyme
import Adapter from 'enzyme-adapter-react-16'
import { GlobalWithFetchMock } from 'jest-fetch-mock'
// @ts-ignore
const svgMock = require('react-native-svg-mock')
configure({ adapter: new Adapter() })

jest.useFakeTimers()

const customGlobal: GlobalWithFetchMock = global as GlobalWithFetchMock
customGlobal.fetch = require('jest-fetch-mock')
customGlobal.fetchMock = customGlobal.fetch

if (typeof window !== 'object') {
  // @ts-ignore
  global.window = global
  // @ts-ignore
  global.window.navigator = {}
}
