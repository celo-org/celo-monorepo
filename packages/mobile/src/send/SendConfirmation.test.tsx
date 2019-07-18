import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import SendConfirmation from 'src/send/SendConfirmation'
import { createMockNavigationProp, createMockStore } from 'test/utils'
import { mockAccount, mockRecipient } from 'test/values'

const store = createMockStore({
  stableToken: {
    balance: '200',
  },
})

describe('SendConfirmation', () => {
  it('renders correctly for send payment confirmation', () => {
    const navigation = createMockNavigationProp({
      recipient: mockRecipient,
      recipientAddress: mockAccount,
      amount: new BigNumber(10),
      fee: new BigNumber(0.01),
      reason: 'My Reason',
    })

    const tree = renderer.create(
      <Provider store={store}>
        <SendConfirmation navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for payment request confirmation', () => {
    const navigation = createMockNavigationProp({
      recipient: mockRecipient,
      recipientAddress: mockAccount,
      amount: new BigNumber(10),
      fee: new BigNumber(0.01),
      reason: 'My Reason',
      isPaymentRequest: true,
    })

    const tree = renderer.create(
      <Provider store={store}>
        <SendConfirmation navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
