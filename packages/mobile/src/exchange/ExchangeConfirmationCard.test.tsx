import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import ExchangeConfirmationCard from 'src/exchange/ExchangeConfirmationCard'
import { createMockStore } from 'test/utils'

const localAmount = {
  value: '1.23',
  exchangeRate: '0.555',
  currencyCode: 'EUR',
}
const makerAmount = { value: '20', currencyCode: 'cGLD', localAmount }
const takerAmount = { value: '1.99', currencyCode: 'cUSD', localAmount }

const store = createMockStore({})

it('renders correctly with no exchange rate', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <ExchangeConfirmationCard makerAmount={makerAmount} takerAmount={takerAmount} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly with giant numbers', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <ExchangeConfirmationCard
        makerAmount={{ value: '24000000.00', currencyCode: 'cUSD', localAmount }}
        takerAmount={{ value: '18000000000', currencyCode: 'cGLD', localAmount }}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
