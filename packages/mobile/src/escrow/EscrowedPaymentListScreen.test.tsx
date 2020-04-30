import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { escrowPaymentDouble } from 'src/escrow/__mocks__'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentListScreen from 'src/escrow/EscrowedPaymentListScreen'
import { createMockNavigationProp, createMockStore } from 'test/utils'
import { mockAccount, mockRecipient } from 'test/values'

const payments = [escrowPaymentDouble({}), escrowPaymentDouble({}), escrowPaymentDouble({})]

const navigation = createMockNavigationProp({
  recipient: mockRecipient,
  recipientAddress: mockAccount,
  amount: new BigNumber(10),
  reason: 'My Reason',
})

function testStore(sentEscrowedPayments: EscrowedPayment[]) {
  return createMockStore({
    stableToken: { balance: '120' },
    escrow: { sentEscrowedPayments },
  })
}

describe('EscrowedPaymentListScreen', () => {
  it('renders correctly with payments', () => {
    const store = testStore(payments)

    const tree = renderer.create(
      <Provider store={store}>
        <EscrowedPaymentListScreen navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with no payments', () => {
    const store = testStore([])

    const tree = renderer.create(
      <Provider store={store}>
        <EscrowedPaymentListScreen navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
