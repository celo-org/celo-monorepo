import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import WithdrawCeloSummary from 'src/exchange/WithdrawCeloSummary'
import { createMockStore } from 'test/utils'

const SAMPLE_ADDRESS = '0xcc642068bdbbdeb91f348213492d2a80ab1ed23c'
const SAMPLE_AMOUNT = new BigNumber(5.001)

const store = createMockStore()

describe('WithdrawCeloSummary', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <WithdrawCeloSummary amount={SAMPLE_AMOUNT} recipientAddress={SAMPLE_ADDRESS} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
