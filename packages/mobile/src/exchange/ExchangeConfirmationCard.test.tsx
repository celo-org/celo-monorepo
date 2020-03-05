import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import ExchangeConfirmationCard from 'src/exchange/ExchangeConfirmationCard'
import { createMockStore } from 'test/utils'

const makerAmount = { value: '20', currencyCode: 'cGLD', localAmount: null }
const takerAmount = { value: '1.99', currencyCode: 'cUSD', localAmount: null }
const fee = '0.01'

const store = createMockStore({})

it('renders correctly with no exchange rate', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <ExchangeConfirmationCard makerAmount={makerAmount} takerAmount={takerAmount} fee={fee} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly with giant numbers', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <ExchangeConfirmationCard
        makerAmount={{ value: '24000000.00', currencyCode: 'cUSD', localAmount: null }}
        takerAmount={{ value: '18000000000', currencyCode: 'cGLD', localAmount: null }}
        exchangeRate={new BigNumber('0.13123123123123123')}
        fee={fee}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
