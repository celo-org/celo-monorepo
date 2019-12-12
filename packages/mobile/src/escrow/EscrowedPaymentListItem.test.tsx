import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'

import { createMockStore } from 'test/utils'
import { mockEscrowedPayment } from 'test/values'

const store = createMockStore()

describe('EscrowedPaymentReminderNotification', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <EscrowedPaymentListItem payment={mockEscrowedPayment} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
