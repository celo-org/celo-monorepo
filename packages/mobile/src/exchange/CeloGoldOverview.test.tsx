import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { CeloGoldOverview } from 'src/exchange/CeloGoldOverview'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { createMockStore, getMockI18nProps } from 'test/utils'

const SAMPLE_BALANCE = '55.00001'
const exchangeRatePair: ExchangeRatePair = { goldMaker: '0.11', dollarMaker: '10' }

it('renders correctly when ready', () => {
  const tree = renderer.create(
    <Provider
      store={createMockStore({
        exchange: { exchangeRatePair },
        goldToken: { balance: SAMPLE_BALANCE },
      })}
    >
      <CeloGoldOverview testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly when not ready', () => {
  const tree = renderer.create(
    <Provider
      store={createMockStore({
        exchange: { exchangeRatePair: null },
        goldToken: { balance: SAMPLE_BALANCE },
      })}
    >
      <CeloGoldOverview testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
