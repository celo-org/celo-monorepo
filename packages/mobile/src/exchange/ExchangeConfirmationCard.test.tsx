import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import ExchangeConfirmationCard from 'src/exchange/ExchangeConfirmationCard'

const newDollarBalance = '189.9'
const newGoldBalance = '207.81'
const leftCurrencyAmount = new BigNumber('20')
const rightCurrencyAmount = new BigNumber('1.99')
const exchangeRate = '2'
const fee = '0.01'

it('renders correctly with no exchange rate', () => {
  const tree = renderer.create(
    <ExchangeConfirmationCard
      token={CURRENCY_ENUM.GOLD}
      newDollarBalance={newDollarBalance}
      newGoldBalance={newGoldBalance}
      leftCurrencyAmount={leftCurrencyAmount}
      rightCurrencyAmount={rightCurrencyAmount}
      exchangeRate={exchangeRate}
      fee={fee}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly with giant numbers', () => {
  const tree = renderer.create(
    <ExchangeConfirmationCard
      token={CURRENCY_ENUM.DOLLAR}
      newDollarBalance={'10000000'}
      newGoldBalance={'10030000'}
      leftCurrencyAmount={new BigNumber('24000000.00')}
      rightCurrencyAmount={new BigNumber('18000000000')}
      exchangeRate={'0.13123123123123123'}
      fee={fee}
    />
  )
  expect(tree).toMatchSnapshot()
})
