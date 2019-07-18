import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import configureMockStore from 'redux-mock-store'
import LanguageScreen from 'src/components/NUX/LanguageScreen'
import i18n from 'src/i18n'

const mockStore = configureMockStore([])

jest.mock('react-native-config', () => {
  return {
    enableAdvertisingTracking: false,
  }
})

const tProps = {
  tReady: false,
  i18n,
  t: i18n.t,
}

it('renders correctly', () => {
  const store = mockStore({ app: { language: 'en' } })
  const navigation: any = {}
  const tree = renderer.create(
    <Provider store={store}>
      <LanguageScreen navigation={navigation} {...tProps} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
