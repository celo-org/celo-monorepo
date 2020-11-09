import React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

// Mock this for now, as we get apollo issues
jest.mock('src/transactions/TransactionsList')

const mockScreenProps = getMockStackScreenProps(Screens.ExchangeHomeScreen)

describe('ExchangeHomeScreen', () => {
  it('renders and behaves correctly for non CP-DOTO restricted countries', () => {
    const store = createMockStore({
      goldToken: { balance: '2' },
      stableToken: { balance: '10' },
      exchange: { exchangeRatePair: { goldMaker: '0.11', dollarMaker: '10' } },
    })

    const tree = render(
      <Provider store={store}>
        <ExchangeHomeScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()

    jest.clearAllMocks()
    fireEvent.press(tree.getByTestId('BuyCelo'))
    expect(mockScreenProps.navigation.navigate).toHaveBeenCalledWith(Screens.ExchangeTradeScreen, {
      makerTokenDisplay: { makerToken: 'Celo Dollar', makerTokenBalance: '10' },
    })

    jest.clearAllMocks()
    fireEvent.press(tree.getByTestId('SellCelo'))
    expect(mockScreenProps.navigation.navigate).toHaveBeenCalledWith(Screens.ExchangeTradeScreen, {
      makerTokenDisplay: { makerToken: 'Celo Gold', makerTokenBalance: '2' },
    })

    jest.clearAllMocks()
    fireEvent.press(tree.getByTestId('WithdrawCELO'))
    expect(mockScreenProps.navigation.navigate).toHaveBeenCalledWith(Screens.WithdrawCeloScreen, {
      isCashOut: false,
    })
  })

  it('renders and behaves correctly for CP-DOTO restricted countries', () => {
    const store = createMockStore({
      account: {
        defaultCountryCode: '+63', // PH is restricted for CP-DOTO
      },
      goldToken: { balance: '2' },
      stableToken: { balance: '10' },
      exchange: { exchangeRatePair: { goldMaker: '0.11', dollarMaker: '10' } },
    })

    const tree = render(
      <Provider store={store}>
        <ExchangeHomeScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()

    // Check we cannot buy/sell
    expect(tree.queryByTestId('BuyCelo')).toBeFalsy()
    expect(tree.queryByTestId('SellCelo')).toBeFalsy()

    // Check we can withdraw
    fireEvent.press(tree.getByTestId('WithdrawCELO'))
    expect(mockScreenProps.navigation.navigate).toHaveBeenCalledWith(Screens.WithdrawCeloScreen, {
      isCashOut: false,
    })
  })
})
