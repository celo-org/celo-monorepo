import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'

it('renders correctly', () => {
  const tree = renderer.create(
    <PaymentRequestNotificationInner
      requesterE164Number="+14155552671"
      amount="24"
      requesterRecipient={null}
    />
  )

  expect(tree).toMatchSnapshot()
})
