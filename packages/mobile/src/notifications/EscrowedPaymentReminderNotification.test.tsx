import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import EscrowedPaymentReminderNotification from 'src/notifications/EscrowedPaymentReminderNotification'
import { createMockStore } from 'test/utils'
import { mockEscrowedPayment } from 'test/values'

const store = createMockStore()

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('EscrowedPaymentReminderNotification', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <EscrowedPaymentReminderNotification payment={mockEscrowedPayment} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
