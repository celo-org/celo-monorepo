import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import PhoneNumberLookupQuotaScreen from 'src/identity/PhoneNumberLookupQuotaScreen'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

const mockRoute = {
  name: Screens.PhoneNumberLookupQuota as Screens.PhoneNumberLookupQuota,
  key: '1',
  params: {
    onBuy: jest.fn(),
    onSkip: jest.fn(),
  },
}

describe('PhoneNumberLookupQuotaScreen', () => {
  const store = createMockStore({})

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <PhoneNumberLookupQuotaScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
