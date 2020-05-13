import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import PhoneNumberLookupQuotaScreen from 'src/identity/PhoneNumberLookupQuotaScreen'
import { createMockStore } from 'test/utils'

describe('PhoneNumberLookupQuotaScreen', () => {
  const store = createMockStore({})

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <PhoneNumberLookupQuotaScreen />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
