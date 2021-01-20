import { CURRENCY_ENUM } from '@celo/utils'
import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import MoonPay from 'src/fiatExchanges/MoonPay'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = () =>
  getMockStackScreenProps(Screens.MoonPay, {
    localAmount: 1,
    currencyCode: LocalCurrencyCode.USD,
    currencyToBuy: CURRENCY_ENUM.GOLD,
  })

describe('MoonPay', () => {
  const store = createMockStore()
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <MoonPay {...mockScreenProps()} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
