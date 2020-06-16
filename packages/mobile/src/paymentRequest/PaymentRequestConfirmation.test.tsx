import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
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
    const tree = render(
      <Provider store={store}>
        <PaymentRequestConfirmation {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('updates the comment/reason', () => {
    const tree = render(
      <Provider store={store}>
        <PaymentRequestConfirmation {...mockScreenProps} />
      </Provider>
    )

    const input = tree.getByTestId('commentInput/request')
    const comment = 'A comment!'
    fireEvent.changeText(input, comment)
    expect(tree.queryAllByDisplayValue(comment)).toHaveLength(1)
  })
})
