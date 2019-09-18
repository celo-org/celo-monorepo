import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'

it('renders correctly', () => {
  const tree = renderer.create(
    <PaymentRequestNotificationInner
      requesterE164Number="+14155552671"
      amount="24"
      comment="Hey thanks for the loan, Ill pay you back ASAP. LOVE YOU"
      requesterRecipient={null}
    />
  )

  expect(tree).toMatchSnapshot()
})
