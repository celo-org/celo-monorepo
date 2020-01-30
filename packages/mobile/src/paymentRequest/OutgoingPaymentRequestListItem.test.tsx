import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import OutgoingPaymentRequestListItem from 'src/paymentRequest/OutgoingPaymentRequestListItem'
import { RecipientKind } from 'src/recipients/recipient'

const commonProps = {
  id: 1,
  amount: '24',
  comment: 'Hey thanks for the loan, Ill pay you back ASAP. LOVE YOU',
  updatePaymentRequestStatus: jest.fn(),
  requestee: {
    kind: RecipientKind.MobileNumber,
    e164PhoneNumber: '5126608970',
    displayId: '5126608970',
    address: '0x91623f625e23ac1400',
    displayName: '5126608970',
    contact: undefined,
  },
}

describe('OutgoingPaymentRequestListItem', () => {
  it('renders correctly', () => {
    // @ts-ignore -- kind is not assignable?
    const tree = renderer.create(<OutgoingPaymentRequestListItem {...commonProps} />)

    expect(tree).toMatchSnapshot()
  })
})
