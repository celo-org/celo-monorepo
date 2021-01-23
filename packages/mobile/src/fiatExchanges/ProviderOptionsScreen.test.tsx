import { CURRENCY_ENUM } from '@celo/utils'
import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ProviderOptionsScreen from 'src/fiatExchanges/ProviderOptionsScreen'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = (isCashIn: boolean) =>
  getMockStackScreenProps(Screens.ProviderOptionsScreen, {
    isCashIn,
  })

const mockStore = createMockStore({
  account: {
    defaultCountryCode: '+54',
  },
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.BRL,
  },
})

describe('ProviderOptionsScreen', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('opens Simplex correctly', () => {
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    fireEvent.press(getByTestId('Provider/Simplex'))
    expect(navigateToURI).toHaveBeenCalled()
  })

  it('opens MoonPay correctly', () => {
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )

    fireEvent.press(getByTestId('Provider/Moonpay'))
    expect(navigate).toHaveBeenCalledWith(Screens.MoonPay, {
      localAmount: 0,
      currencyCode: LocalCurrencyCode.BRL,
      currencyToBuy: CURRENCY_ENUM.DOLLAR,
    })
  })
})
