import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import ExchangeRate from 'src/exchange/ExchangeRate'
import { CURRENCY_ENUM } from 'src/geth/consts'

const EXCHANGE_RATE = '0.1'

it('renders correctly with no exchange rate', () => {
  const tree = renderer.create(
    <ExchangeRate rate={new BigNumber(0)} makerToken={CURRENCY_ENUM.DOLLAR} showFinePrint={false} />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly with infinity exchange rate', () => {
  const tree = renderer.create(
    <ExchangeRate
      rate={new BigNumber('Infinity')}
      makerToken={CURRENCY_ENUM.DOLLAR}
      showFinePrint={false}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly with an exchange rate  and show fine print', () => {
  const tree = renderer.create(
    <ExchangeRate
      rate={new BigNumber(EXCHANGE_RATE)}
      makerToken={CURRENCY_ENUM.GOLD}
      showFinePrint={true}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('isnt overly precise, it rounds', () => {
  const tree = renderer.create(
    <ExchangeRate
      rate={new BigNumber('0.857252921001027301873637373')}
      makerToken={CURRENCY_ENUM.DOLLAR}
      showFinePrint={false}
    />
  )
  expect(tree).toMatchSnapshot()
})
