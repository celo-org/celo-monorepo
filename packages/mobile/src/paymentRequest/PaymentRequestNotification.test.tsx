import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import PaymentRequestNotification from 'src/paymentRequest/PaymentRequestNotification'
import { RecipientKind } from 'src/utils/recipient'
const commonProps = {
  id: 1,
  amount: '24',
  comment: 'Hey thanks for the loan, Ill pay you back ASAP. LOVE YOU',
  updatePaymentRequestStatus: jest.fn(),
  requester: {
    kind: RecipientKind.MobileNumber,
    e164PhoneNumber: '5126608970',
    displayPhoneNumber: '5126608970',
    address: '0x91623f625e23ac1400',
    displayName: '5126608970',
    contact: undefined,
  },
}

describe('PaymentRequestNotification', () => {
  it('renders correctly', () => {
    // @ts-ignore -- kind is not assignable?
    const tree = renderer.create(<PaymentRequestNotification {...commonProps} />)

    expect(tree).toMatchSnapshot()
  })
})
