import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { PaymentRequest } from 'src/account/types'
import { paymentRequestDouble } from 'src/paymentRequest/__mocks__'
import OutgoingPaymentRequestListScreen from 'src/paymentRequest/OutgoingPaymentRequestListScreen'
import { createMockStore } from 'test/utils'
import { mockAccount, mockE164Number } from 'test/values'

const requests = [
  paymentRequestDouble({
    amount: '20',
    comment: 'Just the best',
    requesterE164Number: '+1555-867-5309',
    requesterAddress: mockAccount,
  }),
  paymentRequestDouble({
    amount: '102',
    comment: 'Just the best for the best. Thanos & Zeus Gods of ultimate Power',
    requesterE164Number: mockE164Number,
    requesterAddress: mockAccount,
  }),
  paymentRequestDouble({
    amount: '1',
    comment: 'Just the best but less',
    requesterE164Number: mockE164Number,
    requesterAddress: mockAccount,
  }),
]

function testStore(outgoingPaymentRequests: PaymentRequest[]) {
  return createMockStore({
    stableToken: { balance: '120' },
    account: { outgoingPaymentRequests },
  })
}

describe('OutgoingPaymentRequestListScreen', () => {
  it('renders correctly with requests', () => {
    const store = testStore(requests)

    const tree = renderer.create(
      <Provider store={store}>
        <OutgoingPaymentRequestListScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with no requests', () => {
    const store = testStore([])

    const tree = renderer.create(
      <Provider store={store}>
        <OutgoingPaymentRequestListScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
