import BigNumber from 'bignumber.js'
import * as React from 'react'
import { render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import SendConfirmation from 'src/send/SendConfirmation'
import { createMockNavigationProp, createMockStore } from 'test/utils'
import { mockAccount, mockRecipient } from 'test/values'

jest.mock('src/send/saga', () => ({
  getSendFee: jest.fn(async () => new BigNumber(10000000000000000)),
}))

const store = createMockStore({
  stableToken: {
    balance: '200',
  },
})

describe('SendConfirmation', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly for send payment confirmation', async () => {
    const navigation = createMockNavigationProp({
      recipient: mockRecipient,
      recipientAddress: mockAccount,
      amount: new BigNumber(10),
      reason: 'My Reason',
    })

    const { queryByText, getByText, toJSON } = render(
      <Provider store={store}>
        <SendConfirmation navigation={navigation} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('securityFee')).toBeNull()

    // Wait for fee to be calculated and displayed
    await waitForElement(() => getByText('securityFee'))

    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly for payment request confirmation', async () => {
    const navigation = createMockNavigationProp({
      recipient: mockRecipient,
      recipientAddress: mockAccount,
      amount: new BigNumber(10),
      reason: 'My Reason',
      isPaymentRequest: true,
    })

    const { queryByText, getByText, toJSON } = render(
      <Provider store={store}>
        <SendConfirmation navigation={navigation} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('securityFee')).toBeNull()

    // Wait for fee to be calculated and displayed
    await waitForElement(() => getByText('securityFee'))

    expect(toJSON()).toMatchSnapshot()
  })
})
