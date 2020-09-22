import BigNumber from 'bignumber.js'
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
    localAmount: new BigNumber('1'),
    currencyCode: LocalCurrencyCode.USD,
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
