import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import { RecipientKind } from 'src/recipients/recipient'
import { createMockStore } from 'test/utils'

const store = createMockStore()

const commonProps = {
  id: 1,
  amount: '24',
  comment: 'Hey thanks for the loan, Ill pay you back ASAP. LOVE YOU',
  requester: {
    kind: RecipientKind.MobileNumber,
    e164PhoneNumber: '5126608970',
    displayId: '5126608970',
    address: '0x91623f625e23ac1400',
    displayName: '5126608970',
    contact: undefined,
  },
}

describe('IncomingPaymentRequestListItem', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        // @ts-ignore -- kind is not assignable?
        <IncomingPaymentRequestListItem {...commonProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })
})
