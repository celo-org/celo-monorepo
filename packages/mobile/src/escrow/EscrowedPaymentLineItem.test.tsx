import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'
import { mockRecipientWithPhoneNumber } from 'test/values'

it('renders correctly', () => {
  const tree = renderer.create(
    <PaymentRequestNotificationInner
      requesterE164Number={mockRecipientWithPhoneNumber.e164PhoneNumber}
      comment="You owe me for coffee!"
      amount="5"
      requesterRecipient={mockRecipientWithPhoneNumber}
    />
  )

  expect(tree).toMatchSnapshot()
})
