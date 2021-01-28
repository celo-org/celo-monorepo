import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'
import { AddressRecipient } from 'src/recipients/recipient'
import { createMockStore, getMockI18nProps } from 'test/utils'
import { mockAccount, mockE164Number } from 'test/values'

it('renders correctly', () => {
  const store = createMockStore()
  const requesterRecipient: AddressRecipient = {
    name: 'mockDisplayName',
    address: mockAccount,
    e164PhoneNumber: mockE164Number,
  }
  const tree = renderer.create(
    <Provider store={store}>
      <PaymentRequestNotificationInner
        amount="24"
        recipient={requesterRecipient}
        t={getMockI18nProps().t}
      />
    </Provider>
  )

  expect(tree).toMatchSnapshot()
})
