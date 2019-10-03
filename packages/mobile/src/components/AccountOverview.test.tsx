import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import { AccountOverview } from 'src/components/AccountOverview'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { getMockI18nProps } from 'test/utils'

const SAMPLE_BALANCE = '55.00001'
const exchangeRatePair: ExchangeRatePair = { goldMaker: '0.11', dollarMaker: '10' }

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

it('renders correctly when ready', () => {
  const tree = renderer.create(
    <AccountOverview
      dollarBalance={SAMPLE_BALANCE}
      goldBalance={SAMPLE_BALANCE}
      exchangeRatePair={exchangeRatePair}
      goldEducationCompleted={true}
      stableEducationCompleted={true}
      testID={'SnapshotAccountOverview'}
      startBalanceAutorefresh={jest.fn()}
      stopBalanceAutorefresh={jest.fn()}
      {...getMockI18nProps()}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly when not ready', () => {
  const tree = renderer.create(
    <AccountOverview
      dollarBalance={SAMPLE_BALANCE}
      goldBalance={SAMPLE_BALANCE}
      exchangeRatePair={exchangeRatePair}
      goldEducationCompleted={true}
      stableEducationCompleted={true}
      testID={'SnapshotAccountOverview'}
      startBalanceAutorefresh={jest.fn()}
      stopBalanceAutorefresh={jest.fn()}
      {...getMockI18nProps()}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly when transaction pending', () => {
  const tree = renderer.create(
    <AccountOverview
      dollarBalance={SAMPLE_BALANCE}
      goldBalance={SAMPLE_BALANCE}
      exchangeRatePair={exchangeRatePair}
      goldEducationCompleted={true}
      stableEducationCompleted={true}
      testID={'SnapshotAccountOverview'}
      startBalanceAutorefresh={jest.fn()}
      stopBalanceAutorefresh={jest.fn()}
      {...getMockI18nProps()}
    />
  )
  expect(tree).toMatchSnapshot()
})

it("renders correctly when Gold education NUX flow hasn't been completed", () => {
  const tree = renderer.create(
    <AccountOverview
      dollarBalance={SAMPLE_BALANCE}
      goldBalance={SAMPLE_BALANCE}
      exchangeRatePair={exchangeRatePair}
      goldEducationCompleted={false}
      stableEducationCompleted={true}
      testID={'SnapshotAccountOverview'}
      startBalanceAutorefresh={jest.fn()}
      stopBalanceAutorefresh={jest.fn()}
      {...getMockI18nProps()}
    />
  )
  expect(tree).toMatchSnapshot()
})

it("renders correctly when Dollar education NUX flow hasn't been completed", () => {
  const tree = renderer.create(
    <AccountOverview
      dollarBalance={SAMPLE_BALANCE}
      goldBalance={SAMPLE_BALANCE}
      exchangeRatePair={exchangeRatePair}
      goldEducationCompleted={true}
      stableEducationCompleted={false}
      testID={'SnapshotAccountOverview'}
      startBalanceAutorefresh={jest.fn()}
      stopBalanceAutorefresh={jest.fn()}
      {...getMockI18nProps()}
    />
  )
  expect(tree).toMatchSnapshot()
})
