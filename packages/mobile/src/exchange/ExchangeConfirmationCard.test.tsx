import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import ExchangeConfirmationCard from 'src/exchange/ExchangeConfirmationCard'
import { createMockStore } from 'test/utils'

const newDollarBalance = new BigNumber('189.9')
const newGoldBalance = new BigNumber('207.81')
const makerAmount = new BigNumber('20')
const takerAmount = new BigNumber('1.99')
const exchangeRate = new BigNumber('2')
const fee = '0.01'

const store = createMockStore({})

it('renders correctly with no exchange rate', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <ExchangeConfirmationCard
        makerToken={CURRENCY_ENUM.GOLD}
        newDollarBalance={newDollarBalance}
        newGoldBalance={newGoldBalance}
        makerAmount={makerAmount}
        takerAmount={takerAmount}
        exchangeRate={exchangeRate}
        fee={fee}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly with giant numbers', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <ExchangeConfirmationCard
        makerToken={CURRENCY_ENUM.DOLLAR}
        newDollarBalance={new BigNumber('10000000')}
        newGoldBalance={new BigNumber('10030000')}
        makerAmount={new BigNumber('24000000.00')}
        takerAmount={new BigNumber('18000000000')}
        exchangeRate={new BigNumber('0.13123123123123123')}
        fee={fee}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
