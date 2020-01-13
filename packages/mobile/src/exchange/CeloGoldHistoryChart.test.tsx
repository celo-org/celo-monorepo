import _ from 'lodash'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import CeloGoldHistoryChart from 'src/exchange/CeloGoldHistoryChart'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { createMockStore, getMockI18nProps } from 'test/utils'

const SAMPLE_BALANCE = '55.00001'
const exchangeRatePair: ExchangeRatePair = { goldMaker: '0.11', dollarMaker: '10' }

it('renders without history', () => {
  const tree = renderer.create(
    <Provider
      store={createMockStore({
        exchange: { exchangeRatePair },
        goldToken: { balance: SAMPLE_BALANCE },
      })}
    >
      <CeloGoldHistoryChart testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders while update is in progress', () => {
  const now = Date.now()
  const tree = renderer.create(
    <Provider
      store={createMockStore({
        exchange: {
          exchangeRatePair,
          history: {
            celoGoldExchangeRates: [
              {
                exchangeRate: '0.123',
                timestamp: now,
              },
            ],
            lastTimeUpdated: 0,
          },
        },
        goldToken: { balance: SAMPLE_BALANCE },
      })}
    >
      <CeloGoldHistoryChart testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders properly', () => {
  const now = Date.now()
  const tree = renderer.create(
    <Provider
      store={createMockStore({
        exchange: {
          exchangeRatePair,
          history: {
            celoGoldExchangeRates: _.range(60).map((i) => ({
              exchangeRate: (i / 60).toString(),
              timestamp: now - i * 24 * 3600 * 1000,
            })),
            lastTimeUpdated: now,
          },
        },
        goldToken: { balance: SAMPLE_BALANCE },
      })}
    >
      <CeloGoldHistoryChart testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
