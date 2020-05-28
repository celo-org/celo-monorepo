import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { Screens } from 'src/navigator/Screens'
import PaymentRequestConfirmation from 'src/paymentRequest/PaymentRequestConfirmation'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount2, mockE164Number, mockTransactionData } from 'test/values'

const store = createMockStore({
  account: {
    e164PhoneNumber: mockE164Number,
  },
  web3: {
    account: mockAccount2,
  },
})

const mockScreenProps = getMockStackScreenProps(Screens.PaymentRequestConfirmation, {
  transactionData: mockTransactionData,
})

describe('PaymentRequestConfirmation', () => {
  it('renders correctly for request payment confirmation', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <PaymentRequestConfirmation {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
