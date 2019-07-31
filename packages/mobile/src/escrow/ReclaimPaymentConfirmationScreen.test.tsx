import BigNumber from 'bignumber.js'
import * as React from 'react'
import { render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import { SHORT_CURRENCIES } from 'src/geth/consts'
import { createMockNavigationProp, createMockStore } from 'test/utils'
import { mockAccount, mockAccount2, mockContactWithPhone } from 'test/values'

jest.mock('src/escrow/saga', () => ({
  getReclaimEscrowFee: jest.fn(async () => new BigNumber(10000000000000000)),
}))

const store = createMockStore()

describe('ReclaimPaymentConfirmationScreen', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly', async () => {
    const navigation = createMockNavigationProp({
      senderAddress: mockAccount2,
      recipient: mockContactWithPhone,
      paymentID: mockAccount,
      currency: SHORT_CURRENCIES.DOLLAR,
      amount: new BigNumber(10),
      timestamp: new BigNumber(10000),
      expirySeconds: new BigNumber(50000),
    })

    const { queryByText, getByText, toJSON } = render(
      <Provider store={store}>
        <ReclaimPaymentConfirmationScreen navigation={navigation} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('securityFee')).not.toBeNull()
    expect(queryByText('-$0.01')).toBeNull()

    // Wait for fee to be calculated and displayed
    await waitForElement(() => getByText('-$0.01'))

    expect(queryByText('$9.99')).not.toBeNull()

    expect(toJSON()).toMatchSnapshot()
  })
})
