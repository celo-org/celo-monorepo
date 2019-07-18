import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import EscrowedPaymentReminderNotification from 'src/notifications/EscrowedPaymentReminderNotification'
import { mockEscrowedPayment } from 'test/values'

describe('EscrowedPaymentReminderNotification', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <EscrowedPaymentReminderNotification payment={mockEscrowedPayment} />
    )
    expect(tree).toMatchSnapshot()
  })
})
