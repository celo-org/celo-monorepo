import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'
import { createMockStore } from 'test/utils'

it('renders correctly', () => {
  const store = createMockStore({})
  const tree = renderer.create(
    <Provider store={store}>
      <PaymentRequestNotificationInner
        requesterE164Number="+14155552671"
        amount="24"
        requesterRecipient={null}
      />
    </Provider>
  )

  expect(tree).toMatchSnapshot()
})
