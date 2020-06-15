import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { escrowPaymentDouble } from 'src/escrow/__mocks__'
import EscrowedPaymentReminderSummaryNotification from 'src/escrow/EscrowedPaymentReminderSummaryNotification'
import { createMockStore } from 'test/utils'
import { mockInviteDetails, mockInviteDetails2 } from 'test/values'

const fakePayments = [escrowPaymentDouble({}), escrowPaymentDouble({})]
const store = createMockStore()

describe('EscrowedPaymentReminderSummaryNotification', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <EscrowedPaymentReminderSummaryNotification
          payments={fakePayments}
          invitees={[mockInviteDetails, mockInviteDetails2]}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  describe('when more than 2 requests', () => {
    it('renders just two', () => {
      const tree = renderer.create(
        <Provider store={store}>
          <EscrowedPaymentReminderSummaryNotification
            payments={fakePayments}
            invitees={[mockInviteDetails, mockInviteDetails2]}
          />
        </Provider>
      )
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when more 1 requests', () => {
    it('renders just it alone', () => {
      const tree = renderer.create(
        <Provider store={store}>
          <EscrowedPaymentReminderSummaryNotification
            payments={fakePayments.slice(0, 1)}
            invitees={[mockInviteDetails, mockInviteDetails2]}
          />
        </Provider>
      )
      expect(tree).toMatchSnapshot()
    })
  })
})
