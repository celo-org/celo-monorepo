import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import CeloExchangeButtons from 'src/exchange/CeloExchangeButtons'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const exchangeRatePair: ExchangeRatePair = { goldMaker: '0.11', dollarMaker: '10' }

const mockScreenProps = getMockStackScreenProps(Screens.ExchangeHomeScreen)

describe('CeloExchangeButtons', () => {
  it('renders correctly', () => {
    const store = createMockStore({
      goldToken: { balance: '10' },
      stableToken: { balance: '10' },
      exchange: { exchangeRatePair },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("hides buy button when there's no dollar balance", () => {
    const store = createMockStore({
      goldToken: { balance: '10' },
      stableToken: { balance: '0' },
      exchange: { exchangeRatePair },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("hides sell button when there's no CELO balance", () => {
    const store = createMockStore({
      goldToken: { balance: '0' },
      stableToken: { balance: '10' },
      exchange: { exchangeRatePair },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("returns null when there's no CELO and dollar balance", () => {
    const store = createMockStore({
      goldToken: { balance: '0' },
      stableToken: { balance: '0' },
      exchange: { exchangeRatePair },
    })

    const tree = render(
      <Provider store={store}>
        <CeloExchangeButtons {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
