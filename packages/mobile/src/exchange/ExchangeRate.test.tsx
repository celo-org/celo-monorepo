import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ExchangeRate from 'src/exchange/ExchangeRate'
import { createMockStore, getElementText } from 'test/utils'

const store = createMockStore({})

it('renders correctly for cUSD->cGLD exchanges without local amounts', () => {
  const { getByTestId, toJSON } = render(
    <Provider store={store}>
      <ExchangeRate
        makerAmount={{ value: '20', currencyCode: 'cUSD' }}
        takerAmount={{ value: '2', currencyCode: 'cGLD' }}
      />
    </Provider>
  )
  expect(toJSON()).toMatchSnapshot()

  const element = getByTestId('ExchangeRateRatio')
  expect(getElementText(element)).toBe('10 cUSD : 1 cGLD')
})

it('renders correctly for cGLD->cUSD exchanges without local amounts', () => {
  const { getByTestId, toJSON } = render(
    <Provider store={store}>
      <ExchangeRate
        makerAmount={{ value: '2', currencyCode: 'cGLD' }}
        takerAmount={{ value: '20', currencyCode: 'cUSD' }}
      />
    </Provider>
  )
  expect(toJSON()).toMatchSnapshot()

  const element = getByTestId('ExchangeRateRatio')
  expect(getElementText(element)).toBe('0.1 cGLD : 1 cUSD')
})

it('renders correctly for cUSD->cGLD exchanges with local amounts', () => {
  const { getByTestId, toJSON } = render(
    <Provider store={store}>
      <ExchangeRate
        makerAmount={{
          value: '20',
          currencyCode: 'cUSD',
          localAmount: { value: '15', currencyCode: 'EUR', exchangeRate: '0.75' },
        }}
        takerAmount={{
          value: '2',
          currencyCode: 'cGLD',
          localAmount: { value: '15', currencyCode: 'EUR', exchangeRate: '0.75' },
        }}
      />
    </Provider>
  )
  expect(toJSON()).toMatchSnapshot()

  const element = getByTestId('ExchangeRateRatio')
  expect(getElementText(element)).toBe('7.5 EUR : 1 cGLD')
})

it('renders correctly for cGLD->cUSD exchanges with local amounts', () => {
  const { getByTestId, toJSON } = render(
    <Provider store={store}>
      <ExchangeRate
        makerAmount={{
          value: '2',
          currencyCode: 'cGLD',
          localAmount: { value: '15', currencyCode: 'EUR', exchangeRate: '0.75' },
        }}
        takerAmount={{
          value: '20',
          currencyCode: 'cUSD',
          localAmount: { value: '15', currencyCode: 'EUR', exchangeRate: '0.75' },
        }}
      />
    </Provider>
  )
  expect(toJSON()).toMatchSnapshot()

  const element = getByTestId('ExchangeRateRatio')
  expect(getElementText(element)).toBe('0.1333 cGLD : 1 EUR')
})
