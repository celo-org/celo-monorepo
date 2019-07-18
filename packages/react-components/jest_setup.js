import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
configure({ adapter: new Adapter() })

jest.useFakeTimers()

if (typeof window !== 'object') {
  global.window = global
  global.window.navigator = {}
}
