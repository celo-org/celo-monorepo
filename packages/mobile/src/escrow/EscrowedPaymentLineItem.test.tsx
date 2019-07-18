import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import PaymentRequestLineItem from 'src/paymentRequest/PaymentRequestLineItem'
import { mockRecipientWithPhoneNumber } from 'test/values'

it('renders correctly', () => {
  const tree = renderer.create(
    <PaymentRequestLineItem
      requesterE164Number={mockRecipientWithPhoneNumber.e164PhoneNumber}
      comment="You owe me for coffee!"
      amount="5"
      requesterRecipient={mockRecipientWithPhoneNumber}
    />
  )

  expect(tree).toMatchSnapshot()
})
