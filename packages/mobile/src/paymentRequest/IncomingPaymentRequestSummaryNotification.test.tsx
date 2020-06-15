import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import IncomingPaymentRequestSummaryNotification from 'src/paymentRequest/IncomingPaymentRequestSummaryNotification'
import { createMockStore } from 'test/utils'
import { mockE164Number, mockPaymentRequests } from 'test/values'

const store = createMockStore()

describe('IncomingPaymentRequestSummaryNotification', () => {
  it('renders correctly for more than one request', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <IncomingPaymentRequestSummaryNotification requests={mockPaymentRequests} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for just one alone', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <IncomingPaymentRequestSummaryNotification requests={mockPaymentRequests.slice(0, 1)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders a number when the address mapping is cached', () => {
    const storeWithMapping = createMockStore({
      identity: { addressToE164Number: { mockAccount: mockE164Number } },
    })
    const tree = renderer.create(
      <Provider store={storeWithMapping}>
        <IncomingPaymentRequestSummaryNotification requests={mockPaymentRequests.slice(0, 1)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
