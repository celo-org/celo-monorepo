import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { Screens } from 'src/navigator/Screens'
import PaymentRequestConfirmation from 'src/paymentRequest/PaymentRequestConfirmation'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockE164Number,
  mockNavigation,
  mockRecipient,
} from 'test/values'

const store = createMockStore({
  account: {
    e164PhoneNumber: mockE164Number,
  },
  web3: {
    account: mockAccount2,
  },
})

const mockRoute = {
  name: Screens.PaymentRequestConfirmation as Screens.PaymentRequestConfirmation,
  key: '1',
  params: {
    confirmationInput: {
      amount: new BigNumber(10),
      reason: 'My Reason',
      recipient: mockRecipient,
      recipientAddress: mockAccount,
    },
  },
}

describe('PaymentRequestConfirmation', () => {
  it('renders correctly for request payment confirmation', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <PaymentRequestConfirmation navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
